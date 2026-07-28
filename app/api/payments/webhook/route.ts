import { NextResponse } from 'next/server'
import crypto from 'crypto'
import { TransactionService } from '@/services/transaction.service'
import { RouterService } from '@/services/router.service'
import { PackageService } from '@/services/package.service'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(request: Request) {
  try {
    const rawBody = await request.text()
    const signature = request.headers.get('x-hubtel-signature') || request.headers.get('authorization')
    const secret = process.env.HUBTEL_CLIENT_SECRET || ''

    // Optional HMAC verification if secret is configured and signature present
    if (signature && secret) {
      const computed = crypto.createHmac('sha256', secret).update(rawBody).digest('hex')
      if (computed !== signature && !signature.includes(computed)) {
        console.warn('Webhook signature mismatch. Proceeding with caution or rejecting.')
      }
    }

    const payload = JSON.parse(rawBody)
    const reference = payload.ClientReference || payload.clientReference || payload.reference
    const status = payload.ResponseCode === '0000' || payload.status?.toLowerCase() === 'success' || payload.Status?.toLowerCase() === 'success'
      ? 'success'
      : 'failed'

    if (!reference) {
      return NextResponse.json({ error: 'Missing client reference in webhook' }, { status: 400 })
    }

    const transaction = await TransactionService.getByReference(reference)
    if (!transaction) {
      return NextResponse.json({ error: 'Transaction not found' }, { status: 404 })
    }

    if (transaction.status === 'success') {
      return NextResponse.json({ success: true, message: 'Already processed' })
    }

    if (status === 'success') {
      const pkg = transaction.package_id ? await PackageService.getPackageById(transaction.package_id) : null
      const profile = pkg?.mikrotik_profile || 'weekly'
      const durationSec = pkg?.duration_seconds || 86400
      const expiresAt = new Date(Date.now() + durationSec * 1000).toISOString()

      const voucher = `MC-${Math.random().toString(36).substring(2, 8).toUpperCase()}`
      const username = voucher.toLowerCase()

      // Create Hotspot User on MikroTik
      await RouterService.createHotspotUser({
        name: username,
        password: username,
        profile: profile,
        comment: `Txn Ref: ${reference} | Hubtel Webhook`,
      })

      // Update Database
      await TransactionService.updateTransaction(reference, {
        status: 'success',
        hubtel_reference: payload.TransactionId || payload.transactionId || 'WEBHOOK_TXN',
        voucher_code: voucher,
        mikrotik_username: username,
        mikrotik_synced: true,
        sms_status: 'sent',
        expires_at: expiresAt,
      })

      // Log in activity logs
      const supabase = createAdminClient()
      await supabase.from('activity_logs').insert({
        action: 'PAYMENT_SUCCESS_WEBHOOK',
        actor: `Hubtel:${reference}`,
        details: { reference, amount: transaction.amount, phone: transaction.phone },
      })
    } else {
      await TransactionService.updateTransaction(reference, {
        status: 'failed',
        error_message: payload.Data?.errorMessage || payload.message || 'Failed via Hubtel webhook',
      })
    }

    return NextResponse.json({ success: true })
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Error processing webhook'
    console.error('Webhook Error:', msg)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
