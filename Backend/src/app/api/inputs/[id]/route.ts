import { NextResponse } from 'next/server'
import { createAuthHandler } from '@/shared/middlewares/auth'
import { ALL_ROLES } from '@/shared/middlewares/roleGuard'
import { inputService } from '@/application/services/InputService'
import { AppError } from '@/shared/errors/AppError'

export const GET = createAuthHandler(
  async (request, { params }: { params: { id: string } }) => {
    try {
      const { id } = params
      const input = await inputService.findById(id)
      return NextResponse.json(input)
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
      const result = await inputService.update(id, body)
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
      const result = await inputService.delete(id)
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
