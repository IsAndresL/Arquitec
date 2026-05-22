import { NextResponse } from 'next/server'
import { createAuthHandler } from '@/shared/middlewares/auth'
import { ALL_ROLES, TECHNICIAN_ROLES } from '@/shared/middlewares/roleGuard'
import { farmerService } from '@/application/services/FarmerService'
import { updateFarmerSchema } from '@/application/dtos'
import { AppError } from '@/shared/errors/AppError'

export const GET = createAuthHandler(
  async (request, { params }: { params: { id: string } }) => {
    try {
      const { id } = params
      const farmer = await farmerService.findById(id)
      return NextResponse.json(farmer)
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
      const validated = updateFarmerSchema.parse(body)

      const result = await farmerService.update(id, validated)
      return NextResponse.json(result)
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

export const DELETE = createAuthHandler(
  async (request, { params }: { params: { id: string } }) => {
    try {
      const { id } = params
      const result = await farmerService.delete(id)
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
