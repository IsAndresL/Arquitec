import { NextResponse } from 'next/server'
import { createAuthHandler } from '@/shared/middlewares/auth'
import { ALL_ROLES } from '@/shared/middlewares/roleGuard'
import { inputService } from '@/application/services/InputService'
import { createInputSchema } from '@/application/dtos'
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

      const inputs = await inputService.findByFarmer(farmerId)
      const total = await inputService.calculateTotal(farmerId)

      return NextResponse.json({ inputs, total })
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
      const validated = createInputSchema.parse(body)

      const result = await inputService.create({
        ...validated,
        date: new Date(validated.date + (validated.date.includes('T') ? '' : 'T00:00:00.000Z')),
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
  ALL_ROLES
)
