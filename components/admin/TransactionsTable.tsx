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
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-4 py-2 text-xs font-semibold bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none focus:border-blue-500 transition-all w-full md:w-64"
            />
          </div>
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsFilterOpen(!isFilterOpen)}
              className={`p-2 border rounded-xl transition-colors flex items-center gap-1 text-xs font-bold ${
                isFilterOpen || statusFilter !== 'all' || dateFilter !== 'all'
                  ? 'bg-blue-50 border-blue-200 text-blue-700'
                  : 'bg-zinc-50 border-zinc-200 text-zinc-600 hover:bg-zinc-100'
              }`}
            >
              <Filter className="w-4 h-4" />
              <span>Filter</span>
              {(statusFilter !== 'all' || dateFilter !== 'all') && (
                <span className="w-2 h-2 rounded-full bg-blue-600 ml-1"></span>
              )}
            </button>

            {isFilterOpen && (
              <div className="absolute right-0 mt-2 w-56 bg-white border border-zinc-200 rounded-xl shadow-xl z-10 p-3 flex flex-col gap-4 animate-in fade-in slide-in-from-top-2">
                <div className="space-y-2">
                  <label className="text-[10px] font-extrabold uppercase tracking-wider text-zinc-500">Status</label>
                  <select 
                    value={statusFilter} 
                    onChange={(e) => setStatusFilter(e.target.value as FilterStatus)}
                    className="w-full text-xs font-semibold bg-zinc-50 border border-zinc-200 rounded-lg p-2 focus:outline-none focus:border-blue-500 text-[#0D1B2A]"
                  >
                    <option value="all">All Statuses</option>
                    <option value="success">Success</option>
                    <option value="pending">Pending</option>
                    <option value="failed">Failed</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-extrabold uppercase tracking-wider text-zinc-500">Date Range</label>
                  <select 
                    value={dateFilter} 
                    onChange={(e) => setDateFilter(e.target.value as FilterDate)}
                    className="w-full text-xs font-semibold bg-zinc-50 border border-zinc-200 rounded-lg p-2 focus:outline-none focus:border-blue-500 text-[#0D1B2A]"
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

      <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-zinc-50 border-b border-zinc-200 text-[11px] font-extrabold uppercase tracking-wider text-zinc-500">
                <th className="py-3.5 px-6">Reference</th>
                <th className="py-3.5 px-6">Phone Number</th>
                <th className="py-3.5 px-6">Package</th>
                <th className="py-3.5 px-6">Amount</th>
                <th className="py-3.5 px-6">Voucher Code</th>
                <th className="py-3.5 px-6">Hubtel Ref</th>
                <th className="py-3.5 px-6">Status</th>
                <th className="py-3.5 px-6">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 text-sm font-medium text-[#0D1B2A]">
              {filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-16 text-center text-zinc-400">
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
                    <tr key={txn.id} className="hover:bg-zinc-50/80 transition-colors">
                      <td className="py-3.5 px-6 font-mono text-xs font-bold text-[#1466B8]">
                        {txn.reference}
                      </td>
                      <td className="py-3.5 px-6 font-bold">{txn.phone}</td>
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
                      <td className="py-3.5 px-6 font-mono text-xs text-zinc-500">
                        {txn.hubtel_reference || '—'}
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
                      <td className="py-3.5 px-6 text-xs text-zinc-400 whitespace-nowrap">
                        <div className="font-semibold text-zinc-600">{txDate.toLocaleDateString()}</div>
                        <div className="text-[11px] mt-0.5">{txDate.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}</div>
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
