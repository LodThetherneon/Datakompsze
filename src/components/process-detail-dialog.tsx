'use client'

import { useState, useTransition } from 'react'
import {
  Dialog, DialogContent, DialogHeader,
  DialogTitle, DialogFooter,
} from '@/components/ui/dialog'
import { Pencil, Loader2, Globe } from 'lucide-react'
import { ActivityLog } from '@/components/activity-log'

type Process = {
  id: string
  department_name: string
  process_name: string
  purpose: string
  collected_data: string | null
  retention_period: string | null
  storage_location: string | null
  created_at: string
}

type Website = {
  id: string
  url: string
  status: string
}

type Props = {
  proc: Process
  linkedWebsites: Website[]
  updateAction: (formData: FormData) => Promise<void>
}

export function ProcessDetailDialog({ proc, linkedWebsites, updateAction }: Props) {
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState(false)
  const [isPending, startTransition] = useTransition()

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    startTransition(async () => {
      await updateAction(fd)
      setEditing(false)
      setOpen(false)
    })
  }

  const createdAt = new Intl.DateTimeFormat('hu-HU', {
    year: 'numeric', month: '2-digit', day: '2-digit'
  }).format(new Date(proc.created_at))

  return (
    <>
      <button
        onClick={() => { setOpen(true); setEditing(false) }}
        className="absolute inset-0 w-full h-full cursor-pointer z-0"
        tabIndex={-1}
        aria-label="Részletek megnyitása"
      />

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-[17px] font-bold text-slate-800">
              Folyamat részletei
            </DialogTitle>
          </DialogHeader>

          {!editing && (
            <div className="flex justify-start -mt-2">
              <button
                onClick={() => setEditing(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 text-slate-600 text-[12px] font-bold border border-slate-200 hover:border-emerald-200 transition-colors"
              >
                <Pencil size={13} /> Adatok szerkesztése
              </button>
            </div>
          )}

          {!editing ? (
            /* ── OLVASÓ NÉZET ── */
            <div className="space-y-3 pt-1">
              <Row label="Rögzítve" value={createdAt} />
              <Row label="Szervezeti egység" value={proc.department_name} />
              <Row label="Folyamat neve" value={proc.process_name} />
              <Row label="Kezelt adatok" value={proc.collected_data} />
              <Row label="Adatkezelés célja" value={proc.purpose} />
              <Row label="Megőrzési idő" value={proc.retention_period} />
              <Row label="Tárolás helye" value={proc.storage_location} />
              {linkedWebsites.length > 0 && (
                <div className="flex flex-col gap-1">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Csatolt rendszerek</span>
                  <div className="flex flex-wrap gap-1.5">
                    {linkedWebsites.map((w) => (
                      <span key={w.id} className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 text-[11px] font-bold px-2 py-1 rounded-lg border border-emerald-100">
                        <Globe size={10} />
                        {w.status === 'offline' ? w.url : w.url.replace(/^https?:\/\//, '')}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              <ActivityLog tableName="data_processes" recordId={proc.id} />
            </div>
          ) : (
            /* ── SZERKESZTŐ NÉZET ── */
            <form onSubmit={handleSubmit} className="space-y-4 pt-1">
              <input type="hidden" name="id" value={proc.id} />

              <Field label="Szervezeti egység" name="department_name" defaultValue={proc.department_name} />
              <Field label="Folyamat neve" name="process_name" defaultValue={proc.process_name} />
              <Field label="Kezelt adatok" name="collected_data" defaultValue={proc.collected_data ?? ''} multiline />
              <Field label="Adatkezelés célja" name="purpose" defaultValue={proc.purpose} multiline />
              <Field label="Megőrzési idő" name="retention_period" defaultValue={proc.retention_period ?? ''} />
              <Field label="Tárolás helye" name="storage_location" defaultValue={proc.storage_location ?? ''} />

              <DialogFooter className="gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditing(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 text-[13px] font-bold hover:bg-slate-50 transition-colors"
                >
                  Mégsem
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-[13px] font-bold transition-colors flex items-center gap-2 disabled:opacity-60"
                >
                  {isPending && <Loader2 size={13} className="animate-spin" />}
                  Mentés
                </button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}

function Row({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">{label}</span>
      <span className="text-[14px] text-slate-700 font-medium">
        {value?.trim() ? value : <span className="text-slate-300 italic">Nincs megadva</span>}
      </span>
    </div>
  )
}

function Field({ label, name, defaultValue, multiline }: {
  label: string; name: string; defaultValue: string; multiline?: boolean
}) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">{label}</label>
      {multiline ? (
        <textarea name={name} defaultValue={defaultValue} rows={3}
          className="w-full px-3 py-2 rounded-xl border border-slate-200 text-[13px] text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-300 resize-none bg-slate-50" />
      ) : (
        <input name={name} defaultValue={defaultValue}
          className="w-full px-3 py-2 rounded-xl border border-slate-200 text-[13px] text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-300 bg-slate-50" />
      )}
    </div>
  )
}