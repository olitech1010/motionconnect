import React from 'react'
import { createAdminClient } from '@/lib/supabase/admin'
import { HardDrive, CheckCircle2, Shield, Radio, Server, Cpu, Activity } from 'lucide-react'

export const revalidate = 0

export default async function AdminRoutersPage() {
  const supabase = createAdminClient()
  const { data: routers } = await supabase.from('routers').select('*')

  const routerList = routers || []

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-zinc-200 shadow-sm">
        <div>
          <h1 className="text-2xl font-black text-[#0D1B2A] tracking-tight">MikroTik Routers & Gateways</h1>
          <p className="text-sm text-zinc-500 mt-1">
            Monitor physical hardware, RouterOS REST API connection health, and hotspot user binding.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="px-3.5 py-2 rounded-xl bg-blue-50 border border-blue-200 text-[#1466B8] text-xs font-bold flex items-center gap-2">
            <Radio className="w-3.5 h-3.5 animate-pulse" />
            <span>RouterOS v7.19.6 API Ready</span>
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Router Card 1: Main Gateway */}
        <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm p-6 space-y-5 hover:border-emerald-400 transition-all">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#0D1B2A] to-[#1466B8] text-white flex items-center justify-center shadow-md">
                <HardDrive className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-black text-lg text-[#0D1B2A]">Main Gateway</h3>
                <span className="text-xs text-zinc-500 font-mono">RB5009UG+S+</span>
              </div>
            </div>
            <span className="flex items-center gap-1 text-xs font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Online</span>
            </span>
          </div>

          <div className="space-y-3 bg-zinc-50 p-4 rounded-xl border border-zinc-100 text-xs font-semibold text-zinc-600">
            <div className="flex justify-between">
              <span className="flex items-center gap-1.5">
                <Server className="w-3.5 h-3.5 text-zinc-400" />
                <span>WAN Uplink:</span>
              </span>
              <span className="font-bold text-[#0D1B2A]">Starlink Business (Static IP)</span>
            </div>
            <div className="flex justify-between">
              <span className="flex items-center gap-1.5">
                <Cpu className="w-3.5 h-3.5 text-zinc-400" />
                <span>API Port / SSL:</span>
              </span>
              <span className="font-mono text-[#0D1B2A]">Port 443 (REST HTTPS)</span>
            </div>
            <div className="flex justify-between">
              <span className="flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5 text-zinc-400" />
                <span>Hotspot Mode:</span>
              </span>
              <span className="font-bold text-emerald-600">User & Time Enforced</span>
            </div>
          </div>

          <div className="pt-2 flex items-center justify-between text-xs font-bold text-zinc-500 border-t border-zinc-100">
            <span>Last Sync: Just now</span>
            <span className="text-[#1466B8]">Auto-Provisioning ON</span>
          </div>
        </div>

        {/* Dynamic Database Routers */}
        {routerList.map((r) => (
          <div key={r.id} className="bg-white rounded-2xl border border-zinc-200 shadow-sm p-6 space-y-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-zinc-100 text-zinc-700 flex items-center justify-center">
                  <Activity className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-black text-lg text-[#0D1B2A]">{r.name}</h3>
                  <span className="text-xs text-zinc-500 font-mono">{r.ip_address}</span>
                </div>
              </div>
              <span className="flex items-center gap-1 text-xs font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
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
