import { NextResponse } from 'next/server'
import { createAuthHandler } from '@/shared/middlewares/auth'
import { ALL_ROLES } from '@/shared/middlewares/roleGuard'
import { alertService } from '@/application/services/AlertService'
import { createAlertSchema } from '@/application/dtos'
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

      const alerts = await alertService.findByFarmer(farmerId)
      return NextResponse.json(alerts)
    } catch (error: any) {
      if (error instanceof AppError) {
        return NextResponse.json({ error: error.message }, { status: error.statusCode })
      }
      return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
    }
  },
  ALL_ROLES
)

export const POST = createAuthHandler(
  async (request) => {
    try {
      const body = await request.json()
      const validated = createAlertSchema.parse(body)

      const result = await alertService.create(validated)
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
  ALL_ROLES
)
