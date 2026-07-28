import React from 'react'
import { PackageService } from '@/services/package.service'
import { Signal, CheckCircle2, XCircle } from 'lucide-react'

export const revalidate = 0

export default async function AdminPackagesPage() {
  const packages = await PackageService.getAllPackages()

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-canvas p-6 rounded-lg border border-hairline shadow-sm">
        <div>
          <h1 className="text-2xl font-medium text-ink tracking-tight">Wi-Fi Packages & Pricing</h1>
          <p className="font-mono text-[12px] text-muted mt-1">
            Manage data caps, access durations, signal strength badges, and pricing tiers.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {packages.map((pkg) => (
          <div
            key={pkg.id}
            className="bg-canvas rounded-lg border border-hairline shadow-sm p-6 flex flex-col justify-between hover:border-kumo-brand transition-all group"
          >
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="px-3 py-1 rounded-md bg-compute/10 text-compute font-mono text-[11px] font-bold uppercase tracking-wider">
                  {pkg.mikrotik_profile}
                </span>
                {pkg.is_active ? (
                  <span className="flex items-center gap-1 font-mono text-[11px] font-bold text-ai bg-ai/10 px-2.5 py-1 rounded-full border border-ai/20">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Active</span>
                  </span>
                ) : (
                  <span className="flex items-center gap-1 font-mono text-[11px] font-bold text-muted bg-hairline px-2.5 py-1 rounded-full border border-hairline/50">
                    <XCircle className="w-3.5 h-3.5" />
                    <span>Disabled</span>
                  </span>
                )}
              </div>

              <h3 className="text-xl font-medium text-ink mb-1">{pkg.name}</h3>
              <p className="font-mono text-[12px] text-muted mb-4">
                {pkg.data_limit} Data Limit · {pkg.duration_label}
              </p>

              <div className="space-y-2 border-t border-b border-hairline py-3 my-3 font-mono text-[11px] text-ink-soft font-bold">
                <div className="flex justify-between">
                  <span>Data Limit Bytes:</span>
                  <span className="text-ink">{pkg.data_limit_bytes.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>Duration Seconds:</span>
                  <span className="text-ink">{pkg.duration_seconds.toLocaleString()}s</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Signal Rating:</span>
                  <span className="flex items-center gap-1 text-kumo-brand font-bold">
                    <Signal className="w-3.5 h-3.5" />
                    <span>{pkg.signal_bars || 3} Bars</span>
                  </span>
                </div>
              </div>
            </div>

            <div className="pt-2 flex items-baseline justify-between">
              <div>
                <span className="font-mono text-[10px] text-muted font-bold uppercase mr-1">Price</span>
                <span className="text-2xl font-medium tracking-tight text-ink">GHS {pkg.amount.toFixed(2)}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
