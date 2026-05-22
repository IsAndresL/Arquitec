import { NextResponse } from 'next/server'
import { createAuthHandler } from '@/shared/middlewares/auth'
import { ALL_ROLES } from '@/shared/middlewares/roleGuard'
import { observationService } from '@/application/services/ObservationService'
import { recommendationService } from '@/application/services/RecommendationService'
import { createObservationSchema } from '@/application/dtos'
import { AppError } from '@/shared/errors/AppError'

export const GET = createAuthHandler(
  async (request) => {
    try {
      const { searchParams } = new URL(request.url)
      const farmerId = searchParams.get('farmerId')
      const parcelId = searchParams.get('parcelId')

      if (farmerId) {
        const observations = await observationService.findByFarmer(farmerId)
        return NextResponse.json(observations)
      }

      if (parcelId) {
        const observations = await observationService.findByParcel(parcelId)
        return NextResponse.json(observations)
      }

      return NextResponse.json(
        { error: 'farmerId o parcelId es requerido' },
        { status: 400 }
      )
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
      const validated = createObservationSchema.parse(body)

      const result = await observationService.create(validated)

      if (result.status !== 'SANO') {
        try {
          await recommendationService.generateAutomatic(result.id)
        } catch {
          // Silenciar errores de generación automática
        }
      }

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
