'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { PenLine, ScanSearch } from 'lucide-react'

export function SourceTypeFilter() {
  const router = useRouter()
  const params = useSearchParams()
  const current = params.get('source_type') || 'all'

  const setFilter = (val: string) => {
    const next = new URLSearchParams(params.toString())
    if (val === 'all') {
      next.delete('source_type')
    } else {
      next.set('source_type', val)
    }
    router.push(`/systems?${next.toString()}`)
  }

  const options = [
    { value: 'all', label: 'Mindkettő', icon: null },
    {
      value: 'manual',
      label: 'Manuális',
      icon: <PenLine size={13} className="shrink-0" />,
    },
    {
      value: 'scanned',
      label: 'Scannelt',
      icon: <ScanSearch size={13} className="shrink-0" />,
    },
  ]

  return (
    <div className="flex bg-slate-100/80 p-1 rounded-lg border border-slate-200/60 gap-0.5">
      {options.map((opt) => {
        const active = current === opt.value
        return (
          <button
            key={opt.value}
            onClick={() => setFilter(opt.value)}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-[13px] font-bold rounded-md transition-all cursor-pointer ${
              active
                ? 'bg-white shadow-sm text-slate-800'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            {opt.icon}
            {opt.label}
          </button>
        )
      })}
    </div>
  )
}