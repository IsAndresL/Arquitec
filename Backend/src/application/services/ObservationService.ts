import { prisma } from '@/shared/config/database'
import { AppError, NotFoundError } from '@/shared/errors/AppError'
import { recommendationService } from './RecommendationService'

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

    // ========================================================================
    // MOTOR DE INTELIGENCIA AGRÓNOMA (IA): GENERACIÓN AUTOMÁTICA DE ALERTAS
    // ========================================================================
    if (data.status !== 'SANO') {
      let alertDesc = 'Se han reportado anomalías en el cultivo de tu parcela.';
      let alertType: 'RIEGO' | 'REVISAR_CULTIVO' = 'REVISAR_CULTIVO';

      if (data.status === 'HOJAS_SECAS') {
        alertDesc = 'Hojas secas reportadas en tu parcela. Riega de inmediato y revisa la humedad del suelo.';
        alertType = 'RIEGO';
      } else if (data.status === 'MANCHAS_NEGRAS') {
        alertDesc = 'Manchas negras detectadas. Podría ser un hongo. Aplica fungicida preventivo orgánico.';
        alertType = 'REVISAR_CULTIVO';
      } else if (data.status === 'HOJAS_AMARILLAS') {
        alertDesc = 'Se observan hojas amarillas. Ajusta la dosificación de nutrientes o controla el exceso de humedad.';
        alertType = 'REVISAR_CULTIVO';
      } else if (data.status === 'OTRA') {
        alertDesc = 'Anomalías detectadas en las plantas. Realiza una inspección visual general.';
        alertType = 'REVISAR_CULTIVO';
      }

      // Evitar crear alertas duplicadas activas idénticas
      const existingAlert = await prisma.alert.findFirst({
        where: {
          farmerId: data.farmerId,
          parcelId: data.parcelId,
          type: alertType,
          description: alertDesc,
          isActive: true
        }
      });

      if (!existingAlert) {
        await prisma.alert.create({
          data: {
            type: alertType,
            description: alertDesc,
            frequency: 'DIARIA',
            hour: '07:00',
            isActive: true,
            farmerId: data.farmerId,
            parcelId: data.parcelId,
            syncStatus: 'SINCRONIZADO'
          }
        });
      }

      // Intentar generar recomendación técnica automatizada complementaria
      try {
        await recommendationService.generateAutomatic(observation.id);
      } catch (recErr) {
        console.warn('[ObservationService IA] Error al generar recomendación automática:', recErr);
      }
    }

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
