import { HubtelInitiateRequest, HubtelInitiateResponse } from '@/types/payment'

export class PaymentService {
  /**
   * Initiate Mobile Money payment with Hubtel API
   */
  static async initiatePayment(
    request: HubtelInitiateRequest,
    amount: number,
    reference: string,
    description: string
  ): Promise<HubtelInitiateResponse> {
    const isMock = process.env.HUBTEL_MOCK === 'true' || process.env.HUBTEL_CLIENT_ID === 'demo_client_id' || process.env.HUBTEL_MERCHANT_ACCOUNT === 'demo_merchant_account'

    if (isMock) {
      console.log('--- [DEMO MODE] Initiating Hubtel Payment ---', { request, amount, reference })
      // Return simulated checkout URL pointing to our local demo payment simulation page
      const domain = process.env.NEXT_PUBLIC_PORTAL_DOMAIN || 'localhost:3000'
      const protocol = domain.includes('localhost') ? 'http' : 'https'
      return {
        reference,
        status: 'pending',
        checkoutUrl: `${protocol}://${domain}/portal/checkout/demo?ref=${reference}&amount=${amount}&phone=${request.phone}`,
      }
    }

    const clientId = process.env.HUBTEL_CLIENT_ID
    const clientSecret = process.env.HUBTEL_CLIENT_SECRET
    const merchantAccount = process.env.HUBTEL_MERCHANT_ACCOUNT
    const callbackUrl = process.env.HUBTEL_CALLBACK_URL

    if (!clientId || !clientSecret || !merchantAccount) {
      throw new Error('Hubtel API credentials missing from environment')
    }

    const auth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64')
    const url = 'https://payproxyapi.hubtel.com/items/initiate'

    try {
      const domain = process.env.NEXT_PUBLIC_PORTAL_DOMAIN || 'localhost:3000'
      const protocol = domain.includes('localhost') ? 'http' : 'https'

      const payload = {
        totalAmount: amount,
        description,
        callbackUrl,
        returnUrl: `${protocol}://${domain}/portal/status?ref=${reference}`,
        merchantAccountNumber: merchantAccount,
        clientReference: reference,
      }

      console.log('--- Initiating Hubtel Payment ---')
      console.log('Payload:', payload)
      console.log('Auth Prefix:', `Basic ${auth.substring(0, 5)}...`)

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Basic ${auth}`,
          'Cache-Control': 'no-cache',
        },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        const errText = await response.text()
        console.error('Hubtel Error Response:', response.status, errText)
        return {
          reference,
          status: 'failed',
          message: `Hubtel Error (${response.status}): ${errText}`,
        }
      }

      const data = await response.json()
      return {
        reference,
        status: 'pending',
        checkoutUrl: data.data?.checkoutUrl || data.checkoutUrl,
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unknown Hubtel error'
      return {
        reference,
        status: 'failed',
        message: msg,
      }
    }
  }
}
