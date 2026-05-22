import { NextRequest, NextResponse } from 'next/server'
import { authService } from '@/application/services/AuthService'
import { loginTechnicianSchema } from '@/application/dtos'
import { AppError } from '@/shared/errors/AppError'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validated = loginTechnicianSchema.parse(body)

    const result = await authService.loginTechnician(validated.email, validated.password)

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
}
