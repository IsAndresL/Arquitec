import { NextResponse } from 'next/server'
import { createAuthHandler } from '@/shared/middlewares/auth'
import { TECHNICIAN_ROLES } from '@/shared/middlewares/roleGuard'
import { prisma } from '@/shared/config/database'

export const GET = createAuthHandler(
  async (request) => {
    try {
      const technicians = await prisma.user.findMany({
        where: { role: 'TECNICO_ADMIN', isActive: true },
        select: {
          id: true,
          name: true,
          email: true,
        },
        orderBy: { name: 'asc' }
      })
      return NextResponse.json(technicians)
    } catch (error: any) {
      console.error('Error fetching technicians:', error)
      return NextResponse.json({ error: 'Error al cargar lista de técnicos' }, { status: 500 })
    }
  },
  TECHNICIAN_ROLES
)
