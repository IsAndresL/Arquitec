import jwt from 'jsonwebtoken'
import { AppError } from '../errors/AppError'

const JWT_SECRET = process.env.JWT_SECRET || 'magdalena-smart-farming-secret-key-2026'
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '30d'

export interface JWTPayload {
  userId: string
  email: string
  role: string
  type: 'user' | 'farmer'
}

export function generateToken(payload: Omit<JWTPayload, 'iat' | 'exp'>): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN as any })
}

export function verifyToken(token: string): JWTPayload {
  try {
    return jwt.verify(token, JWT_SECRET) as JWTPayload
  } catch {
    throw new AppError('Token inválido o expirado', 401)
  }
}

export function generateFarmerToken(farmerId: string, name: string): string {
  return generateToken({
    userId: farmerId,
    email: farmerId,
    role: 'CAMPESINO',
    type: 'farmer',
  })
}

export function generateUserToken(userId: string, email: string, role: string): string {
  return generateToken({
    userId,
    email,
    role,
    type: 'user',
  })
}
