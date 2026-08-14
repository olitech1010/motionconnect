import { NextResponse } from 'next/server'
import { z } from 'zod'
import { PackageService } from '@/services/package.service'
import { TransactionService } from '@/services/transaction.service'
import { PaymentService } from '@/services/payment.service'

const InitiateSchema = z.object({
  packageId: z.string().min(1, 'Package ID is required').max(100),
  amount: z.number().positive('Amount must be positive'),
  phone: z.string().regex(/^\+?\d{9,15}$/, 'Valid numeric phone number is required').max(20),
  name: z.string().max(100).optional(),
  macAddress: z.string().max(100).optional(),
  ipAddress: z.string().max(100).optional(),
})

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const validation = InitiateSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { success: false, message: validation.error.issues[0]?.message || 'Invalid request' },
        { status: 400 }
      )
    }

    const { packageId, phone, name, macAddress, ipAddress } = validation.data
    const cleanPhone = phone.replace(/\D/g, '')
    const userAgent = request.headers.get('user-agent') || 'Unknown Device'
    const forwardedIp = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || ipAddress || 'Unknown IP'
    const mac = macAddress || '00:00:00:00:00:00'

    // Fetch package from database
    const pkg = await PackageService.getPackageById(packageId)
    if (!pkg) {
      return NextResponse.json(
        { success: false, message: 'Selected package not found or inactive' },
        { status: 404 }
      )
    }

    // Generate unique reference
    const reference = `MC-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`

    // Create transaction in database (status: pending)
    await TransactionService.createTransaction({
      reference,
      phone: cleanPhone,
      amount: pkg.amount,
      package_id: pkg.id,
      package_name: pkg.name,
      mac_address: mac,
      ip_address: forwardedIp,
      device_info: userAgent,
      data_used_bytes: 0,
      status: 'pending',
    })

    // Initiate payment with Hubtel (or demo mock mode)
    const paymentResult = await PaymentService.initiatePayment(
      { packageId: pkg.id, phone: cleanPhone, name, macAddress: mac },
      pkg.amount,
      reference,
      `Motion Connect Wi-Fi: ${pkg.name}`
    )

    if (paymentResult.status === 'failed') {
      await TransactionService.updateTransaction(reference, {
        status: 'failed',
        error_message: paymentResult.message || 'Payment initiation failed',
      })

      return NextResponse.json(
        { success: false, message: paymentResult.message || 'Payment initiation failed' },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      reference,
      checkoutUrl: paymentResult.checkoutUrl,
      status: paymentResult.status,
    })
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Internal server error during payment initiation'
    console.error('Payment Initiate Error:', msg)
    return NextResponse.json(
      { success: false, message: 'Internal server error during payment initiation' },
      { status: 500 }
    )
  }
}
