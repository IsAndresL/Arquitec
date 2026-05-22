import { NextResponse } from 'next/server'
import { createAuthHandler } from '@/shared/middlewares/auth'
import { ALL_ROLES } from '@/shared/middlewares/roleGuard'
import { observationService } from '@/application/services/ObservationService'
import { AppError } from '@/shared/errors/AppError'

export const GET = createAuthHandler(
  async (request, { params }: { params: { id: string } }) => {
    try {
      const { id } = params
      const observation = await observationService.findById(id)
      return NextResponse.json(observation)
    } catch (error: any) {
      if (error instanceof AppError) {
        return NextResponse.json({ error: error.message }, { status: error.statusCode })
      }
      return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
    }
  },
  ALL_ROLES
)

export const PATCH = createAuthHandler(
  async (request, { params }: { params: { id: string } }) => {
    try {
      const { id } = params
      const body = await request.json()
      const result = await observationService.update(id, body)
      return NextResponse.json(result)
    } catch (error: any) {
      if (error instanceof AppError) {
        return NextResponse.json({ error: error.message }, { status: error.statusCode })
      }
      return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
    }
  },
  ALL_ROLES
)

export const DELETE = createAuthHandler(
  async (request, { params }: { params: { id: string } }) => {
    try {
      const { id } = params
      const result = await observationService.delete(id)
      return NextResponse.json(result)
    } catch (error: any) {
      if (error instanceof AppError) {
        return NextResponse.json({ error: error.message }, { status: error.statusCode })
      }
      return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
    }
  },
  ALL_ROLES
)
