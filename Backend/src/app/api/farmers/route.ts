import { NextResponse } from 'next/server'
import { createAuthHandler } from '@/shared/middlewares/auth'
import { ALL_ROLES, TECHNICIAN_ROLES } from '@/shared/middlewares/roleGuard'
import { farmerService } from '@/application/services/FarmerService'
import { createFarmerSchema } from '@/application/dtos'
import { AppError } from '@/shared/errors/AppError'
import { prisma } from '@/shared/config/database'
import { verifyToken } from '@/shared/utils/jwt'

export const GET = async (request: Request) => {
    try {
      const authHeader = request.headers.get('authorization')
      
      if (authHeader?.startsWith('Bearer ')) {
        const token = authHeader.split(' ')[1]
        let payload;
        try {
          payload = verifyToken(token)
        } catch (err) {
          return NextResponse.json({ error: 'Token inválido o expirado' }, { status: 401 })
        }

        const isMainTech = payload.email === 'tecnico@magdalena-smart-farming.com'

        // Técnico autenticado: devolver campesinos según su nivel de acceso
        const farmers = await prisma.farmerProfile.findMany({
          where: { 
            isActive: true,
            ...(isMainTech ? {} : { createdById: payload.userId })
          },
          include: {
            createdBy: {
              select: { id: true, name: true, email: true }
            }
          },
          orderBy: { name: 'asc' }
        })
        return NextResponse.json(farmers)
      }

      // Selector de login público: solo datos mínimos
      const farmers = await prisma.farmerProfile.findMany({
        where: { isActive: true },
        select: {
          id: true,
          name: true,
          photoUrl: true
        },
        orderBy: { name: 'asc' }
      })
      return NextResponse.json(farmers)
    } catch (error: any) {
      console.error('Error public farmers:', error)
      return NextResponse.json({ error: 'Error al cargar lista de productores' }, { status: 500 })
    }
}

export const POST = createAuthHandler(
  async (request) => {
    try {
      const body = await request.json()
      console.log("RECEIVED BODY:", body)
      const validated = createFarmerSchema.parse(body)
      console.log("VALIDATED BODY:", validated)

      const result = await farmerService.create({
        ...validated,
        createdById: request.user!.userId,
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
