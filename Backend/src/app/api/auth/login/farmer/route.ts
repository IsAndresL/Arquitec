import { NextRequest, NextResponse } from 'next/server'
import { authService } from '@/application/services/AuthService'
import { loginFarmerSchema } from '@/application/dtos'
import { AppError } from '@/shared/errors/AppError'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validated = loginFarmerSchema.parse(body)

    const result = await authService.loginFarmer(validated.farmerId, validated.pin)

    return NextResponse.json(result)
  } catch (error: any) {
    console.error('ERROR IN FARMER LOGIN ROUTE:', error)
    if (error instanceof AppError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode })
    }
    if (error.name === 'ZodError') {
      const messages = error.errors.map((e: any) => `${e.path.join('.')}: ${e.message}`).join(', ')
        return NextResponse.json({ error: messages }, { status: 400 })
    }
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
