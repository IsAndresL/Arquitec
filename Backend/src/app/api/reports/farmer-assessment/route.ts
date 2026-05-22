import { NextResponse } from 'next/server'
import { createAuthHandler } from '@/shared/middlewares/auth'
import { TECHNICIAN_ROLES } from '@/shared/middlewares/roleGuard'
import { reportService } from '@/application/services/ReportService'
import { AppError } from '@/shared/errors/AppError'

export const POST = createAuthHandler(
  async (request) => {
    try {
      const body = await request.json()
      const { farmerId, periodStart, periodEnd } = body

      if (!farmerId || !periodStart || !periodEnd) {
        return NextResponse.json(
          { error: 'farmerId, periodStart y periodEnd son requeridos' },
          { status: 400 }
        )
      }

      const result = await reportService.generateFarmerReport(
        farmerId,
        new Date(periodStart),
        new Date(periodEnd),
        request.user!.userId
      )
      return NextResponse.json(result, { status: 201 })
    } catch (error: any) {
      if (error instanceof AppError) {
        return NextResponse.json({ error: error.message }, { status: error.statusCode })
      }
      return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
    }
  },
  TECHNICIAN_ROLES
)
