import { Button } from "@/components/ui/button";
import { createClient } from "@/utils/supabase/server";
import { saveCompanySettings } from "./actions";
import { SettingsForm } from "./settings-form";

export default async function SettingsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  let company = null;
  if (user) {
    const { data } = await supabase
      .from('companies')
      .select('*')
      .eq('user_id', user.id)
      .single();
    company = data;
  }

  return (
    <div className="w-full space-y-10 font-sans">
      
      {/* Fejléc */}
      <header className="pb-4 border-b border-slate-200/60">
        <h1 className="text-3xl font-semibold text-slate-900 tracking-tight">Beállítások</h1>
        <p className="text-[14px] text-slate-500 mt-2 font-medium">
          A vállalkozás alapadatai. Ezek jelennek meg a hivatalos Adatkezelési Tájékoztatókban.
        </p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* === BEHÍVJUK AZ ÚJ "OKOS" ŰRLAPOT A BAL OLDALRA === */}
        <div className="lg:col-span-2">
          <SettingsForm company={company} saveAction={saveCompanySettings} />
        </div>

        {/* === ELŐFIZETÉS INFÓ (Maradt a régi) === */}
        <div>
          <div className="bg-gradient-to-br from-white to-slate-50 rounded-2xl p-8 border border-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.03)] h-full">
            <div className="text-[11px] font-bold text-slate-400 mb-6 uppercase tracking-widest">Előfizetés állapota</div>
            
            <div className="space-y-5">
              <div>
                <div className="text-[11px] text-slate-500 uppercase tracking-wider mb-1 font-semibold">Aktuális csomag</div>
                <div className="font-bold text-slate-800 text-[15px]">DataKomp Pro – KKV</div>
              </div>

              <div>
                <div className="text-[11px] text-slate-500 uppercase tracking-wider mb-1 font-semibold">Státusz</div>
                <div className="inline-flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
                  <span className="font-bold text-emerald-700 text-[13px]">Aktív</span>
                </div>
              </div>
            </div>

            <div className="mt-8 space-y-3">
              <Button variant="outline" className="w-full bg-white hover:bg-slate-50 border-slate-200 text-slate-700 font-semibold h-10 shadow-sm">
                Csomag módosítása
              </Button>
              <button className="w-full text-[12px] font-semibold text-slate-400 hover:text-red-500 transition-colors py-2">
                Előfizetés lemondása
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}