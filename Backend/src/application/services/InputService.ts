import { prisma } from '@/shared/config/database'
import { AppError, NotFoundError } from '@/shared/errors/AppError'

export class InputService {
  async create(data: {
    name: string
    quantity: number
    unit: string
    date: Date
    cost?: number
    farmerId: string
  }) {
    const farmer = await prisma.farmerProfile.findUnique({
      where: { id: data.farmerId },
    })

    if (!farmer) {
      throw new NotFoundError('Campesino no encontrado')
    }

    const input = await prisma.inputRecord.create({ data })

    await prisma.activityLog.create({
      data: {
        type: 'INPUT_REGISTERED',
        description: `Insumo registrado: ${data.name}`,
        entityType: 'InputRecord',
        entityId: input.id,
        farmerId: data.farmerId,
      },
    })

    return input
  }

  async findByFarmer(farmerId: string) {
    return prisma.inputRecord.findMany({
      where: { farmerId },
      orderBy: { date: 'desc' },
    })
  }

  async findById(id: string) {
    const input = await prisma.inputRecord.findUnique({ where: { id } })

    if (!input) {
      throw new NotFoundError('Insumo no encontrado')
    }

    return input
  }

  async update(id: string, data: any) {
    const input = await prisma.inputRecord.findUnique({ where: { id } })

    if (!input) {
      throw new NotFoundError('Insumo no encontrado')
    }

    return prisma.inputRecord.update({ where: { id }, data })
  }

  async delete(id: string) {
    const input = await prisma.inputRecord.findUnique({ where: { id } })

    if (!input) {
      throw new NotFoundError('Insumo no encontrado')
    }

    return prisma.inputRecord.delete({ where: { id } })
  }

  async calculateTotal(farmerId: string) {
    const result = await prisma.inputRecord.aggregate({
      where: { farmerId },
      _sum: { cost: true },
    })

    return result._sum.cost || 0
  }
}

export const inputService = new InputService()
