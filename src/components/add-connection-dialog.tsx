"use client";

import { useState } from "react";
import { Plus, Globe, Server, Link as LinkIcon, DatabaseBackup } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export function AddConnectionDialog({ addAction }: { addAction: (formData: FormData) => Promise<void> }) {
  const [open, setOpen] = useState(false);
  const [type, setType] = useState<"website" | "system">("website");
  const [mode, setMode] = useState<"link" | "manual">("link");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    formData.append("type", type);
    formData.append("mode", mode);
    
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
            Új kapcsolat hozzáadása
          </div>
        )}
      />
      
      <DialogContent className="sm:max-w-[480px] rounded-2xl p-6 border-slate-100 shadow-[0_20px_60px_rgba(0,0,0,0.08)] bg-white">
        <DialogHeader>
          <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center mb-4">
            <Plus className="text-emerald-600" size={24} />
          </div>
          <DialogTitle className="text-xl font-bold text-slate-800">Új kapcsolat felvétele</DialogTitle>
          <DialogDescription className="text-sm text-slate-500 pt-1">
            Válassza ki, mit szeretne a rendszerhez kapcsolni, és adja meg az adatait.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 pt-4">
          
          {/* Típus választó */}
          <div className="space-y-3">
            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Kapcsolat típusa</label>
            <div className="grid grid-cols-2 gap-3">
              <div 
                onClick={() => setType("website")}
                className={`p-3 rounded-lg border-2 cursor-pointer transition-all flex flex-col items-center justify-center gap-2 ${type === "website" ? "border-emerald-500 bg-emerald-50/50 text-emerald-700" : "border-slate-100 bg-white text-slate-500 hover:border-slate-200"}`}
              >
                <Globe size={24} />
                <span className="text-sm font-bold">Weboldal</span>
              </div>
              <div 
                onClick={() => setType("system")}
                className={`p-3 rounded-lg border-2 cursor-pointer transition-all flex flex-col items-center justify-center gap-2 ${type === "system" ? "border-emerald-500 bg-emerald-50/50 text-emerald-700" : "border-slate-100 bg-white text-slate-500 hover:border-slate-200"}`}
              >
                <Server size={24} />
                <span className="text-sm font-bold">Webapp, Rendszer</span>
              </div>
            </div>
          </div>

          {/* Mód választó */}
          <div className="space-y-3">
            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Hozzáadás módja</label>
            <div className="flex p-1 bg-slate-100 rounded-lg">
              <div 
                onClick={() => setMode("link")}
                className={`flex-1 text-center py-2 rounded-md text-sm font-bold cursor-pointer transition-colors ${mode === "link" ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
              >
                Online hivatkozás
              </div>
              <div 
                onClick={() => setMode("manual")}
                className={`flex-1 text-center py-2 rounded-md text-sm font-bold cursor-pointer transition-colors ${mode === "manual" ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
              >
                Belső kapcsolat
              </div>
            </div>
          </div>

          {/* Beviteli mezők a választott mód alapján */}
          <div className="space-y-3 pt-2">
            {mode === "link" ? (
              <>
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">URL / Hivatkozás</label>
                <div className="relative">
                  <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                  <Input 
                    name="url" 
                    placeholder="https://pelda.hu" 
                    className="pl-9 bg-slate-50 border-slate-200 focus-visible:ring-emerald-500 h-11" 
                    required 
                  />
                </div>
                <p className="text-[11px] text-slate-500">A rendszer automatikusan felderíti a kapcsolatot.</p>
              </>
            ) : (
              <>
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Megnevezés</label>
                <div className="relative">
                  <DatabaseBackup className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                  <Input 
                    name="name" 
                    placeholder="Pl. Belső HR Rendszer" 
                    className="pl-9 bg-slate-50 border-slate-200 focus-visible:ring-emerald-500 h-11" 
                    required 
                  />
                </div>
              </>
            )}
          </div>

          <div className="pt-2 flex gap-3">
            <Button type="button" variant="outline" onClick={() => setOpen(false)} className="flex-1 h-11 border-slate-200">
              Mégsem
            </Button>
            <Button type="submit" className="flex-1 h-11 bg-emerald-600 hover:bg-emerald-700 text-white shadow-[0_2px_10px_rgba(16,185,129,0.2)]">
              Kapcsolat hozzáadása
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}