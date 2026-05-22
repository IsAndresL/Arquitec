import { NextResponse } from 'next/server'
import { swaggerConfig } from '@/shared/config/swagger'

export async function GET() {
  return NextResponse.json(swaggerConfig)
}
