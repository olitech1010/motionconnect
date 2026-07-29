import React from 'react'
import { createAdminClient } from '@/lib/supabase/admin'
import { ShieldCheck } from 'lucide-react'
import { LogsTable } from '@/components/admin/LogsTable'

export const revalidate = 0

export default async function AdminLogsPage() {
  const supabase = createAdminClient()
  const { data: logs } = await supabase
    .from('activity_logs')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(50)

  const activityLogs = logs || []

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-zinc-200 shadow-sm">
        <div>
          <h1 className="text-2xl font-black text-[#0D1B2A] tracking-tight">System & Security Logs</h1>
          <p className="text-sm text-zinc-500 mt-1">
            Industry-standard audit trail of API requests, webhooks, voucher creation, and admin activities.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="px-3 py-1.5 rounded-xl bg-purple-50 text-purple-700 font-bold text-xs flex items-center gap-1.5 border border-purple-100">
            <ShieldCheck className="w-4 h-4" />
            <span>SAIF Audit Active</span>
          </span>
        </div>
      </div>

      <LogsTable initialLogs={activityLogs} />
    </div>
  )
}
