"use client";

import { useState } from "react";
import { Trash2, AlertTriangle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface DeleteConfirmDialogProps {
  id: string;
  systemName: string;
  deleteAction: (formData: FormData) => Promise<void>;
}

export function DeleteConfirmDialog({ id, systemName, deleteAction }: DeleteConfirmDialogProps) {
  const [open, setOpen] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  const isMatch = inputValue === systemName;

  const handleDelete = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!isMatch) return;

    setIsDeleting(true);
    const formData = new FormData();
    formData.append("id", id);
    
    await deleteAction(formData);
    
    setIsDeleting(false);
    setOpen(false);
    setInputValue(""); // Visszaállítjuk
  };

  return (
    <Dialog open={open} onOpenChange={(newOpen) => {
      setOpen(newOpen);
      if (!newOpen) setInputValue(""); // Töröljük a beírt szöveget ha bezárja
    }}>
      <DialogTrigger
        nativeButton={false}
        render={(props) => (
          <div 
            {...props} 
            role="button"
            tabIndex={0}
            title="Rendszer törlése" 
            className="p-2 text-rose-500 hover:bg-rose-100 bg-rose-50 rounded-md transition-colors cursor-pointer flex items-center"
          >
            <Trash2 size={16} />
          </div>
        )}
      />

      <DialogContent className="sm:max-w-[425px] rounded-2xl border-slate-100 shadow-xl bg-white">
        <DialogHeader>
          <div className="w-12 h-12 rounded-xl bg-rose-50 flex items-center justify-center mb-4">
            <AlertTriangle className="text-rose-500" size={24} />
          </div>
          <DialogTitle className="text-xl font-bold text-slate-800">Rendszer törlése</DialogTitle>
          <DialogDescription className="text-sm text-slate-500 pt-1">
            Ez a művelet végleges és nem vonható vissza. Eltávolítja a(z) <strong className="text-slate-800">{systemName}</strong> rendszert és az összes hozzá tartozó adatkezelési rekordot.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleDelete} className="space-y-4 pt-4">
          <div className="space-y-2">
            <label className="text-[12px] font-bold text-slate-500 uppercase tracking-widest">
              Gépelje be a rendszer nevét a törléshez:
            </label>
            <div className="p-3 bg-slate-50 border border-slate-100 rounded-lg text-sm text-slate-600 select-all mb-2 font-mono">
              {systemName}
            </div>
            <Input
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder={systemName}
              className="border-slate-200 focus-visible:ring-rose-500"
              autoComplete="off"
            />
          </div>

          <DialogFooter className="gap-2 sm:gap-0 pt-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => setOpen(false)}
              className="border-slate-200 text-slate-600"
            >
              Mégsem
            </Button>
            <Button 
              type="submit" 
              disabled={!isMatch || isDeleting}
              className={`text-white transition-all ${isMatch ? 'bg-rose-600 hover:bg-rose-700 shadow-md' : 'bg-slate-300'}`}
            >
              {isDeleting ? "Törlés..." : "Végleges törlés"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}