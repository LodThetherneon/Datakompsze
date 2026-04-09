'use client'

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Globe, Plus } from "lucide-react"

// Megmondjuk a TypeScriptnek, hogy milyen funkciót vár bemenetként
interface AddWebsiteDialogProps {
  addAction: (formData: FormData) => Promise<void>;
}

export function AddWebsiteDialog({ addAction }: AddWebsiteDialogProps) {
  // Ez az állapot vezérli, hogy nyitva van-e a felugró ablak
  const [open, setOpen] = useState(false)

  // Ez a függvény fut le, amikor rákattint a "Szkennelés indítása" gombra
  const handleSubmit = async (formData: FormData) => {
    try {
      // 1. Lefuttatjuk a backend mentést (actions.ts)
      await addAction(formData);
      // 2. Ha sikeres volt, bezárjuk az ablakot
      setOpen(false);
    } catch (error) {
      console.error("Hiba történt a mentés során:", error);
      alert("Hiba: Először töltsd ki a cégadatokat a Beállítások menüben!");
    }
  }

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
            Új weboldal hozzáadása
          </div>
        )}
      />
      
      {/* A tényleges felugró ablak tartalma */}
      <DialogContent className="sm:max-w-[425px] rounded-2xl p-6 border-slate-100 shadow-[0_20px_60px_rgba(0,0,0,0.08)] bg-white">
        
        <DialogHeader>
          <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center mb-4">
            <Globe className="text-emerald-600" size={24} />
          </div>
          <DialogTitle className="text-xl font-bold text-slate-800">Új Weboldal bekötése</DialogTitle>
          <DialogDescription className="text-sm text-slate-500 pt-1">
            Adja meg a weboldal címét. A rendszer ezután automatikusan elkezdi a felderítést (Data Mapping).
          </DialogDescription>
        </DialogHeader>
        
        {/* Az űrlap, ami bekéri az URL-t */}
        <form action={handleSubmit} className="space-y-6 pt-4">
          <div className="space-y-2">
            <Label htmlFor="url" className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">
              Weboldal pontos címe (URL)
            </Label>
            <Input 
              id="url" 
              name="url" 
              type="url"
              placeholder="https://www.pelda-webshop.hu" 
              required
              className="h-12 bg-slate-50 border-slate-200 rounded-xl focus-visible:ring-emerald-500/20 focus-visible:border-emerald-500 text-slate-700"
            />
          </div>
          
          <DialogFooter>
            {/* Bezárás gomb (Mégsem) */}
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => setOpen(false)} 
              className="rounded-xl h-11 px-6 border-slate-200 text-slate-600 hover:bg-slate-50"
            >
              Mégsem
            </Button>
            
            {/* Mentés gomb */}
            <Button 
              type="submit" 
              className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl h-11 px-6 shadow-sm"
            >
              Szkennelés indítása
            </Button>
          </DialogFooter>
        </form>

      </DialogContent>
    </Dialog>
  )
}