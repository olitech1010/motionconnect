export interface HubtelInitiateRequest {
  packageId: string
  phone: string
  name?: string
  macAddress: string
  ipAddress?: string
  linkLogin?: string
  linkOrig?: string
}

export interface HubtelInitiateResponse {
  reference: string
  checkoutUrl?: string
  /** Hubtel's own id for the hosted checkout session. Stored for reconciliation. */
  checkoutId?: string
  status: 'pending' | 'success' | 'failed'
  message?: string
}

export interface HubtelWebhookPayload {
  ResponseCode: string
  Message: string
  Data: {
    Amount: number
    Charges: number
    AmountAfterCharges: number
    Description: string
    ClientReference: string
    TransactionId: string
    ExternalTransactionId: string
    AmountPaid: number
    PaymentMethod: string
  }
}
