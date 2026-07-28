import React from 'react'
import { TransactionService } from '@/services/transaction.service'
import { CheckCircle2, Clock, AlertCircle, Search, Filter } from 'lucide-react'

export const revalidate = 0

export default async function AdminTransactionsPage() {
  const transactions = await TransactionService.getAllTransactions()

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-canvas p-6 rounded-lg border border-hairline shadow-sm">
        <div>
          <h1 className="text-2xl font-medium text-ink tracking-tight">Transaction Ledger</h1>
          <p className="font-mono text-[12px] text-muted mt-1">
            Complete audit trail of all Mobile Money payments, Hubtel references, and voucher codes.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="w-4 h-4 text-muted absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search phone or ref..."
              className="pl-9 pr-4 py-2 font-mono text-[12px] bg-canvas border border-hairline rounded-md focus:outline-none focus:border-kumo-brand transition-all w-48 md:w-64 placeholder:text-muted text-ink"
              disabled
            />
          </div>
          <button
            type="button"
            className="p-2 border border-hairline rounded-md bg-canvas text-ink-soft hover:bg-hairline/30 transition-colors flex items-center gap-1 font-mono text-[12px] font-bold"
          >
            <Filter className="w-4 h-4" />
            <span>Filter</span>
          </button>
        </div>
      </div>

      <div className="bg-canvas rounded-lg border border-hairline shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-hairline/30 border-b border-hairline font-mono text-[10px] font-bold uppercase tracking-wider text-muted">
                <th className="py-3.5 px-6">Reference</th>
                <th className="py-3.5 px-6">Phone Number</th>
                <th className="py-3.5 px-6">Device & Telemetry</th>
                <th className="py-3.5 px-6">Package</th>
                <th className="py-3.5 px-6">Amount</th>
                <th className="py-3.5 px-6">Voucher Code</th>
                <th className="py-3.5 px-6">Status</th>
                <th className="py-3.5 px-6">Expiration</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-hairline text-sm font-medium text-ink">
              {transactions.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-16 text-center text-muted font-mono text-[12px]">
                    No transaction history found in database.
                  </td>
                </tr>
              ) : (
                transactions.map((txn) => {
                  const isSuccess = txn.status === 'success'
                  const isPending = txn.status === 'pending'

                  return (
                    <tr key={txn.id} className="hover:bg-hairline/30 transition-colors">
                      <td className="py-3.5 px-6 font-mono text-[12px] font-bold text-kumo-brand">
                        {txn.reference}
                      </td>
                      <td className="py-3.5 px-6 font-bold">{txn.phone}</td>
                      <td className="py-3.5 px-6">
                        <div className="font-mono text-[12px] font-bold text-ink truncate max-w-[180px]" title={txn.device_info || 'Unknown Device'}>
                          {txn.device_info || 'Unknown Device'}
                        </div>
                        <div className="text-[10px] text-muted font-mono mt-0.5">
                          MAC: {txn.mac_address || 'N/A'}
                        </div>
                      </td>
                      <td className="py-3.5 px-6 text-ink-soft">{txn.package_name}</td>
                      <td className="py-3.5 px-6 font-bold">GHS {txn.amount.toFixed(2)}</td>
                      <td className="py-3.5 px-6 font-mono text-[12px]">
                        {txn.voucher_code ? (
                          <span className="bg-compute/10 text-compute px-2 py-1 rounded-md font-bold">
                            {txn.voucher_code}
                          </span>
                        ) : (
                          <span className="text-muted">—</span>
                        )}
                      </td>
                      <td className="py-3.5 px-6">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full font-mono text-[11px] font-bold ${
                            isSuccess
                              ? 'bg-ai/10 text-ai border border-ai/20'
                              : isPending
                              ? 'bg-kumo-brand-soft/10 text-kumo-brand-soft border border-kumo-brand-soft/20 animate-pulse'
                              : 'bg-emergency-red/10 text-emergency-red border border-emergency-red/20'
                          }`}
                        >
                          {isSuccess ? (
                            <CheckCircle2 className="w-3.5 h-3.5" />
                          ) : isPending ? (
                            <Clock className="w-3.5 h-3.5" />
                          ) : (
                            <AlertCircle className="w-3.5 h-3.5" />
                          )}
                          <span className="capitalize">{txn.status}</span>
                        </span>
                      </td>
                      <td className="py-3.5 px-6 font-mono text-[12px] text-muted">
                        {txn.expires_at ? new Date(txn.expires_at).toLocaleString() : '—'}
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
