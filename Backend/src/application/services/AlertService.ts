import { prisma } from '@/shared/config/database'
import { AppError, NotFoundError } from '@/shared/errors/AppError'

export class AlertService {
  async create(data: {
    type: 'RIEGO' | 'REVISAR_CULTIVO' | 'OTRO'
    description?: string
    frequency: 'DIARIA' | 'CADA_N_DIAS' | 'SEMANAL'
    intervalDays?: number
    hour: string
    parcelId?: string
    farmerId: string
  }) {
    const farmer = await prisma.farmerProfile.findUnique({
      where: { id: data.farmerId },
    })

    if (!farmer) {
      throw new NotFoundError('Campesino no encontrado')
    }

    const alert = await prisma.alert.create({ data })

    await prisma.activityLog.create({
      data: {
        type: 'ALERT_CREATED',
        description: `Alerta programada: ${data.type}`,
        entityType: 'Alert',
        entityId: alert.id,
        farmerId: data.farmerId,
      },
    })

    return alert
  }

  async findByFarmer(farmerId: string) {
    return prisma.alert.findMany({
      where: { farmerId },
      include: { parcel: true },
      orderBy: { createdAt: 'desc' },
    })
  }

  async findById(id: string) {
    const alert = await prisma.alert.findUnique({
      where: { id },
      include: { parcel: true },
    })

    if (!alert) {
      throw new NotFoundError('Alerta no encontrada')
    }

    return alert
  }

  async update(id: string, data: any) {
    const alert = await prisma.alert.findUnique({ where: { id } })

    if (!alert) {
      throw new NotFoundError('Alerta no encontrada')
    }

    return prisma.alert.update({ where: { id }, data })
  }

  async delete(id: string) {
    const alert = await prisma.alert.findUnique({ where: { id } })

    if (!alert) {
      throw new NotFoundError('Alerta no encontrada')
    }

    return prisma.alert.delete({ where: { id } })
  }

  async toggle(id: string) {
    const alert = await prisma.alert.findUnique({ where: { id } })

    if (!alert) {
      throw new NotFoundError('Alerta no encontrada')
    }

    return prisma.alert.update({
      where: { id },
      data: { isActive: !alert.isActive },
    })
  }
}

export const alertService = new AlertService()
