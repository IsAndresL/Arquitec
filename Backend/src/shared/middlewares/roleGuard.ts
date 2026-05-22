import { NextResponse } from 'next/server'
import { AuthenticatedRequest } from './auth'

export function requireRole(allowedRoles: string[]) {
  return allowedRoles
}

export const TECHNICIAN_ROLES = ['TECNICO_ADMIN']
export const FARMER_ROLES = ['CAMPESINO']
export const ALL_ROLES = ['TECNICO_ADMIN', 'CAMPESINO']
