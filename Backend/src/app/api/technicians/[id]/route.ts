import { NextResponse } from 'next/server'
import { createAuthHandler, AuthenticatedRequest } from '@/shared/middlewares/auth'
import { TECHNICIAN_ROLES } from '@/shared/middlewares/roleGuard'
import { prisma } from '@/shared/config/database'

export const DELETE = createAuthHandler(
  async (request: AuthenticatedRequest, { params }: { params: { id: string } }) => {
    try {
      const technicianId = params.id

      // El solicitante debe ser el Técnico Principal
      if (request.user!.email !== 'tecnico@magdalena-smart-farming.com') {
        return NextResponse.json({ error: 'No tienes permisos para desactivar técnicos' }, { status: 403 })
      }

      // Validar si existe
      const techToDeactivate = await prisma.user.findUnique({ where: { id: technicianId } })
      if (!techToDeactivate) {
        return NextResponse.json({ error: 'Técnico no encontrado' }, { status: 404 })
      }

      // No permitir desactivarse a sí mismo
      if (techToDeactivate.email === 'tecnico@magdalena-smart-farming.com') {
        return NextResponse.json({ error: 'No se puede desactivar al Técnico Principal' }, { status: 400 })
      }

      // Desactivar el técnico
      await prisma.user.update({
        where: { id: technicianId },
        data: { isActive: false }
      })

      // Log de actividad
      await prisma.activityLog.create({
        data: {
          type: 'TECHNICIAN_DEACTIVATED',
          description: `Técnico agrícola desactivado: ${techToDeactivate.name} (${techToDeactivate.email})`,
          entityType: 'User',
          entityId: technicianId,
          userId: request.user!.userId
        }
      })

      return NextResponse.json({ message: 'Técnico desactivado con éxito' })
    } catch (error: any) {
      console.error('Error deactivating technician:', error)
      return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
    }
  },
  TECHNICIAN_ROLES
)
