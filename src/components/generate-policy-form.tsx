'use client'

import { useState, useTransition, useRef, useEffect } from 'react'
import { Plus, ChevronDown, Loader2, Check, Globe } from 'lucide-react'
import { generatePolicy } from '@/app/actions'
import { useToast } from '@/components/toast-provider'

interface Website {
  id: string
  url: string
  status: string
}

export function GeneratePolicyForm({ websites }: { websites: Website[] }) {
  const { success, error } = useToast()
  const [isPending, startTransition] = useTransition()
  const [selectedId, setSelectedId] = useState(websites[0]?.id ?? '')
  const [open, setOpen] = useState(false)
  const [pos, setPos] = useState({ top: 0, left: 0, width: 0 })
  const btnRef = useRef<HTMLButtonElement>(null)

  const selectedSite = websites.find(w => w.id === selectedId)
  const siteName = (w: Website) =>
    w.status === 'offline' ? w.url : w.url.replace(/^https?:\/\//, '')

  const handleOpen = () => {
    if (!btnRef.current) return
    const rect = btnRef.current.getBoundingClientRect()
    const menuH = websites.length * 44
    const spaceBelow = window.innerHeight - rect.bottom
    const openUp = spaceBelow < menuH + 8
    setPos({
      top: openUp ? rect.top - menuH - 4 : rect.bottom + 4,
      left: rect.left,
      width: rect.width,
    })
    setOpen(true)
  }

  useEffect(() => {
    if (!open) return
    const close = () => setOpen(false)
    window.addEventListener('scroll', close, true)
    window.addEventListener('resize', close)
    return () => {
      window.removeEventListener('scroll', close, true)
      window.removeEventListener('resize', close)
    }
  }, [open])

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const formData = new FormData()
    formData.set('websiteId', selectedId)
    startTransition(async () => {
      try {
        await generatePolicy(formData)
        success(`Tájékoztató sikeresen generálva: ${siteName(selectedSite!)}`)
      } catch (err: any) {
        if (err?.digest?.startsWith('NEXT_REDIRECT')) return
        error(err?.message ?? 'Hiba a generálás során')
      }
    })
  }

  return (
    <form onSubmit={handleSubmit} className="flex items-center gap-3 w-full md:w-auto">

      {/* Custom dropdown trigger */}
      <button
        ref={btnRef}
        type="button"
        onClick={handleOpen}
        disabled={isPending}
        className="relative flex items-center justify-between gap-2 flex-1 md:flex-none md:min-w-[220px] pl-4 pr-3 h-11 bg-white border border-emerald-200 rounded-lg text-sm font-semibold text-slate-700 hover:border-emerald-300 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none shadow-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
      >
        <span className="flex items-center gap-2 truncate">
          <Globe size={13} className="text-emerald-500 shrink-0" />
          <span className="truncate">
            {selectedSite ? siteName(selectedSite) : 'Válassz forrást...'}
          </span>
        </span>
        <ChevronDown
          size={14}
          className={`text-emerald-500 shrink-0 transition-transform duration-150 ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {/* Dropdown panel — fixed, nem vágódik le */}
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div
            className="fixed z-50 bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden py-1"
            style={{ top: pos.top, left: pos.left, width: pos.width, minWidth: 220 }}
          >
            {websites.map(w => (
              <button
                key={w.id}
                type="button"
                onClick={() => { setSelectedId(w.id); setOpen(false) }}
                className={`w-full flex items-center gap-2.5 px-4 py-2.5 text-[13px] font-medium transition-colors hover:bg-slate-50 ${
                  selectedId === w.id ? 'bg-emerald-50/60' : ''
                }`}
              >
                <Globe size={12} className="text-emerald-500 shrink-0" />
                <span className="flex-1 text-left text-slate-700 truncate">{siteName(w)}</span>
                {selectedId === w.id && <Check size={12} className="text-emerald-500 shrink-0" />}
              </button>
            ))}
          </div>
        </>
      )}

      {/* Generálás gomb */}
      <button
        type="submit"
        disabled={isPending || !selectedId}
        className="inline-flex items-center gap-2 px-6 h-11 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 disabled:opacity-60 disabled:cursor-not-allowed text-white text-sm font-medium whitespace-nowrap rounded-lg shadow-[0_4px_12px_rgba(16,185,129,0.3)] transition-colors"
      >
        {isPending ? (
          <><Loader2 size={16} className="animate-spin" />Generálás...</>
        ) : (
          <><Plus size={18} className="mr-0.5" />Generálás</>
        )}
      </button>
    </form>
  )
}