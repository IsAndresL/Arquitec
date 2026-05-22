import { NextResponse } from 'next/server'
import { createAuthHandler } from '@/shared/middlewares/auth'
import { TECHNICIAN_ROLES } from '@/shared/middlewares/roleGuard'
import { ruleService } from '@/application/services/RuleService'
import { createRuleSchema } from '@/application/dtos'
import { AppError } from '@/shared/errors/AppError'

// GET público para que campesinos puedan ver reglas (usado en generación de recomendaciones)
export async function GET() {
  try {
    const rules = await ruleService.findAll()
    return NextResponse.json(rules)
  } catch (error: any) {
    if (error instanceof AppError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode })
    }
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}

export const POST = createAuthHandler(
  async (request) => {
    try {
      const body = await request.json()
      const validated = createRuleSchema.parse(body)

      const result = await ruleService.create(validated)
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
