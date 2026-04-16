'use client'

import { useState, useTransition } from 'react'
import {
  Dialog, DialogContent, DialogHeader,
  DialogTitle, DialogFooter,
} from '@/components/ui/dialog'
import { Pencil, X, Loader2 } from 'lucide-react'

type System = {
  id: string
  system_name: string
  purpose: string | null
  collected_data: string | null
  retention_period: string | null
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
}

export function SystemDetailDialog({ sys, website, updateAction }: Props) {
  const [open, setOpen]       = useState(false)
  const [editing, setEditing] = useState(false)
  const [isPending, startTransition] = useTransition()

  const siteName = website
    ? website.status === 'offline'
      ? website.url
      : website.url.replace(/^https?:\/\//, '')
    : 'Ismeretlen forrás'

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
      {/* Kattintható sor-trigger — ezt a systems/page.tsx-ből hívjuk */}
      <button
        onClick={() => { setOpen(true); setEditing(false) }}
        className="absolute inset-0 w-full h-full cursor-pointer z-0"
        tabIndex={-1}
        aria-label="Részletek megnyitása"
      />

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl">
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
                <Pencil size={13} /> Adatok Szerkesztés
                </button>
            </div>
            )}

          {!editing ? (
            /* ── OLVASÓ NÉZET ── */
            <div className="space-y-4 pt-2">
              <Row label="Forrás" value={siteName} />
              <Row label="Adattípus neve" value={sys.system_name} />
              <Row label="Adatkezelés célja" value={sys.purpose} />
              <Row label="Kezelt adatok" value={sys.collected_data} />
              <Row label="Megőrzési idő" value={sys.retention_period} />
              <Row label="Státusz" value={sys.status === 'active' ? 'Elfogadva' : 'Jóváhagyásra vár'} />
            </div>
          ) : (
            /* ── SZERKESZTŐ NÉZET ── */
            <form onSubmit={handleSubmit} className="space-y-4 pt-2">
              <input type="hidden" name="id" value={sys.id} />

              <Field label="Adattípus neve" name="system_name" defaultValue={sys.system_name} />
              <Field label="Adatkezelés célja" name="purpose" defaultValue={sys.purpose ?? ''} multiline />
              <Field label="Kezelt adatok" name="collected_data" defaultValue={sys.collected_data ?? ''} multiline />
              <Field label="Megőrzési idő" name="retention_period" defaultValue={sys.retention_period ?? ''} />

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