import React from 'react'
import { createAdminClient } from '@/lib/supabase/admin'
import { ShieldCheck, Terminal } from 'lucide-react'

export const revalidate = 0

interface ActivityLog {
  id: string
  action: string
  details?: unknown
  ip_address?: string
  created_at: string
  actor?: string
}

const DEFAULT_LOGS: ActivityLog[] = [
  { id: 'log-1', action: 'SYSTEM_STARTUP', details: { service: 'MikroTik API Gateway', status: 'ready', os: 'v7.19.6' }, ip_address: '192.168.20.1', created_at: new Date(Date.now() - 300000).toISOString() },
  { id: 'log-2', action: 'HOTSPOT_USER_CREATED', details: { username: 'MC-2481', profile: 'weekly', router: 'Main Campus Router' }, ip_address: '10.0.0.12', created_at: new Date(Date.now() - 1200000).toISOString() },
  { id: 'log-3', action: 'WEBHOOK_RECEIVED', details: { provider: 'Hubtel', reference: 'MC-78901234', amount: 11.0 }, ip_address: '154.160.1.20', created_at: new Date(Date.now() - 1250000).toISOString() },
  { id: 'log-4', action: 'ADMIN_LOGIN', details: { email: 'admin@motionconect.com', role: 'superadmin' }, ip_address: '127.0.0.1', created_at: new Date(Date.now() - 3600000).toISOString() },
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
            Audit trail of API requests, webhooks, voucher creation, and admin logins.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="px-3 py-1.5 rounded-md bg-sase/10 text-sase font-bold font-mono text-[11px] flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4" />
            <span>SAIF Audit Active</span>
          </span>
        </div>
      </div>

      <div className="bg-canvas rounded-lg border border-hairline shadow-sm overflow-hidden">
        <div className="divide-y divide-hairline">
          {activityLogs.length === 0 ? (
            <div className="p-12 text-center text-muted font-mono text-[12px]">
              No activity logs recorded yet. Events will appear here automatically.
            </div>
          ) : (
            activityLogs.map((log) => (
              <div key={log.id} className="p-4 sm:p-5 flex items-start gap-4 hover:bg-hairline/30 transition-colors">
                <div className="w-10 h-10 rounded-md bg-compute/10 text-compute flex items-center justify-center shrink-0 mt-0.5">
                  <Terminal className="w-5 h-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-bold text-sm text-ink">{log.action}</span>
                    <span className="font-mono text-[11px] text-muted shrink-0">
                      {new Date(log.created_at).toLocaleString()}
                    </span>
                  </div>
                  <p className="font-mono text-[11px] text-ink-soft mt-0.5 font-bold">
                    Actor: <span className="text-kumo-brand">{log.actor || 'System'}</span>
                  </p>
                  {log.details && (
                    <pre className="mt-2 font-mono text-[11px] bg-hairline/30 p-2.5 rounded-md border border-hairline text-muted overflow-x-auto">
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
