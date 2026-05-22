import type { Metadata } from 'next'
import { initWorkers } from '@/shared/workers'

// Inicializar workers de background jobs
initWorkers()

export const metadata: Metadata = {
  title: 'Magdalena Smart Farming - API',
  description: 'Backend API para Magdalena Smart Farming',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  )
}
