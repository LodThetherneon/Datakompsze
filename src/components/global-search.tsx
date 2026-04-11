'use client'

import { Search, Globe, Database, Building2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState, useEffect, useRef } from 'react'

type Result = {
  type: 'website' | 'system'
  id: string
  label: string
  sub: string
  departments: string[]
}

export function GlobalSearch() {
  const router = useRouter()
  const [value, setValue] = useState('')
  const [results, setResults] = useState<Result[]>([])
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(-1)
  const containerRef = useRef<HTMLDivElement>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  useEffect(() => {
    if (value.length < 2) { setResults([]); setOpen(false); return }
    clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(async () => {
      const res = await fetch(`/api/search?q=${encodeURIComponent(value)}`)
      const data = await res.json()
      setResults(data)
      setOpen(data.length > 0)
      setActive(-1)
    }, 250)
  }, [value])

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const select = (r: Result) => {
    setOpen(false)
    setValue('')
    router.push(`/website/${r.id}`)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!open) return
    if (e.key === 'ArrowDown') { e.preventDefault(); setActive(a => Math.min(a + 1, results.length - 1)) }
    if (e.key === 'ArrowUp') { e.preventDefault(); setActive(a => Math.max(a - 1, 0)) }
    if (e.key === 'Enter' && active >= 0) select(results[active])
    if (e.key === 'Escape') setOpen(false)
  }

  return (
    <div ref={containerRef} className="relative w-[480px] hidden lg:block">
      <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
      <input
        type="text"
        value={value}
        onChange={e => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        onFocus={() => results.length > 0 && setOpen(true)}
        placeholder="Keresés rendszerek és weboldalak között..."
        className="w-full pl-10 pr-4 py-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-[10px] text-[13px] focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 focus:bg-white transition-all outline-none text-slate-700 placeholder:text-slate-400"
      />

      {open && (
        <div className="absolute top-full mt-2 w-full bg-white border border-slate-200 rounded-xl shadow-xl z-50 overflow-hidden">
          {results.map((r, i) => (
            <button
              key={`${r.type}-${r.id}-${i}`}
              onMouseDown={() => select(r)}
              className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${active === i ? 'bg-emerald-50' : 'hover:bg-slate-50'}`}
            >
              <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${r.type === 'website' ? 'bg-blue-50 text-blue-500' : 'bg-emerald-50 text-emerald-500'}`}>
                {r.type === 'website' ? <Globe size={13} /> : <Database size={13} />}
              </div>
              <div className="overflow-hidden flex-1 min-w-0">
                <div className="font-semibold text-[13px] text-slate-800 truncate">{r.label}</div>
                <div className="text-[11px] text-slate-400 truncate">{r.sub}</div>
                {/* Szervezeti egység badge-ek — csak system típusnál */}
                {r.type === 'system' && r.departments?.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-1">
                    {r.departments.map((d, j) => (
                      <span
                        key={j}
                        className="inline-flex items-center gap-1 bg-indigo-50 text-indigo-600 text-[10px] font-bold px-1.5 py-0.5 rounded-full border border-indigo-100"
                      >
                        <Building2 size={8} />
                        {d}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}