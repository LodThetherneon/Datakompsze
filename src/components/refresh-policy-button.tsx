'use client'

import { useTransition } from 'react'
import { RefreshCw, Loader2 } from 'lucide-react'
import { useToast } from '@/components/toast-provider'
import { generatePolicy } from '@/app/actions'

export function RefreshPolicyButton({
  websiteId,
  siteName,
}: {
  websiteId: string
  siteName: string
}) {
  const [isPending, startTransition] = useTransition()
  const { success, error } = useToast()

  function handleClick() {
    startTransition(async () => {
      try {
        const fd = new FormData()
        fd.set('websiteId', websiteId)
        await generatePolicy(fd)
        success(`Tájékoztató frissítve: ${siteName}`)
      } catch (err: any) {
        error(err?.message ?? 'Hiba a frissítés során')
      }
    })
  }

  return (
    <button
      onClick={handleClick}
      disabled={isPending}
      className="flex items-center gap-1.5 px-3 py-2 bg-slate-50 hover:bg-amber-50 hover:text-amber-700 hover:border-amber-200 border border-slate-200 rounded-lg text-[12px] font-bold text-slate-700 transition-colors disabled:opacity-50"
    >
      {isPending
        ? <><Loader2 size={13} className="animate-spin" /> Frissítés...</>
        : <><RefreshCw size={13} /> Frissítés</>
      }
    </button>
  )
}