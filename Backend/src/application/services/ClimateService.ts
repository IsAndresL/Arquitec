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

    // ========================================================================
    // MOTOR DE INTELIGENCIA AGRÓNOMA (IA): ANÁLISIS DE CLIMA HISTÓRICO Y ALERTAS
    // ========================================================================
    if (data.type === 'LLUVIA') {
      // Si llueve, resolver de forma automática cualquier alerta activa de RIEGO
      await prisma.alert.updateMany({
        where: {
          farmerId: data.farmerId,
          type: 'RIEGO',
          isActive: true
        },
        data: {
          isActive: false
        }
      });
    } else {
      // Si no es lluvia (SOL, NUBLADO, VIENTO), revisar si lleva varios días sin lluvia
      // Recuperar los últimos 3 registros climáticos ordenados por fecha
      const recentRecords = await prisma.climateRecord.findMany({
        where: { farmerId: data.farmerId },
        orderBy: { date: 'desc' },
        take: 3
      });

      // Si ha registrado al menos 3 días consecutivos y ninguno es de lluvia
      if (recentRecords.length >= 3 && recentRecords.every(r => r.type !== 'LLUVIA')) {
        // Verificar si ya existe una alerta activa de riego para evitar duplicados
        const existingRiegoAlert = await prisma.alert.findFirst({
          where: {
            farmerId: data.farmerId,
            type: 'RIEGO',
            isActive: true
          }
        });

        if (!existingRiegoAlert) {
          await prisma.alert.create({
            data: {
              type: 'RIEGO',
              description: 'Se han registrado 3 días consecutivos sin lluvias en tu vereda. Riega tus parcelas para mantener el cultivo hidratado.',
              frequency: 'DIARIA',
              hour: '07:00',
              isActive: true,
              farmerId: data.farmerId,
              syncStatus: 'SINCRONIZADO'
            }
          });
        }
      }
    }

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
