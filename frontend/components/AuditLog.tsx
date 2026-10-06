'use client'

import React, { useEffect, useState } from 'react'
import { ShieldAlert, Trash2, Clock, CheckCircle2, XCircle, AlertTriangle, Info } from 'lucide-react'

export interface AuditEntry {
  id: string
  timestamp: string
  action: string
  doc_id: string
  status: string
  details?: string | Record<string, unknown>
}

const STORAGE_KEY = 'securepass_audit_log'
const EVENT_KEY = 'securepass_audit_update'

export function addAuditEntry(
  action: string,
  doc_id: string,
  status: string,
  details?: string | Record<string, unknown>
) {
  if (typeof window === 'undefined') return

  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    const existing: AuditEntry[] = raw ? JSON.parse(raw) : []

    const newEntry: AuditEntry = {
      id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `log_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      timestamp: new Date().toISOString(),
      action,
      doc_id: doc_id || 'N/A',
      status,
      details,
    }

    const updated = [newEntry, ...existing].slice(0, 100)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
    window.dispatchEvent(new CustomEvent(EVENT_KEY))
  } catch (err) {
    console.error('Failed to save audit log:', err)
  }
}

export function AuditLog() {
  const [logs, setLogs] = useState<AuditEntry[]>([])
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const loadLogs = () => {
    if (typeof window === 'undefined') return
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) {
        setLogs(JSON.parse(raw))
      } else {
        setLogs([])
      }
    } catch {
      setLogs([])
    }
  }

  useEffect(() => {
    loadLogs()
    window.addEventListener(EVENT_KEY, loadLogs)
    window.addEventListener('storage', loadLogs)
    return () => {
      window.removeEventListener(EVENT_KEY, loadLogs)
      window.removeEventListener('storage', loadLogs)
    }
  }, [])

  const handleClear = () => {
    if (typeof window === 'undefined') return
    localStorage.removeItem(STORAGE_KEY)
    setLogs([])
    window.dispatchEvent(new CustomEvent(EVENT_KEY))
  }

  const getStatusBadge = (status: string) => {
    const upper = status.toUpperCase()
    if (upper.includes('VALID') || upper.includes('SUCCESS') || upper.includes('CLEARED') || upper.includes('ISSUED')) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-mono font-medium text-emerald-400 bg-emerald-950/60 border border-emerald-700/60">
          <CheckCircle2 className="w-3 h-3" /> {status}
        </span>
      )
    }
    if (upper.includes('REPLAY') || upper.includes('WARN')) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-mono font-medium text-amber-400 bg-amber-950/60 border border-amber-700/60">
          <AlertTriangle className="w-3 h-3" /> {status}
        </span>
      )
    }
    if (upper.includes('INVALID') || upper.includes('BLOCKED') || upper.includes('FAIL') || upper.includes('TAMPER') || upper.includes('CORRUPT')) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-mono font-medium text-rose-400 bg-rose-950/60 border border-rose-700/60">
          <XCircle className="w-3 h-3" /> {status}
        </span>
      )
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-mono font-medium text-cyan-400 bg-cyan-950/60 border border-cyan-700/60">
        <Info className="w-3 h-3" /> {status}
      </span>
    )
  }

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-lg p-5 shadow-lg">
      <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-4">
        <div className="flex items-center gap-2">
          <ShieldAlert className="w-5 h-5 text-cyan-400" />
          <h2 className="text-lg font-semibold text-slate-100">Audit Trail Log</h2>
          <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 font-mono">
            {logs.length} entri
          </span>
        </div>
        {logs.length > 0 && (
          <button
            onClick={handleClear}
            className="flex items-center gap-1.5 px-3 py-1 text-xs rounded bg-slate-800 hover:bg-rose-950/50 hover:text-rose-400 border border-slate-700 hover:border-rose-800 text-slate-400 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" /> Bersihkan Log
          </button>
        )}
      </div>

      {logs.length === 0 ? (
        <div className="py-8 text-center text-slate-500 text-sm">
          Belum ada riwayat aktivitas kriptografi yang tercatat.
        </div>
      ) : (
        <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
          {logs.map((log) => {
            const isExpanded = expandedId === log.id
            const dateStr = new Date(log.timestamp).toLocaleTimeString('id-ID', {
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit',
            })

            return (
              <div
                key={log.id}
                className="bg-slate-950/70 border border-slate-800/80 rounded p-3 text-sm hover:border-slate-700 transition-colors cursor-pointer"
                onClick={() => setExpandedId(isExpanded ? null : log.id)}
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="flex items-center gap-1 text-xs text-slate-500 font-mono">
                      <Clock className="w-3 h-3" /> {dateStr}
                    </span>
                    <span className="font-semibold text-slate-200 text-xs px-2 py-0.5 rounded bg-slate-800 border border-slate-700">
                      {log.action}
                    </span>
                    <span className="text-xs font-mono text-cyan-400/90 truncate max-w-[200px]" title={log.doc_id}>
                      Doc: {log.doc_id}
                    </span>
                  </div>
                  <div>{getStatusBadge(log.status)}</div>
                </div>

                {isExpanded && log.details && (
                  <div className="mt-3 pt-2 border-t border-slate-800 text-xs font-mono text-slate-400">
                    <p className="text-slate-500 mb-1">Rincian / Metadata:</p>
                    <pre className="p-2 bg-slate-900 rounded border border-slate-800 overflow-x-auto text-slate-300">
                      {typeof log.details === 'string'
                        ? log.details
                        : JSON.stringify(log.details, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
export default AuditLog
