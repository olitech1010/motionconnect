import React from 'react'
import { createAdminClient } from '@/lib/supabase/admin'
import { ShieldCheck, Terminal } from 'lucide-react'

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
            Audit trail of API requests, webhooks, voucher creation, and admin logins.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="px-3 py-1.5 rounded-xl bg-purple-50 text-purple-700 font-bold text-xs flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4" />
            <span>SAIF Audit Active</span>
          </span>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm overflow-hidden">
        <div className="divide-y divide-zinc-100">
          {activityLogs.length === 0 ? (
            <div className="p-12 text-center text-zinc-400 font-medium">
              No activity logs recorded yet. Events will appear here automatically.
            </div>
          ) : (
            activityLogs.map((log) => (
              <div key={log.id} className="p-4 sm:p-5 flex items-start gap-4 hover:bg-zinc-50/80 transition-colors">
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#1466B8] flex items-center justify-center shrink-0 mt-0.5">
                  <Terminal className="w-5 h-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-extrabold text-sm text-[#0D1B2A]">{log.action}</span>
                    <span className="text-xs font-mono text-zinc-400 shrink-0">
                      {new Date(log.created_at).toLocaleString()}
                    </span>
                  </div>
                  <p className="text-xs font-semibold text-zinc-500 mt-0.5">
                    Actor: <span className="text-[#1466B8] font-bold">{log.actor || 'System'}</span>
                  </p>
                  {log.details && (
                    <pre className="mt-2 text-[11px] font-mono bg-zinc-50 p-2.5 rounded-lg border border-zinc-200 text-zinc-700 overflow-x-auto">
                      {JSON.stringify(log.details, null, 2)}
                    </pre>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
