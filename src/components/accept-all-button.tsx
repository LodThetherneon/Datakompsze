'use client'

import { useState } from 'react'
import { CheckCircle2, Loader2 } from 'lucide-react'
import { acceptAllPending } from '@/app/actions'
import { useToast } from '@/components/toast-provider'

export function AcceptAllButton({ pendingCount }: { pendingCount: number }) {
  const [loading, setLoading] = useState(false)
  const { success, error } = useToast()

  if (pendingCount === 0) return null

  const handleClick = async () => {
    setLoading(true)
    try {
      await acceptAllPending()
      success(`${pendingCount} adattípus sikeresen jóváhagyva!`)
    } catch (err: any) {
      error(err?.message ?? 'Hiba történt a jóváhagyás során.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-700 text-[13px] font-bold transition-all disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer shadow-sm"
    >
      {loading ? (
        <Loader2 size={14} className="animate-spin" />
      ) : (
        <CheckCircle2 size={14} />
      )}
      {loading ? 'Jóváhagyás...' : `Összes jóváhagyása (${pendingCount})`}
    </button>
  )
}