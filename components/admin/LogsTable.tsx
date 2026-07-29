'use client'

import React, { useState, useMemo } from 'react'
import { ActivityLog } from '@/types/transaction'
import { Terminal, Search, Filter } from 'lucide-react'

interface LogsTableProps {
  initialLogs: ActivityLog[]
}

type FilterSeverity = 'all' | 'info' | 'warning' | 'critical'

export function LogsTable({ initialLogs }: LogsTableProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [severityFilter, setSeverityFilter] = useState<FilterSeverity>('all')
  const [isFilterOpen, setIsFilterOpen] = useState(false)

  const filteredLogs = useMemo(() => {
    return initialLogs.filter((log) => {
      // 1. Search query match
      const q = searchQuery.toLowerCase()
      const matchesSearch = 
        !q || 
        log.action.toLowerCase().includes(q) || 
        (log.actor && log.actor.toLowerCase().includes(q)) ||
        (log.details && JSON.stringify(log.details).toLowerCase().includes(q))

      if (!matchesSearch) return false

      // 2. Severity match
      if (severityFilter !== 'all') {
        const actionLower = log.action.toLowerCase()
        if (severityFilter === 'info' && (actionLower.includes('error') || actionLower.includes('failed'))) return false
        if (severityFilter === 'warning' && !actionLower.includes('warning') && !actionLower.includes('failed')) return false
        if (severityFilter === 'critical' && !actionLower.includes('error') && !actionLower.includes('critical')) return false
      }

      return true
    })
  }, [initialLogs, searchQuery, severityFilter])

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-muted absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search logs by action, actor, or details..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 font-mono text-[12px] bg-canvas border border-hairline rounded-md focus:outline-none focus:border-kumo-brand transition-all shadow-sm text-ink placeholder:text-muted"
          />
        </div>
        <div className="relative">
          <button
            type="button"
            onClick={() => setIsFilterOpen(!isFilterOpen)}
            className={`px-4 py-2 border rounded-md shadow-sm transition-colors flex items-center gap-2 font-mono text-[12px] font-bold ${
              isFilterOpen || severityFilter !== 'all'
                ? 'bg-compute/10 border-compute text-compute'
                : 'bg-canvas border-hairline text-ink-soft hover:bg-hairline/30'
            }`}
          >
            <Filter className="w-4 h-4" />
            <span>Severity</span>
            {severityFilter !== 'all' && (
              <span className="w-2 h-2 rounded-full bg-compute ml-1"></span>
            )}
          </button>

          {isFilterOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-canvas border border-hairline rounded-lg shadow-xl z-10 p-2 animate-in fade-in slide-in-from-top-2">
              <div className="flex flex-col">
                {(['all', 'info', 'warning', 'critical'] as FilterSeverity[]).map((severity) => (
                  <button
                    key={severity}
                    onClick={() => {
                      setSeverityFilter(severity)
                      setIsFilterOpen(false)
                    }}
                    className={`text-left px-3 py-2 font-mono text-[12px] rounded-lg transition-colors capitalize ${
                      severityFilter === severity 
                        ? 'bg-compute/10 text-compute font-bold' 
                        : 'text-ink-soft hover:bg-hairline/30'
                    }`}
                  >
                    {severity === 'all' ? 'All Severities' : severity}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="bg-canvas rounded-lg border border-hairline shadow-sm overflow-hidden">
        <div className="divide-y divide-hairline">
          {filteredLogs.length === 0 ? (
            <div className="p-12 text-center text-muted font-mono text-[12px]">
              {initialLogs.length === 0 
                ? 'No activity logs recorded yet. Events will appear here automatically.'
                : 'No logs match your search/filter criteria.'}
            </div>
          ) : (
            filteredLogs.map((log) => {
              const actionLower = log.action.toLowerCase()
              const isError = actionLower.includes('error') || actionLower.includes('failed') || actionLower.includes('critical')
              const isWarning = actionLower.includes('warning')

              return (
                <div key={log.id} className="p-4 sm:p-5 flex items-start gap-4 hover:bg-hairline/30 transition-colors">
                  <div className={`w-10 h-10 rounded-md flex items-center justify-center shrink-0 mt-0.5 ${
                    isError 
                      ? 'bg-emergency-red/10 text-emergency-red' 
                      : isWarning 
                      ? 'bg-kumo-brand-soft/10 text-kumo-brand-soft' 
                      : 'bg-ai/10 text-ai'
                  }`}>
                    <Terminal className="w-5 h-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-mono text-[13px] font-bold text-ink tracking-tight">{log.action}</span>
                      <span className="text-[11px] font-mono text-muted shrink-0">
                        {new Date(log.created_at).toLocaleString()}
                      </span>
                    </div>
                    <p className="font-mono text-[11px] text-muted mt-1">
                      Actor: <span className="text-kumo-brand font-bold">{log.actor || 'System'}</span>
                    </p>
                    {log.details && (
                      <pre className="mt-2.5 text-[11px] font-mono bg-hairline/30 p-2.5 rounded-md border border-hairline text-ink-soft overflow-x-auto whitespace-pre-wrap">
                        {JSON.stringify(log.details, null, 2)}
                      </pre>
                    )}
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}
