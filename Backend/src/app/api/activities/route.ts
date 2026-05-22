import { NextResponse } from 'next/server'
import { createAuthHandler, AuthenticatedRequest } from '@/shared/middlewares/auth'
import { TECHNICIAN_ROLES } from '@/shared/middlewares/roleGuard'
import { prisma } from '@/shared/config/database'
import { AppError } from '@/shared/errors/AppError'

export const GET = createAuthHandler(
  async (request: AuthenticatedRequest) => {
    try {
      const { searchParams } = new URL(request.url)
      const farmerId = searchParams.get('farmerId')
      const limit = parseInt(searchParams.get('limit') || '50')

      const isMainTech = request.user!.email === 'tecnico@magdalena-smart-farming.com'
      const where: any = {}

      if (farmerId) {
        where.farmerId = farmerId
      } else if (!isMainTech) {
        where.OR = [
          { userId: request.user!.userId },
          { farmer: { createdById: request.user!.userId } },
        ]
      }

      const activities = await prisma.activityLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limit,
        include: {
          farmer: { select: { id: true, name: true } },
          user: { select: { id: true, name: true } },
          parcel: { select: { id: true, name: true, cropType: true } },
        },
      })

      return NextResponse.json(activities)
    } catch (error: any) {
      if (error instanceof AppError) {
        return NextResponse.json({ error: error.message }, { status: error.statusCode })
      }
      return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
    }
  },
  TECHNICIAN_ROLES
)
