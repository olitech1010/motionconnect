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
            <h1 className="text-2xl font-medium text-ink tracking-tight">Hotspot Subscribers & Live Sessions</h1>
            <span className="px-2.5 py-0.5 rounded-full bg-ai/10 text-ai text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
              <Activity className="w-3 h-3 animate-pulse" /> Live Telemetry
            </span>
          </div>
          <p className="font-mono text-[12px] text-muted mt-1">
            Real-time tracking of connected devices, MAC addresses, IP allocations, data usage, and voucher expiration.
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-canvas p-5 rounded-lg border border-hairline shadow-sm flex items-center justify-between hover:border-kumo-brand transition-colors">
          <div>
            <p className="font-mono text-[11px] font-bold uppercase tracking-wider text-muted">Total Subscribers</p>
            <p className="text-2xl font-medium tracking-tight text-ink mt-1">{totalSubscribers}</p>
          </div>
          <div className="w-12 h-12 rounded-md bg-compute/10 flex items-center justify-center text-compute">
            <Users className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-canvas p-5 rounded-lg border border-hairline shadow-sm flex items-center justify-between hover:border-storage transition-colors">
          <div>
            <p className="font-mono text-[11px] font-bold uppercase tracking-wider text-muted">Currently Online</p>
            <p className="text-2xl font-medium tracking-tight text-storage mt-1">{currentlyOnline}</p>
          </div>
          <div className="w-12 h-12 rounded-md bg-storage/10 flex items-center justify-center text-storage">
            <Wifi className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-canvas p-5 rounded-lg border border-hairline shadow-sm flex items-center justify-between hover:border-ai transition-colors">
          <div>
            <p className="font-mono text-[11px] font-bold uppercase tracking-wider text-muted">Total Data Consumed</p>
            <p className="text-2xl font-medium tracking-tight text-ink mt-1">{totalDataUsedMB.toFixed(1)} MB</p>
          </div>
          <div className="w-12 h-12 rounded-md bg-ai/10 flex items-center justify-center text-ai">
            <Activity className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-canvas p-5 rounded-lg border border-hairline shadow-sm flex items-center justify-between hover:border-kumo-brand-soft transition-colors">
          <div>
            <p className="font-mono text-[11px] font-bold uppercase tracking-wider text-muted">MikroTik Router Sync</p>
            <p className="text-lg font-medium tracking-tight text-storage mt-1 flex items-center gap-1.5">
              <ShieldCheck className="w-5 h-5" /> Active
            </p>
          </div>
          <div className="w-12 h-12 rounded-md bg-kumo-brand-soft/10 flex items-center justify-center text-kumo-brand-soft">
            <RefreshCw className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Subscribers Table */}
      <div className="bg-canvas rounded-lg border border-hairline shadow-sm overflow-hidden">
        <div className="p-5 border-b border-hairline flex items-center justify-between">
          <h2 className="font-medium text-ink">Authenticated Hotspot Users ({subscribers.length})</h2>
          <span className="font-mono text-[12px] text-muted font-bold">Sorted by recent authentication</span>
        </div>

        {subscribers.length === 0 ? (
          <div className="p-12 text-center text-muted">
            <AlertCircle className="w-10 h-10 mx-auto text-ink-soft mb-3" />
            <p className="font-medium text-ink">No active subscribers found</p>
            <p className="font-mono text-[12px] mt-1">Once users complete payment on the portal, their device telemetry will appear here.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-hairline bg-hairline/30 font-mono text-[10px] font-bold uppercase tracking-wider text-muted">
                  <th className="py-3 px-4">Subscriber Details</th>
                  <th className="py-3 px-4">Device & Telemetry</th>
                  <th className="py-3 px-4">Package Plan</th>
                  <th className="py-3 px-4">Session Status</th>
                  <th className="py-3 px-4">Data Usage</th>
                  <th className="py-3 px-4">Expiration</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-hairline text-sm text-ink font-medium">
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
                    <tr key={sub.id} className="hover:bg-hairline/30 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="font-bold">{sub.phone}</div>
                        <div className="text-[12px] text-muted font-mono mt-0.5">Voucher: {sub.voucher_code || 'N/A'}</div>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1.5 text-ink-soft font-bold text-[12px]">
                          <Smartphone className="w-3.5 h-3.5 text-muted shrink-0" />
                          <span className="truncate max-w-[200px]" title={sub.device_info || 'Unknown Device'}>
                            {sub.device_info || 'Unknown Device'}
                          </span>
                        </div>
                        <div className="text-[10px] text-muted font-mono mt-1 flex items-center gap-3">
                          <span>MAC: {sub.mac_address}</span>
                          {sub.ip_address && <span>IP: {sub.ip_address}</span>}
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-compute/10 text-compute font-bold text-[11px] font-mono">
                          {sub.package_name}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        {isOnline ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-ai/10 text-ai font-bold text-[11px] font-mono border border-ai/20">
                            <span className="w-1.5 h-1.5 rounded-full bg-ai animate-pulse"></span>
                            Online (Active)
                          </span>
                        ) : isExpired ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emergency-red/10 text-emergency-red font-bold text-[11px] font-mono border border-emergency-red/20">
                            Expired
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-hairline text-ink-soft font-bold text-[11px] font-mono border border-hairline/50">
                            Offline (Valid)
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-[12px] font-bold text-ink">
                        {totalMB} MB
                        {activeSession?.uptime && (
                          <div className="text-[10px] text-muted font-normal mt-0.5">Uptime: {activeSession.uptime}</div>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        {sub.expires_at ? (
                          <div className="flex items-center gap-1 text-[12px] font-mono text-ink-soft">
                            <Clock className="w-3.5 h-3.5 text-muted" />
                            <span>{new Date(sub.expires_at).toLocaleString()}</span>
                          </div>
                        ) : (
                          <span className="font-mono text-[12px] text-muted">No Expiration Set</span>
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
