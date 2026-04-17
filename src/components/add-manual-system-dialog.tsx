"use client"

import { useState } from "react"
import { Plus, Database, FileText, Clock, Target } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { useToast } from "@/components/toast-provider"
import {Dialog, DialogContent, DialogDescription,DialogHeader, DialogTitle, DialogTrigger,} from "@/components/ui/dialog"
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue,} from "@/components/ui/select"


interface Website {
  id: string
  url: string
  status: string
}

interface AddManualSystemDialogProps {
  addAction: (formData: FormData) => Promise<void>
  existingSystems: Website[]
}

const CATEGORY_OPTIONS = [
  "Személyes azonosítók (Név, Születési adat)",
  "Elérhetőségek (Email, Telefon, Cím)",
  "Pénzügyi adatok (Bankszámla, Bankkártya)",
  "Technikai adatok (IP cím, Sütik, Eszköz)",
  "Munkavállalói adatok (Önéletrajz, Bér)",
  "Különleges adatok (Egészségügyi, Biometrikus)",
  "Vizuális adatok (Kamerafelvétel, Fénykép)",
]

const UNIT_OPTIONS = [
  { value: "nap",   label: "Nap" },
  { value: "hónap", label: "Hónap" },
  { value: "év",    label: "Év" },
]

function calcRetentionUntil(value: string, unit: string): string | null {
  const n = parseInt(value, 10)
  if (!n || n <= 0) return null
  const d = new Date()
  if (unit === "nap")   d.setDate(d.getDate() + n)
  if (unit === "hónap") d.setMonth(d.getMonth() + n)
  if (unit === "év")    d.setFullYear(d.getFullYear() + n)
  return d.toISOString().split("T")[0]
}

