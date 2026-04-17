'use client'

import { useTransition } from 'react'
import { Loader2 } from 'lucide-react'
import { useToast } from '@/components/toast-provider'
import { refreshAllPolicies } from '@/app/actions'

export function RefreshAllPoliciesButton() {
  const [isPending, startTransition] = useTransition()
  const { success, error } = useToast()

  function handleClick() {
    startTransition(async () => {
      try {
        await refreshAllPolicies()
        success('Összes dokumentum frissítve!')
      } catch (err: any) {
        error(err?.message ?? 'Hiba a frissítés során')
      }
    })
  }

  return (
    <button
      onClick={handleClick}
      disabled={isPending}
      className="w-full bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-semibold h-11 shadow-sm rounded-xl text-[13px] transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
    >
      {isPending
        ? <><Loader2 size={14} className="animate-spin" /> Frissítés...</>
        : 'Dokumentumok frissítése'
      }
    </button>
  )
}