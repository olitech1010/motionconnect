import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { Transaction, NewTransaction, UpdateTransaction } from '@/types/transaction'

export class TransactionService {
  /**
   * Fetch transaction by unique reference
   */
  static async getByReference(reference: string): Promise<Transaction | null> {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('reference', reference)
      .single()

    if (error) {
      return null
    }

    return data
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
