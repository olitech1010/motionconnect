import { NextResponse } from 'next/server'
import { PackageService } from '@/services/package.service'

export async function GET() {
  try {
    const packages = await PackageService.getActivePackages()
    return NextResponse.json({ success: true, data: packages })
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Failed to fetch packages'
    return NextResponse.json(
      { success: false, error: msg },
      { status: 500 }
    )
  }
}
