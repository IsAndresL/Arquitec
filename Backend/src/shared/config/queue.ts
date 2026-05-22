import { Queue, Worker, Job } from 'bullmq'
import { redis } from './redis'
import { syncService } from '@/application/services/SyncService'

// Nombre de la cola
export const SYNC_QUEUE_NAME = 'sync-queue'

// Crear la cola
export const syncQueue = new Queue(SYNC_QUEUE_NAME, {
  connection: redis,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 1000,
    },
    removeOnComplete: 100,
    removeOnFail: 50,
  },
})

// Interfaz del job
interface SyncJobData {
  farmerId: string
  entityType: string
  data: any[]
  jobId: string
}

// Crear el worker
export function createSyncWorker() {
  const worker = new Worker<SyncJobData>(
    SYNC_QUEUE_NAME,
    async (job: Job<SyncJobData>) => {
      const { farmerId, entityType, data } = job.data

      console.log(`[SyncWorker] Procesando job ${job.id} - Farmer: ${farmerId}, Entity: ${entityType}, Items: ${data.length}`)

      const result = await syncService.syncData(farmerId, entityType, data)

      console.log(`[SyncWorker] Job ${job.id} completado - Éxitos: ${result.success}, Fallos: ${result.failed}`)

      return result
    },
    {
      connection: redis,
      concurrency: 5, // Procesar hasta 5 jobs simultáneamente
    }
  )

  worker.on('completed', (job) => {
    console.log(`[SyncWorker] Job ${job.id} completado exitosamente`)
  })

  worker.on('failed', (job, err) => {
    console.error(`[SyncWorker] Job ${job?.id} falló:`, err.message)
  })

  return worker
}

// Función para agregar job a la cola
export async function enqueueSync(
  farmerId: string,
  entityType: string,
  data: any[]
): Promise<Job> {
  const job = await syncQueue.add(
    'sync-data',
    {
      farmerId,
      entityType,
      data,
      jobId: `sync-${farmerId}-${entityType}-${Date.now()}`,
    },
    {
      jobId: `sync-${farmerId}-${entityType}-${Date.now()}`,
    }
  )

  console.log(`[SyncQueue] Job encolado: ${job.id}`)
  return job
}

// Obtener estado de la cola
export async function getQueueStatus() {
  const [waiting, active, completed, failed] = await Promise.all([
    syncQueue.getWaitingCount(),
    syncQueue.getActiveCount(),
    syncQueue.getCompletedCount(),
    syncQueue.getFailedCount(),
  ])

  return {
    waiting,
    active,
    completed,
    failed,
    total: waiting + active + completed + failed,
  }
}
