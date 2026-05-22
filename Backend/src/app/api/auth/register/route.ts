import { NextRequest, NextResponse } from 'next/server'
import { authService } from '@/application/services/AuthService'
import { AppError } from '@/shared/errors/AppError'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password, name } = body

    if (!email || !password || !name) {
      return NextResponse.json(
        { error: 'Email, contraseña y nombre son obligatorios' },
        { status: 400 }
      )
    }

    const result = await authService.createTechnician(email, password, name)

    return NextResponse.json(result, { status: 201 })
  } catch (error: any) {
    if (error instanceof AppError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode })
    }
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
