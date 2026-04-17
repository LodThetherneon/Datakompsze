'use client'

import { useState, useTransition } from 'react'
import {
  Dialog, DialogContent, DialogHeader,
  DialogTitle, DialogFooter,
} from '@/components/ui/dialog'
import { Pencil, Loader2, GitBranch } from 'lucide-react'

type System = {
  id: string
  system_name: string
  purpose: string | null
  collected_data: string | null
  retention_period: string | null
  retention_display: string | null
  storage_location: string | null
  department_name: string | null
  status: string
  source_type: string
}

type Website = {
  id: string
  url: string
  status: string
}

type Props = {
  sys: System
  website: Website | undefined
  updateAction: (formData: FormData) => Promise<void>
  processName?: string | null
}

export function SystemDetailDialog({ sys, website, updateAction, processName }: Props) {
  const [open, setOpen]       = useState(false)
  const [editing, setEditing] = useState(false)
  const [isPending, startTransition] = useTransition()

  const isLinkedFromProcess = sys.source_type === 'process'

  const siteName = website
    ? website.status === 'offline'
      ? website.url
      : website.url.replace(/^https?:\/\//, '')
    : 'Ismeretlen forrás'

  const retentionValue = sys.retention_period ?? sys.retention_display ?? null

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    startTransition(async () => {
      await updateAction(fd)
      setEditing(false)
      setOpen(false)
    })
  }

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
              Adattípus részletei
            </DialogTitle>
          </DialogHeader>

          {!editing && (
            <div className="flex justify-start -mt-2">
              <button
                onClick={() => setEditing(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 text-slate-600 text-[12px] font-bold border border-slate-200 hover:border-emerald-200 transition-colors"
              >
                <Pencil size={13} /> Szerkesztés
              </button>
            </div>
          )}

          {!editing ? (
            /* ── OLVASÓ NÉZET ── */
            <div className="space-y-3 pt-1">
              <Row label="Rendszer / Forrás" value={siteName} />
              {isLinkedFromProcess && processName && (
                <div className="flex flex-col gap-0.5">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Kapcsolódó folyamat</span>
                  <span className="flex items-center gap-1.5 text-[14px] text-emerald-700 font-semibold">
                    <GitBranch size={13} className="text-emerald-500 shrink-0" />
                    {processName}
                  </span>
                </div>
              )}
              <Row label="Adattípus neve" value={sys.system_name} />
              <Row label="Kezelt adatok" value={sys.collected_data} />
              <Row label="Adatkezelés célja" value={sys.purpose} />
              <Row label="Megőrzési idő" value={retentionValue} />
              <Row label="Tárolás helye" value={sys.storage_location} />
              {isLinkedFromProcess && <Row label="Szervezeti egység" value={sys.department_name} />}
              <div className="flex flex-col gap-0.5">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Státusz</span>
                <span className={`inline-flex items-center gap-2 w-fit px-3 py-1 rounded-lg text-[12px] font-bold ${
                  sys.status === 'active'
                    ? 'bg-emerald-50 text-emerald-700'
                    : 'bg-amber-50 text-amber-700'
                }`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${
                    sys.status === 'active' ? 'bg-emerald-500' : 'bg-amber-500 animate-pulse'
                  }`} />
                  {sys.status === 'active' ? 'Elfogadva' : 'Jóváhagyandó'}
                </span>
              </div>
            </div>
          ) : (
            /* ── SZERKESZTŐ NÉZET ── */
            <form onSubmit={handleSubmit} className="space-y-4 pt-2">
              <input type="hidden" name="id" value={sys.id} />

              <Field label="Adattípus neve" name="system_name" defaultValue={sys.system_name} />
              <Field label="Kezelt adatok" name="collected_data" defaultValue={sys.collected_data ?? ''} multiline />
              <Field label="Adatkezelés célja" name="purpose" defaultValue={sys.purpose ?? ''} multiline />
              <Field label="Megőrzési idő" name="retention_period" defaultValue={retentionValue ?? ''} />
              <Field label="Tárolás helye" name="storage_location" defaultValue={sys.storage_location ?? ''} />
              {isLinkedFromProcess && (
                <Field label="Szervezeti egység" name="department_name" defaultValue={sys.department_name ?? ''} />
              )}

              <DialogFooter className="gap-2 pt-4">
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

function Field({
  label, name, defaultValue, multiline,
}: {
  label: string; name: string; defaultValue: string; multiline?: boolean
}) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">
        {label}
      </label>
      {multiline ? (
        <textarea
          name={name}
          defaultValue={defaultValue}
          rows={3}
          className="w-full px-3 py-2 rounded-xl border border-slate-200 text-[13px] text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-300 resize-none bg-slate-50"
        />
      ) : (
        <input
          name={name}
          defaultValue={defaultValue}
          className="w-full px-3 py-2 rounded-xl border border-slate-200 text-[13px] text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-300 bg-slate-50"
        />
      )}
    </div>
  )
}