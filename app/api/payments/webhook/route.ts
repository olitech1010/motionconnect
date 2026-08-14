import { NextResponse } from 'next/server'
import crypto from 'crypto'
import { TransactionService } from '@/services/transaction.service'
import { PackageService } from '@/services/package.service'
import { createAdminClient } from '@/lib/supabase/admin'
import { verifyWebhookToken } from '@/lib/webhook-token'

export async function POST(request: Request) {
  try {
    const rawBody = await request.text()

    const payload = JSON.parse(rawBody)
    const data = payload.Data || payload.data || payload
    const reference = data.ClientReference || data.clientReference || data.reference || payload.ClientReference
    const status = payload.ResponseCode === '0000' || payload.status?.toLowerCase() === 'success' || payload.Status?.toLowerCase() === 'success'
      ? 'success'
      : 'failed'

    if (!reference) {
      return NextResponse.json({ error: 'Missing client reference in webhook' }, { status: 400 })
    }

    // === AUTHENTICATION ===
    // Without this, anyone who buys once and reads their own clientReference off
    // the page can POST a forged success callback and provision free Wi-Fi. The
    // token is bound to this reference and only ever travelled server-to-server.
    // Kill switch: set WEBHOOK_TOKEN_ENFORCE=false if Hubtel is found to strip
    // query strings from callbackUrl — but then payments are unauthenticated.
    const enforce = process.env.WEBHOOK_TOKEN_ENFORCE !== 'false'
    const providedToken = new URL(request.url).searchParams.get('token')

    if (!verifyWebhookToken(reference, providedToken)) {
      console.error(
        `[WEBHOOK AUTH] Bad or missing token for ${reference}. ` +
        `token_present=${Boolean(providedToken)} enforcing=${enforce}`
      )
      if (enforce) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }
    }

    // Log Hubtel's own signature header alongside what an HMAC of the body would
    // produce, so the real format can be confirmed from a live payment and
    // adopted as a second factor. Never gates the request.
    const signature = request.headers.get('x-hubtel-signature')
    if (signature && process.env.HUBTEL_CLIENT_SECRET) {
      const computed = crypto
        .createHmac('sha256', process.env.HUBTEL_CLIENT_SECRET)
        .update(rawBody)
        .digest('hex')
      console.log(`[WEBHOOK SIG] received=${signature} body_hmac=${computed} match=${signature.includes(computed)}`)
    }

    const transaction = await TransactionService.getByReference(reference)
    if (!transaction) {
      return NextResponse.json({ error: 'Transaction not found' }, { status: 404 })
    }

    if (transaction.status === 'success') {
      return NextResponse.json({ success: true, message: 'Already processed' })
    }

    if (status === 'success') {
      // Confirm Hubtel charged what the package actually costs, so a cheap
      // package can't be swapped for an expensive one after initiation.
      const paidAmount = Number(data.AmountPaid ?? data.Amount ?? data.amount)
      if (Number.isFinite(paidAmount) && paidAmount + 0.001 < Number(transaction.amount)) {
        console.error(
          `[WEBHOOK] Underpayment for ${reference}: paid ${paidAmount}, expected ${transaction.amount}`
        )
        await TransactionService.updateTransaction(reference, {
          status: 'failed',
          error_message: `Amount mismatch: paid ${paidAmount}, expected ${transaction.amount}`,
        })
        return NextResponse.json({ error: 'Amount mismatch' }, { status: 400 })
      }

      const pkg = transaction.package_id ? await PackageService.getPackageById(transaction.package_id) : null
      const durationSec = pkg?.duration_seconds || 86400
      const expiresAt = new Date(Date.now() + durationSec * 1000).toISOString()

      // Generate cryptographically secure voucher code
      const voucher = `MC-${crypto.randomBytes(4).toString('hex').toUpperCase()}`
      const username = voucher.toLowerCase()


      const phoneFromWebhook = data.CustomerPhoneNumber || data.customerPhoneNumber || undefined

      // Update Database
      await TransactionService.updateTransaction(reference, {
        status: 'success',
        hubtel_reference: data.CheckoutId || data.TransactionId || data.transactionId || 'WEBHOOK_TXN',
        voucher_code: voucher,
        mikrotik_username: username,
        mikrotik_synced: false,
        sms_status: 'sent',
        expires_at: expiresAt,
        ...(phoneFromWebhook && { phone: phoneFromWebhook }),
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
    return NextResponse.json(
      { error: 'Internal server error processing webhook' },
      { status: 500 }
    )
  }
}
