import { NextResponse } from 'next/server'
import { createAuthHandler } from '@/shared/middlewares/auth'
import { ALL_ROLES, TECHNICIAN_ROLES } from '@/shared/middlewares/roleGuard'
import { recommendationService } from '@/application/services/RecommendationService'
import { createRecommendationSchema } from '@/application/dtos'
import { AppError } from '@/shared/errors/AppError'

export const GET = createAuthHandler(
  async (request) => {
    try {
      const { searchParams } = new URL(request.url)
      const farmerId = searchParams.get('farmerId')
      const technicianId = searchParams.get('technicianId')

      if (farmerId) {
        const recommendations = await recommendationService.findByFarmer(farmerId)
        return NextResponse.json(recommendations)
      }

      if (technicianId) {
        const recommendations = await recommendationService.findByTechnician(technicianId)
        return NextResponse.json(recommendations)
      }

      return NextResponse.json(
        { error: 'farmerId o technicianId es requerido' },
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
      const validated = createRecommendationSchema.parse(body)

      const result = await recommendationService.create({
        ...validated,
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
