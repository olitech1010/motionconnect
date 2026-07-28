import React from 'react'
import { TransactionService } from '@/services/transaction.service'
import { DollarSign, Users, Wifi, CheckCircle2, Clock, AlertCircle, ArrowUpRight } from 'lucide-react'

export const revalidate = 0

export default async function AdminDashboardPage() {
  const allTxns = await TransactionService.getAllTransactions()
  const successTxns = allTxns.filter((t) => t.status === 'success')
  const pendingTxns = allTxns.filter((t) => t.status === 'pending')

  const totalRevenue = successTxns.reduce((acc, t) => acc + (t.amount || 0), 0)

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Top Welcome Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-canvas p-6 rounded-lg border border-hairline shadow-sm">
        <div>
          <h1 className="text-2xl font-medium text-ink tracking-tight">Dashboard Overview</h1>
          <p className="font-mono text-[12px] text-muted mt-1">
            Real-time analytics and hotspot monitoring for campus Wi-Fi access.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="px-3.5 py-2 rounded-md bg-ai/10 border border-ai/20 text-ai font-mono text-[12px] font-bold flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-ai animate-ping" />
            <span>MikroTik RB5009 Connected</span>
          </div>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Revenue */}
        <div className="bg-canvas p-6 rounded-lg border border-hairline shadow-sm relative overflow-hidden group hover:border-kumo-brand transition-all">
          <div className="flex items-center justify-between mb-3">
            <span className="font-mono text-[12px] font-bold uppercase tracking-wider text-muted">Total Revenue</span>
            <div className="w-10 h-10 rounded-md bg-compute/10 text-compute flex items-center justify-center">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-medium tracking-tight text-ink">
            GHS {totalRevenue.toLocaleString('en-GH', { minimumFractionDigits: 2 })}
          </div>
          <div className="font-mono text-[12px] text-ai font-bold mt-2 flex items-center gap-1">
            <ArrowUpRight className="w-3.5 h-3.5" />
            <span>100% Verified MoMo</span>
          </div>
        </div>

        {/* Active Vouchers */}
        <div className="bg-canvas p-6 rounded-lg border border-hairline shadow-sm relative overflow-hidden group hover:border-storage transition-all">
          <div className="flex items-center justify-between mb-3">
            <span className="font-mono text-[12px] font-bold uppercase tracking-wider text-muted">Vouchers Issued</span>
            <div className="w-10 h-10 rounded-md bg-storage/10 text-storage flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-medium tracking-tight text-ink">{successTxns.length}</div>
          <div className="font-mono text-[12px] text-muted font-bold mt-2">Active hotspot accounts</div>
        </div>

        {/* Pending Approval */}
        <div className="bg-canvas p-6 rounded-lg border border-hairline shadow-sm relative overflow-hidden group hover:border-kumo-brand-soft transition-all">
          <div className="flex items-center justify-between mb-3">
            <span className="font-mono text-[12px] font-bold uppercase tracking-wider text-muted">Pending Approval</span>
            <div className="w-10 h-10 rounded-md bg-kumo-brand-soft/10 text-kumo-brand-soft flex items-center justify-center">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-medium tracking-tight text-ink">{pendingTxns.length}</div>
          <div className="font-mono text-[12px] text-kumo-brand-soft font-bold mt-2">Awaiting MoMo PIN</div>
        </div>

        {/* System Health */}
        <div className="bg-canvas p-6 rounded-lg border border-hairline shadow-sm relative overflow-hidden group hover:border-sase transition-all">
          <div className="flex items-center justify-between mb-3">
            <span className="font-mono text-[12px] font-bold uppercase tracking-wider text-muted">Router Health</span>
            <div className="w-10 h-10 rounded-md bg-sase/10 text-sase flex items-center justify-center">
              <Wifi className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-medium tracking-tight text-ink">Online</div>
          <div className="font-mono text-[12px] text-sase font-bold mt-2">RouterOS v7.19.6 · Starlink IP</div>
        </div>
      </div>

      {/* Recent Transactions Table */}
      <div className="bg-canvas rounded-lg border border-hairline shadow-sm overflow-hidden">
        <div className="p-6 border-b border-hairline flex items-center justify-between">
          <div>
            <h2 className="text-lg font-medium text-ink">Recent Transactions</h2>
            <p className="font-mono text-[12px] text-muted mt-0.5">Latest Hubtel Mobile Money payments and voucher provisions.</p>
          </div>
          <span className="font-mono text-[12px] font-bold text-muted uppercase">
            Showing top {Math.min(allTxns.length, 10)} of {allTxns.length}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-hairline/30 border-b border-hairline font-mono text-[10px] font-bold uppercase tracking-wider text-muted">
                <th className="py-3 px-6">Reference</th>
                <th className="py-3 px-6">Phone Number</th>
                <th className="py-3 px-6">Device Info</th>
                <th className="py-3 px-6">Package Plan</th>
                <th className="py-3 px-6">Amount</th>
                <th className="py-3 px-6">Voucher Code</th>
                <th className="py-3 px-6">Status</th>
                <th className="py-3 px-6">Expiry</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-hairline text-sm font-medium text-ink">
              {allTxns.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-muted">
                    No transactions recorded yet. Go to Captive Portal to test a payment!
                  </td>
                </tr>
              ) : (
                allTxns.slice(0, 10).map((txn) => {
                  const isSuccess = txn.status === 'success'
                  const isPending = txn.status === 'pending'

                  return (
                    <tr key={txn.id} className="hover:bg-hairline/30 transition-colors">
                      <td className="py-3.5 px-6 font-mono text-[12px] font-bold text-kumo-brand">
                        {txn.reference}
                      </td>
                      <td className="py-3.5 px-6 font-bold">{txn.phone}</td>
                      <td className="py-3.5 px-6">
                        <div className="font-mono text-[12px] font-bold text-ink truncate max-w-[150px]" title={txn.device_info || 'Unknown Device'}>
                          {txn.device_info || 'Unknown Device'}
                        </div>
                        <div className="text-[10px] text-muted font-mono">
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
                        {txn.expires_at ? new Date(txn.expires_at).toLocaleDateString() : '—'}
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