export function AddManualSystemDialog({ addAction, existingSystems }: AddManualSystemDialogProps) {
  const [open, setOpen]                           = useState(false)
  const [isSubmitting, setIsSubmitting]           = useState(false)
  const [selectedWebsiteId, setSelectedWebsiteId] = useState<string>("")  // ÚJ
  const [selectedCategory, setSelectedCategory]   = useState<string>("")
  const [customCategory, setCustomCategory]       = useState<string>("")
  const [retentionValue, setRetentionValue]       = useState<string>("")
  const [retentionUnit, setRetentionUnit]         = useState<string>("év")
  const { success, error } = useToast()

  const handleClose = () => {
    setOpen(false)
    setSelectedWebsiteId("")  // ÚJ
    setSelectedCategory("")
    setCustomCategory("")
    setRetentionValue("")
    setRetentionUnit("év")
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (isSubmitting) return
    setIsSubmitting(true)

    const formData = new FormData(e.currentTarget)

    const finalCategory = selectedCategory === "__custom__"
      ? customCategory.trim()
      : selectedCategory
    formData.set("dataTypeCategory", finalCategory)

    const retentionDate = calcRetentionUntil(retentionValue, retentionUnit)
    if (!retentionDate) {
      error("Adjon meg érvényes megőrzési időt!")
      setIsSubmitting(false)
      return
    }
    formData.set("retentionUntil",   retentionDate)
    formData.set("retentionDisplay", `${retentionValue} ${retentionUnit}`)

    // ÚJ: kiválasztott weboldal beállítása
    const chosenWebsite = existingSystems.find(w => w.id === selectedWebsiteId)
    formData.set("websiteId",  selectedWebsiteId)
    formData.set("systemName", chosenWebsite?.url ?? "")

    try {
      await addAction(formData)
      handleClose()
      success("Adattípus sikeresen mentve!")
    } catch (err: any) {
      error(err?.message ?? "Hiba történt a mentés során.")
    } finally {
      setIsSubmitting(false)
    }
  }

    const isValid =
    !!selectedWebsiteId &&
    !!selectedCategory &&
    (selectedCategory !== "__custom__" || !!customCategory.trim()) &&
    !!retentionValue && parseInt(retentionValue, 10) > 0
  // (a purpose mező required attribútuma elvégzi a validációt automatikusan)

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) handleClose(); else setOpen(true) }}>
      <DialogTrigger
        type="button"
        className="inline-flex items-center justify-center whitespace-nowrap text-sm font-medium transition-colors bg-emerald-600 hover:bg-emerald-700 text-white shadow-[0_4px_12px_rgba(16,185,129,0.3)] rounded-lg px-6 h-11 cursor-pointer"
      >
        <Plus size={18} className="mr-2" />
        Új adattípus felvitele
      </DialogTrigger>

      <DialogContent className="sm:max-w-[500px] rounded-2xl p-6 border-slate-100 shadow-[0_20px_60px_rgba(0,0,0,0.08)] bg-white max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center mb-4">
            <Database className="text-emerald-600" size={24} />
          </div>
          <DialogTitle className="text-xl font-bold text-slate-800">
            Kezelt adattípus felvétele
          </DialogTitle>
          <DialogDescription className="text-sm text-slate-500 pt-1">
            Adja meg az adattípus kategóriáját, a kezelt adatot és a megőrzési időt.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5 pt-4">

          {/* ÚJ: Rendszer / Weboldal */}
          <div className="space-y-2">
            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">
              Rendszer / Weboldal
            </label>
            <Select
              value={selectedWebsiteId}
              onValueChange={(v) => setSelectedWebsiteId(v ?? "")}
            >
              <SelectTrigger className="w-full h-11 bg-slate-50 border-slate-200">
                <SelectValue placeholder="Válasszon rendszert..." />
              </SelectTrigger>
              <SelectContent>
                {existingSystems.map((site) => (
                  <SelectItem key={site.id} value={site.id}>
                    {site.status === "offline"
                      ? site.url
                      : site.url.replace(/^https?:\/\//, "")}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Kategória */}
          <div className="space-y-2">
            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">
              Adattípus kategória
            </label>
            <Select
              value={selectedCategory}
              onValueChange={(v) => setSelectedCategory(v ?? "")}
            >
              <SelectTrigger className="w-full h-11 bg-slate-50 border-slate-200">
                <SelectValue placeholder="Válasszon vagy írjon be kategóriát..." />
              </SelectTrigger>
              <SelectContent>
                {CATEGORY_OPTIONS.map((opt) => (
                  <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                ))}
                <SelectItem value="__custom__">✏️ Egyéb – saját megadás...</SelectItem>
              </SelectContent>
            </Select>

            {selectedCategory === "__custom__" && (
              <Input
                value={customCategory}
                onChange={(e) => setCustomCategory(e.target.value)}
                placeholder="Írja be a kategória nevét..."
                className="h-11 bg-slate-50 border-slate-200 focus-visible:ring-emerald-500"
              />
            )}
          </div>

          {/* Konkrét kezelt adatok */}
          <div className="space-y-2">
            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">
              Konkrét kezelt adat(ok)
            </label>
            <div className="relative">
              <FileText className="absolute left-3 top-3 text-slate-400" size={16} />
              <Textarea
                name="collectedData"
                placeholder="Pl.: Ügyfelek e-mail címe hírlevél küldéséhez."
                className="pl-9 bg-slate-50 border-slate-200 focus-visible:ring-emerald-500 min-h-[90px] resize-none"
                required
              />
            </div>
          </div>

          {/* Adatkezelés célja */}
          <div className="space-y-2">
            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1">
              <Target size={12} />
              Adatkezelés célja
            </label>
            <div className="relative">
              <Target className="absolute left-3 top-3 text-slate-400" size={16} />
              <Textarea
                name="purpose"
                placeholder="Pl.: Hírlevél küldése az ügyfelek részére."
                className="pl-9 bg-slate-50 border-slate-200 focus-visible:ring-emerald-500 min-h-[80px] resize-none"
                required
              />
            </div>
          </div>

          {/* Megőrzési idő */}
          <div className="space-y-2">
            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1">
              <Clock size={12} />
              Megőrzési idő (meddig kezeljük)
            </label>
            <div className="flex gap-2">
              <Input
                type="number"
                min="1"
                max="999"
                value={retentionValue}
                onChange={(e) => setRetentionValue(e.target.value)}
                placeholder="Pl.: 5"
                className="flex-1 h-11 bg-slate-50 border-slate-200 focus-visible:ring-emerald-500"
                required
              />
              <Select value={retentionUnit} onValueChange={(v: string | null) => setRetentionUnit(v ?? "év")}>
                <SelectTrigger className="w-32 h-11 bg-slate-50 border-slate-200">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {UNIT_OPTIONS.map((u) => (
                    <SelectItem key={u.value} value={u.value}>{u.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <p className="text-[11px] text-slate-400">
              Ez az időtartam jelenik meg a generált adatkezelési tájékoztatóban.
            </p>
          </div>

          <div className="pt-4 flex gap-3">
            <Button
              type="button" variant="outline"
              onClick={handleClose}
              className="flex-1 h-11 border-slate-200"
              disabled={isSubmitting}
            >
              Mégsem
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || !isValid}
              className="flex-1 h-11 bg-emerald-600 hover:bg-emerald-700 text-white shadow-[0_2px_10px_rgba(16,185,129,0.2)]"
            >
              {isSubmitting ? "Mentés..." : "Adattípus mentése"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}