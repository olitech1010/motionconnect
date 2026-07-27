import React from 'react'
import { createAdminClient } from '@/lib/supabase/admin'
import { DollarSign, Users, Wifi, CheckCircle2, Clock, AlertCircle, ArrowUpRight } from 'lucide-react'

export const revalidate = 0

export default async function AdminDashboardPage() {
  const supabase = createAdminClient()

  // Fetch summary metrics
  const { data: txns } = await supabase
    .from('transactions')
    .select('*')
    .order('created_at', { ascending: false })

  const allTxns = txns || []
  const successTxns = allTxns.filter((t) => t.status === 'success')
  const pendingTxns = allTxns.filter((t) => t.status === 'pending')

  const totalRevenue = successTxns.reduce((acc, t) => acc + (t.amount || 0), 0)

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Top Welcome Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-zinc-200 shadow-sm">
        <div>
          <h1 className="text-2xl font-black text-[#0D1B2A] tracking-tight">Dashboard Overview</h1>
          <p className="text-sm text-zinc-500 mt-1">
            Real-time analytics and hotspot monitoring for campus Wi-Fi access.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="px-3.5 py-2 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
            <span>MikroTik RB5009 Connected</span>
          </div>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Revenue */}
        <div className="bg-white p-6 rounded-2xl border border-zinc-200 shadow-sm relative overflow-hidden group hover:border-blue-400 transition-all">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-extrabold uppercase tracking-wider text-zinc-400">Total Revenue</span>
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#1466B8] flex items-center justify-center">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-black text-[#0D1B2A]">
            GHS {totalRevenue.toLocaleString('en-GH', { minimumFractionDigits: 2 })}
          </div>
          <div className="text-xs text-emerald-600 font-bold mt-2 flex items-center gap-1">
            <ArrowUpRight className="w-3.5 h-3.5" />
            <span>100% Verified MoMo</span>
          </div>
        </div>

        {/* Active Vouchers */}
        <div className="bg-white p-6 rounded-2xl border border-zinc-200 shadow-sm relative overflow-hidden group hover:border-emerald-400 transition-all">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-extrabold uppercase tracking-wider text-zinc-400">Vouchers Issued</span>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-black text-[#0D1B2A]">{successTxns.length}</div>
          <div className="text-xs text-zinc-500 font-semibold mt-2">Active hotspot accounts</div>
        </div>

        {/* Pending Approval */}
        <div className="bg-white p-6 rounded-2xl border border-zinc-200 shadow-sm relative overflow-hidden group hover:border-amber-400 transition-all">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-extrabold uppercase tracking-wider text-zinc-400">Pending Approval</span>
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-black text-[#0D1B2A]">{pendingTxns.length}</div>
          <div className="text-xs text-amber-600 font-semibold mt-2">Awaiting MoMo PIN</div>
        </div>

        {/* System Health */}
        <div className="bg-white p-6 rounded-2xl border border-zinc-200 shadow-sm relative overflow-hidden group hover:border-purple-400 transition-all">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-extrabold uppercase tracking-wider text-zinc-400">Router Health</span>
            <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <Wifi className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-black text-[#0D1B2A]">Online</div>
          <div className="text-xs text-purple-600 font-semibold mt-2">RouterOS v7.19.6 · Starlink IP</div>
        </div>
      </div>

      {/* Recent Transactions Table */}
      <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-zinc-200 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-black text-[#0D1B2A]">Recent Transactions</h2>
            <p className="text-xs text-zinc-500 mt-0.5">Latest Hubtel Mobile Money payments and voucher provisions.</p>
          </div>
          <span className="text-xs font-bold text-zinc-400 uppercase">
            Showing top {Math.min(allTxns.length, 10)} of {allTxns.length}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-zinc-50 border-b border-zinc-200 text-[11px] font-extrabold uppercase tracking-wider text-zinc-500">
                <th className="py-3 px-6">Reference</th>
                <th className="py-3 px-6">Phone Number</th>
                <th className="py-3 px-6">Package Plan</th>
                <th className="py-3 px-6">Amount</th>
                <th className="py-3 px-6">Voucher Code</th>
                <th className="py-3 px-6">Status</th>
                <th className="py-3 px-6">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 text-sm font-medium text-[#0D1B2A]">
              {allTxns.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-zinc-400">
                    No transactions recorded yet. Go to Captive Portal to test a payment!
                  </td>
                </tr>
              ) : (
                allTxns.slice(0, 10).map((txn) => {
                  const isSuccess = txn.status === 'success'
                  const isPending = txn.status === 'pending'

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
                      <td className="py-3.5 px-6 text-xs text-zinc-400">
                        {new Date(txn.created_at).toLocaleString()}
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
