import { prisma } from '@/shared/config/database'
import { AppError, NotFoundError } from '@/shared/errors/AppError'

export class ObservationService {
  async create(data: {
    status: 'SANO' | 'HOJAS_AMARILLAS' | 'MANCHAS_NEGRAS' | 'HOJAS_SECAS' | 'OTRA'
    notes?: string
    farmerId: string
    parcelId: string
  }) {
    const [farmer, parcel] = await Promise.all([
      prisma.farmerProfile.findUnique({ where: { id: data.farmerId } }),
      prisma.farmParcel.findUnique({ where: { id: data.parcelId } }),
    ])

    if (!farmer) {
      throw new NotFoundError('Campesino no encontrado')
    }

    if (!parcel) {
      throw new NotFoundError('Parcela no encontrada')
    }

    const observation = await prisma.cropObservation.create({ data })

    await prisma.activityLog.create({
      data: {
        type: 'OBSERVATION_CREATED',
        description: `Observación registrada: ${data.status}`,
        entityType: 'CropObservation',
        entityId: observation.id,
        farmerId: data.farmerId,
        parcelId: data.parcelId,
      },
    })

    return observation
  }

  async findByFarmer(farmerId: string) {
    return prisma.cropObservation.findMany({
      where: { farmerId },
      include: { parcel: true },
      orderBy: { createdAt: 'desc' },
    })
  }

  async findByParcel(parcelId: string) {
    return prisma.cropObservation.findMany({
      where: { parcelId },
      orderBy: { createdAt: 'desc' },
    })
  }

  async findById(id: string) {
    const observation = await prisma.cropObservation.findUnique({
      where: { id },
      include: { parcel: true },
    })

    if (!observation) {
      throw new NotFoundError('Observación no encontrada')
    }

    return observation
  }

  async update(id: string, data: Partial<{
    status: 'SANO' | 'HOJAS_AMARILLAS' | 'MANCHAS_NEGRAS' | 'HOJAS_SECAS' | 'OTRA'
    notes?: string
    farmerId: string
    parcelId: string
  }>) {
    const observation = await prisma.cropObservation.findUnique({ where: { id } })

    if (!observation) {
      throw new NotFoundError('Observación no encontrada')
    }

    const updated = await prisma.cropObservation.update({
      where: { id },
      data,
    })

    await prisma.activityLog.create({
      data: {
        type: 'OBSERVATION_UPDATED',
        description: `Observación actualizada: ${updated.status}`,
        entityType: 'CropObservation',
        entityId: updated.id,
        farmerId: updated.farmerId,
        parcelId: updated.parcelId,
      },
    })

    return updated
  }

  async delete(id: string) {
    const observation = await prisma.cropObservation.findUnique({ where: { id } })

    if (!observation) {
      throw new NotFoundError('Observación no encontrada')
    }

    await prisma.cropObservation.delete({ where: { id } })

    await prisma.activityLog.create({
      data: {
        type: 'OBSERVATION_DELETED',
        description: `Observación eliminada: ${observation.status}`,
        entityType: 'CropObservation',
        entityId: id,
        farmerId: observation.farmerId,
        parcelId: observation.parcelId,
      },
    })

    return { message: 'Observación eliminada' }
  }
}

export const observationService = new ObservationService()
