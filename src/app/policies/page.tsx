import { createClient } from "@/utils/supabase/server";
import { generatePolicy, deletePolicy, restorePolicy } from "@/app/actions";
import { FileText, Clock, Plus, Filter, RotateCcw, RefreshCw, Trash2 } from "lucide-react";

function formatDate(d: string | null) {
  if (!d) return "—";
  return new Intl.DateTimeFormat('hu-HU', {
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit'
  }).format(new Date(d));
}

export default async function PoliciesPage({
  searchParams,
}: {
  searchParams: Promise<{ site?: string; show?: string }>;
}) {
  const params = await searchParams;
  const filterSite = params.site || 'all';
  const showArchived = params.show === 'archived';

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  let policies: any[] = [];
  let websites: any[] = [];

  if (user) {
    const { data: company } = await supabase
      .from('companies').select('id').eq('user_id', user.id).single();

    if (company) {
      const { data: webData } = await supabase
        .from('websites').select('*').eq('company_id', company.id)
        .neq('status', 'scanning');
      if (webData) websites = webData;

      if (websites.length > 0) {
        const websiteIds = websites.map(w => w.id);
        const { data: polData } = await supabase
          .from('policies').select('*')
          .in('website_id', websiteIds)
          .order('valid_from', { ascending: false });
        if (polData) policies = polData;
      }
    }
  }

  // Szűrés
  const filteredPolicies = filterSite === 'all'
    ? policies
    : policies.filter(p => p.website_id === filterSite);

  const currentPolicies = filteredPolicies.filter(p => p.status === 'current');
  const archivedPolicies = filteredPolicies.filter(p => p.status === 'archived');

  function getSiteName(websiteId: string) {
    const w = websites.find(x => x.id === websiteId);
    if (!w) return 'Ismeretlen';
    return w.status === 'offline' ? w.url : w.url.replace(/^https?:\/\//, '');
  }

  return (
    <div className="w-full space-y-8 font-sans">

      {/* FEJLÉC */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-6 border-b border-slate-200/80">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 tracking-tight">Adatkezelési Tájékoztatók</h1>
          <p className="text-[14px] text-slate-500 mt-2 font-medium">
            Automatikusan generált, verziózott GDPR tájékoztatók a bekötött rendszerekhez.
          </p>
        </div>

        {websites.length > 0 && (
          <form action={generatePolicy} className="flex items-center gap-3">
            <select
              name="websiteId"
              className="px-4 py-2.5 border border-slate-200 rounded-xl text-[13px] font-semibold text-slate-700 bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none"
            >
              {websites.map(w => (
                <option key={w.id} value={w.id}>
                  {w.status === 'offline' ? w.url : w.url.replace(/^https?:\/\//, '')}
                </option>
              ))}
            </select>
            <button
              type="submit"
              className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-[13px] font-bold rounded-xl transition-colors"
            >
              <Plus size={15} />
              Új tájékoztató generálása
            </button>
          </form>
        )}
      </header>

      {/* SZŰRŐ SÁV */}
      {websites.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-400 uppercase tracking-widest mr-2">
            <Filter size={12} /> Szűrés
          </div>
          <a
            href="/policies"
            className={`px-3 py-1.5 rounded-lg text-[12px] font-bold border transition-colors ${
              filterSite === 'all'
                ? 'bg-slate-800 text-white border-slate-800'
                : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
            }`}
          >
            Összes
          </a>
          {websites.map(w => {
            const name = w.status === 'offline' ? w.url : w.url.replace(/^https?:\/\//, '');
            const active = filterSite === w.id;
            return (
              <a
                key={w.id}
                href={`/policies?site=${w.id}${showArchived ? '&show=archived' : ''}`}
                className={`px-3 py-1.5 rounded-lg text-[12px] font-bold border transition-colors ${
                  active
                    ? 'bg-emerald-600 text-white border-emerald-600'
                    : 'bg-white text-slate-600 border-slate-200 hover:border-emerald-300 hover:text-emerald-700'
                }`}
              >
                {name}
              </a>
            );
          })}

          {/* Archivált toggle */}
          <a
            href={showArchived
              ? `/policies${filterSite !== 'all' ? `?site=${filterSite}` : ''}`
              : `/policies?${filterSite !== 'all' ? `site=${filterSite}&` : ''}show=archived`
            }
            className={`ml-auto flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-bold border transition-colors ${
              showArchived
                ? 'bg-amber-50 text-amber-700 border-amber-200'
                : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300'
            }`}
          >
            <Clock size={12} />
            {showArchived ? 'Archiváltak elrejtése' : 'Archiváltak mutatása'}
          </a>
        </div>
      )}

      {/* ÜRES ÁLLAPOT */}
      {policies.length === 0 && (
        <div className="bg-white rounded-2xl border border-slate-100 p-16 text-center shadow-sm">
          <div className="w-16 h-16 rounded-full bg-slate-50 flex items-center justify-center mx-auto mb-4 border border-slate-100">
            <FileText className="text-slate-300" size={28} />
          </div>
          <h3 className="text-lg font-bold text-slate-700 mb-2">Még nincs generált tájékoztató</h3>
          <p className="text-[14px] text-slate-500 max-w-md mx-auto">
            Válassz ki egy forrást fent, és kattints az „Új tájékoztató generálása" gombra.
          </p>
        </div>
      )}

      {/* AKTUÁLIS TÁJÉKOZTATÓK */}
      {currentPolicies.length > 0 && (
        <section className="space-y-4">
          <h2 className="text-[13px] font-bold text-slate-400 uppercase tracking-widest">Aktuális verziók</h2>
          {currentPolicies.map(policy => {
            const siteName = getSiteName(policy.website_id);
            return (
              <div key={policy.id} className="bg-white rounded-2xl border border-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.03)] overflow-hidden">
                <div className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center border border-emerald-100 shrink-0">
                      <FileText size={18} className="text-emerald-600" />
                    </div>
                    <div>
                      <div className="font-bold text-[15px] text-slate-800">{siteName}</div>
                      <div className="flex items-center gap-3 mt-1 flex-wrap">
                        <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-100 px-2.5 py-0.5 rounded-md">
                          v{policy.version}
                        </span>
                        <span className="text-[12px] text-slate-500 flex items-center gap-1">
                          <Clock size={11} /> Hatályos: {formatDate(policy.valid_from)}-tól
                        </span>
                        <span className="text-[11px] font-bold text-emerald-600">● Naprakész</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap justify-end">
                    <a
                      href={`/policies/${policy.id}`}
                      className="flex items-center gap-1.5 px-3 py-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg text-[12px] font-bold text-slate-700 transition-colors"
                    >
                      <FileText size={13} /> Megtekintés
                    </a>
                    <form action={generatePolicy}>
                      <input type="hidden" name="websiteId" value={policy.website_id} />
                      <button
                        type="submit"
                        className="flex items-center gap-1.5 px-3 py-2 bg-slate-50 hover:bg-amber-50 hover:text-amber-700 hover:border-amber-200 border border-slate-200 rounded-lg text-[12px] font-bold text-slate-700 transition-colors"
                      >
                        <RefreshCw size={13} /> Frissítés
                      </button>
                    </form>
                    <form action={deletePolicy}>
                      <input type="hidden" name="id" value={policy.id} />
                      <button
                        type="submit"
                        className="flex items-center gap-1.5 px-3 py-2 bg-slate-50 hover:bg-red-50 hover:text-red-600 hover:border-red-200 border border-slate-200 rounded-lg text-[12px] font-bold text-slate-600 transition-colors"
                      >
                        <Trash2 size={13} /> Törlés
                      </button>
                    </form>
                  </div>
                </div>
              </div>
            );
          })}
        </section>
      )}

      {/* ARCHIVÁLT VERZIÓK */}
      {showArchived && archivedPolicies.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-[13px] font-bold text-slate-400 uppercase tracking-widest">Archivált verziók</h2>
          <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-100">
                <tr>
                  <th className="px-5 py-3 text-left text-[11px] font-bold text-slate-400 uppercase tracking-widest">Forrás</th>
                  <th className="px-5 py-3 text-left text-[11px] font-bold text-slate-400 uppercase tracking-widest">Verzió</th>
                  <th className="px-5 py-3 text-left text-[11px] font-bold text-slate-400 uppercase tracking-widest">Érvényesség</th>
                  <th className="px-5 py-3 text-right text-[11px] font-bold text-slate-400 uppercase tracking-widest">Műveletek</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {archivedPolicies.map(policy => (
                  <tr key={policy.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="px-5 py-3 font-medium text-slate-700">{getSiteName(policy.website_id)}</td>
                    <td className="px-5 py-3">
                      <span className="text-[11px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">v{policy.version}</span>
                    </td>
                    <td className="px-5 py-3 text-slate-500 text-[13px]">
                      {formatDate(policy.valid_from)} – {formatDate(policy.valid_to)}
                    </td>
                    <td className="px-5 py-3 text-right flex items-center justify-end gap-2">
                      <a
                        href={`/policies/${policy.id}`}
                        className="text-blue-600 hover:underline text-[12px] font-semibold"
                      >
                        Megnyitás
                      </a>
                      <form action={restorePolicy}>
                        <input type="hidden" name="id" value={policy.id} />
                        <button
                          type="submit"
                          className="flex items-center gap-1 text-[12px] font-bold text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 px-2.5 py-1 rounded-lg transition-colors"
                        >
                          <RotateCcw size={11} /> Visszaállítás
                        </button>
                      </form>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {showArchived && archivedPolicies.length === 0 && policies.length > 0 && (
        <div className="text-center py-8 text-[14px] text-slate-400 font-medium">
          Nincsenek archivált verziók ehhez a szűrőhöz.
        </div>
      )}

    </div>
  );
}