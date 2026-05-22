import { prisma } from '@/shared/config/database'
import { AppError, NotFoundError } from '@/shared/errors/AppError'

export class ParcelService {
  async create(data: {
    name?: string
    area: number
    cropType: string
    icon?: string
    farmerId: string
  }) {
    const farmer = await prisma.farmerProfile.findUnique({
      where: { id: data.farmerId },
    })

    if (!farmer) {
      throw new NotFoundError('Campesino no encontrado')
    }

    const parcel = await prisma.farmParcel.create({ data })

    await prisma.activityLog.create({
      data: {
        type: 'PARCEL_CREATED',
        description: `Parcela creada: ${data.cropType}`,
        entityType: 'FarmParcel',
        entityId: parcel.id,
        farmerId: data.farmerId,
      },
    })

    return parcel
  }

  async findByFarmer(farmerId: string) {
    return prisma.farmParcel.findMany({
      where: { farmerId, isActive: true },
      orderBy: { createdAt: 'desc' },
    })
  }

  async findById(id: string) {
    const parcel = await prisma.farmParcel.findUnique({
      where: { id },
      include: {
        observations: {
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
      },
    })

    if (!parcel) {
      throw new NotFoundError('Parcela no encontrada')
    }

    return parcel
  }

  async update(id: string, data: any) {
    const parcel = await prisma.farmParcel.findUnique({ where: { id } })

    if (!parcel) {
      throw new NotFoundError('Parcela no encontrada')
    }

    return prisma.farmParcel.update({ where: { id }, data })
  }

  async delete(id: string) {
    const parcel = await prisma.farmParcel.findUnique({ where: { id } })

    if (!parcel) {
      throw new NotFoundError('Parcela no encontrada')
    }

    return prisma.farmParcel.update({
      where: { id },
      data: { isActive: false },
    })
  }
}

export const parcelService = new ParcelService()
