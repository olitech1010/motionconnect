import { NextResponse } from 'next/server'
import { TransactionService } from '@/services/transaction.service'
import { PackageService } from '@/services/package.service'

export async function POST(request: Request) {
  try {
    const { reference } = await request.json()

    if (!reference) {
      return NextResponse.json({ success: false, message: 'Reference is required' }, { status: 400 })
    }

    const transaction = await TransactionService.getByReference(reference)
    if (!transaction) {
      return NextResponse.json({ success: false, message: 'Transaction not found' }, { status: 404 })
    }

    if (transaction.status === 'success') {
      return NextResponse.json({ success: true, message: 'Transaction already completed', reference })
    }

    const pkg = transaction.package_id ? await PackageService.getPackageById(transaction.package_id) : null
    const durationSec = pkg?.duration_seconds || 86400
    const expiresAt = new Date(Date.now() + durationSec * 1000).toISOString()

    const voucher = `MC-${Math.random().toString(36).substring(2, 8).toUpperCase()}`
    const username = voucher.toLowerCase()

    // (Demo Mode: mock router creation and just mark synced in DB)

    // Update database record
    await TransactionService.updateTransaction(reference, {
      status: 'success',
      voucher_code: voucher,
      mikrotik_username: username,
      mikrotik_synced: true,
      sms_status: 'sent',
      expires_at: expiresAt,
    })

    return NextResponse.json({
      success: true,
      reference,
      voucher,
      username,
      password: username,
    })
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Failed to complete demo payment'
    console.error('Demo Complete Error:', msg)
    return NextResponse.json({ success: false, message: msg }, { status: 500 })
  }
}
