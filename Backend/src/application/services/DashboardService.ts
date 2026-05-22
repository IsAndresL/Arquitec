import { prisma } from '@/shared/config/database'
import { getCache, setCache, CACHE_TTL } from '@/shared/config/redis'

export class DashboardService {
  async getTechnicianDashboard(technicianId: string) {
    const cacheKey = `dashboard:technician:${technicianId}`
    const cached = await getCache(cacheKey)
    
    if (cached) {
      return JSON.parse(cached)
    }

    const user = await prisma.user.findUnique({
      where: { id: technicianId }
    })
    const isMainTech = user?.email === 'tecnico@magdalena-smart-farming.com'

    const [
      totalFarmers,
      activeAlerts,
      pendingSyncs,
      totalParcels,
      totalReports,
      recentActivities,
      recentRecommendations,
    ] = await Promise.all([
      prisma.farmerProfile.count({
        where: { 
          isActive: true,
          ...(isMainTech ? {} : { createdById: technicianId })
        },
      }),
      prisma.alert.count({
        where: {
          isActive: true,
          ...(isMainTech ? {} : { farmer: { createdById: technicianId } }),
        },
      }),
      prisma.syncRecord.count({
        where: {
          status: 'PENDIENTE',
          ...(isMainTech ? {} : { farmer: { createdById: technicianId } }),
        },
      }),
      prisma.farmParcel.count({
        where: {
          isActive: true,
          ...(isMainTech ? {} : { farmer: { createdById: technicianId } }),
        },
      }),
      prisma.report.count({
        where: isMainTech ? {} : { technicianId },
      }),
      prisma.activityLog.findMany({
        where: isMainTech ? {} : {
          OR: [
            { userId: technicianId },
            { farmer: { createdById: technicianId } },
          ],
        },
        orderBy: { createdAt: 'desc' },
        take: 10,
        include: {
          farmer: { select: { id: true, name: true } },
          user: { select: { id: true, name: true } },
        },
      }),
      prisma.recommendation.findMany({
        where: isMainTech ? {} : { technicianId },
        orderBy: { createdAt: 'desc' },
        take: 5,
        include: {
          farmer: { select: { id: true, name: true } },
        },
      }),
    ])

    const totalRecords = await prisma.syncRecord.count({
      where: isMainTech ? {} : { farmer: { createdById: technicianId } },
    })

    const syncPercentage = totalRecords > 0 
      ? Math.round(((totalRecords - pendingSyncs) / totalRecords) * 100) 
      : 100

    const dashboard = {
      metrics: {
        totalFarmers,
        activeAlerts,
        syncPercentage,
        pendingSyncs,
        totalParcels,
        totalReports,
      },
      recentActivities,
      recentRecommendations,
    }

    await setCache(cacheKey, JSON.stringify(dashboard), CACHE_TTL.DASHBOARD)
    return dashboard
  }

  async getFarmerDashboard(farmerId: string) {
    const cacheKey = `dashboard:farmer:${farmerId}`
    const cached = await getCache(cacheKey)
    
    if (cached) {
      return JSON.parse(cached)
    }

    const [
      parcels,
      alerts,
      recommendations,
      observations,
      climateRecords,
      inputs,
    ] = await Promise.all([
      prisma.farmParcel.findMany({
        where: { farmerId, isActive: true },
      }),
      prisma.alert.findMany({
        where: { farmerId, isActive: true },
      }),
      prisma.recommendation.findMany({
        where: { farmerId },
        orderBy: { createdAt: 'desc' },
        take: 5,
      }),
      prisma.cropObservation.findMany({
        where: { farmerId },
        orderBy: { createdAt: 'desc' },
        take: 5,
      }),
      prisma.climateRecord.findMany({
        where: { farmerId },
        orderBy: { date: 'desc' },
        take: 7,
      }),
      prisma.inputRecord.findMany({
        where: { farmerId },
        orderBy: { date: 'desc' },
        take: 5,
      }),
    ])

    const totalCost = inputs.reduce((sum, input) => sum + (input.cost || 0), 0)

    const dashboard = {
      parcels,
      alerts,
      recommendations,
      observations,
      climateRecords,
      inputs,
      totalInputCost: totalCost,
      ethicalNotice: 'Esta es una recomendación automática; la decisión final la toma el agricultor.',
    }

    await setCache(cacheKey, JSON.stringify(dashboard), CACHE_TTL.DASHBOARD)
    return dashboard
  }
}

export const dashboardService = new DashboardService()
