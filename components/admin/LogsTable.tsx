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
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search logs by action, actor, or details..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm bg-white border border-zinc-200 rounded-xl focus:outline-none focus:border-blue-500 transition-all shadow-sm"
          />
        </div>
        <div className="relative">
          <button
            type="button"
            onClick={() => setIsFilterOpen(!isFilterOpen)}
            className={`px-4 py-2 border rounded-xl shadow-sm transition-colors flex items-center gap-2 text-sm font-medium ${
              isFilterOpen || severityFilter !== 'all'
                ? 'bg-blue-50 border-blue-200 text-blue-700'
                : 'bg-white border-zinc-200 text-zinc-700 hover:bg-zinc-50'
            }`}
          >
            <Filter className="w-4 h-4" />
            <span>Severity</span>
            {severityFilter !== 'all' && (
              <span className="w-2 h-2 rounded-full bg-blue-600 ml-1"></span>
            )}
          </button>

          {isFilterOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-white border border-zinc-200 rounded-xl shadow-xl z-10 p-2 animate-in fade-in slide-in-from-top-2">
              <div className="flex flex-col">
                {(['all', 'info', 'warning', 'critical'] as FilterSeverity[]).map((severity) => (
                  <button
                    key={severity}
                    onClick={() => {
                      setSeverityFilter(severity)
                      setIsFilterOpen(false)
                    }}
                    className={`text-left px-3 py-2 text-sm rounded-lg transition-colors capitalize ${
                      severityFilter === severity 
                        ? 'bg-blue-50 text-blue-700 font-semibold' 
                        : 'text-zinc-700 hover:bg-zinc-100'
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

      <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm overflow-hidden">
        <div className="divide-y divide-zinc-100">
          {filteredLogs.length === 0 ? (
            <div className="p-12 text-center text-zinc-400 font-medium">
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
                <div key={log.id} className="p-4 sm:p-5 flex items-start gap-4 hover:bg-zinc-50/80 transition-colors">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                    isError 
                      ? 'bg-rose-50 text-rose-600' 
                      : isWarning 
                      ? 'bg-amber-50 text-amber-600' 
                      : 'bg-blue-50 text-[#1466B8]'
                  }`}>
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
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}
