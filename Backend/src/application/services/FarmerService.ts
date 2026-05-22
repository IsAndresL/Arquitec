import { prisma } from '@/shared/config/database'
import { generatePIN, hashPIN } from '@/shared/utils/password'
import { AppError, NotFoundError, ConflictError } from '@/shared/errors/AppError'
import { deleteCache } from '@/shared/config/redis'

export class FarmerService {
  async create(data: {
    name: string
    photoUrl?: string
    municipality?: string
    vereda?: string
    pin?: string
    createdById: string
  }) {
    const pin = data.pin || generatePIN()
    const pinHash = await hashPIN(pin)

    const farmer = await prisma.farmerProfile.create({
      data: {
        name: data.name,
        photoUrl: data.photoUrl,
        municipality: data.municipality,
        vereda: data.vereda,
        pinHash,
        createdById: data.createdById,
      },
    })

    await prisma.activityLog.create({
      data: {
        type: 'FARMER_CREATED',
        description: `Perfil de campesino creado: ${data.name}`,
        entityType: 'FarmerProfile',
        entityId: farmer.id,
        userId: data.createdById,
      },
    })

    await deleteCache(`dashboard:technician:${data.createdById}`)

    return {
      ...farmer,
      pin,
    }
  }

  async findById(id: string) {
    const farmer = await prisma.farmerProfile.findUnique({
      where: { id },
      include: {
        parcels: true,
        createdBy: {
          select: { id: true, name: true, email: true },
        },
      },
    })

    if (!farmer) {
      throw new NotFoundError('Campesino no encontrado')
    }

    const { pinHash, ...farmerWithoutPin } = farmer
    return farmerWithoutPin
  }

  async findAll(filters?: { technicianId?: string; isActive?: boolean }) {
    const where: any = {}

    if (filters?.technicianId) {
      where.createdById = filters.technicianId
    }

    if (filters?.isActive !== undefined) {
      where.isActive = filters.isActive
    }

    const farmers = await prisma.farmerProfile.findMany({
      where,
      include: {
        parcels: { where: { isActive: true } },
        _count: {
          select: {
            alerts: { where: { isActive: true } },
            syncRecords: { where: { status: 'PENDIENTE' } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    return farmers.map((farmer) => {
      const { pinHash, ...rest } = farmer
      return rest
    })
  }

  async update(id: string, data: any) {
    const farmer = await prisma.farmerProfile.findUnique({ where: { id } })

    if (!farmer) {
      throw new NotFoundError('Campesino no encontrado')
    }

    const { pin, ...updateData } = data
    if (pin) {
      updateData.pinHash = await hashPIN(pin)
    }

    const updated = await prisma.farmerProfile.update({
      where: { id },
      data: updateData,
    })

    await deleteCache(`farmer:${id}`)

    const { pinHash, ...rest } = updated
    return {
      ...rest,
      pin: pin || undefined,
    }
  }

  async regeneratePIN(id: string) {
    const farmer = await prisma.farmerProfile.findUnique({ where: { id } })

    if (!farmer) {
      throw new NotFoundError('Campesino no encontrado')
    }

    const newPin = generatePIN()
    const pinHash = await hashPIN(newPin)

    const updated = await prisma.farmerProfile.update({
      where: { id },
      data: {
        pinHash,
        failedAttempts: 0,
        isLocked: false,
        lockedUntil: null,
      },
    })

    await prisma.activityLog.create({
      data: {
        type: 'PIN_REGENERATED',
        description: `PIN regenerado para campesino: ${farmer.name}`,
        entityType: 'FarmerProfile',
        entityId: farmer.id,
      },
    })

    return {
      ...updated,
      pin: newPin,
    }
  }

  async delete(id: string) {
    const farmer = await prisma.farmerProfile.findUnique({ where: { id } })

    if (!farmer) {
      throw new NotFoundError('Campesino no encontrado')
    }

    await prisma.farmerProfile.delete({ where: { id } })

    await prisma.activityLog.create({
      data: {
        type: 'FARMER_DELETED',
        description: `Perfil de campesino eliminado: ${farmer.name}`,
        entityType: 'FarmerProfile',
        entityId: id,
      },
    })

    await deleteCache(`dashboard:technician:${farmer.createdById}`)

    return { message: 'Campesino eliminado' }
  }

  async getDashboard(farmerId: string) {
    const farmer = await prisma.farmerProfile.findUnique({
      where: { id: farmerId },
      include: {
        parcels: { where: { isActive: true } },
        alerts: { where: { isActive: true } },
        recommendations: {
          where: { status: { in: ['PENDIENTE', 'VISTA'] } },
          orderBy: { createdAt: 'desc' },
          take: 5,
        },
        observations: {
          orderBy: { createdAt: 'desc' },
          take: 5,
        },
        climateRecords: {
          orderBy: { date: 'desc' },
          take: 7,
        },
      },
    })

    if (!farmer) {
      throw new NotFoundError('Campesino no encontrado')
    }

    const totalInputs = await prisma.inputRecord.aggregate({
      where: { farmerId },
      _sum: { cost: true },
    })

    const { pinHash, ...rest } = farmer

    return {
      ...rest,
      totalInputCost: totalInputs._sum.cost || 0,
      ethicalNotice: 'Esta es una recomendación automática; la decisión final la toma el agricultor.',
    }
  }
}

export const farmerService = new FarmerService()
