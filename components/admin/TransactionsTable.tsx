'use client'

import React, { useState, useMemo } from 'react'
import { Transaction } from '@/types/transaction'
import { CheckCircle2, Clock, AlertCircle, Search, Filter } from 'lucide-react'

interface TransactionsTableProps {
  initialTransactions: Transaction[]
}

type FilterStatus = 'all' | 'success' | 'pending' | 'failed'
type FilterDate = 'all' | 'today' | '7days' | '30days'

export function TransactionsTable({ initialTransactions }: TransactionsTableProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<FilterStatus>('all')
  const [dateFilter, setDateFilter] = useState<FilterDate>('all')
  const [isFilterOpen, setIsFilterOpen] = useState(false)

  const filteredTransactions = useMemo(() => {
    return initialTransactions.filter((txn) => {
      // 1. Search query match
      const q = searchQuery.toLowerCase()
      const matchesSearch = 
        !q || 
        txn.phone.toLowerCase().includes(q) || 
        txn.reference.toLowerCase().includes(q) || 
        (txn.voucher_code && txn.voucher_code.toLowerCase().includes(q)) ||
        (txn.hubtel_reference && txn.hubtel_reference.toLowerCase().includes(q))

      if (!matchesSearch) return false

      // 2. Status match
      if (statusFilter !== 'all' && txn.status !== statusFilter) return false

      // 3. Date match
      if (dateFilter !== 'all') {
        const txnDate = new Date(txn.created_at)
        const now = new Date()
        const diffTime = Math.abs(now.getTime() - txnDate.getTime())
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

        if (dateFilter === 'today' && diffDays > 1) return false
        if (dateFilter === '7days' && diffDays > 7) return false
        if (dateFilter === '30days' && diffDays > 30) return false
      }

      return true
    })
  }, [initialTransactions, searchQuery, statusFilter, dateFilter])

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
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-4 py-2 font-mono text-[12px] bg-canvas border border-hairline rounded-md focus:outline-none focus:border-kumo-brand transition-all w-full md:w-64 text-ink placeholder:text-muted"
            />
          </div>
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsFilterOpen(!isFilterOpen)}
              className={`p-2 border rounded-md transition-colors flex items-center gap-1 font-mono text-[12px] font-bold ${
                isFilterOpen || statusFilter !== 'all' || dateFilter !== 'all'
                  ? 'bg-compute/10 border-compute text-compute'
                  : 'bg-canvas border-hairline text-ink-soft hover:bg-hairline/30'
              }`}
            >
              <Filter className="w-4 h-4" />
              <span>Filter</span>
              {(statusFilter !== 'all' || dateFilter !== 'all') && (
                <span className="w-2 h-2 rounded-full bg-compute ml-1"></span>
              )}
            </button>

            {isFilterOpen && (
              <div className="absolute right-0 mt-2 w-56 bg-canvas border border-hairline rounded-lg shadow-xl z-10 p-3 flex flex-col gap-4 animate-in fade-in slide-in-from-top-2">
                <div className="space-y-2">
                  <label className="font-mono text-[10px] font-bold uppercase tracking-wider text-muted">Status</label>
                  <select 
                    value={statusFilter} 
                    onChange={(e) => setStatusFilter(e.target.value as FilterStatus)}
                    className="w-full font-mono text-[12px] bg-canvas border border-hairline rounded-md p-2 focus:outline-none focus:border-kumo-brand text-ink"
                  >
                    <option value="all">All Statuses</option>
                    <option value="success">Success</option>
                    <option value="pending">Pending</option>
                    <option value="failed">Failed</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="font-mono text-[10px] font-bold uppercase tracking-wider text-muted">Date Range</label>
                  <select 
                    value={dateFilter} 
                    onChange={(e) => setDateFilter(e.target.value as FilterDate)}
                    className="w-full font-mono text-[12px] bg-canvas border border-hairline rounded-md p-2 focus:outline-none focus:border-kumo-brand text-ink"
                  >
                    <option value="all">All Time</option>
                    <option value="today">Today</option>
                    <option value="7days">Last 7 Days</option>
                    <option value="30days">Last 30 Days</option>
                  </select>
                </div>
              </div>
            )}
          </div>
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
                <th className="py-3.5 px-6">Hubtel Ref</th>
                <th className="py-3.5 px-6">Status</th>
                <th className="py-3.5 px-6">Expiration</th>
                <th className="py-3.5 px-6">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-hairline text-sm font-medium text-ink">
              {filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-16 text-center text-muted font-mono text-[12px]">
                    {initialTransactions.length === 0 
                      ? 'No transaction history found in database.' 
                      : 'No transactions match your search/filter criteria.'}
                  </td>
                </tr>
              ) : (
                filteredTransactions.map((txn) => {
                  const isSuccess = txn.status === 'success'
                  const isPending = txn.status === 'pending'
                  const txDate = new Date(txn.created_at)

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
                      <td className="py-3.5 px-6 font-mono text-[12px] text-muted">
                        {txn.hubtel_reference || '—'}
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
                      <td className="py-3.5 px-6 font-mono text-[12px] text-muted whitespace-nowrap">
                        <div className="font-bold text-ink-soft">{txDate.toLocaleDateString()}</div>
                        <div className="mt-0.5">{txDate.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}</div>
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
