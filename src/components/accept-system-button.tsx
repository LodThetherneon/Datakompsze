'use client'

import { useState } from 'react'
import { CheckCircle2, Loader2 } from 'lucide-react'
import { acceptSystem } from '@/app/actions'
import { useToast } from '@/components/toast-provider'

export function AcceptSystemButton({ id }: { id: string }) {
  const [loading, setLoading] = useState(false)
  const { success, error } = useToast()

  const handleClick = async () => {
    setLoading(true)
    const fd = new FormData()
    fd.set('id', id)
    try {
      await acceptSystem(fd)
      success('Adattípus sikeresen jóváhagyva!')
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
      title="Adattípus elfogadása"
      className="p-2 text-emerald-600 hover:bg-emerald-100 bg-emerald-50 rounded-md transition-colors cursor-pointer flex items-center disabled:opacity-50"
    >
      {loading ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
    </button>
  )
}