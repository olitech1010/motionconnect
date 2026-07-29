import React from 'react'
import { TransactionService } from '@/services/transaction.service'
import { TransactionsTable } from '@/components/admin/TransactionsTable'

export const revalidate = 0

export default async function AdminTransactionsPage() {
  const transactions = await TransactionService.getAllTransactions()

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <TransactionsTable initialTransactions={transactions} />
    </div>
  )
}
