import { createSyncWorker } from '@/shared/config/queue'

let workerInitialized = false

export function initWorkers() {
  if (workerInitialized) {
    return
  }

  if (process.env.NODE_ENV === 'development') {
    console.log('[Workers] Inicializando workers en modo desarrollo...')
  }

  try {
    createSyncWorker()
    workerInitialized = true
    console.log('[Workers] Worker de sincronización iniciado correctamente')
  } catch (error) {
    console.error('[Workers] Error iniciando workers:', error)
  }
}

// Auto-inicializar en producción
if (process.env.NODE_ENV === 'production') {
  initWorkers()
}
