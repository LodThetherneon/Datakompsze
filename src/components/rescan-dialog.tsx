'use client'

import { useState } from 'react'
import { ScanSearch, X, RefreshCw } from 'lucide-react'
import { useToast } from '@/components/toast-provider'

type Website = { id: string; url: string; status: string }

export function RescanDialog({
  websites,
  rescanAction,
}: {
  websites: Website[]
  rescanAction: (fd: FormData) => Promise<void>
}) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [selected, setSelected] = useState(websites[0]?.id || '')
  const { success, error } = useToast()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    const fd = new FormData()
    fd.set('websiteId', selected)
    try {
      await rescanAction(fd)
      setOpen(false)
      success('Újraszkennelés sikeresen elindítva!')
    } catch (err: any) {
      error(err?.message ?? 'Hiba történt a szkennelés indításakor.')
    } finally {
      setLoading(false)
    }
  }

  const scannable = websites.filter(w => w.status !== 'offline')

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="w-full bg-white hover:bg-blue-50 hover:text-blue-700 hover:border-blue-200 border border-slate-200 text-slate-700 font-semibold h-11 shadow-sm rounded-xl text-[13px] transition-colors flex items-center justify-center gap-2"
      >
        <ScanSearch size={14} />
        Újrascannelés
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-100 w-full max-w-sm mx-4 p-6">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-blue-50 flex items-center justify-center border border-blue-100">
                  <ScanSearch size={15} className="text-blue-600" />
                </div>
                <h2 className="text-[15px] font-bold text-slate-800">Weboldal scannelése</h2>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-slate-100 text-slate-400 transition-colors"
              >
                <X size={15} />
              </button>
            </div>

            {scannable.length === 0 ? (
              <p className="text-[13px] text-slate-500 text-center py-4">
                Nincs scannelhető weboldal (csak offline rendszerek vannak).
              </p>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-2">
                    Válassz weboldalt
                  </label>
                  <div className="relative">
                    <select
                      value={selected}
                      onChange={e => setSelected(e.target.value)}
                      className="w-full appearance-none pl-4 pr-10 py-2.5 border border-slate-200 rounded-xl text-[13px] font-semibold text-slate-700 bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                    >
                      {scannable.map(w => (
                        <option key={w.id} value={w.id}>
                          {w.url.replace(/^https?:\/\//, '')}
                        </option>
                      ))}
                    </select>
                    <RefreshCw size={13} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                  </div>
                </div>
                <p className="text-[12px] text-slate-500">
                  A scan során az ismert sütik és rendszerek újra felderítésre kerülnek.
                </p>
                <div className="flex gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setOpen(false)}
                    className="flex-1 h-10 rounded-xl border border-slate-200 text-slate-600 text-[13px] font-semibold hover:bg-slate-50 transition-colors"
                  >
                    Mégse
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 h-10 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-[13px] font-bold transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <><span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" /> Scannelés...</>
                    ) : (
                      <><ScanSearch size={13} /> Indítás</>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  )
}