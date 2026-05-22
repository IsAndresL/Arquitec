import { NextResponse } from 'next/server'
import { createAuthHandler } from '@/shared/middlewares/auth'
import { ALL_ROLES } from '@/shared/middlewares/roleGuard'
import { syncService } from '@/application/services/SyncService'
import { AppError } from '@/shared/errors/AppError'

export const GET = createAuthHandler(
  async (request, { params }: { params: { farmerId: string } }) => {
    try {
      const { farmerId } = params
      const status = await syncService.getSyncStatus(farmerId)
      return NextResponse.json(status)
    } catch (error: any) {
      if (error instanceof AppError) {
        return NextResponse.json({ error: error.message }, { status: error.statusCode })
      }
      return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
    }
  },
  ALL_ROLES
)
