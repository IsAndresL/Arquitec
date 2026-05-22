import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '../utils/jwt'
import { AppError, UnauthorizedError } from '../errors/AppError'

export interface AuthenticatedRequest extends NextRequest {
  user?: {
    userId: string
    email: string
    role: string
    type: 'user' | 'farmer'
  }
}

export async function authMiddleware(
  request: NextRequest
): Promise<{ user: AuthenticatedRequest['user'] } | NextResponse> {
  try {
    const authHeader = request.headers.get('authorization')
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedError('Token no proporcionado')
    }

    const token = authHeader.split(' ')[1]
    const payload = verifyToken(token)

    return {
      user: {
        userId: payload.userId,
        email: payload.email,
        role: payload.role,
        type: payload.type,
      },
    }
  } catch (error: any) {
    if (error instanceof AppError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.statusCode }
      )
    }
    return NextResponse.json(
      { error: 'Error de autenticación' },
      { status: 401 }
    )
  }
}

export async function withAuth(
  request: NextRequest,
  allowedRoles?: string[]
): Promise<{ user: AuthenticatedRequest['user'] } | NextResponse> {
  const authResult = await authMiddleware(request)
  
  if (authResult instanceof NextResponse) {
    return authResult
  }

  if (allowedRoles && (!authResult.user || !allowedRoles.includes(authResult.user.role))) {
    return NextResponse.json(
      { error: 'No tiene permisos para esta acción' },
      { status: 403 }
    )
  }

  return authResult
}

export function createAuthHandler(
  handler: (req: AuthenticatedRequest, ...args: any[]) => Promise<NextResponse>,
  allowedRoles?: string[]
) {
  return async (request: NextRequest, ...args: any[]): Promise<NextResponse> => {
    const authResult = await withAuth(request, allowedRoles)
    
    if (authResult instanceof NextResponse) {
      return authResult
    }

    const authenticatedReq = request as AuthenticatedRequest
    authenticatedReq.user = authResult.user

    return handler(authenticatedReq, ...args)
  }
}
