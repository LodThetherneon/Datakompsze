"use client";

import { useState } from "react";
import { Plus, Database, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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

// Kibővítjük a prop-okat, hogy megkapja a létező rendszereket
interface AddManualSystemDialogProps {
  addAction: (formData: FormData) => Promise<void>;
  existingSystems: any[]; // Itt fogjuk átadni a Dashboardon felvett rendszereket/oldalakat
}

export function AddManualSystemDialog({ addAction, existingSystems }: AddManualSystemDialogProps) {
  const [open, setOpen] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    await addAction(formData);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
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
      
      <DialogContent className="sm:max-w-[480px] rounded-2xl p-6 border-slate-100 shadow-[0_20px_60px_rgba(0,0,0,0.08)] bg-white">
        <DialogHeader>
          <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center mb-4">
            <Database className="text-emerald-600" size={24} />
          </div>
          <DialogTitle className="text-xl font-bold text-slate-800">Kezelt adattípus felvétele</DialogTitle>
          <DialogDescription className="text-sm text-slate-500 pt-1">
            Rögzítsen egy konkrét adatot (pl. Email cím, Név), amit gyűjtenek, és rendelje hozzá egy meglévő forráshoz.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5 pt-4">
          
          {/* 1. Melyik rendszerhez kötjük? */}
          <div className="space-y-2">
            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">
              Melyik forrás/rendszer gyűjti?
            </label>
            <Select name="systemId" required>
              <SelectTrigger className="w-full h-11 bg-slate-50 border-slate-200">
                <SelectValue placeholder="Válasszon egy meglévő rendszert..." />
              </SelectTrigger>
                <SelectContent>
                {existingSystems.length === 0 ? (
                  <SelectItem value="none" disabled>Nincs még felvett forrás a Dashboardon!</SelectItem>
                ) : (
                  existingSystems.map((sys) => (
                    <SelectItem key={sys.id} value={sys.id}>
                      {sys.status === 'offline' ? sys.url : sys.url.replace(/^https?:\/\//, '')}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          {/* 2. Adattípus kategória */}
          <div className="space-y-2">
            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">
              Adattípus Kategória
            </label>
            <Select name="dataTypeCategory" required>
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
              </SelectContent>
            </Select>
          </div>

          {/* 3. Konkrét adat leírása */}
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

          <div className="pt-4 flex gap-3">
            <Button type="button" variant="outline" onClick={() => setOpen(false)} className="flex-1 h-11 border-slate-200">
              Mégsem
            </Button>
            {/* Itt módosítottam a gomb szövegét a kérésednek megfelelően! */}
            <Button type="submit" className="flex-1 h-11 bg-emerald-600 hover:bg-emerald-700 text-white shadow-[0_2px_10px_rgba(16,185,129,0.2)]">
              Adattípus mentése
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}