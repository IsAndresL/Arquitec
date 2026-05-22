import { NextResponse } from 'next/server'
import { createAuthHandler } from '@/shared/middlewares/auth'
import { TECHNICIAN_ROLES } from '@/shared/middlewares/roleGuard'
import { prisma } from '@/shared/config/database'
import { AppError } from '@/shared/errors/AppError'

export const PATCH = createAuthHandler(
  async (request, { params }: { params: { id: string } }) => {
    try {
      const id = params?.id
      const body = await request.json()
      const { technicianId } = body

      if (!id || !technicianId) {
        return NextResponse.json({ error: 'Faltan parámetros requeridos: id o technicianId' }, { status: 400 })
      }

      // Validar que el campesino exista
      const farmer = await prisma.farmerProfile.findUnique({
        where: { id }
      })
      if (!farmer) {
        return NextResponse.json({ error: 'Campesino no encontrado' }, { status: 404 })
      }

      // Validar que el técnico exista
      const technician = await prisma.user.findUnique({
        where: { id: technicianId }
      })
      if (!technician) {
        return NextResponse.json({ error: 'Técnico no encontrado' }, { status: 404 })
      }

      // Actualizar el campesino
      const updated = await prisma.farmerProfile.update({
        where: { id },
        data: { createdById: technicianId }
      })

      // Registrar actividad
      await prisma.activityLog.create({
        data: {
          type: 'FARMER_REASSIGNED',
          description: `Campesino ${farmer.name} reasignado al técnico ${technician.name}`,
          entityType: 'FarmerProfile',
          entityId: id,
          userId: request.user!.userId,
        }
      })

      return NextResponse.json(updated)
    } catch (error: any) {
      console.error('Error assigning farmer:', error)
      return NextResponse.json({ error: 'Error al asignar campesino al técnico' }, { status: 500 })
    }
  },
  TECHNICIAN_ROLES
)
