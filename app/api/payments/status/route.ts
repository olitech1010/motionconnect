import { NextResponse } from 'next/server'
import { TransactionService } from '@/services/transaction.service'
import { RouterService } from '@/services/router.service'
import { PackageService } from '@/services/package.service'

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

    let days = 7
    if (profile === 'boost24') days = 1
    else if (profile === 'biweekly' || profile === 'bwpro') days = 14
    else if (profile === 'monthly') days = 30

    if (transaction.status === 'success') {
      const expDate = new Date(new Date(transaction.created_at).getTime() + days * 86400000).toLocaleDateString()

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

    // Check if in Demo/Mock Mode to auto-simulate payment completion after 2.5 seconds
    const isMock = process.env.MIKROTIK_MOCK === 'true' || process.env.HUBTEL_CLIENT_ID === 'demo_client_id'
    if (isMock && transaction.status === 'pending') {
      const createdAt = new Date(transaction.created_at).getTime()
      const elapsed = Date.now() - createdAt

      if (elapsed > 2500) {
        console.log('--- [DEMO MODE] Auto-completing pending transaction ---', reference)
        const voucher = `MC-${Math.random().toString(36).substring(2, 8).toUpperCase()}`
        const username = voucher.toLowerCase()

        // Create Hotspot User on MikroTik (mock or physical router)
        await RouterService.createHotspotUser({
          name: username,
          password: username,
          profile: profile,
          comment: `Txn Ref: ${reference} | Phone: ${transaction.phone}`,
        })

        // Update database record
        const updated = await TransactionService.updateTransaction(reference, {
          status: 'success',
          voucher_code: voucher,
          mikrotik_username: username,
          mikrotik_synced: true,
          sms_status: 'sent',
        })

        const expDate = new Date(new Date(transaction.created_at).getTime() + days * 86400000).toLocaleDateString()

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
