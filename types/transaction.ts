import { Database } from './supabase'

export type Transaction = Database['public']['Tables']['transactions']['Row']
export type NewTransaction = Database['public']['Tables']['transactions']['Insert']
export type UpdateTransaction = Database['public']['Tables']['transactions']['Update']

export type TransactionStatus = Transaction['status']
