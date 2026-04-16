'use client'

import { useIMask } from 'react-imask'
import { useTransition, useState } from 'react'
import { useRouter } from 'next/navigation'
import { AlertTriangle } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { useToast } from '@/components/toast-provider'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"

type Company = {
  id: string
  name: string
  tax_number: string | null
  registration_number: string | null
  headquarters: string | null
  email: string | null
  phone: string | null
  dpo_name: string | null
  dpo_email: string | null
  hosting_provider_name: string | null
  hosting_provider_address: string | null
  hosting_provider_email: string | null
}

interface SettingsFormProps {
  company: Company | null
  saveAction: (formData: FormData) => Promise<void>
  deleteAction: () => Promise<void>
}

export function SettingsForm({ company, saveAction, deleteAction }: SettingsFormProps) {
  const { success, error } = useToast()
  const [isPending, startTransition] = useTransition()
  const [showConfirm, setShowConfirm] = useState(false)
  const router = useRouter()

  const { ref: taxRef } = useIMask({ mask: '00000000-0-00' })
  const { ref: regRef } = useIMask({ mask: '00-00-000000' })
  const { ref: phoneRef } = useIMask({ mask: '+36 00 000 0000' })

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    startTransition(async () => {
      try {
        await saveAction(formData)
        success('Cégadatok sikeresen mentve!')
        router.refresh()
      } catch (err: any) {
        error(err?.message ?? 'Hiba történt a mentés során.')
      }
    })
  }

  const handleDelete = () => {
    startTransition(async () => {
      try {
        await deleteAction()
        success('Cégadatok sikeresen törölve!')
        setShowConfirm(false)
        router.refresh()
      } catch (err: any) {
        error(err?.message ?? 'Hiba történt a törlés során.')
        setShowConfirm(false)
      }
    })
  }

  return (
    <>
      {/* MEGERŐSÍTŐ DIALOG */}
      <Dialog open={showConfirm} onOpenChange={setShowConfirm}>
        <DialogContent className="sm:max-w-[425px] rounded-2xl border-slate-100 shadow-xl bg-white">
          <DialogHeader>
            <div className="w-12 h-12 rounded-xl bg-rose-50 flex items-center justify-center mb-4">
              <AlertTriangle className="text-rose-500" size={24} />
            </div>
            <DialogTitle className="text-xl font-bold text-slate-800">Cégadatok törlése</DialogTitle>
            <DialogDescription className="text-sm text-slate-500 pt-1">
              Ez a művelet <strong className="text-slate-800">visszafordíthatatlan</strong>. Minden megadott cégadat törlésre kerül. Ha csak egy adatot szeretne módosítani, kérem használja a fenti űrlapot.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="gap-2 sm:gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowConfirm(false)}
              className="border-slate-200 text-slate-600"
            >
              Mégsem
            </Button>
            <Button
              type="button"
              onClick={handleDelete}
              disabled={isPending}
              className="bg-rose-600 hover:bg-rose-700 text-white shadow-md"
            >
              {isPending ? 'Törlés...' : 'Végleges törlés'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <form onSubmit={handleSubmit} className="bg-white rounded-2xl p-8 border border-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.03)] space-y-8 [&_input:-webkit-autofill]:[box-shadow:0_0_0_1000px_#f8fafc_inset] [&_input:-webkit-autofill]:![webkit-text-fill-color:#1e293b]">

        {/* --- VÁLLALKOZÁS ALAPADATAI --- */}
        <div className="space-y-6">
          <h2 className="text-[15px] font-bold text-slate-800 border-b border-slate-100 pb-2">1. Vállalkozás Alapadatai</h2>

          <div>
            <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-2">Vállalkozás (adatkezelő) teljes neve</label>
            <input type="text" name="companyName" defaultValue={company?.name || ""} placeholder="Pl. DataKomp Kft." required className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-[14px] font-medium text-slate-800 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all outline-none" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-2">Adószám</label>
              {/* @ts-ignore */}
              <input ref={taxRef} name="taxNumber" type="text" defaultValue={company?.tax_number || ""} placeholder="12345678-2-42" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-[14px] font-medium text-slate-800 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all outline-none" />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-2">Cégjegyzékszám</label>
              {/* @ts-ignore */}
              <input ref={regRef} name="regNumber" type="text" defaultValue={company?.registration_number || ""} placeholder="01-09-123456" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-[14px] font-medium text-slate-800 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all outline-none" />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-2">Székhely pontos címe</label>
            <input type="text" name="headquarters" defaultValue={company?.headquarters || ""} placeholder="1051 Budapest, Példa utca 1." required className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-[14px] font-medium text-slate-800 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all outline-none" />
          </div>
        </div>

        {/* --- KAPCSOLATTARTÁSI ADATOK --- */}
        <div className="space-y-6 pt-2">
          <h2 className="text-[15px] font-bold text-slate-800 border-b border-slate-100 pb-2">2. Hivatalos Elérhetőségek (Tájékoztatóba)</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-2">Hivatalos E-mail cím</label>
              <input type="email" name="email" defaultValue={company?.email || ""} placeholder="hello@cegem.hu" required className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-[14px] font-medium text-slate-800 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all outline-none" />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-2">Telefonszám</label>
              {/* @ts-ignore */}
              <input ref={phoneRef} name="phone" type="text" defaultValue={company?.phone || ""} placeholder="+36 30 123 4567" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-[14px] font-medium text-slate-800 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all outline-none" />
            </div>
          </div>
        </div>

        {/* --- ADATVÉDELMI TISZTVISELŐ (DPO) --- */}
        <div className="space-y-6 pt-2">
          <div className="border-b border-slate-100 pb-2">
            <h2 className="text-[15px] font-bold text-slate-800">3. Adatvédelmi Tisztviselő (DPO)</h2>
            <p className="text-[12px] text-slate-500 mt-1">Csak akkor töltse ki, ha a GDPR alapján kötelező DPO-t kijelölnie, vagy önkéntesen megtette.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-2">DPO Neve</label>
              <input type="text" name="dpoName" defaultValue={company?.dpo_name || ""} placeholder="Dr. Adat Védő" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-[14px] font-medium text-slate-800 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all outline-none" />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-2">DPO E-mail címe</label>
              <input type="email" name="dpoEmail" defaultValue={company?.dpo_email || ""} placeholder="dpo@cegem.hu" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-[14px] font-medium text-slate-800 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all outline-none" />
            </div>
          </div>
        </div>

        {/* --- TÁRHELYSZOLGÁLTATÓ --- */}
        <div className="space-y-6 pt-2">
          <div className="border-b border-slate-100 pb-2">
            <h2 className="text-[15px] font-bold text-slate-800">4. Tárhelyszolgáltató adatai</h2>
            <p className="text-[12px] text-slate-500 mt-1">A GDPR értelmében meg kell nevezni azt a céget, amelyik a weboldal szervereit fizikailag üzemelteti.</p>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-2">Tárhelyszolgáltató cégneve</label>
            <input type="text" name="hostingName" defaultValue={company?.hosting_provider_name || ""} placeholder="Pl. Tárhely.eu Kft." required className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-[14px] font-medium text-slate-800 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all outline-none" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-2">Székhely címe</label>
              <input type="text" name="hostingAddress" defaultValue={company?.hosting_provider_address || ""} placeholder="1144 Budapest, Ormánság utca 4." required className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-[14px] font-medium text-slate-800 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all outline-none" />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-2">E-mail címe / Ügyfélszolgálat</label>
              <input type="email" name="hostingEmail" defaultValue={company?.hosting_provider_email || ""} placeholder="support@tarhely.eu" required className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-[14px] font-medium text-slate-800 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all outline-none" />
            </div>
          </div>
        </div>

        {/* GOMBSOR */}
        <div className="pt-6 border-t border-slate-100 flex justify-end gap-3">
          <Button
            type="button"
            onClick={() => setShowConfirm(true)}
            disabled={isPending || !company}
            className="bg-red-500 hover:bg-red-600 text-white shadow-[0_4px_12px_rgba(239,68,68,0.25)] rounded-lg px-8 h-11 font-semibold disabled:opacity-60 disabled:cursor-not-allowed transition-opacity"
          >
            Adatok törlése
          </Button>
          <Button
            type="submit"
            disabled={isPending}
            className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-[0_4px_12px_rgba(16,185,129,0.3)] rounded-lg px-8 h-11 font-semibold disabled:opacity-60 disabled:cursor-not-allowed transition-opacity"
          >
            {isPending ? 'Mentés...' : 'Beállítások mentése'}
          </Button>
        </div>
      </form>
    </>
  )
}