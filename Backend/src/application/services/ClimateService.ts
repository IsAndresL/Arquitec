import { prisma } from '@/shared/config/database'
import { AppError, NotFoundError } from '@/shared/errors/AppError'

export class ClimateService {
  async create(data: {
    date: Date
    type: 'SOL' | 'NUBLADO' | 'LLUVIA' | 'VIENTO'
    farmerId: string
  }) {
    const farmer = await prisma.farmerProfile.findUnique({
      where: { id: data.farmerId },
    })

    if (!farmer) {
      throw new NotFoundError('Campesino no encontrado')
    }

    const record = await prisma.climateRecord.create({ data })

    await prisma.activityLog.create({
      data: {
        type: 'CLIMATE_RECORDED',
        description: `Clima registrado: ${data.type}`,
        entityType: 'ClimateRecord',
        entityId: record.id,
        farmerId: data.farmerId,
      },
    })

    return record
  }

  async findByFarmer(farmerId: string) {
    return prisma.climateRecord.findMany({
      where: { farmerId },
      orderBy: { date: 'desc' },
    })
  }

  async findById(id: string) {
    const record = await prisma.climateRecord.findUnique({ where: { id } })

    if (!record) {
      throw new NotFoundError('Registro climático no encontrado')
    }

    return record
  }

  async update(id: string, data: Partial<{
    date: Date
    type: 'SOL' | 'NUBLADO' | 'LLUVIA' | 'VIENTO'
    farmerId: string
  }>) {
    const record = await prisma.climateRecord.findUnique({ where: { id } })

    if (!record) {
      throw new NotFoundError('Registro climático no encontrado')
    }

    const updated = await prisma.climateRecord.update({
      where: { id },
      data,
    })

    await prisma.activityLog.create({
      data: {
        type: 'CLIMATE_UPDATED',
        description: `Clima actualizado: ${updated.type}`,
        entityType: 'ClimateRecord',
        entityId: updated.id,
        farmerId: updated.farmerId,
      },
    })

    return updated
  }

  async delete(id: string) {
    const record = await prisma.climateRecord.findUnique({ where: { id } })

    if (!record) {
      throw new NotFoundError('Registro climático no encontrado')
    }

    await prisma.climateRecord.delete({ where: { id } })

    await prisma.activityLog.create({
      data: {
        type: 'CLIMATE_DELETED',
        description: `Registro climático eliminado`,
        entityType: 'ClimateRecord',
        entityId: id,
        farmerId: record.farmerId,
      },
    })

    return { message: 'Registro climático eliminado' }
  }
}

export const climateService = new ClimateService()
