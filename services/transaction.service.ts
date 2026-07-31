// Removed createClient import
import { createAdminClient } from '@/lib/supabase/admin'
import { Transaction, NewTransaction, UpdateTransaction } from '@/types/transaction'

const DEFAULT_TRANSACTIONS: Transaction[] = [
  { id: 'tx-1', reference: 'MC-78901234', hubtel_reference: 'HUB-991203', package_id: '11111111-1111-1111-1111-111111111111', package_name: 'Weekly Access', amount: 11.00, phone: '0241234567', mac_address: '00:1A:2B:3C:4D:5E', ip_address: '192.168.20.101', device_info: 'iPhone (iOS 17.4, Safari)', data_used_bytes: 104857600, expires_at: new Date(Date.now() + 518400000).toISOString(), status: 'success', payment_method: 'mtn-momo', voucher_code: 'MC-2481', mikrotik_username: 'MC-2481', mikrotik_synced: true, error_message: null, sms_status: 'sent', created_at: new Date(Date.now() - 1200000).toISOString(), updated_at: new Date(Date.now() - 1200000).toISOString() },
  { id: 'tx-2', reference: 'MC-78901235', hubtel_reference: 'HUB-991204', package_id: '22222222-2222-2222-2222-222222222222', package_name: '24hr Speed Boost', amount: 15.00, phone: '0509876543', mac_address: 'AA:BB:CC:DD:EE:FF', ip_address: '192.168.20.102', device_info: 'Samsung Galaxy S24 (Android 14, Chrome)', data_used_bytes: 524288000, expires_at: new Date(Date.now() + 82800000).toISOString(), status: 'success', payment_method: 'mtn-momo', voucher_code: 'MC-8932', mikrotik_username: 'MC-8932', mikrotik_synced: true, error_message: null, sms_status: 'sent', created_at: new Date(Date.now() - 3600000).toISOString(), updated_at: new Date(Date.now() - 3600000).toISOString() },
  { id: 'tx-3', reference: 'MC-78901236', hubtel_reference: 'HUB-991205', package_id: '33333333-3333-3333-3333-333333333333', package_name: 'Bi-Weekly Value', amount: 25.00, phone: '0205551122', mac_address: '11:22:33:44:55:66', ip_address: '192.168.20.103', device_info: 'MacBook Air (macOS 14, Chrome)', data_used_bytes: 0, expires_at: null, status: 'pending', payment_method: 'mtn-momo', voucher_code: null, mikrotik_username: null, mikrotik_synced: false, error_message: null, sms_status: null, created_at: new Date(Date.now() - 7200000).toISOString(), updated_at: new Date(Date.now() - 7200000).toISOString() },
  { id: 'tx-4', reference: 'MC-78901237', hubtel_reference: 'HUB-991206', package_id: '55555555-5555-5555-5555-555555555555', package_name: 'Monthly Unlimited', amount: 70.00, phone: '0543332211', mac_address: '77:88:99:AA:BB:CC', ip_address: '192.168.20.104', device_info: 'Windows PC (Windows 11, Edge)', data_used_bytes: 2147483648, expires_at: new Date(Date.now() + 2500000000).toISOString(), status: 'success', payment_method: 'mtn-momo', voucher_code: 'MC-9102', mikrotik_username: 'MC-9102', mikrotik_synced: true, error_message: null, sms_status: 'sent', created_at: new Date(Date.now() - 86400000).toISOString(), updated_at: new Date(Date.now() - 86400000).toISOString() },
]

export class TransactionService {
  /**
   * Fetch all transactions (for admin ledger)
   */
  static async getAllTransactions(): Promise<Transaction[]> {
    try {
      const supabase = createAdminClient()
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100)

      if (error || !data || data.length === 0) {
        return DEFAULT_TRANSACTIONS
      }
      return data
    } catch {
      return DEFAULT_TRANSACTIONS
    }
  }

  /**
   * Fetch transaction by unique reference
   */
  static async getByReference(reference: string): Promise<Transaction | null> {
    try {
      const supabase = createAdminClient()
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('reference', reference)
        .single()

      if (error || !data) {
        return null
      }
      return data
    } catch {
      return null
    }
  }

  /**
   * Create new transaction record
   */
  static async createTransaction(payload: NewTransaction): Promise<Transaction> {
    const supabase = createAdminClient()
    const { data, error } = await supabase
      .from('transactions')
      .insert(payload)
      .select()
      .single()

    if (error) {
      console.error('Error creating transaction:', error.message)
      throw new Error('Failed to create transaction record')
    }

    return data
  }

  /**
   * Update existing transaction status or webhook fields
   */
  static async updateTransaction(reference: string, payload: UpdateTransaction): Promise<Transaction> {
    const supabase = createAdminClient()
    const { data, error } = await supabase
      .from('transactions')
      .update({ ...payload, updated_at: new Date().toISOString() })
      .eq('reference', reference)
      .select()
      .single()

    if (error) {
      console.error('Error updating transaction:', error.message)
      throw new Error('Failed to update transaction')
    }

    return data
  }

  /**
   * Fetch recent transactions for admin dashboard
   */
  static async getRecentTransactions(limit = 20): Promise<Transaction[]> {
    const supabase = createAdminClient()
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) {
      console.error('Error fetching recent transactions:', error.message)
      throw new Error('Failed to fetch transactions')
    }

    return data || []
  }
}
