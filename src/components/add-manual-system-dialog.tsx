"use client"

import { useState } from "react"
import { Plus, Database, FileText, Calendar, Link2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { useToast } from "@/components/toast-provider"
import {
  Dialog, DialogContent, DialogDescription,
  DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog"
import {
  Select, SelectContent, SelectItem,
  SelectTrigger, SelectValue,
} from "@/components/ui/select"

interface Website {
  id: string
  url: string
  status: string
}

interface AddManualSystemDialogProps {
  addAction: (formData: FormData) => Promise<void>
  existingSystems: Website[]
}

export function AddManualSystemDialog({ addAction, existingSystems }: AddManualSystemDialogProps) {
  const [open, setOpen]                           = useState(false)
  const [isSubmitting, setIsSubmitting]           = useState(false)
  const [selectedWebsiteId, setSelectedWebsiteId] = useState<string>("")
  const [selectedCategory, setSelectedCategory]   = useState<string>("")
  const [customCategory, setCustomCategory]       = useState<string>("")
  const { success, error } = useToast()

  function getSourceLabel(source: Website): string {
    if (source.status === "offline") return source.url
    return source.url.replace(/^https?:\/\//, "")
  }

  function getSystemName(id: string): string {
    const found = existingSystems.find((s) => s.id === id)
    return found ? getSourceLabel(found) : ""
  }

  const handleClose = () => {
    setOpen(false)
    setSelectedWebsiteId("")
    setSelectedCategory("")
    setCustomCategory("")
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (isSubmitting) return
    setIsSubmitting(true)

    const formData = new FormData(e.currentTarget)

    // Kategória
    formData.set("dataTypeCategory",
      selectedCategory === "__custom__" ? customCategory.trim() : selectedCategory
    )
    // Kapcsolt rendszer ID és megjelenítési neve
    formData.set("websiteId",  selectedWebsiteId)
    formData.set("systemName", getSystemName(selectedWebsiteId))

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

  const today = new Date().toISOString().split("T")[0]

  const isValid =
    !!selectedWebsiteId &&
    !!selectedCategory &&
    (selectedCategory !== "__custom__" || !!customCategory.trim())

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) handleClose(); else setOpen(true) }}>
      <DialogTrigger
        type="button"
        className="inline-flex items-center justify-center whitespace-nowrap text-sm font-medium transition-colors bg-emerald-600 hover:bg-emerald-700 text-white shadow-[0_4px_12px_rgba(16,185,129,0.3)] rounded-lg px-6 h-11 cursor-pointer"
      >
        <Plus size={18} className="mr-2" />
        Új adattípus felvitele
      </DialogTrigger>

      <DialogContent className="sm:max-w-[500px] rounded-2xl p-6 border-slate-100 shadow-[0_20px_60px_rgba(0,0,0,0.08)] bg-white">
        <DialogHeader>
          <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center mb-4">
            <Database className="text-emerald-600" size={24} />
          </div>
          <DialogTitle className="text-xl font-bold text-slate-800">
            Kezelt adattípus felvétele
          </DialogTitle>
          <DialogDescription className="text-sm text-slate-500 pt-1">
            Válassza ki a kapcsolt rendszert, adja meg a kategóriát, a kezelt adatot és az adatkezelés végét.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5 pt-4">

          {/* Kapcsolt rendszer */}
          <div className="space-y-2">
            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1">
              <Link2 size={12} />
              Kapcsolt rendszer / forrás
            </label>
            {existingSystems.length === 0 ? (
              <div className="h-11 flex items-center px-3 rounded-lg bg-amber-50 border border-amber-200 text-[13px] text-amber-700 font-medium">
                Nincs felvett forrás. Először adj hozzá egyet a Dashboardon.
              </div>
            ) : (
              <Select
                value={selectedWebsiteId}
                onValueChange={(v) => setSelectedWebsiteId(v ?? "")}
              >
                <SelectTrigger className="w-full h-11 bg-slate-50 border-slate-200">
                  <SelectValue placeholder="Válasszon rendszert..." />
                </SelectTrigger>
                <SelectContent>
                  {existingSystems.map((source) => (
                    <SelectItem key={source.id} value={source.id}>
                      <span className="flex items-center gap-2">
                        <span className={`inline-block w-1.5 h-1.5 rounded-full shrink-0 ${
                          source.status === "offline"   ? "bg-violet-400" :
                          source.status === "scanning"  ? "bg-amber-400"  : "bg-emerald-400"
                        }`} />
                        {getSourceLabel(source)}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
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
                <SelectValue placeholder="Válasszon kategóriát..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Személyes azonosítók (Név, Születési adat)">Személyes azonosítók (Név, Születési adat)</SelectItem>
                <SelectItem value="Elérhetőségek (Email, Telefon, Cím)">Elérhetőségek (Email, Telefon, Cím)</SelectItem>
                <SelectItem value="Pénzügyi adatok (Bankszámla, Bankkártya)">Pénzügyi adatok (Bankszámla, Bankkártya)</SelectItem>
                <SelectItem value="Technikai adatok (IP cím, Sütik, Eszköz)">Technikai adatok (IP cím, Sütik, Eszköz)</SelectItem>
                <SelectItem value="Munkavállalói adatok (Önéletrajz, Bér)">Munkavállalói adatok (Önéletrajz, Bér)</SelectItem>
                <SelectItem value="Különleges adatok (Egészségügyi, Biometrikus)">Különleges adatok (Egészségügyi, Biometrikus)</SelectItem>
                <SelectItem value="Vizuális adatok (Kamerafelvétel, Fénykép)">Vizuális adatok (Kamerafelvétel, Fénykép)</SelectItem>
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

          {/* Adatkezelés vége */}
          <div className="space-y-2">
            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1">
              <Calendar size={12} />
              Adatkezelés vége (meddig kezeljük)
            </label>
            <Input
              type="date"
              name="retentionUntil"
              min={today}
              className="h-11 bg-slate-50 border-slate-200 focus-visible:ring-emerald-500"
              required
            />
            <p className="text-[11px] text-slate-400">
              Ez a dátum jelenik meg a generált adatkezelési tájékoztatóban a megőrzési idő oszlopban.
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