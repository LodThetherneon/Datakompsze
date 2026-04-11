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

interface SystemItem {
  id: string
  system_name: string
  collected_data: string
  website_id: string
}

interface WebsiteItem {
  id: string
  url: string
  status: string
}

interface Props {
  processId: string
  allSystems: SystemItem[]
  allWebsites: WebsiteItem[]
  linkedSystemIds: string[]
  linkAction: (formData: FormData) => Promise<void>
  unlinkAction: (formData: FormData) => Promise<void>
}

export function LinkSystemDialog({
  processId,
  allSystems,
  allWebsites,
  linkedSystemIds,
  linkAction,
  unlinkAction,
}: Props) {
  const [open, setOpen] = useState(false)
  const [loadingId, setLoadingId] = useState<string | null>(null)
  const router = useRouter()
  const { success, error } = useToast()

  const handleToggle = async (systemId: string, isLinked: boolean) => {
    setLoadingId(systemId)
    const formData = new FormData()
    formData.append('process_id', processId)
    formData.append('system_id', systemId)
    try {
      if (isLinked) {
        await unlinkAction(formData)
        success('Adattípus leválasztva.')
      } else {
        await linkAction(formData)
        success('Adattípus csatolva!')
      }
      router.refresh()
    } catch (err: any) {
      error(err?.message ?? 'Hiba történt.')
    } finally {
      setLoadingId(null)
    }
  }

  const getWebsiteLabel = (websiteId: string) => {
    const w = allWebsites.find((w) => w.id === websiteId)
    if (!w) return 'Ismeretlen forrás'
    return w.status === 'offline' ? w.url : w.url.replace(/^https?:\/\//, '')
  }

  // Adattípusok forrás szerint csoportosítva
  const grouped = allWebsites
    .map((w) => ({
      website: w,
      systems: allSystems.filter((s) => s.website_id === w.id),
    }))
    .filter((g) => g.systems.length > 0)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        nativeButton={false}
        render={(props) => (
          <div
            {...props}
            role="button"
            tabIndex={0}
            title="Adattípus csatolása"
            className="p-2 text-emerald-600 hover:bg-emerald-100 bg-emerald-50 rounded-md transition-colors cursor-pointer flex items-center"
          >
            <Link2 size={15} />
          </div>
        )}
      />

      <DialogContent className="sm:max-w-[480px] rounded-2xl border-slate-100 shadow-xl bg-white">
        <DialogHeader>
          <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center mb-4">
            <Link2 className="text-emerald-600" size={22} />
          </div>
          <DialogTitle className="text-xl font-bold text-slate-800">Adattípus csatolása folyamathoz</DialogTitle>
          <DialogDescription className="text-sm text-slate-500 pt-1">
            Válassza ki, hogy melyik konkrét adattípus vesz részt ebben a folyamatban.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 pt-2 max-h-80 overflow-y-auto pr-1">
          {grouped.length === 0 ? (
            <p className="text-sm text-slate-500 text-center py-6">
              Még nincs elfogadott adattípus rögzítve az Adatkapcsolatok oldalon.
            </p>
          ) : (
            grouped.map(({ website, systems }) => (
              <div key={website.id}>
                {/* Forrás fejléc */}
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1 mb-1.5">
                  {getWebsiteLabel(website.id)}
                </div>
                <div className="space-y-1.5">
                  {systems.map((sys) => {
                    const isLinked = linkedSystemIds.includes(sys.id)
                    return (
                      <div
                        key={sys.id}
                        className={`flex items-center justify-between px-4 py-3 rounded-xl border transition-colors ${
                          isLinked
                            ? 'bg-emerald-50 border-emerald-200'
                            : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        <div className="min-w-0 mr-3">
                          <div className={`text-[13px] font-semibold truncate ${isLinked ? 'text-emerald-700' : 'text-slate-700'}`}>
                            {sys.collected_data || sys.system_name}
                          </div>
                          <div className="text-[11px] text-slate-400 truncate mt-0.5">
                            {sys.system_name}
                          </div>
                        </div>
                        <button
                          onClick={() => handleToggle(sys.id, isLinked)}
                          disabled={loadingId === sys.id}
                          className={`shrink-0 text-[12px] font-bold px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1 ${
                            isLinked
                              ? 'bg-rose-50 text-rose-600 hover:bg-rose-100'
                              : 'bg-emerald-600 text-white hover:bg-emerald-700'
                          }`}
                        >
                          {loadingId === sys.id ? '...' : isLinked
                            ? <><Unlink size={12} /> Leválaszt</>
                            : <><Link2 size={12} /> Csatol</>
                          }
                        </button>
                      </div>
                    )
                  })}
                </div>
              </div>
            ))
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