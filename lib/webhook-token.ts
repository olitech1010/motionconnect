import crypto from 'crypto'

/**
 * Per-transaction webhook authentication.
 *
 * Hubtel's `x-hubtel-signature` HMAC format is still unconfirmed (see
 * docs/HUBTEL_PAYMENT_INTEGRATION.md §5.3), and the transaction-status API that
 * would let us verify out-of-band sits behind an IP whitelist we are not on. So
 * neither of the usual verification routes is available.
 *
 * What we can rely on: the callbackUrl is sent server-to-server at initiate time
 * and is never exposed to the browser. Embedding a keyed token in it gives every
 * transaction a callback URL only Hubtel and we know. A forger who watched their
 * own payment knows the clientReference and the checkoutId — both are visible in
 * the checkout URL — but cannot derive this token without the signing secret.
 */
function signingSecret(): string {
  const secret = process.env.WEBHOOK_TOKEN_SECRET || process.env.HUBTEL_CLIENT_SECRET
  if (!secret) {
    throw new Error('No webhook signing secret configured (WEBHOOK_TOKEN_SECRET or HUBTEL_CLIENT_SECRET)')
  }
  return secret
}

export function webhookToken(reference: string): string {
  return crypto
    .createHmac('sha256', signingSecret())
    .update(`webhook:${reference}`)
    .digest('hex')
    .slice(0, 32)
}

/** Constant-time compare so the token can't be recovered by timing the endpoint. */
export function verifyWebhookToken(reference: string, provided: string | null): boolean {
  if (!provided) return false
  let expected: string
  try {
    expected = webhookToken(reference)
  } catch {
    return false
  }
  const a = Buffer.from(expected)
  const b = Buffer.from(provided)
  if (a.length !== b.length) return false
  return crypto.timingSafeEqual(a, b)
}
