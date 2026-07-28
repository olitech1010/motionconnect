import React from 'react'
import { TransactionService } from '@/services/transaction.service'
import { CheckCircle2, Clock, AlertCircle, Search, Filter } from 'lucide-react'

export const revalidate = 0

export default async function AdminTransactionsPage() {
  const transactions = await TransactionService.getAllTransactions()

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-zinc-200 shadow-sm">
        <div>
          <h1 className="text-2xl font-black text-[#0D1B2A] tracking-tight">Transaction Ledger</h1>
          <p className="text-sm text-zinc-500 mt-1">
            Complete audit trail of all Mobile Money payments, Hubtel references, and voucher codes.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search phone or ref..."
              className="pl-9 pr-4 py-2 text-xs font-semibold bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none focus:border-blue-500 transition-all w-48 md:w-64"
              disabled
            />
          </div>
          <button
            type="button"
            className="p-2 border border-zinc-200 rounded-xl bg-zinc-50 text-zinc-600 hover:bg-zinc-100 transition-colors flex items-center gap-1 text-xs font-bold"
          >
            <Filter className="w-4 h-4" />
            <span>Filter</span>
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-zinc-50 border-b border-zinc-200 text-[11px] font-extrabold uppercase tracking-wider text-zinc-500">
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
            <tbody className="divide-y divide-zinc-100 text-sm font-medium text-[#0D1B2A]">
              {transactions.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-16 text-center text-zinc-400">
                    No transaction history found in database.
                  </td>
                </tr>
              ) : (
                transactions.map((txn) => {
                  const isSuccess = txn.status === 'success'
                  const isPending = txn.status === 'pending'

                  return (
                    <tr key={txn.id} className="hover:bg-zinc-50/80 transition-colors">
                      <td className="py-3.5 px-6 font-mono text-xs font-bold text-[#1466B8]">
                        {txn.reference}
                      </td>
                      <td className="py-3.5 px-6 font-bold">{txn.phone}</td>
                      <td className="py-3.5 px-6">
                        <div className="text-xs font-bold text-zinc-800 truncate max-w-[180px]" title={txn.device_info || 'Unknown Device'}>
                          {txn.device_info || 'Unknown Device'}
                        </div>
                        <div className="text-[10px] text-zinc-500 font-mono mt-0.5">
                          MAC: {txn.mac_address || 'N/A'}
                        </div>
                      </td>
                      <td className="py-3.5 px-6 text-zinc-600">{txn.package_name}</td>
                      <td className="py-3.5 px-6 font-extrabold">GHS {txn.amount.toFixed(2)}</td>
                      <td className="py-3.5 px-6 font-mono text-xs">
                        {txn.voucher_code ? (
                          <span className="bg-blue-50 text-blue-700 px-2 py-1 rounded font-bold">
                            {txn.voucher_code}
                          </span>
                        ) : (
                          <span className="text-zinc-400">—</span>
                        )}
                      </td>
                      <td className="py-3.5 px-6">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${
                            isSuccess
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : isPending
                              ? 'bg-amber-50 text-amber-700 border border-amber-200 animate-pulse'
                              : 'bg-rose-50 text-rose-700 border border-rose-200'
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
                      <td className="py-3.5 px-6 text-xs text-zinc-500">
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
