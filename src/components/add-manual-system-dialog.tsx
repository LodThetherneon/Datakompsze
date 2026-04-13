"use client";

import { useState } from "react";
import { Plus, Database, FileText, Calendar, Tag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/toast-provider";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface AddManualSystemDialogProps {
  addAction: (formData: FormData) => Promise<void>;
  existingSystems: any[];
}

export function AddManualSystemDialog({ addAction, existingSystems }: AddManualSystemDialogProps) {
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [customCategory, setCustomCategory] = useState<string>("");
  const { success, error } = useToast();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);

    const formData = new FormData(e.currentTarget);

    if (selectedCategory === "__custom__") {
      formData.set("dataTypeCategory", customCategory.trim());
    } else {
      formData.set("dataTypeCategory", selectedCategory);
    }

    try {
      await addAction(formData);
      setOpen(false);
      setSelectedCategory("");
      setCustomCategory("");
      success("Adattípus sikeresen mentve!");
    } catch (err: any) {
      error(err?.message ?? "Hiba történt a mentés során.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const today = new Date().toISOString().split("T")[0];

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        setOpen(v);
        if (!v) {
          setSelectedCategory("");
          setCustomCategory("");
        }
      }}
    >
      <DialogTrigger
        nativeButton={false}
        render={(props) => (
          <div
            {...props}
            role="button"
            tabIndex={0}
            className="inline-flex items-center justify-center whitespace-nowrap text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 bg-emerald-600 hover:bg-emerald-700 text-white shadow-[0_4px_12px_rgba(16,185,129,0.3)] rounded-lg px-6 h-11 cursor-pointer"
          >
            <Plus size={18} className="mr-2" />
            Új adattípus felvitele
          </div>
        )}
      />

      <DialogContent className="sm:max-w-[500px] rounded-2xl p-6 border-slate-100 shadow-[0_20px_60px_rgba(0,0,0,0.08)] bg-white">
        <DialogHeader>
          <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center mb-4">
            <Database className="text-emerald-600" size={24} />
          </div>
          <DialogTitle className="text-xl font-bold text-slate-800">Kezelt adattípus felvétele</DialogTitle>
          <DialogDescription className="text-sm text-slate-500 pt-1">
            Rögzítsen egy manuálisan kezelt adattípust: adja meg a nevét, kategóriáját, tartalmát és a kezelés végét.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5 pt-4">

          {/* Név */}
          <div className="space-y-2">
            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1">
              <Tag size={12} />
              Az adattípus neve
            </label>
            <Input
              name="systemName"
              placeholder="Pl.: Ügyfél-adatbázis, Hírlevél lista, HR nyilvántartás..."
              className="h-11 bg-slate-50 border-slate-200 focus-visible:ring-emerald-500"
              required
            />
          </div>

          {/* Kategória */}
          <div className="space-y-2">
            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">
              Adattípus kategória
            </label>
              <Select
                value={selectedCategory}
                onValueChange={(value) => setSelectedCategory(value ?? "")}
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
                required
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
                placeholder="Pl.: Ügyfelek e-mail címe hírlevél küldéséhez, vagy látogatók IP címe."
                className="pl-9 bg-slate-50 border-slate-200 focus-visible:ring-emerald-500 min-h-[100px] resize-none"
                required
              />
            </div>
          </div>

          {/* Kezelés vége – kötelező */}
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
              Ez a dátum fog megjelenni a generált adatkezelési tájékoztatóban.
            </p>
          </div>

          <div className="pt-4 flex gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              className="flex-1 h-11 border-slate-200"
              disabled={isSubmitting}
            >
              Mégsem
            </Button>
            <Button
              type="submit"
              disabled={
                isSubmitting ||
                !selectedCategory ||
                (selectedCategory === "__custom__" && !customCategory.trim())
              }
              className="flex-1 h-11 bg-emerald-600 hover:bg-emerald-700 text-white shadow-[0_2px_10px_rgba(16,185,129,0.2)]"
            >
              {isSubmitting ? "Mentés..." : "Adattípus mentése"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}