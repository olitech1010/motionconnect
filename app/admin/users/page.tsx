import React from 'react'
import { TransactionService } from '@/services/transaction.service'
import { RouterService } from '@/services/router.service'
import { Users, Wifi, Clock, Smartphone, ShieldCheck, AlertCircle, RefreshCw, Activity } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function SubscribersPage() {
  const transactions = await TransactionService.getAllTransactions()
  const activeSessionsRes = await RouterService.getActiveSessions()

  const activeSessions = activeSessionsRes.success && activeSessionsRes.data ? activeSessionsRes.data : []
  const activeMacs = new Set(activeSessions.map((s) => s['mac-address']?.toUpperCase()))

  // Filter only successful payments as subscribers
  const subscribers = transactions.filter((tx) => tx.status === 'success')

  // Calculate stats
  const totalSubscribers = subscribers.length
  const currentlyOnline = subscribers.filter((s) => s.mac_address && activeMacs.has(s.mac_address.toUpperCase())).length
  const totalDataUsedMB = subscribers.reduce((acc, curr) => acc + (curr.data_used_bytes || 0) / (1024 * 1024), 0)

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-[#0D1B2A]">Hotspot Subscribers & Live Sessions</h1>
            <span className="px-2.5 py-0.5 rounded-full bg-[#05C46B]/15 text-[#05C46B] text-xs font-black uppercase tracking-wider flex items-center gap-1">
              <Activity className="w-3 h-3 animate-pulse" /> Live Telemetry
            </span>
          </div>
          <p className="text-zinc-600 text-sm mt-1">
            Real-time tracking of connected devices, MAC addresses, IP allocations, data usage, and voucher expiration.
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-zinc-200/80 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-extrabold uppercase tracking-wider text-zinc-400">Total Subscribers</p>
            <p className="text-2xl font-black text-[#0D1B2A] mt-1">{totalSubscribers}</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center text-[#1466B8]">
            <Users className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-zinc-200/80 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-extrabold uppercase tracking-wider text-zinc-400">Currently Online</p>
            <p className="text-2xl font-black text-[#05C46B] mt-1">{currentlyOnline}</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center text-[#05C46B]">
            <Wifi className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-zinc-200/80 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-extrabold uppercase tracking-wider text-zinc-400">Total Data Consumed</p>
            <p className="text-2xl font-black text-[#0D1B2A] mt-1">{totalDataUsedMB.toFixed(1)} MB</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-purple-50 flex items-center justify-center text-purple-600">
            <Activity className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-zinc-200/80 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-extrabold uppercase tracking-wider text-zinc-400">MikroTik Router Sync</p>
            <p className="text-lg font-black text-emerald-600 mt-1 flex items-center gap-1.5">
              <ShieldCheck className="w-5 h-5" /> Active
            </p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600">
            <RefreshCw className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Subscribers Table */}
      <div className="bg-white rounded-2xl border border-zinc-200/80 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-zinc-100 flex items-center justify-between">
          <h2 className="font-extrabold text-[#0D1B2A]">Authenticated Hotspot Users ({subscribers.length})</h2>
          <span className="text-xs text-zinc-500 font-medium">Sorted by recent authentication</span>
        </div>

        {subscribers.length === 0 ? (
          <div className="p-12 text-center text-zinc-500">
            <AlertCircle className="w-10 h-10 mx-auto text-zinc-300 mb-3" />
            <p className="font-bold text-zinc-700">No active subscribers found</p>
            <p className="text-xs mt-1">Once users complete payment on the portal, their device telemetry will appear here.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-zinc-100 bg-zinc-50/50 text-[11px] font-extrabold uppercase tracking-wider text-zinc-500">
                  <th className="py-3 px-4">Subscriber Details</th>
                  <th className="py-3 px-4">Device & Telemetry</th>
                  <th className="py-3 px-4">Package Plan</th>
                  <th className="py-3 px-4">Session Status</th>
                  <th className="py-3 px-4">Data Usage</th>
                  <th className="py-3 px-4">Expiration</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 text-sm">
                {subscribers.map((sub) => {
                  const isOnline = sub.mac_address && activeMacs.has(sub.mac_address.toUpperCase())
                  const activeSession = activeSessions.find(
                    (s) => s['mac-address']?.toUpperCase() === sub.mac_address?.toUpperCase()
                  )
                  const bytesIn = activeSession?.['bytes-in'] ? Number(activeSession['bytes-in']) : 0
                  const bytesOut = activeSession?.['bytes-out'] ? Number(activeSession['bytes-out']) : 0
                  const totalBytes = bytesIn + bytesOut || sub.data_used_bytes || 0
                  const totalMB = (totalBytes / (1024 * 1024)).toFixed(2)

                  const isExpired = sub.expires_at ? new Date(sub.expires_at) < new Date() : false

                  return (
                    <tr key={sub.id} className="hover:bg-zinc-50/50 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="font-extrabold text-[#0D1B2A]">{sub.phone}</div>
                        <div className="text-xs text-zinc-500 font-mono mt-0.5">Voucher: {sub.voucher_code || 'N/A'}</div>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1.5 text-zinc-800 font-medium text-xs">
                          <Smartphone className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                          <span className="truncate max-w-[200px]" title={sub.device_info || 'Unknown Device'}>
                            {sub.device_info || 'Unknown Device'}
                          </span>
                        </div>
                        <div className="text-[11px] text-zinc-500 font-mono mt-1 flex items-center gap-3">
                          <span>MAC: {sub.mac_address}</span>
                          {sub.ip_address && <span>IP: {sub.ip_address}</span>}
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-50 text-[#1466B8] font-bold text-xs">
                          {sub.package_name}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        {isOnline ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-[#05C46B] font-extrabold text-xs">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#05C46B] animate-pulse"></span>
                            Online (Active)
                          </span>
                        ) : isExpired ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-rose-50 text-rose-600 font-extrabold text-xs">
                            Expired
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-zinc-100 text-zinc-600 font-extrabold text-xs">
                            Offline (Valid)
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-xs font-bold text-zinc-700">
                        {totalMB} MB
                        {activeSession?.uptime && (
                          <div className="text-[10px] text-zinc-400 font-normal mt-0.5">Uptime: {activeSession.uptime}</div>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        {sub.expires_at ? (
                          <div className="flex items-center gap-1 text-xs font-medium text-zinc-600">
                            <Clock className="w-3.5 h-3.5 text-zinc-400" />
                            <span>{new Date(sub.expires_at).toLocaleString()}</span>
                          </div>
                        ) : (
                          <span className="text-xs text-zinc-400 font-medium">No Expiration Set</span>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
