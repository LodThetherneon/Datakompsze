'use client'

import { useState } from 'react'
import { Link2, Unlink } from 'lucide-react'
import {
  Dialog, DialogContent, DialogDescription,
  DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'
import { useToast } from '@/components/toast-provider'

interface Website {
  id: string
  url: string
  status: string
}

interface Props {
  processId: string
  allWebsites: Website[]
  linkedWebsiteIds: string[]
  linkAction: (formData: FormData) => Promise<void>
  unlinkAction: (formData: FormData) => Promise<void>
}

export function LinkWebsiteDialog({ processId, allWebsites, linkedWebsiteIds, linkAction, unlinkAction }: Props) {
  const [open, setOpen] = useState(false)
  const [loadingId, setLoadingId] = useState<string | null>(null)
  const router = useRouter()
  const { success, error } = useToast()

  const handleToggle = async (websiteId: string, isLinked: boolean) => {
    setLoadingId(websiteId)
    const formData = new FormData()
    formData.append('process_id', processId)
    formData.append('website_id', websiteId)
    try {
      if (isLinked) {
        await unlinkAction(formData)
        success('Rendszer leválasztva.')
      } else {
        await linkAction(formData)
        success('Rendszer csatolva!')
      }
      router.refresh()
    } catch (err: any) {
      error(err?.message ?? 'Hiba történt.')
    } finally {
      setLoadingId(null)
    }
  }

  const getLabel = (w: Website) =>
    w.status === 'offline' ? w.url : w.url.replace(/^https?:\/\//, '')

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        nativeButton={false}
        render={(props) => (
          <div
            {...props}
            role="button"
            tabIndex={0}
            title="Rendszer csatolása"
            className="p-2 text-emerald-600 hover:bg-emerald-100 bg-emerald-50 rounded-md transition-colors cursor-pointer flex items-center"
          >
            <Link2 size={15} />
          </div>
        )}
      />

      <DialogContent className="sm:max-w-[440px] rounded-2xl border-slate-100 shadow-xl bg-white">
        <DialogHeader>
          <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center mb-4">
            <Link2 className="text-emerald-600" size={22} />
          </div>
          <DialogTitle className="text-xl font-bold text-slate-800">Rendszer / weboldal csatolása</DialogTitle>
          <DialogDescription className="text-sm text-slate-500 pt-1">
            Válassza ki, hogy melyik rendszer vagy weboldal vesz részt ebben a folyamatban.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2 pt-2 max-h-72 overflow-y-auto pr-1">
          {allWebsites.length === 0 ? (
            <p className="text-sm text-slate-500 text-center py-6">
              Még nincs hozzáadott kapcsolat a rendszerben.
            </p>
          ) : (
            allWebsites.map((w) => {
              const isLinked = linkedWebsiteIds.includes(w.id)
              const label = getLabel(w)
              return (
                <div
                  key={w.id}
                  className={`flex items-center justify-between px-4 py-3 rounded-xl border transition-colors ${
                    isLinked ? 'bg-emerald-50 border-emerald-200' : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <span className={`text-[13px] font-semibold truncate max-w-[220px] ${isLinked ? 'text-emerald-700' : 'text-slate-700'}`}>
                    {label}
                  </span>
                  <button
                    onClick={() => handleToggle(w.id, isLinked)}
                    disabled={loadingId === w.id}
                    className={`shrink-0 text-[12px] font-bold px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1 ${
                      isLinked
                        ? 'bg-rose-50 text-rose-600 hover:bg-rose-100'
                        : 'bg-emerald-600 text-white hover:bg-emerald-700'
                    }`}
                  >
                    {loadingId === w.id ? '...' : isLinked
                      ? <><Unlink size={12} /> Leválaszt</>
                      : <><Link2 size={12} /> Csatolás</>
                    }
                  </button>
                </div>
              )
            })
          )}
        </div>

        <div className="pt-4">
          <Button type="button" variant="outline" onClick={() => setOpen(false)} className="w-full border-slate-200">
            Bezárás
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}