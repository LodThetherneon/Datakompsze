'use client'

import { useState } from 'react'
import { updateRetentionPeriod } from '@/app/actions'

const PRESETS = [
  '30 nap', '3 hónap', '6 hónap',
  '1 év', '2 év', '3 év', '5 év', '8 év',
  'Fiók fennállásáig',
]

export function RetentionEditor({
  id,
  value,
}: {
  id: string
  value: string | null
}) {
  const [editing, setEditing] = useState(false)
  const [current, setCurrent] = useState(value)
  const [custom, setCustom] = useState('')
  const [loading, setLoading] = useState(false)

  async function save(newValue: string) {
    setLoading(true)
    await updateRetentionPeriod(id, newValue)
    setCurrent(newValue)
    setEditing(false)
    setLoading(false)
  }

  if (!editing) {
    return (
      <button
        onClick={() => setEditing(true)}
        className="text-[12px] font-medium text-slate-600 hover:text-slate-900 hover:underline underline-offset-2 transition-colors text-left"
      >
        {current ?? <span className="text-slate-300">—</span>}
      </button>
    )
  }

  return (
    <div className="flex flex-col gap-2 min-w-[160px]">
      {/* Preset gombok */}
      <div className="flex flex-wrap gap-1">
        {PRESETS.map((p) => (
          <button
            key={p}
            onClick={() => save(p)}
            disabled={loading}
            className={`px-2 py-0.5 rounded text-[11px] font-bold border transition-colors ${
              current === p
                ? 'bg-slate-800 text-white border-slate-800'
                : 'bg-white text-slate-600 border-slate-200 hover:border-slate-400'
            }`}
          >
            {p}
          </button>
        ))}
      </div>

      {/* Egyedi érték */}
      <div className="flex gap-1">
        <input
          autoFocus
          value={custom}
          onChange={(e) => setCustom(e.target.value)}
          placeholder="Egyedi érték..."
          className="flex-1 text-[12px] border border-slate-200 rounded px-2 py-1 focus:outline-none focus:border-slate-400"
          onKeyDown={(e) => {
            if (e.key === 'Enter' && custom.trim()) save(custom.trim())
            if (e.key === 'Escape') setEditing(false)
          }}
        />
        <button
          onClick={() => custom.trim() && save(custom.trim())}
          disabled={loading || !custom.trim()}
          className="px-2 py-1 text-[11px] font-bold bg-slate-800 text-white rounded disabled:opacity-40"
        >
          OK
        </button>
        <button
          onClick={() => setEditing(false)}
          className="px-2 py-1 text-[11px] text-slate-400 hover:text-slate-600"
        >
          ✕
        </button>
      </div>
    </div>
  )
}