import { createClient } from "@/utils/supabase/server";
import { SettingsForm } from "./settings-form";
import { saveCompanySettings } from "./actions";
import { Crown, Zap, ArrowRight } from "lucide-react";

export default async function SettingsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  let company = null;
  if (user) {
    const { data } = await supabase
      .from("companies")
      .select("*")
      .eq("user_id", user.id)
      .single();
    company = data;
  }

  return (
    <div className="max-w-3xl space-y-8 font-sans">

      <header className="pb-6 border-b border-slate-200/80">
        <h1 className="text-3xl font-bold text-slate-800 tracking-tight">Beállítások & Előfizetés</h1>
        <p className="text-[14px] text-slate-500 mt-2 font-medium">
          Céges adatok és előfizetési csomag kezelése.
        </p>
      </header>

      {/* ELŐFIZETÉS PANEL */}
      <section className="bg-white rounded-2xl border border-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.03)] overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-50 flex items-center justify-center border border-amber-100">
              <Crown size={18} className="text-amber-500" />
            </div>
            <div>
              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Jelenlegi csomag</div>
              <div className="text-[15px] font-bold text-slate-800">Free Plan</div>
            </div>
          </div>
          <span className="px-3 py-1.5 bg-emerald-50 text-emerald-700 text-[11px] font-bold rounded-lg border border-emerald-100">
            Aktív
          </span>
        </div>

        <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex flex-col gap-1">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Rendszer kvóta</span>
            <div className="flex items-end gap-1.5">
              <span className="text-2xl font-black text-slate-800">5</span>
              <span className="text-[13px] text-slate-400 font-medium mb-0.5">/ 20 db</span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-1.5 mt-1">
              <div className="bg-emerald-500 h-1.5 rounded-full w-1/4"></div>
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Generált tájékoztatók</span>
            <div className="flex items-end gap-1.5">
              <span className="text-2xl font-black text-slate-800">0</span>
              <span className="text-[13px] text-slate-400 font-medium mb-0.5">/ 5 db / hó</span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-1.5 mt-1">
              <div className="bg-emerald-500 h-1.5 rounded-full w-0"></div>
            </div>
          </div>

          <div className="flex flex-col justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Csomag bővítése</span>
            <button className="mt-2 flex items-center justify-between w-full px-4 py-3 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white rounded-xl font-bold text-[13px] shadow-[0_4px_12px_rgba(16,185,129,0.3)] transition-all">
              <div className="flex items-center gap-2">
                <Zap size={15} />
                Pro-ra váltás
              </div>
              <ArrowRight size={15} />
            </button>
          </div>
        </div>
      </section>

      {/* CÉGES BEÁLLÍTÁSOK FORM */}
      <SettingsForm company={company} saveAction={saveCompanySettings} />

    </div>
  );
}