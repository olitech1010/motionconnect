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
    const authToken = process.env.HUBTEL_AUTH_TOKEN

    if ((!authToken && (!clientId || !clientSecret)) || !merchantAccount) {
      throw new Error('Hubtel API credentials missing from environment')
    }

    // Use pre-encoded token from env directly if available, avoiding runtime encoding
    const auth = authToken || Buffer.from(`${clientId}:${clientSecret}`).toString('base64')

    try {
      const domain = process.env.NEXT_PUBLIC_PORTAL_DOMAIN || 'localhost:3000'
      const protocol = domain.includes('localhost') ? 'http' : 'https'
      const defaultCallback = `${protocol}://${domain}/api/payments/webhook`

      const myHeaders = new Headers()
      myHeaders.append("Authorization", `Basic ${auth}`)
      myHeaders.append("Content-Type", "application/json")

      const rawPayload = JSON.stringify({
        totalAmount: amount,
        description: description,
        callbackUrl: callbackUrl || defaultCallback,
        returnUrl: `${protocol}://${domain}/portal/status?reference=${reference}`,
        merchantAccountNumber: merchantAccount,
        cancellationUrl: `${protocol}://${domain}/portal#cancelled`,
        clientReference: reference,
      })

      const requestOptions: RequestInit = {
        method: "POST",
        headers: myHeaders,
        body: rawPayload,
        redirect: "follow",
      }

      console.log('--- Initiating Hubtel Payment ---')
      console.log('Payload:', rawPayload)
      console.log('Auth Header:', `Basic ${auth.substring(0, 8)}...`)

      const response = await fetch('https://payproxyapi.hubtel.com/items/initiate', requestOptions)

      // Convert response headers to a plain object for logging
      const responseHeaders: Record<string, string> = {}
      response.headers.forEach((value, key) => {
        responseHeaders[key] = value
      })

      const rawText = await response.text()

      console.log('=== [HUBTEL RESPONSE LOG] ===')
      console.log('Status Code:', response.status, response.statusText)
      console.log('Headers:', JSON.stringify(responseHeaders, null, 2))
      console.log('Raw Body:', rawText || '<EMPTY BODY>')
      console.log('=============================')

      if (!response.ok) {
        console.error('Hubtel Error Response:', response.status, rawText)
        return {
          reference,
          status: 'failed',
          message: `Hubtel Error (${response.status}): ${rawText}`,
        }
      }

      let data: Record<string, any> = {}
      try {
        data = rawText ? JSON.parse(rawText) : {}
      } catch {
        console.error('Failed to parse Hubtel JSON response')
      }

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
