import { createClient } from "@/utils/supabase/server";
import { Search, PenLine } from "lucide-react";

// --- ACTIONS ---
import { addConnection, deleteWebsite, refreshAllPolicies, rescanWebsite } from "./actions";
import Link from "next/link";

// --- COMPONENTS ---
import { AddConnectionDialog } from "@/components/add-connection-dialog";
import { DeleteConfirmDialog } from "@/components/delete-confirm-dialog";
import { RealtimeRefresher } from '@/components/realtime-refresher';
import { RescanDialog } from '@/components/rescan-dialog';

function formatDate(dateString: string | null) {
  if (!dateString) return "Még nem generált";
  return new Intl.DateTimeFormat('hu-HU', {
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit'
  }).format(new Date(dateString));
}

type ComplianceState = 'noConnection' | 'noDocument' | 'pending' | 'ok';

export default async function Home() {
  // 1. BEJELENTKEZÉS
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // 2. CÉG LEKÉRDEZÉSE
  let companyId: string | null = null;
  if (user) {
    const { data: company } = await supabase
      .from('companies').select('id').eq('user_id', user.id).single();
    if (company) companyId = company.id;
  }

  // 3. VALÓS ADATOK LEKÉRDEZÉSE
  let websites: any[] = [];
  let systems: any[] = [];
  let pendingSystems = 0;

  if (companyId) {
    const { data: webData } = await supabase
      .from('websites').select('*').eq('company_id', companyId)
      .order('created_at', { ascending: false });
    if (webData) websites = webData;

    if (websites.length > 0) {
      const websiteIds = websites.map(w => w.id);
      const { data: sysData } = await supabase
        .from('systems').select('*').in('website_id', websiteIds);
      if (sysData) {
        systems = sysData;
        pendingSystems = systems.filter(s => s.status === 'pending').length;
      }
    }
  }

  // POLICIES LEKÉRDEZÉSE
  const policyResult = companyId && websites.length > 0
    ? await supabase
        .from('policies')
        .select('id', { count: 'exact', head: true })
        .in('website_id', websites.map(w => w.id))
    : { count: 0 };

  const hasGeneratedPolicy = (policyResult.count ?? 0) > 0;

  // 4. STATISZTIKÁK
  const totalSources = websites.length;
  const webDomainCount = websites.filter(w => w.status !== 'offline').length;
  const offlineSystemCount = websites.filter(w => w.status === 'offline').length;
  const totalDataTypes = systems.length;
  const activeSystemsCount = systems.filter(s => s.status === 'active').length;
  const inactiveSystemsCount = systems.length - activeSystemsCount - pendingSystems;

  const complianceState: ComplianceState =
    websites.length === 0
      ? 'noConnection'
      : !hasGeneratedPolicy
      ? 'noDocument'
      : pendingSystems > 0
      ? 'pending'
      : 'ok';

  const complianceScore = systems.length === 0
    ? null
    : Math.round(((systems.length - pendingSystems) / systems.length) * 100);

  return (
    <div className="w-full h-full flex flex-col space-y-8 font-sans">
      <RealtimeRefresher />

      {/* === FEJLÉC === */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-6 border-b border-slate-200/80">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 tracking-tight">Irányítópult</h1>
          <p className="text-[14px] text-slate-500 mt-2 font-medium">
            Összesített áttekintés az összekapcsolt rendszerekről és tájékoztatók frissítési állapotáról.
          </p>
        </div>
        <AddConnectionDialog addAction={addConnection} />
      </header>

      {/* === KPI KÁRTYÁK === */}
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 w-full">

        {/* MEGFELELŐSÉGI SZINT */}
        <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.03)] flex flex-col justify-between hover:shadow-[0_8px_24px_rgba(0,0,0,0.06)] transition-all">
          <div>
            <div className="text-[11px] font-bold text-slate-400 mb-4 uppercase tracking-widest">Megfelelőségi szint</div>

            {complianceState === 'noConnection' ? (
              <>
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-[15px] font-black text-slate-400">—</span>
                  <span className="text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-md text-slate-500 bg-slate-100">
                    Inaktív
                  </span>
                </div>
                <p className="text-[13px] text-slate-400 leading-relaxed font-medium">
                  Nincs aktív kapcsolat. Adjon hozzá legalább egy weboldalt vagy rendszert.
                </p>
              </>
            ) : complianceState === 'noDocument' ? (
              <>
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-[15px] font-black text-amber-400">—</span>
                  <span className="text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-md text-amber-700 bg-amber-50">
                    Hiányzó dokumentum
                  </span>
                </div>
                <p className="text-[13px] text-slate-500 leading-relaxed font-medium">
                  Nincs generált dokumentum. Hozz létre tájékoztatót a Tájékoztatók oldalon.
                </p>
              </>
            ) : (
              <>
                <div className="flex items-end gap-3 mb-3">
                  <span className={`text-5xl font-black tracking-tighter ${complianceScore! < 100 ? 'text-amber-500' : 'text-emerald-500'}`}>
                    {complianceScore}%
                  </span>
                  <span className={`text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-md mb-2 ${complianceScore! < 100 ? 'text-amber-700 bg-amber-50' : 'text-emerald-700 bg-emerald-50'}`}>
                    {complianceScore! < 100 ? 'Figyelmet igényel' : 'Stabil'}
                  </span>
                </div>
                <p className="text-[13px] text-slate-500 leading-relaxed font-medium">
                  {pendingSystems > 0
                    ? `${pendingSystems} figyelmet igénylő adatkezelés (új süti) függőben vár.`
                    : 'Minden ismert adatkezelés szerepel a tájékoztatókban.'}
                </p>
              </>
            )}
          </div>
        </div>

        {/* RENDSZEREK / HONLAPOK */}
        <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.03)] flex flex-col justify-between hover:shadow-[0_8px_24px_rgba(0,0,0,0.06)] transition-all">
          <div>
            <div className="text-[11px] font-bold text-slate-400 mb-4 uppercase tracking-widest">Rendszerek / honlapok</div>
            <div className="text-5xl font-black text-slate-800 tracking-tighter mb-4">
              {totalSources}<span className="text-lg text-slate-400 font-bold ml-1.5">db</span>
            </div>
            <div className="space-y-2 mt-auto">
              <div className="flex justify-between items-center text-[13px] border-b border-slate-100 pb-2">
                <span className="text-slate-600 font-medium">Weboldalak / Rendszerek</span>
                <span className="font-bold text-emerald-600">{webDomainCount} db</span>
              </div>
              <div className="flex justify-between items-center text-[13px] pt-1">
                <span className="text-slate-500 font-medium">Belső (offline) rendszerek</span>
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
            <p className="text-[13px] text-slate-600 leading-relaxed mb-4 font-medium">
              Scannelje újra valamelyik weboldalt, vagy frissítse az összes tájékoztatót.
            </p>
          </div>
          <div className="flex flex-col gap-2">
            <RescanDialog websites={websites} rescanAction={rescanWebsite} />
            <form action={refreshAllPolicies}>
              <button
                type="submit"
                className="w-full bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-semibold h-11 shadow-sm rounded-xl text-[13px] transition-colors"
              >
                Dokumentumok frissítése
              </button>
            </form>
          </div>
        </div>

      </section>

      {/* === LISTA NÉZET === */}
      <section className="pt-6 w-full flex-1">
        <h2 className="text-[15px] font-bold text-slate-800 mb-4">Bekötött Weboldalak, Rendszerek és Állapotuk</h2>

        <div className="bg-white rounded-2xl border border-slate-100 shadow-[0_4px_20px_rgba(0,0,0,0.02)] overflow-hidden w-full overflow-x-auto">
          <div className="min-w-[800px] grid grid-cols-12 gap-4 p-4 border-b border-slate-100 bg-slate-50/50 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
            <div className="col-span-3 pl-4">Rendszer / Weboldal</div>
            <div className="col-span-3">Dátumok (Hozzáadva / Utolsó scan)</div>
            <div className="col-span-2 text-center">Tájékoztató Verzió</div>
            <div className="col-span-2 text-center">Kezelt Adattípusok</div>
            <div className="col-span-2 text-right pr-4">Státusz/Műveletek</div>
          </div>

          <div className="min-w-[800px] divide-y divide-slate-50">
            {websites.length === 0 ? (
              <div className="p-8 text-center text-slate-500 text-sm font-medium">
                Még nincs bekötve egyetlen forrás sem. Kattintson az új kapcsolat hozzáadása gombra!
              </div>
            ) : (
              websites.map((site) => {
                const siteSystems = systems.filter(s => s.website_id === site.id);
                const totalSystemsCount = siteSystems.length;
                const pendingSystemsCount = siteSystems.filter(s => s.status === 'pending').length;
                const manualCount = siteSystems.filter(s => s.source_type === 'manual').length;
                const scannedCount = siteSystems.filter(s => s.source_type === 'scanned').length;
                const isOffline = site.status === 'offline';
                const displayName = isOffline ? site.url : site.url.replace(/^https?:\/\//, '');
                const rawUrl = isOffline ? null : site.url;
                const lastScanned = site.updated_at ? formatDate(site.updated_at) : 'Még nem volt';
                const policyVersion = site.policy_version || 'N/A';

                return (
                  <div key={site.id} className="grid grid-cols-12 gap-4 p-5 items-center hover:bg-slate-50/80 transition-colors group relative">

                    {/* 1. Rendszer Név */}
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

                    {/* 2. Dátumok */}
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

                    {/* 3. Tájékoztató Verzió */}
                    <div className="col-span-2 flex flex-col items-center justify-center">
                      {policyVersion === 'N/A' ? (
                        <Link
                          href="/policies"
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-50 text-red-600 border border-red-200 text-[11px] font-bold rounded-md shadow-sm hover:bg-red-100 transition-colors"
                        >
                          <span className="text-red-500 font-black text-[13px] leading-none">!</span>
                          Nincs dokumentum
                        </Link>
                      ) : (
                        <div className="flex flex-col items-center">
                          <span className="text-[14px] font-black text-slate-800">v{policyVersion}</span>
                          <span className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">Aktuális verzió</span>
                        </div>
                      )}
                    </div>

                    {/* 4. Kezelt Adattípusok */}
                    <Link
                      href={`/systems?source=${site.id}`}
                      className="col-span-2 flex flex-col justify-center items-center hover:bg-slate-100/60 p-2 rounded-xl transition-colors cursor-pointer group/link"
                      title={`Kattints ide a(z) ${displayName} forráshoz tartozó adatok megtekintéséhez`}
                    >
                      <div className="text-[14px] font-bold text-slate-800 mb-1.5 group-hover/link:text-emerald-600 transition-colors">
                        {totalSystemsCount} <span className="text-[12px] text-slate-500 font-medium ml-0.5 group-hover/link:text-emerald-600/70">db összesen</span>
                      </div>
                      <div className="flex items-center gap-2 text-[11px] font-bold">
                        <span className="flex items-center gap-1.5 text-blue-600 bg-blue-50/80 border border-blue-100 px-2 py-0.5 rounded-md" title="Szkennelt/Automatikus adatok">
                          <Search size={12} strokeWidth={2.5} /> {scannedCount}
                        </span>
                        <span className="flex items-center gap-1.5 text-amber-600 bg-amber-50/80 border border-amber-100 px-2 py-0.5 rounded-md" title="Manuálisan rögzített adatok">
                          <PenLine size={12} strokeWidth={2.5} /> {manualCount}
                        </span>
                      </div>
                    </Link>

                    {/* 5. Státusz + Törlés */}
                    <div className="col-span-2 flex items-center justify-end pr-4">
                      <div className="w-[120px] flex items-center justify-end relative">
                        {site.status === 'scanning' ? (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-50 text-blue-700 text-[11px] font-bold shadow-sm transition-opacity group-hover:opacity-0 w-full justify-center">
                            <span className="w-3 h-3 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></span> Szkennelés
                          </span>
                        ) : isOffline ? (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 text-slate-600 text-[11px] font-bold shadow-sm transition-opacity group-hover:opacity-0 w-full justify-center">
                            <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span> Belső hálózat
                          </span>
                        ) : pendingSystemsCount > 0 ? (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-50 text-amber-700 text-[11px] font-bold shadow-sm transition-opacity group-hover:opacity-0 w-full justify-center">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span> Függőben
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 text-[11px] font-bold shadow-sm transition-opacity group-hover:opacity-0 w-full justify-center">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Ellenőrzött
                          </span>
                        )}
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute inset-0 flex items-center justify-end">
                          <DeleteConfirmDialog
                            id={site.id}
                            systemName={site.url}
                            websiteId={site.id}
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