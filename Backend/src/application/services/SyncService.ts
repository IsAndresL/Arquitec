import { prisma } from '@/shared/config/database'
import { SyncStatus } from '@prisma/client'
import { AppError, NotFoundError } from '@/shared/errors/AppError'

export class SyncService {
  async syncData(farmerId: string, entityType: string, data: any[]) {
    const farmer = await prisma.farmerProfile.findUnique({
      where: { id: farmerId },
    })

    if (!farmer) {
      throw new NotFoundError('Campesino no encontrado')
    }

    const results = []
    const syncRecords = []

    for (const item of data) {
      try {
        let record

        // Strip Dexie-only fields that Prisma doesn't accept
        const { syncStatus, ...cleanItem } = item

        switch (entityType) {
          case 'FarmParcel': {
            const { id, ...rest } = cleanItem
            if (id) {
              record = await prisma.farmParcel.upsert({
                where: { id },
                update: { ...rest, farmerId },
                create: { id, ...rest, farmerId },
              })
            } else {
              record = await prisma.farmParcel.create({ data: { ...rest, farmerId } })
            }
            break
          }

          case 'ClimateRecord': {
            const { id, ...rest } = cleanItem
            const dateValue = new Date(rest.date)
            if (id) {
              record = await prisma.climateRecord.upsert({
                where: { id },
                update: { ...rest, farmerId, date: dateValue },
                create: { id, ...rest, farmerId, date: dateValue },
              })
            } else {
              record = await prisma.climateRecord.create({ data: { ...rest, farmerId, date: dateValue } })
            }
            break
          }

          case 'CropObservation': {
            const { id, ...rest } = cleanItem
            if (id) {
              record = await prisma.cropObservation.upsert({
                where: { id },
                update: { ...rest, farmerId },
                create: { id, ...rest, farmerId },
              })
            } else {
              record = await prisma.cropObservation.create({ data: { ...rest, farmerId } })
            }
            break
          }

          case 'InputRecord': {
            const { id, ...rest } = cleanItem
            const dateValue = new Date(rest.date)
            if (id) {
              record = await prisma.inputRecord.upsert({
                where: { id },
                update: { ...rest, farmerId, date: dateValue },
                create: { id, ...rest, farmerId, date: dateValue },
              })
            } else {
              record = await prisma.inputRecord.create({ data: { ...rest, farmerId, date: dateValue } })
            }
            break
          }

          case 'Alert': {
            const { id, ...rest } = cleanItem
            if (id) {
              record = await prisma.alert.upsert({
                where: { id },
                update: { ...rest, farmerId },
                create: { id, ...rest, farmerId },
              })
            } else {
              record = await prisma.alert.create({ data: { ...rest, farmerId } })
            }
            break
          }

          default:
            throw new Error(`Tipo de entidad no soportado: ${entityType}`)
        }

        results.push({ success: true, id: record.id })
        
        syncRecords.push({
          entityType,
          entityId: record.id,
          status: SyncStatus.SINCRONIZADO,
          farmerId,
          syncedAt: new Date(),
        })
      } catch (error: any) {
        results.push({ success: false, error: error.message, data: item })
        
        syncRecords.push({
          entityType,
          entityId: item.id || 'unknown',
          status: SyncStatus.CONFLICTO,
          farmerId,
          conflictData: item,
        })
      }
    }

    if (syncRecords.length > 0) {
      await prisma.syncRecord.createMany({ data: syncRecords })
    }

    await prisma.farmerProfile.update({
      where: { id: farmerId },
      data: { lastSyncAt: new Date() },
    })

    const successCount = results.filter((r) => r.success).length
    const totalCount = results.length

    return {
      success: successCount,
      failed: totalCount - successCount,
      total: totalCount,
      results,
    }
  }

  async getSyncStatus(farmerId: string) {
    const [totalRecords, pendingRecords, conflictRecords, lastSync] = await Promise.all([
      prisma.syncRecord.count({ where: { farmerId } }),
      prisma.syncRecord.count({ where: { farmerId, status: SyncStatus.PENDIENTE } }),
      prisma.syncRecord.count({ where: { farmerId, status: SyncStatus.CONFLICTO } }),
      prisma.syncRecord.findFirst({
        where: { farmerId, status: SyncStatus.SINCRONIZADO },
        orderBy: { syncedAt: 'desc' },
      }),
    ])

    const syncPercentage = totalRecords > 0 
      ? Math.round(((totalRecords - pendingRecords) / totalRecords) * 100) 
      : 100

    return {
      farmerId,
      totalRecords,
      pendingRecords,
      conflictRecords,
      syncPercentage,
      lastSyncAt: lastSync?.syncedAt || null,
    }
  }

  async findByFarmer(farmerId: string) {
    return prisma.syncRecord.findMany({
      where: { farmerId },
      orderBy: { createdAt: 'desc' },
    })
  }
}

export const syncService = new SyncService()
