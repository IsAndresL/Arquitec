import { NextResponse } from 'next/server'
import { createAuthHandler } from '@/shared/middlewares/auth'
import { TECHNICIAN_ROLES } from '@/shared/middlewares/roleGuard'
import { reportService } from '@/application/services/ReportService'
import { createReportSchema } from '@/application/dtos'
import { AppError } from '@/shared/errors/AppError'

export const GET = createAuthHandler(
  async (request) => {
    try {
      const reports = await reportService.findByTechnician(request.user!.userId)
      return NextResponse.json(reports)
    } catch (error: any) {
      if (error instanceof AppError) {
        return NextResponse.json({ error: error.message }, { status: error.statusCode })
      }
      return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
    }
  },
  TECHNICIAN_ROLES
)

export const POST = createAuthHandler(
  async (request) => {
    try {
      const body = await request.json()
      const validated = createReportSchema.parse(body)

      const result = await reportService.create({
        ...validated,
        periodStart: new Date(validated.periodStart + (validated.periodStart.includes('T') ? '' : 'T00:00:00.000Z')),
        periodEnd: new Date(validated.periodEnd + (validated.periodEnd.includes('T') ? '' : 'T23:59:59.999Z')),
        technicianId: request.user!.userId,
      })
      return NextResponse.json(result, { status: 201 })
    } catch (error: any) {
      if (error instanceof AppError) {
        return NextResponse.json({ error: error.message }, { status: error.statusCode })
      }
      if (error.name === 'ZodError') {
        const messages = error.errors.map((e: any) => `${e.path.join('.')}: ${e.message}`).join(', ')
        return NextResponse.json({ error: messages }, { status: 400 })
      }
      return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
    }
  },
  TECHNICIAN_ROLES
)
