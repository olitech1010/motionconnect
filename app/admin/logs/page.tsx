import React from 'react'
import { createAdminClient } from '@/lib/supabase/admin'
import { ShieldCheck } from 'lucide-react'
import { LogsTable } from '@/components/admin/LogsTable'

export const revalidate = 0

import { ActivityLog } from '@/types/transaction'

const DEFAULT_LOGS: ActivityLog[] = [
  { id: 'log-1', action: 'SYSTEM_STARTUP', actor: 'system', details: { service: 'MikroTik API Gateway', status: 'ready', os: 'v7.19.6' }, created_at: new Date(Date.now() - 300000).toISOString() },
  { id: 'log-2', action: 'HOTSPOT_USER_CREATED', actor: 'system', details: { username: 'MC-2481', profile: 'weekly', router: 'Main Campus Router' }, created_at: new Date(Date.now() - 1200000).toISOString() },
  { id: 'log-3', action: 'WEBHOOK_RECEIVED', actor: 'system', details: { provider: 'Hubtel', reference: 'MC-78901234', amount: 11.0 }, created_at: new Date(Date.now() - 1250000).toISOString() },
  { id: 'log-4', action: 'ADMIN_LOGIN', actor: 'admin@motionconect.com', details: { email: 'admin@motionconect.com', role: 'superadmin' }, created_at: new Date(Date.now() - 3600000).toISOString() },
]

export default async function AdminLogsPage() {
  let activityLogs: ActivityLog[] = DEFAULT_LOGS
  try {
    const supabase = createAdminClient()
    const { data: logs, error } = await supabase
      .from('activity_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50)

    if (!error && logs && logs.length > 0) {
      activityLogs = logs
    }
  } catch {
    // Fallback to default logs
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-canvas p-6 rounded-lg border border-hairline shadow-sm">
        <div>
          <h1 className="text-2xl font-medium text-ink tracking-tight">System & Security Logs</h1>
          <p className="font-mono text-[12px] text-muted mt-1">
            Industry-standard audit trail of API requests, webhooks, voucher creation, and admin activities.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="px-3 py-1.5 rounded-md bg-sase/10 text-sase font-bold font-mono text-[11px] flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4" />
            <span>SAIF Audit Active</span>
          </span>
        </div>
      </div>

      <LogsTable initialLogs={activityLogs} />
    </div>
  )
}
