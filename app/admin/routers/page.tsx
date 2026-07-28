import React from 'react'
import { RouterService } from '@/services/router.service'
import { HardDrive, CheckCircle2, Shield, Radio, Server, Cpu, Activity } from 'lucide-react'

export const revalidate = 0

export default async function AdminRoutersPage() {
  const routerList = await RouterService.getAllRouters()

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-canvas p-6 rounded-lg border border-hairline shadow-sm">
        <div>
          <h1 className="text-2xl font-medium text-ink tracking-tight">MikroTik Routers & Gateways</h1>
          <p className="font-mono text-[12px] text-muted mt-1">
            Monitor physical hardware, RouterOS REST API connection health, and hotspot user binding.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="px-3.5 py-2 rounded-md bg-compute/10 border border-compute/20 text-compute font-mono text-[12px] font-bold flex items-center gap-2">
            <Radio className="w-3.5 h-3.5 animate-pulse" />
            <span>RouterOS v7.19.6 API Ready</span>
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Router Card 1: Main Gateway */}
        <div className="bg-canvas rounded-lg border border-hairline shadow-sm p-6 space-y-5 hover:border-storage transition-all">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-[4px] bg-ink text-cream flex items-center justify-center shadow-sm">
                <HardDrive className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-medium text-lg text-ink">Main Gateway</h3>
                <span className="font-mono text-[11px] text-muted">RB5009UG+S+</span>
              </div>
            </div>
            <span className="flex items-center gap-1 font-mono text-[11px] font-bold text-ai bg-ai/10 px-2.5 py-1 rounded-full border border-ai/20">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Online</span>
            </span>
          </div>

          <div className="space-y-3 bg-hairline/30 p-4 rounded-md border border-hairline font-mono text-[11px] font-bold text-ink-soft">
            <div className="flex justify-between">
              <span className="flex items-center gap-1.5">
                <Server className="w-3.5 h-3.5 text-muted" />
                <span>WAN Uplink:</span>
              </span>
              <span className="text-ink">Starlink Business (Static IP)</span>
            </div>
            <div className="flex justify-between">
              <span className="flex items-center gap-1.5">
                <Cpu className="w-3.5 h-3.5 text-muted" />
                <span>API Port / SSL:</span>
              </span>
              <span className="text-ink">Port 443 (REST HTTPS)</span>
            </div>
            <div className="flex justify-between">
              <span className="flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5 text-muted" />
                <span>Hotspot Mode:</span>
              </span>
              <span className="text-ai">User & Time Enforced</span>
            </div>
          </div>

          <div className="pt-2 flex items-center justify-between font-mono text-[11px] font-bold text-muted border-t border-hairline">
            <span>Last Sync: Just now</span>
            <span className="text-kumo-brand">Auto-Provisioning ON</span>
          </div>
        </div>

        {/* Dynamic Database Routers */}
        {routerList.map((r) => (
          <div key={r.id} className="bg-canvas rounded-lg border border-hairline shadow-sm p-6 space-y-5 hover:border-hairline transition-all">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-[4px] bg-hairline/50 text-ink-soft flex items-center justify-center">
                  <Activity className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-medium text-lg text-ink">{r.name}</h3>
                  <span className="font-mono text-[11px] text-muted">{r.ip_address}</span>
                </div>
              </div>
              <span className="flex items-center gap-1 font-mono text-[11px] font-bold text-ai bg-ai/10 px-2.5 py-1 rounded-full border border-ai/20">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span className="capitalize">{r.api_status || 'online'}</span>
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
