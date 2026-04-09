import { Button } from "@/components/ui/button";
import { createClient } from "@/utils/supabase/server";
import { Search, PenLine } from "lucide-react";

// --- ACTIONS ---
import { addConnection, deleteWebsite } from "./actions";
import Link from "next/link"; 

// --- COMPONENTS ---
import { AddConnectionDialog } from "@/components/add-connection-dialog";
import { DeleteConfirmDialog } from "@/components/delete-confirm-dialog";
import { RealtimeRefresher } from '@/components/realtime-refresher'

// Dátumformázó segédfüggvény a szép magyar megjelenéshez
function formatDate(dateString: string | null) {
  if (!dateString) return "Még nem generált";
  return new Intl.DateTimeFormat('hu-HU', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  }).format(new Date(dateString));
}

export default async function Home() {
  // 1. BEJELENTKEZÉS ÉS ADATBÁZIS KAPCSOLAT
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // 2. CÉG LEKÉRDEZÉSE (hogy tudjuk, mik a saját weboldalaink)
  let companyId = null;
  if (user) {
    const { data: company } = await supabase
      .from('companies')
      .select('id')
      .eq('user_id', user.id)
      .single();
    if (company) companyId = company.id;
  }

  // 3. VALÓS ADATOK LEKÉRDEZÉSE (Weboldalak és Rendszerek)
  let websites: any[] = [];
  let systems: any[] = [];
  let pendingSystems = 0;

  if (companyId) {
    // Lekérjük a cég összes weboldalát
    const { data: webData } = await supabase
      .from('websites')
      .select('*')
      .eq('company_id', companyId)
      .order('created_at', { ascending: false });
    
    if (webData) websites = webData;

    // Lekérjük az összes rendszert, ami ezekhez a weboldalakhoz tartozik
    if (websites.length > 0) {
      const websiteIds = websites.map(w => w.id);
      const { data: sysData } = await supabase
        .from('systems')
        .select('*')
        .in('website_id', websiteIds);
      
      if (sysData) {
        systems = sysData;
        // Kiszámoljuk, mennyi vár jóváhagyásra (Megfelelőségi szint kártyához)
        pendingSystems = systems.filter(s => s.status === 'pending').length;
      }
    }
  }

    // 4. STATISZTIKÁK KISZÁMÍTÁSA
  // Összes Forrás (Weboldalak + Offline Rendszerek)
  const totalSources = websites.length;
  const webDomainCount = websites.filter(w => w.status !== 'offline').length;
  const offlineSystemCount = websites.filter(w => w.status === 'offline').length;

  // Összes Kezelt Adattípus
  const totalDataTypes = systems.length;
  
  // Megfelelőségi szinthez
  const activeSystemsCount = systems.filter(s => s.status === 'active').length;
  const inactiveSystemsCount = systems.length - activeSystemsCount - pendingSystems; 
  const complianceScore = systems.length === 0 ? 100 : Math.round(((systems.length - pendingSystems) / systems.length) * 100);

  return (
    <div className="w-full h-full flex flex-col space-y-8 font-sans">
      <RealtimeRefresher />
      
      {/* === FEJLÉC ÉS ÚJ RENDSZER GOMB === */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-6 border-b border-slate-200/80">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 tracking-tight">Irányítópult</h1>
          <p className="text-[14px] text-slate-500 mt-2 font-medium">
            Összesített áttekintés az összekapcsolt rendszerekről és tájékoztatók frissítési állapotáról.
          </p>
        </div>
        <AddConnectionDialog addAction={addConnection} />
      </header>

      {/* === KPI KÁRTYÁK (Valós adatokkal) === */}
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 w-full">
        
        {/* MEGFELELŐSÉGI SZINT */}
        <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.03)] flex flex-col justify-between hover:shadow-[0_8px_24px_rgba(0,0,0,0.06)] transition-all">
          <div>
            <div className="text-[11px] font-bold text-slate-400 mb-4 uppercase tracking-widest">Megfelelőségi szint</div>
            <div className="flex items-end gap-3 mb-3">
              <span className={`text-5xl font-black tracking-tighter ${complianceScore < 100 ? 'text-amber-500' : 'text-emerald-500'}`}>
                {complianceScore}%
              </span>
              <span className={`text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-md mb-2 ${complianceScore < 100 ? 'text-amber-700 bg-amber-50' : 'text-emerald-700 bg-emerald-50'}`}>
                {complianceScore < 100 ? 'Figyelmet igényel' : 'Stabil'}
              </span>
            </div>
            <p className="text-[13px] text-slate-500 leading-relaxed font-medium">
              {pendingSystems > 0 
                ? `${pendingSystems} figyelmet igénylő adatkezelés (új süti) jóváhagyásra vár.`
                : 'Minden ismert adatkezelés szerepel a tájékoztatókban.'}
            </p>
          </div>
        </div>

                {/* ÖSSZEKAPCSOLT RENDSZEREK / HONLAPOK */}
        <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.03)] flex flex-col justify-between hover:shadow-[0_8px_24px_rgba(0,0,0,0.06)] transition-all">
          <div>
            <div className="text-[11px] font-bold text-slate-400 mb-4 uppercase tracking-widest">Rendszerek / honlapok</div>
            <div className="text-5xl font-black text-slate-800 tracking-tighter mb-4">
              {totalSources}<span className="text-lg text-slate-400 font-bold ml-1.5">db</span>
            </div>
            <div className="space-y-2 mt-auto">
              <div className="flex justify-between items-center text-[13px] border-b border-slate-100 pb-2">
                <span className="text-slate-600 font-medium">Weboldalak / Domének</span>
                <span className="font-bold text-emerald-600">{webDomainCount} db</span>
              </div>
              <div className="flex justify-between items-center text-[13px] pt-1">
                <span className="text-slate-500 font-medium">Offline rendszerek</span>
                <span className="font-bold text-slate-400">{offlineSystemCount} db</span>
              </div>
            </div>
          </div>
        </div>

        {/* KEZELT ADATTÍPUSOK */}
        <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.03)] flex flex-col justify-between hover:shadow-[0_8px_24px_rgba(0,0,0,0.06)] transition-all">
          <div>
            <div className="text-[11px] font-bold text-slate-400 mb-4 uppercase tracking-widest">Kezelt Adattípusok</div>
            <div className="text-5xl font-black text-slate-800 tracking-tighter mb-3">
              {totalDataTypes}<span className="text-lg text-slate-400 font-bold ml-1.5">db</span>
            </div>
            <p className="text-[13px] text-slate-500 leading-relaxed font-medium">
              A bekötött forrásokon összesen {totalDataTypes} db eltérő adatkezelési folyamat és adattípus van jelenleg rögzítve.
            </p>
          </div>
        </div>

        {/* GYORSMŰVELET */}
        <div className="bg-gradient-to-br from-white to-slate-50 rounded-2xl p-6 border border-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.03)] flex flex-col justify-between">
          <div>
            <div className="text-[11px] font-bold text-slate-400 mb-4 uppercase tracking-widest">Gyorsművelet</div>
            <p className="text-[13px] text-slate-600 leading-relaxed mb-6 font-medium">
              Indítsa el az összes bekötött weboldal tájékoztatójának szinkronizálását.
            </p>
          </div>
          <Button variant="outline" className="w-full bg-white hover:bg-slate-50 border-slate-200 text-slate-700 font-semibold h-11 shadow-sm">
            Összes frissítése
          </Button>
        </div>

      </section>

           {/* === SZÉLES LISTANÉZET (Valós Weboldalak Listája) === */}
      <section className="pt-6 w-full flex-1">
        <h2 className="text-[15px] font-bold text-slate-800 mb-4">Bekötött Weboldalak és Rendszerek Állapota</h2>
        
        <div className="bg-white rounded-2xl border border-slate-100 shadow-[0_4px_20px_rgba(0,0,0,0.02)] overflow-hidden w-full overflow-x-auto">
          {/* Táblázat Fejléc (Megváltozott oszlopnevek és felosztás) */}
          <div className="min-w-[800px] grid grid-cols-12 gap-4 p-4 border-b border-slate-100 bg-slate-50/50 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
            <div className="col-span-3 pl-4">Rendszer / Weboldal</div>
            <div className="col-span-3">Dátumok (Hozzáadva / Utolsó scan)</div>
            <div className="col-span-2 text-center">Tájékoztató Verzió</div>
            <div className="col-span-2 text-center">Kezelt Adattípusok</div>
            <div className="col-span-2 text-right pr-4">Státusz</div>
          </div>
          
          {/* Táblázat Sorok */}
          <div className="min-w-[800px] divide-y divide-slate-50">
            {websites.length === 0 ? (
              <div className="p-8 text-center text-slate-500 text-sm font-medium">
                Még nincs bekötve egyetlen forrás sem. Kattints a zöld gombra fent!
              </div>
            ) : (
              websites.map((site) => {
                // Rendszerek leszűrése ehhez a weboldalhoz
                const siteSystems = systems.filter(s => s.website_id === site.id);
                
                const totalSystemsCount = siteSystems.length;
                const pendingSystemsCount = siteSystems.filter(s => s.status === 'pending').length;
                
                                // --- VALÓS MATEK A SZKENNELT/MANUÁLIS ADATOKHOZ ---
                // Most már az adatbázisból pontosan tudjuk az új 'source_type' oszlop alapján!
                const manualCount = siteSystems.filter(s => s.source_type === 'manual').length;
                const scannedCount = siteSystems.filter(s => s.source_type === 'scanned').length;
                
                // URL és Név formázása
                const isOffline = site.status === 'offline';
                const displayName = isOffline ? site.url : site.url.replace(/^https?:\/\//, '');
                const rawUrl = isOffline ? null : site.url;

                // Verziószám és Dátumok (Jelenleg statikus / placeholderek a hiányzó adatbázismezőkhöz)
                // Hogy valós legyen: adj 'last_scanned_at' és 'policy_version' oszlopokat a websites táblához!
                const lastScanned = site.updated_at ? formatDate(site.updated_at) : 'Még nem volt';
                const policyVersion = site.policy_version || 'N/A'; // Ha nincs ilyen mező, N/A lesz

                return (
                  <div key={site.id} className="grid grid-cols-12 gap-4 p-5 items-center hover:bg-slate-50/80 transition-colors group relative">
                    
                    {/* 1. Oszlop: Rendszer Név és Kattintható URL */}
                    <div className="col-span-3 pl-4">
                      <div className="font-bold text-[14px] text-slate-800 flex items-center gap-2 truncate">
                        <span className="truncate">{displayName}</span>
                        {pendingSystemsCount > 0 && (
                          <span className="shrink-0 w-2 h-2 rounded-full bg-amber-500 animate-pulse" title={`${pendingSystemsCount} új, jóváhagyásra váró adattípus!`}></span>
                        )}
                      </div>
                      <div className="text-[12px] text-slate-500 font-medium truncate mt-0.5">
                        {rawUrl ? (
                          <a href={rawUrl} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:text-blue-700 hover:underline flex items-center gap-1">
                            {rawUrl}
                            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>
                          </a>
                        ) : (
                          "Offline / Belső hálózat"
                        )}
                      </div>
                    </div>
                    
                                        {/* 2. Oszlop: Hozzáadva és Utolsó Szkennelés */}
                    <div className="col-span-3 flex flex-col justify-center">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest w-[84px]">Hozzáadva</span>
                        <div className="h-3 w-[1px] bg-slate-200"></div>
                        <span className="text-[13px] font-medium text-slate-700">{formatDate(site.created_at)}</span>
                      </div>
                      <div className="flex items-center gap-2 mt-1.5">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest w-[84px]">Utolsó Scan</span>
                        <div className="h-3 w-[1px] bg-slate-200"></div>
                        <span className="text-[13px] font-medium text-slate-500">{lastScanned}</span>
                      </div>
                    </div>

                    {/* 3. Oszlop: Tájékoztató Verziószáma */}
                    <div className="col-span-2 flex flex-col items-center justify-center">
                      {policyVersion === 'N/A' ? (
                        <span className="px-3 py-1.5 bg-slate-50 text-slate-400 border border-slate-100 text-[11px] font-bold rounded-md">N/A</span>
                      ) : (
                        <div className="flex flex-col items-center">
                          <span className="text-[14px] font-black text-slate-800">v{policyVersion}</span>
                          <span className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">Aktuális verzió</span>
                        </div>
                      )}
                    </div>

                                        {/* 4. Oszlop: Kezelt Adattípusok (Kattintható linkkel, ami szűr!) */}
                    <Link 
                      href={`/systems?source=${site.id}`} 
                      className="col-span-2 flex flex-col justify-center items-center hover:bg-slate-100/60 p-2 rounded-xl transition-colors cursor-pointer group/link"
                      title={`Kattints ide a(z) ${displayName} forráshoz tartozó adatok megtekintéséhez`}
                    >
                      <div className="text-[14px] font-bold text-slate-800 mb-1.5 group-hover/link:text-emerald-600 transition-colors">
                        {totalSystemsCount} <span className="text-[12px] text-slate-500 font-medium ml-0.5 group-hover/link:text-emerald-600/70">db összesen</span>
                      </div>
                      <div className="flex items-center gap-2 text-[11px] font-bold">
                        <span 
                          className="flex items-center gap-1.5 text-blue-600 bg-blue-50/80 border border-blue-100 px-2 py-0.5 rounded-md" 
                          title="Szkennelt/Automatikus adatok"
                        >
                          <Search size={12} strokeWidth={2.5} /> {scannedCount}
                        </span>
                        <span 
                          className="flex items-center gap-1.5 text-amber-600 bg-amber-50/80 border border-amber-100 px-2 py-0.5 rounded-md" 
                          title="Manuálisan rögzített adatok"
                        >
                          <PenLine size={12} strokeWidth={2.5} /> {manualCount}
                        </span>
                      </div>
                    </Link>
                    
                    {/* 5. Oszlop: Státusz és Lebegő Törlés Gomb */}
                    <div className="col-span-2 flex items-center justify-end pr-4">
                      <div className="w-[120px] flex items-center justify-end relative">
                        {/* Státusz jelző */}
                        {site.status === 'scanning' ? (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-50 text-blue-700 text-[11px] font-bold shadow-sm transition-opacity group-hover:opacity-0 w-full justify-center">
                            <span className="w-3 h-3 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></span> Szkennelés
                          </span>
                        ) : isOffline ? (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 text-slate-600 text-[11px] font-bold shadow-sm transition-opacity group-hover:opacity-0 w-full justify-center">
                            <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span> Belső hálózat
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 text-[11px] font-bold shadow-sm transition-opacity group-hover:opacity-0 w-full justify-center">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Ellenőrzött
                          </span>
                        )}

                        {/* Lebegő Törlés Gomb (Csak Hover esetén látszik) */}
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute inset-0 flex items-center justify-end">
                          <DeleteConfirmDialog 
                            id={site.id} 
                            systemName={site.url} 
                            deleteAction={deleteWebsite} 
                          />
                        </div>
                      </div>
                    </div>

                  </div>
                );
              })
            )}
          </div>
        </div>
      </section>
      
    </div>
  );
}