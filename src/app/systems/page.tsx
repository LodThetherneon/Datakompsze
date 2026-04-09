import { Button } from "@/components/ui/button";
import { Search, Filter, Trash2, CheckCircle2 } from "lucide-react";
import { createClient } from "@/utils/supabase/server";
import Link from "next/link";
import { addManualSystem, deleteSystem, acceptSystem } from "@/app/actions";
import { AddManualSystemDialog } from "@/components/add-manual-system-dialog";
import { DeleteConfirmDialog } from "@/components/delete-confirm-dialog";
import { SearchBar } from "@/components/search-bar";

export default async function SystemsPage(props: { searchParams: Promise<{ filter?: string, q?: string, source?: string }> }) {
  const searchParams = await props.searchParams;
  const currentFilter = searchParams.filter || 'all';
  const searchQuery = searchParams.q || ''; 
  const sourceId = searchParams.source || '';

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  let systems: any[] = [];
  let websites: any[] = []; // Ide töltjük a Dashboard forrásait a lenyílóhoz

  if (user) {
    const { data: company } = await supabase
      .from('companies')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (company) {
      // 1. Lekérjük az összes Forrást (Weboldalak + Offline Rendszerek)
      // NAGYON FONTOS a csillag (*), hogy a status-t is visszakapjuk!
      const { data: webData } = await supabase
        .from('websites')
        .select('*')
        .eq('company_id', company.id)
        .order('created_at', { ascending: false });
      
      if (webData && webData.length > 0) {
        websites = webData;
        const websiteIds = webData.map(w => w.id);
        
        // 2. Lekérdezzük az Adattípusokat (systems) amik ezekhez tartoznak
        let query = supabase
          .from('systems')
          .select('*')
          .in('website_id', websiteIds)
          .order('created_at', { ascending: false });
        
        // 3. Állapot szűrés
        if (currentFilter !== 'all') {
          query = query.eq('status', currentFilter);
        }
        
        // 3/B. Szűrés konkrét forrásra (HA rákattintott a Dashboardon a számra!)
        if (sourceId) {
          query = query.eq('website_id', sourceId);
        }

        // 4. Szöveges keresés
        if (searchQuery) {
          query = query.or(`system_name.ilike.%${searchQuery}%,purpose.ilike.%${searchQuery}%,collected_data.ilike.%${searchQuery}%`);
        }
          
        const { data: sysData } = await query;
        if (sysData) systems = sysData;
      }
    }
  }

  return (
    <div className="w-full h-full flex flex-col space-y-8 font-sans">
      
      {/* === FEJLÉC ÉS GOMBOK === */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-6 border-b border-slate-200/80">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 tracking-tight">Kezelt adattípusok</h1>
          <p className="text-[14px] text-slate-500 mt-2 font-medium">
            A rendszerek és weboldalak által gyűjtött és feldolgozott konkrét adatok listája.
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          
          {/* SZŰRŐ KAPCSOLÓK */}
          <div className="flex bg-slate-100/80 p-1 rounded-lg border border-slate-200/60 mr-1">
            <Link href={`/systems?filter=all${searchQuery ? `&q=${searchQuery}` : ''}`} className={`px-3 py-1.5 text-[13px] font-bold rounded-md transition-all ${currentFilter === 'all' ? 'bg-white shadow-sm text-slate-800' : 'text-slate-500 hover:text-slate-700'}`}>Összes</Link>
            <Link href={`/systems?filter=active${searchQuery ? `&q=${searchQuery}` : ''}`} className={`px-3 py-1.5 text-[13px] font-bold rounded-md transition-all ${currentFilter === 'active' ? 'bg-white shadow-sm text-slate-800' : 'text-slate-500 hover:text-slate-700'}`}>Elfogadva</Link>
            <Link href={`/systems?filter=pending${searchQuery ? `&q=${searchQuery}` : ''}`} className={`px-3 py-1.5 text-[13px] font-bold rounded-md transition-all ${currentFilter === 'pending' ? 'bg-white shadow-sm text-slate-800' : 'text-slate-500 hover:text-slate-700'}`}>Függőben</Link>
          </div>
        
          {/* ÚJ ADATTÍPUS GOMB (Átadjuk neki a lekérdezett websites tömböt!) */}
          <AddManualSystemDialog addAction={addManualSystem} existingSystems={websites} />
        </div>
      </header>

      {/* === TÁBLÁZAT === */}
      <section className="bg-white rounded-2xl border border-slate-100 shadow-[0_4px_20px_rgba(0,0,0,0.02)] overflow-hidden w-full flex-1">
        
        {/* KERESŐ SÁV */}
        <div className="p-4 border-b border-slate-100 flex items-center gap-4 bg-slate-50/30">
          <SearchBar defaultValue={searchQuery} />
        </div>

        {/* Táblázat Fejléc */}
        <div className="grid grid-cols-12 gap-4 p-4 border-b border-slate-100 bg-slate-50/80 text-[11px] font-bold text-slate-400 uppercase tracking-widest">
          <div className="col-span-3 pl-4">Rendszer neve / Típusa</div>
          <div className="col-span-3">Adatkezelés célja</div>
          <div className="col-span-2">Forrás</div>
          <div className="col-span-2">Státusz</div>
          <div className="col-span-2 text-right pr-4">Műveletek</div>
        </div>
        
        {/* Táblázat Sorok */}
        <div className="divide-y divide-slate-50">
          {systems.length === 0 ? (
            <div className="p-12 text-center flex flex-col items-center justify-center">
              <div className="w-16 h-16 rounded-full bg-slate-50 flex items-center justify-center mb-4">
                <Search className="text-slate-300" size={24} />
              </div>
              <h3 className="text-lg font-bold text-slate-700 mb-1">Nincs találat</h3>
              <p className="text-sm text-slate-500 max-w-md mx-auto">
                {searchQuery ? `Nem találtunk eredményt a(z) "${searchQuery}" kifejezésre.` : "A rendszer még nem talált automatikusan adatkezeléseket, vagy a kiválasztott szűrőnek nem felel meg egy sem."}
              </p>
            </div>
          ) : (
            systems.map((sys) => {
              // Megkeressük, melyik forráshoz (website/offline rendszer) tartozik
              const website = websites.find(w => w.id === sys.website_id);
              const isPending = sys.status === 'pending';
              
              return (
                <div key={sys.id} className="grid grid-cols-12 gap-4 p-5 items-center hover:bg-slate-50/80 transition-colors group">
                  <div className="col-span-3 pl-4">
                    <div className="font-bold text-[14px] text-slate-800">{sys.system_name}</div>
                    <div className="text-[12px] text-slate-500 font-medium truncate pr-4">
                      {sys.collected_data || "Nincs megadva adat"}
                    </div>
                  </div>
                  <div className="col-span-3 text-[13px] font-medium text-slate-600 pr-4">
                    {sys.purpose || "Nincs megadva cél"}
                  </div>
                  
                  <div className="col-span-2 text-[13px] font-medium text-slate-600">
                    <span className="bg-slate-100 text-slate-600 px-2 py-1 rounded-md text-[11px] font-bold truncate max-w-full inline-block">
                      {/* Szépen formázzuk a Forrást a státusztól függően */}
                      {website ? (website.status === 'offline' ? website.url : website.url.replace(/^https?:\/\//, '')) : 'Ismeretlen forrás'}
                    </span>
                  </div>
                  
                  <div className="col-span-2">
                    {isPending ? (
                      <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-amber-50 text-amber-700 text-[12px] font-bold shadow-sm">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span> Jóváhagyásra vár
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 text-[12px] font-bold shadow-sm">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Elfogadva
                      </span>
                    )}
                  </div>
                  
                  <div className="col-span-2 flex justify-end items-center gap-2 pr-4 opacity-0 group-hover:opacity-100 transition-opacity">
                    {isPending && (
                      <form action={acceptSystem}>
                        <input type="hidden" name="id" value={sys.id} />
                        <button type="submit" title="Adattípus elfogadása" className="p-2 text-emerald-600 hover:bg-emerald-100 bg-emerald-50 rounded-md transition-colors cursor-pointer flex items-center">
                          <CheckCircle2 size={16} />
                        </button>
                      </form>
                    )}
                    
                    {/* Profi Törlés Gomb */}
                    <DeleteConfirmDialog 
                      id={sys.id} 
                      systemName={sys.system_name} 
                      deleteAction={deleteSystem} 
                    />
                  </div>
                </div>
              );
            })
          )}
        </div>
      </section>
    </div>
  );
}