import { prisma } from '@/shared/config/database'
import { AppError, NotFoundError } from '@/shared/errors/AppError'

export class RecommendationService {
  async create(data: {
    type: 'AUTOMATICA' | 'MANUAL'
    priority?: 'BAJA' | 'MEDIA' | 'ALTA'
    title: string
    description: string
    action?: string
    farmerId: string
    observationId?: string
    technicianId?: string
  }) {
    const farmer = await prisma.farmerProfile.findUnique({
      where: { id: data.farmerId },
    })

    if (!farmer) {
      throw new NotFoundError('Campesino no encontrado')
    }

    const recommendation = await prisma.recommendation.create({ data })

    await prisma.activityLog.create({
      data: {
        type: 'RECOMMENDATION_CREATED',
        description: `Recomendación emitida: ${data.title}`,
        entityType: 'Recommendation',
        entityId: recommendation.id,
        farmerId: data.farmerId,
        userId: data.technicianId,
      },
    })

    return recommendation
  }

  async findByFarmer(farmerId: string) {
    return prisma.recommendation.findMany({
      where: { farmerId },
      include: {
        observation: true,
        technician: {
          select: { id: true, name: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    })
  }

  async findByTechnician(technicianId: string) {
    return prisma.recommendation.findMany({
      where: { technicianId },
      include: {
        farmer: {
          select: { id: true, name: true, photoUrl: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    })
  }

  async findById(id: string) {
    const recommendation = await prisma.recommendation.findUnique({
      where: { id },
      include: {
        farmer: { select: { id: true, name: true } },
        observation: true,
        technician: { select: { id: true, name: true } },
      },
    })

    if (!recommendation) {
      throw new NotFoundError('Recomendación no encontrada')
    }

    return recommendation
  }

  async updateStatus(id: string, status: string) {
    const recommendation = await prisma.recommendation.findUnique({ where: { id } })

    if (!recommendation) {
      throw new NotFoundError('Recomendación no encontrada')
    }

    const updateData: any = { status }

    if (status === 'SEGUIDA') {
      updateData.followedAt = new Date()
    } else if (status === 'IGNORADA') {
      updateData.ignoredAt = new Date()
    }

    return prisma.recommendation.update({
      where: { id },
      data: updateData,
    })
  }

  async update(id: string, data: Partial<{
    type: 'AUTOMATICA' | 'MANUAL'
    priority: 'BAJA' | 'MEDIA' | 'ALTA'
    title: string
    description: string
    action?: string
    farmerId: string
    observationId?: string
    technicianId?: string
  }>) {
    const recommendation = await prisma.recommendation.findUnique({ where: { id } })

    if (!recommendation) {
      throw new NotFoundError('Recomendación no encontrada')
    }

    const updated = await prisma.recommendation.update({
      where: { id },
      data,
    })

    await prisma.activityLog.create({
      data: {
        type: 'RECOMMENDATION_UPDATED',
        description: `Recomendación actualizada: ${updated.title}`,
        entityType: 'Recommendation',
        entityId: updated.id,
        farmerId: updated.farmerId,
        userId: updated.technicianId,
      },
    })

    return updated
  }

  async delete(id: string) {
    const recommendation = await prisma.recommendation.findUnique({ where: { id } })

    if (!recommendation) {
      throw new NotFoundError('Recomendación no encontrada')
    }

    await prisma.recommendation.delete({ where: { id } })

    await prisma.activityLog.create({
      data: {
        type: 'RECOMMENDATION_DELETED',
        description: `Recomendación eliminada: ${recommendation.title}`,
        entityType: 'Recommendation',
        entityId: id,
        farmerId: recommendation.farmerId,
        userId: recommendation.technicianId,
      },
    })

    return { message: 'Recomendación eliminada' }
  }

  async generateAutomatic(observationId: string) {
    const observation = await prisma.cropObservation.findUnique({
      where: { id: observationId },
      include: { parcel: true },
    })

    if (!observation) {
      throw new NotFoundError('Observación no encontrada')
    }

    if (observation.status === 'SANO') {
      return null
    }

    const recentClimate = await prisma.climateRecord.findFirst({
      where: { farmerId: observation.farmerId },
      orderBy: { date: 'desc' },
    })

    const rules = await prisma.agronomicRule.findMany({
      where: {
        cropType: observation.parcel.cropType,
        cropStatus: observation.status,
        isActive: true,
        OR: [
          { climateType: recentClimate?.type || undefined },
          { climateType: null },
        ],
      },
    })

    if (rules.length === 0) {
      return null
    }

    const rule = rules[0]

    const recommendation = await prisma.recommendation.create({
      data: {
        type: 'AUTOMATICA',
        priority: rule.priority,
        title: `Recomendación para ${observation.parcel.cropType}`,
        description: rule.action,
        action: rule.action,
        farmerId: observation.farmerId,
        observationId: observation.id,
        cropStatus: observation.status,
        climateType: recentClimate?.type,
        cropType: observation.parcel.cropType,
      },
    })

    return recommendation
  }
}

export const recommendationService = new RecommendationService()
