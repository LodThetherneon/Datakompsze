"use client";

import { useState } from "react";
import { Trash2, AlertTriangle, RefreshCw, CheckCircle2 } from "lucide-react";
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
import { generatePolicy } from "@/app/actions";

interface DeleteConfirmDialogProps {
  id: string;
  systemName: string;
  websiteId: string;
  deleteAction: (formData: FormData) => Promise<{ websiteId: string | null }>;
}

export function DeleteConfirmDialog({ id, systemName, websiteId, deleteAction }: DeleteConfirmDialogProps) {
  const [open, setOpen] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showRefreshPrompt, setShowRefreshPrompt] = useState(false);
  const [deletedWebsiteId, setDeletedWebsiteId] = useState<string | null>(null);

  const isMatch = inputValue === systemName;

  const handleDelete = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!isMatch) return;

    setIsDeleting(true);
    const formData = new FormData();
    formData.append("id", id);

    const result = await deleteAction(formData);

    setIsDeleting(false);
    setInputValue("");

    if (result?.websiteId) {
      setDeletedWebsiteId(result.websiteId);
      setShowRefreshPrompt(true);
    } else {
      setOpen(false);
    }
  };

  const handleRefresh = async () => {
    if (!deletedWebsiteId) return;
    setIsRefreshing(true);
    const fd = new FormData();
    fd.set("websiteId", deletedWebsiteId);
    await generatePolicy(fd);
    setIsRefreshing(false);
    setOpen(false);
    setShowRefreshPrompt(false);
  };

  const handleSkip = () => {
    setOpen(false);
    setShowRefreshPrompt(false);
  };

  return (
    <Dialog open={open} onOpenChange={(newOpen) => {
      setOpen(newOpen);
      if (!newOpen) {
        setInputValue("");
        setShowRefreshPrompt(false);
      }
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

        {/* === TÖRLÉS MEGERŐSÍTÉS === */}
        {!showRefreshPrompt && (
          <>
            <DialogHeader>
              <div className="w-12 h-12 rounded-xl bg-rose-50 flex items-center justify-center mb-4">
                <AlertTriangle className="text-rose-500" size={24} />
              </div>
              <DialogTitle className="text-xl font-bold text-slate-800">Adattípus törlése</DialogTitle>
              <DialogDescription className="text-sm text-slate-500 pt-1">
                Ez a művelet végleges. Eltávolítja a(z) <strong className="text-slate-800">{systemName}</strong> adattípust.
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
          </>
        )}

        {/* === FRISSÍTÉS KÉRDÉS === */}
        {showRefreshPrompt && (
          <>
            <DialogHeader>
              <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center mb-4">
                <RefreshCw className="text-emerald-600" size={24} />
              </div>
              <DialogTitle className="text-xl font-bold text-slate-800">Frissítsük a tájékoztatót?</DialogTitle>
              <DialogDescription className="text-sm text-slate-500 pt-1">
                Az adattípus törölve. Szeretné most frissíteni a hozzá tartozó adatkezelési tájékoztatót, hogy az már ne tartalmazza ezt az adatot?
              </DialogDescription>
            </DialogHeader>

            <DialogFooter className="gap-2 sm:gap-0 pt-6">
              <Button
                type="button"
                variant="outline"
                onClick={handleSkip}
                className="border-slate-200 text-slate-600"
              >
                Nem, később
              </Button>
              <Button
                type="button"
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-md"
              >
                {isRefreshing
                  ? <><RefreshCw size={14} className="animate-spin mr-2" /> Frissítés...</>
                  : <><CheckCircle2 size={14} className="mr-2" /> Igen, frissítés</>
                }
              </Button>
            </DialogFooter>
          </>
        )}

      </DialogContent>
    </Dialog>
  );
}