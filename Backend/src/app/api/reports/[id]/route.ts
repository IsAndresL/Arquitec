import { NextResponse } from 'next/server'
import { createAuthHandler } from '@/shared/middlewares/auth'
import { TECHNICIAN_ROLES } from '@/shared/middlewares/roleGuard'
import { reportService } from '@/application/services/ReportService'
import { AppError } from '@/shared/errors/AppError'

export const GET = createAuthHandler(
  async (request, { params }: { params: { id: string } }) => {
    try {
      const { id } = params
      const report = await reportService.findById(id)
      return NextResponse.json(report)
    } catch (error: any) {
      if (error instanceof AppError) {
        return NextResponse.json({ error: error.message }, { status: error.statusCode })
      }
      return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
    }
  },
  TECHNICIAN_ROLES
)

export const PATCH = createAuthHandler(
  async (request, { params }: { params: { id: string } }) => {
    try {
      const { id } = params
      const body = await request.json()
      const result = await reportService.update(id, body)
      return NextResponse.json(result)
    } catch (error: any) {
      if (error instanceof AppError) {
        return NextResponse.json({ error: error.message }, { status: error.statusCode })
      }
      return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
    }
  },
  TECHNICIAN_ROLES
)

export const DELETE = createAuthHandler(
  async (request, { params }: { params: { id: string } }) => {
    try {
      const { id } = params
      const result = await reportService.delete(id)
      return NextResponse.json(result)
    } catch (error: any) {
      if (error instanceof AppError) {
        return NextResponse.json({ error: error.message }, { status: error.statusCode })
      }
      return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
    }
  },
  TECHNICIAN_ROLES
)
