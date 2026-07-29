import React from 'react'
import { createAdminClient } from '@/lib/supabase/admin'
import { TransactionsTable } from '@/components/admin/TransactionsTable'

export const revalidate = 0

export default async function AdminTransactionsPage() {
  const supabase = createAdminClient()
  const { data: txns } = await supabase
    .from('transactions')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(100)

  const transactions = txns || []

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <TransactionsTable initialTransactions={transactions} />
    </div>
  )
}
