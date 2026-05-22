import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Configuración CORS
const allowedOrigins = [
  'http://localhost:3001',
  'http://localhost:3000',
  'http://192.168.0.23:3001',
  'http://192.168.80.79:3001',
]

export function middleware(request: NextRequest) {
  const origin = request.headers.get('origin') || ''
  
  // Verificar si el origen está permitido
  const isAllowedOrigin = allowedOrigins.includes(origin) || !origin

  // Manejar preflight requests (OPTIONS)
  if (request.method === 'OPTIONS') {
    const response = new NextResponse(null, { status: 204 })
    
    if (isAllowedOrigin) {
      response.headers.set('Access-Control-Allow-Origin', origin || '*')
    }
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS')
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization')
    response.headers.set('Access-Control-Allow-Credentials', 'true')
    response.headers.set('Access-Control-Max-Age', '86400')
    
    return response
  }

  // Para otras requests, agregar headers CORS a la respuesta
  const response = NextResponse.next()
  
  if (isAllowedOrigin) {
    response.headers.set('Access-Control-Allow-Origin', origin || '*')
  }
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS')
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  response.headers.set('Access-Control-Allow-Credentials', 'true')
  
  return response
}

// Configurar el matcher para que aplique a todas las rutas API
export const config = {
  matcher: '/api/:path*',
}
