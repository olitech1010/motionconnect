import React from 'react'
import { createAdminClient } from '@/lib/supabase/admin'
import { Signal, CheckCircle2, XCircle } from 'lucide-react'

export const revalidate = 0

export default async function AdminPackagesPage() {
  const supabase = createAdminClient()
  const { data: pkgs } = await supabase.from('packages').select('*').order('sort_order', { ascending: true })

  const packages = pkgs || []

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-zinc-200 shadow-sm">
        <div>
          <h1 className="text-2xl font-black text-[#0D1B2A] tracking-tight">Wi-Fi Packages & Pricing</h1>
          <p className="text-sm text-zinc-500 mt-1">
            Manage data caps, access durations, signal strength badges, and pricing tiers.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {packages.map((pkg) => (
          <div
            key={pkg.id}
            className="bg-white rounded-2xl border border-zinc-200 shadow-sm p-6 flex flex-col justify-between hover:border-[#1466B8] transition-all group"
          >
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="px-3 py-1 rounded-full bg-blue-50 text-[#1466B8] text-xs font-black uppercase tracking-wider">
                  {pkg.mikrotik_profile}
                </span>
                {pkg.is_active ? (
                  <span className="flex items-center gap-1 text-xs font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Active</span>
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-xs font-bold text-zinc-400 bg-zinc-100 px-2.5 py-1 rounded-full">
                    <XCircle className="w-3.5 h-3.5" />
                    <span>Disabled</span>
                  </span>
                )}
              </div>

              <h3 className="text-xl font-extrabold text-[#0D1B2A] mb-1">{pkg.name}</h3>
              <p className="text-sm text-zinc-500 mb-4">
                {pkg.data_limit} Data Limit · {pkg.duration_label}
              </p>

              <div className="space-y-2 border-t border-b border-zinc-100 py-3 my-3 text-xs text-zinc-600 font-semibold">
                <div className="flex justify-between">
                  <span>Data Limit Bytes:</span>
                  <span className="font-mono text-[#0D1B2A]">{pkg.data_limit_bytes.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>Duration Seconds:</span>
                  <span className="font-mono text-[#0D1B2A]">{pkg.duration_seconds.toLocaleString()}s</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Signal Rating:</span>
                  <span className="flex items-center gap-1 text-[#1466B8] font-bold">
                    <Signal className="w-3.5 h-3.5" />
                    <span>{pkg.signal_bars || 3} Bars</span>
                  </span>
                </div>
              </div>
            </div>

            <div className="pt-2 flex items-baseline justify-between">
              <div>
                <span className="text-xs text-zinc-400 font-bold uppercase mr-1">Price</span>
                <span className="text-2xl font-black text-[#0D1B2A]">GHS {pkg.amount.toFixed(2)}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
