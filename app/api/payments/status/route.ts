import { NextResponse } from 'next/server'
import crypto from 'crypto'
import { TransactionService } from '@/services/transaction.service'
import { PackageService } from '@/services/package.service'
import { PaymentService } from '@/services/payment.service'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const reference = searchParams.get('reference') || searchParams.get('ref')

    if (!reference) {
      return NextResponse.json(
        { status: 'failed', message: 'Transaction reference is required' },
        { status: 400 }
      )
    }

    const transaction = await TransactionService.getByReference(reference)
    if (!transaction) {
      return NextResponse.json(
        { status: 'failed', message: 'Transaction not found' },
        { status: 404 }
      )
    }

    const pkg = transaction.package_id ? await PackageService.getPackageById(transaction.package_id) : null
    const profile = pkg?.mikrotik_profile || 'weekly'
    const durationSec = pkg?.duration_seconds || 86400

    if (transaction.status === 'success') {
      if (transaction.mikrotik_synced === false) {
        return NextResponse.json({
          status: 'syncing',
          message: 'Your payment was successful! Setting up your Wi-Fi access...',
        })
      }

      const expDate = transaction.expires_at
        ? new Date(transaction.expires_at).toLocaleDateString()
        : new Date(new Date(transaction.created_at).getTime() + durationSec * 1000).toLocaleDateString()

      return NextResponse.json({
        status: 'success',
        credentials: {
          voucher: transaction.voucher_code || transaction.mikrotik_username || '—',
          username: transaction.mikrotik_username || '—',
          password: transaction.mikrotik_username || '—',
          profile: profile,
          expiry: expDate,
          sms: transaction.sms_status === 'sent' ? 'Sent ✓' : 'Sent ✓ (demo)',
        },
      })
    }

    if (transaction.status === 'failed') {
      return NextResponse.json({
        status: 'failed',
        message: transaction.error_message || 'Payment failed or was declined by user.',
      })
    }

    // === PENDING TRANSACTION ===
    // Check if in Demo/Mock Mode to auto-simulate payment completion after 2.5 seconds
    const isMock = process.env.MIKROTIK_MOCK === 'true' || process.env.HUBTEL_CLIENT_ID === 'demo_client_id'
    if (isMock && transaction.status === 'pending') {
      const createdAt = new Date(transaction.created_at).getTime()
      const elapsed = Date.now() - createdAt

      if (elapsed > 2500) {
        console.log('--- [DEMO MODE] Auto-completing pending transaction ---', reference)
        const voucher = `MC-${crypto.randomBytes(4).toString('hex').toUpperCase()}`
        const username = voucher.toLowerCase()

        // (Mock Mode: skip router polling entirely and mark as synced so UI progresses)

        // Update database record
        const updated = await TransactionService.updateTransaction(reference, {
          status: 'success',
          voucher_code: voucher,
          mikrotik_username: username,
          mikrotik_synced: true,
          sms_status: 'sent',
          expires_at: new Date(Date.now() + durationSec * 1000).toISOString(),
        })

        const expDate = new Date(Date.now() + durationSec * 1000).toLocaleDateString()

        return NextResponse.json({
          status: 'success',
          credentials: {
            voucher: updated.voucher_code || voucher,
            username: updated.mikrotik_username || username,
            password: updated.mikrotik_username || username,
            profile: profile,
            expiry: expDate,
            sms: 'Sent ✓ (demo)',
          },
        })
      }
    }

    // === SERVER-SIDE HUBTEL STATUS CHECK FALLBACK ===
    // If transaction has been pending for 30+ seconds, check Hubtel directly
    // This handles the case where the webhook was lost/delayed/blocked
    // Only usable once Hubtel whitelists our egress IP: api-txnstatus.hubtel.com
    // answers 403 (WAF HTML, not JSON) from any other source, so until then this
    // check can only ever return paid:false — and it would add a blocking
    // outbound call to every single poll. Enable with HUBTEL_STATUS_CHECK=true
    // the day whitelisting lands.
    const statusCheckAvailable = process.env.HUBTEL_STATUS_CHECK === 'true'

    if (!isMock && statusCheckAvailable && transaction.status === 'pending') {
      const createdAt = new Date(transaction.created_at).getTime()
      const elapsed = Date.now() - createdAt

      if (elapsed > 30000) {
        console.log(`[STATUS FALLBACK] Checking Hubtel directly for ${reference} (pending ${Math.round(elapsed / 1000)}s)`)

        const hubtelStatus = await PaymentService.checkPaymentStatus(reference)

        if (hubtelStatus.paid) {
          console.log(`[STATUS FALLBACK] Hubtel confirmed PAID for ${reference}. Processing...`)

          const expiresAt = new Date(Date.now() + durationSec * 1000).toISOString()
          const voucher = `MC-${crypto.randomBytes(4).toString('hex').toUpperCase()}`
          const username = voucher.toLowerCase()



          // Update Database
          await TransactionService.updateTransaction(reference, {
            status: 'success',
            hubtel_reference: hubtelStatus.transactionId || 'STATUS_CHECK',
            voucher_code: voucher,
            mikrotik_username: username,
            mikrotik_synced: false,
            sms_status: 'sent',
            expires_at: expiresAt,
            ...(hubtelStatus.phone && { phone: hubtelStatus.phone }),
          })

          // Log in activity logs
          try {
            const supabase = createAdminClient()
            await supabase.from('activity_logs').insert({
              action: 'PAYMENT_SUCCESS_STATUS_FALLBACK',
              actor: `StatusCheck:${reference}`,
              details: { reference, amount: transaction.amount, source: 'hubtel_status_api' },
            })
          } catch {
            // Non-critical logging failure
          }

          // mikrotik_synced is still false here — the router has not created the
          // hotspot user yet. Reporting 'success' would hand the student
          // credentials that fail at the login form, so mirror the branch above
          // and let them through on the next poll once the router confirms.
          return NextResponse.json({
            status: 'syncing',
            message: 'Your payment was successful! Setting up your Wi-Fi access...',
          })
        }
      }
    }

    return NextResponse.json({ status: 'pending' })
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Error checking payment status'
    console.error('Payment Status Error:', msg)
    return NextResponse.json(
      { status: 'failed', message: msg },
      { status: 500 }
    )
  }
}
