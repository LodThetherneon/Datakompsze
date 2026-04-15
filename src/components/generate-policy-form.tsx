'use client'

import { useState, useTransition } from 'react'
import { Plus, ChevronDown, Loader2 } from 'lucide-react'
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

  const selectedSite = websites.find(w => w.id === selectedId)
  const siteName = selectedSite
    ? selectedSite.status === 'offline'
      ? selectedSite.url
      : selectedSite.url.replace(/^https?:\/\//, '')
    : ''

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const formData = new FormData()
    formData.set('websiteId', selectedId)

    startTransition(async () => {
      try {
        await generatePolicy(formData)
        success(`Tájékoztató sikeresen generálva: ${siteName}`)
      } catch (err: any) {
        error(err?.message ?? 'Hiba a generálás során')
      }
    })
  }

  return (
    <form onSubmit={handleSubmit} className="flex items-center gap-3 w-full md:w-auto">
      <div className="relative flex-1 md:flex-none md:min-w-[220px]">
        <select
          name="websiteId"
          value={selectedId}
          onChange={e => setSelectedId(e.target.value)}
          disabled={isPending}
          className="w-full appearance-none pl-4 pr-10 h-11 bg-white border border-emerald-200 rounded-lg text-sm font-semibold text-slate-700 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none shadow-sm cursor-pointer hover:border-emerald-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {websites.map(w => (
            <option key={w.id} value={w.id}>
              {w.status === 'offline' ? w.url : w.url.replace(/^https?:\/\//, '')}
            </option>
          ))}
        </select>
        <ChevronDown
          size={14}
          className="absolute right-3.5 top-1/2 -translate-y-1/2 text-emerald-500 pointer-events-none"
        />
      </div>

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