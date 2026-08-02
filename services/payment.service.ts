import { HubtelInitiateRequest, HubtelInitiateResponse } from '@/types/payment'

/**
 * Resolve the canonical base URL for callback/return URLs.
 * Priority: explicit env > Vercel system vars > localhost fallback.
 * NEVER reads HUBTEL_CALLBACK_URL — that footgun has been removed.
 */
function getBaseUrl(): string {
  if (process.env.NEXT_PUBLIC_PORTAL_DOMAIN) {
    return `https://${process.env.NEXT_PUBLIC_PORTAL_DOMAIN.replace(/^https?:\/\//, '')}`
  }
  
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) {
    return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
  }

  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`
  }

  // If we are in production but none of the above are set, use the known vercel domain
  if (process.env.NODE_ENV === 'production') {
    return 'https://motionconnect.vercel.app'
  }

  return 'http://localhost:3000'
}

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
      if (process.env.NODE_ENV !== 'production') console.log('--- [DEMO MODE] Initiating Hubtel Payment ---', { request, amount, reference })
      const baseUrl = getBaseUrl()
      return {
        reference,
        status: 'pending',
        checkoutUrl: `${baseUrl}/portal/checkout/demo?ref=${reference}&amount=${amount}&phone=${request.phone}`,
      }
    }

    const clientId = process.env.HUBTEL_CLIENT_ID
    const clientSecret = process.env.HUBTEL_CLIENT_SECRET
    const merchantAccount = process.env.HUBTEL_MERCHANT_ACCOUNT
    const authToken = process.env.HUBTEL_AUTH_TOKEN

    if ((!authToken && (!clientId || !clientSecret)) || !merchantAccount) {
      throw new Error('Hubtel API credentials missing from environment')
    }

    // Use pre-encoded token from env directly if available, avoiding runtime encoding
    const auth = authToken || Buffer.from(`${clientId}:${clientSecret}`).toString('base64')

    try {
      const baseUrl = getBaseUrl()
      const callbackUrl = `${baseUrl}/api/payments/webhook`
      const returnUrl = `${baseUrl}/?reference=${reference}`
      const cancellationUrl = `${baseUrl}/portal#cancelled`

      // Log the resolved URLs so we can verify in Vercel function logs
      if (process.env.NODE_ENV !== 'production') {
        console.log('--- Initiating Hubtel Payment ---')
        console.log('Resolved baseUrl:', baseUrl)
        console.log('Callback URL:', callbackUrl)
        console.log('Return URL:', returnUrl)
      }

      const myHeaders = new Headers()
      myHeaders.append("Authorization", `Basic ${auth}`)
      myHeaders.append("Content-Type", "application/json")

      const rawPayload = JSON.stringify({
        totalAmount: amount,
        description: description,
        // Send BOTH field names for maximum Hubtel API compatibility
        callbackUrl: callbackUrl,
        PrimaryCallbackUrl: callbackUrl,
        returnUrl: returnUrl,
        ReturnUrl: returnUrl,
        merchantAccountNumber: merchantAccount,
        cancellationUrl: cancellationUrl,
        CancellationUrl: cancellationUrl,
        clientReference: reference,
        ClientReference: reference,
        customerName: request.name || 'Motion Connect User',
      })

      const requestOptions: RequestInit = {
        method: "POST",
        headers: myHeaders,
        body: rawPayload,
        redirect: "follow",
      }

      if (process.env.NODE_ENV !== 'production') {
        console.log('Payload:', rawPayload)
        console.log('Auth Header:', `Basic ${auth.substring(0, 8)}...`)
      }

      const response = await fetch('https://payproxyapi.hubtel.com/items/initiate', requestOptions)

      // Convert response headers to a plain object for logging
      const responseHeaders: Record<string, string> = {}
      response.headers.forEach((value, key) => {
        responseHeaders[key] = value
      })

      const rawText = await response.text()

      if (process.env.NODE_ENV !== 'production') {
        console.log('=== [HUBTEL RESPONSE LOG] ===')
        console.log('Status Code:', response.status, response.statusText)
        console.log('Headers:', JSON.stringify(responseHeaders, null, 2))
        console.log('Raw Body:', rawText || '<EMPTY BODY>')
        console.log('=============================')
      }

      if (!response.ok) {
        console.error('Hubtel Error Response:', response.status, rawText)
        return {
          reference,
          status: 'failed',
          message: `Hubtel Error (${response.status}): ${rawText}`,
        }
      }

      let data: Record<string, unknown> = {}
      try {
        data = rawText ? JSON.parse(rawText) : {}
      } catch {
        console.error('Failed to parse Hubtel JSON response')
      }

      const dataObj = data as { data?: { checkoutUrl?: string }; checkoutUrl?: string }
      return {
        reference,
        status: 'pending',
        checkoutUrl: dataObj.data?.checkoutUrl || dataObj.checkoutUrl,
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

  /**
   * Check payment status directly from Hubtel API.
   * This is the fallback when the webhook doesn't arrive.
   */
  static async checkPaymentStatus(reference: string): Promise<{ paid: boolean; transactionId?: string; phone?: string }> {
    const clientId = process.env.HUBTEL_CLIENT_ID
    const clientSecret = process.env.HUBTEL_CLIENT_SECRET
    const authToken = process.env.HUBTEL_AUTH_TOKEN

    if (!authToken && (!clientId || !clientSecret)) {
      console.warn('Cannot check Hubtel status: missing credentials')
      return { paid: false }
    }

    const auth = authToken || Buffer.from(`${clientId}:${clientSecret}`).toString('base64')

    try {
      const merchantAccount = process.env.HUBTEL_MERCHANT_ACCOUNT || '2011037' // Fallback to live account if not set

      // Hubtel Transaction Status Check API (GET endpoint)
      const res = await fetch(
        `https://api-txnstatus.hubtel.com/transactions/${merchantAccount}/status?clientReference=${reference}`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Basic ${auth}`,
            'Accept': 'application/json',
          },
        }
      )

      if (!res.ok) {
        console.warn(`Hubtel status check failed: ${res.status}`)
        return { paid: false }
      }

      interface HubtelStatusResponse {
        responseCode?: string
        ResponseCode?: string
        status?: string
        Status?: string
        data?: {
          transactionId?: string
          status?: string
        }
        Data?: {
          TransactionId?: string
          CustomerPhoneNumber?: string
        }
      }

      const data = await res.json() as HubtelStatusResponse
      if (process.env.NODE_ENV !== 'production') {
        console.log('Hubtel status check response:', JSON.stringify(data))
      }

      // Check various Hubtel response formats for success
      const responseCode = data.responseCode || data.ResponseCode
      const status = (data.data?.status || data.status || data.Status || '').toLowerCase()
      
      if (responseCode === '0000' || responseCode === '00' || status === 'completed' || status === 'success' || status === 'paid') {
        return {
          paid: true,
          transactionId: data.data?.transactionId || data.Data?.TransactionId || 'HUBTEL_STATUS_CHECK',
          phone: data.Data?.CustomerPhoneNumber,
        }
      }

      return { paid: false }
    } catch (err) {
      console.error('Hubtel status check error:', err)
      return { paid: false }
    }
  }
}
