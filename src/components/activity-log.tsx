'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { Clock } from 'lucide-react'

type LogEntry = {
  id: string
  action: string
  user_email: string | null
  created_at: string
}

type Props = {
  tableName: string
  recordId: string
}

export function ActivityLog({ tableName, recordId }: Props) {
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
  const supabase = createClient()
  supabase
    .from('activity_log')
    .select('id, action, user_email, created_at')
    .eq('table_name', tableName)
    .eq('record_id', recordId)
    .order('created_at', { ascending: false })
    .limit(20)
    .then(({ data, error }) => {
      if (error) console.error('ActivityLog hiba:', error)
      const all = data ?? []
      const created = all.filter(l => l.action === 'created' || l.action === 'INSERT')
      const updates = all.filter(l => l.action === 'updated' || l.action === 'UPDATE').slice(0, 3)
      setLogs([...updates, ...created])
      setLoading(false)
    })
}, [tableName, recordId])

  if (loading) return null
  if (logs.length === 0) return null

  return (
    <div className="mt-4 pt-4 border-t border-slate-100">
      <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5 mb-2">
        <Clock size={11} /> Aktivitás napló
      </span>
      <div className="flex flex-col gap-1.5">
        {logs.map((log) => {
          const date = new Intl.DateTimeFormat('hu-HU', {
            year: 'numeric', month: '2-digit', day: '2-digit',
            hour: '2-digit', minute: '2-digit',
            timeZone: 'Europe/Budapest',
          }).format(new Date(log.created_at))

          const actionLabel =
            log.action === 'INSERT'   ? 'Létrehozta' :
            log.action === 'UPDATE'   ? 'Módosította' :
            log.action === 'DELETE'   ? 'Törölte' :
            log.action === 'created'  ? 'Létrehozta' :
            log.action === 'updated'  ? 'Módosította' :
            log.action === 'deleted'  ? 'Törölte' : log.action

          return (
            <div key={log.id} className="flex items-center gap-2 text-[12px] text-slate-500">
              <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                (log.action === 'INSERT' || log.action === 'created') ? 'bg-emerald-400' :
                (log.action === 'UPDATE' || log.action === 'updated') ? 'bg-blue-400' : 'bg-red-400'
              }`} />
              <span className="font-semibold text-slate-600">{actionLabel}:</span>
              <span>{log.user_email ?? 'Ismeretlen'}</span>
              <span className="ml-auto text-slate-400">{date}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}