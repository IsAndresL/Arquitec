import { NextResponse } from 'next/server'
import { createAuthHandler } from '@/shared/middlewares/auth'
import { ALL_ROLES } from '@/shared/middlewares/roleGuard'
import { dashboardService } from '@/application/services/DashboardService'
import { AppError } from '@/shared/errors/AppError'

export const GET = createAuthHandler(
  async (request) => {
    try {
      const { searchParams } = new URL(request.url)
      const farmerId = searchParams.get('farmerId')

      if (!farmerId) {
        return NextResponse.json(
          { error: 'farmerId es requerido' },
          { status: 400 }
        )
      }

      const dashboard = await dashboardService.getFarmerDashboard(farmerId)
      return NextResponse.json(dashboard)
    } catch (error: any) {
      if (error instanceof AppError) {
        return NextResponse.json({ error: error.message }, { status: error.statusCode })
      }
      return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
    }
  },
  ALL_ROLES
)
