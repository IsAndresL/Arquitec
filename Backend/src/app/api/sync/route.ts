import { NextResponse } from 'next/server'
import { createAuthHandler } from '@/shared/middlewares/auth'
import { ALL_ROLES } from '@/shared/middlewares/roleGuard'
import { syncService } from '@/application/services/SyncService'
import { enqueueSync, getQueueStatus } from '@/shared/config/queue'
import { syncDataSchema } from '@/application/dtos'
import { AppError } from '@/shared/errors/AppError'

export const POST = createAuthHandler(
  async (request) => {
    try {
      const body = await request.json()
      const validated = syncDataSchema.parse(body)

      try {
        // Intentar encolar el job con BullMQ/Redis
        const job = await enqueueSync(
          validated.farmerId,
          validated.entityType,
          validated.data
        )

        return NextResponse.json({
          message: 'Sincronización encolada exitosamente',
          jobId: job.id,
          status: 'queued',
          items: validated.data.length,
        })
      } catch (queueError) {
        // Fallback: procesar sincrónicamente si la cola no está disponible (Redis offline)
        console.warn('[Sync] Cola no disponible, procesando sincrónicamente:', queueError)
        const result = await syncService.syncData(
          validated.farmerId,
          validated.entityType,
          validated.data
        )
        return NextResponse.json({
          message: 'Sincronización procesada (modo directo)',
          status: 'completed',
          success: result.success,
          failed: result.failed,
          items: validated.data.length,
        })
      }
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
  ALL_ROLES
)

export const GET = createAuthHandler(
  async () => {
    try {
      const status = await getQueueStatus()
      return NextResponse.json(status)
    } catch (error: any) {
      return NextResponse.json({ error: 'Error obteniendo estado de la cola' }, { status: 500 })
    }
  },
  ALL_ROLES
)
