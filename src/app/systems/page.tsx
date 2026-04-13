import { Search } from 'lucide-react'
import { createClient } from '@/utils/supabase/server'
import Link from 'next/link'
import { addManualSystem, deleteSystem } from '@/app/actions'
import { AddManualSystemDialog } from '@/components/add-manual-system-dialog'
import { DeleteConfirmDialog } from '@/components/delete-confirm-dialog'
import { SearchBar } from '@/components/search-bar'
import { AcceptAllButton } from '@/components/accept-all-button'
import { SourceTypeFilter } from '@/components/source-type-filter'
import { AcceptSystemButton } from '@/components/accept-system-button'
import {
  PenLine, ScanSearch, Tag, Database,
  Globe, CheckCircle2,
} from 'lucide-react'

export default async function SystemsPage(props: {
  searchParams: Promise<{ filter?: string; q?: string; source?: string; source_type?: string }>
}) {
  const searchParams  = await props.searchParams
  const currentFilter = searchParams.filter      || 'all'
  const searchQuery   = searchParams.q           || ''
  const sourceId      = searchParams.source      || ''
  const sourceType    = searchParams.source_type || 'all'

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  let systems: any[]  = []
  let websites: any[] = []
  let pendingCount    = 0

  if (user) {
    const { data: company } = await supabase
      .from('companies').select('id').eq('user_id', user.id).single()

    if (company) {
      const { data: webData } = await supabase
        .from('websites').select('*')
        .eq('company_id', company.id)
        .order('created_at', { ascending: false })

      if (webData && webData.length > 0) {
        websites = webData
        const websiteIds = webData.map((w) => w.id)

        const { count } = await supabase
          .from('systems')
          .select('*', { count: 'exact', head: true })
          .in('website_id', websiteIds)
          .eq('status', 'pending')
        pendingCount = count ?? 0

        let query = supabase
          .from('systems').select('*')
          .in('website_id', websiteIds)
          .order('created_at', { ascending: false })

        if (currentFilter !== 'all')  query = query.eq('status', currentFilter)
        if (sourceId)                 query = query.eq('website_id', sourceId)
        if (sourceType !== 'all')     query = query.eq('source_type', sourceType)
        if (searchQuery) {
          query = query.or(
            `system_name.ilike.%${searchQuery}%,purpose.ilike.%${searchQuery}%,collected_data.ilike.%${searchQuery}%`
          )
        }

        const { data: sysData } = await query
        if (sysData) systems = sysData
      }
    }
  }

  return (
    <div className="w-full h-full flex flex-col space-y-8 font-sans">

      {/* FEJLÉC */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-6 border-b border-slate-200/80">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 tracking-tight">Kezelt adattípusok</h1>
          <p className="text-[14px] text-slate-500 mt-2 font-medium">
            A rendszerek és weboldalak által gyűjtött és feldolgozott konkrét adatok listája.
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          {/* ÁLLAPOT SZŰRŐ */}
          <div className="flex bg-slate-100/80 p-1 rounded-lg border border-slate-200/60">
            {(['all', 'active', 'pending'] as const).map((f) => (
              <Link
                key={f}
                href={`/systems?filter=${f}${searchQuery ? `&q=${searchQuery}` : ''}${sourceType !== 'all' ? `&source_type=${sourceType}` : ''}`}
                className={`px-3 py-1.5 text-[13px] font-bold rounded-md transition-all ${
                  currentFilter === f ? 'bg-white shadow-sm text-slate-800' : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                {f === 'all' ? 'Összes' : f === 'active' ? 'Elfogadva' : 'Függőben'}
              </Link>
            ))}
          </div>

          <SourceTypeFilter />
          <AddManualSystemDialog addAction={addManualSystem} existingSystems={websites} />
        </div>
      </header>

      <section className="bg-white rounded-2xl border border-slate-100 shadow-[0_4px_20px_rgba(0,0,0,0.02)] overflow-hidden w-full flex-1">

        {/* KERESŐ SÁV */}
        <div className="p-4 border-b border-slate-100 flex items-center gap-3 bg-slate-50/30">
          <SearchBar defaultValue={searchQuery} />
          <div className="ml-auto shrink-0">
            <AcceptAllButton pendingCount={pendingCount} />
          </div>
        </div>

        {/* Táblázat fejléc – ikonokkal */}
        <div className="grid grid-cols-[2rem_280px_200px_160px_160px_7rem] gap-4 px-5 py-4 border-b border-slate-100 bg-slate-50/80 text-[11px] font-bold text-slate-400 uppercase tracking-widest">
          <div />
          <div className="flex items-center gap-1.5">
            <Tag size={11} />
            Adattípus neve / Kategória
          </div>
          <div className="flex items-center gap-1.5">
            <Database size={11} />
            Kezelt adatok
          </div>
          <div className="flex items-center gap-1.5">
            <Globe size={11} />
            Forrás
          </div>
          <div className="flex items-center gap-1.5">
            <CheckCircle2 size={11} />
            Státusz
          </div>
          <div className="text-right pr-4">Műveletek</div>
        </div>

        {/* Sorok */}
        <div className="divide-y divide-slate-50">
          {systems.length === 0 ? (
            <div className="p-12 text-center flex flex-col items-center justify-center">
              <div className="w-16 h-16 rounded-full bg-slate-50 flex items-center justify-center mb-4">
                <Search className="text-slate-300" size={24} />
              </div>
              <h3 className="text-lg font-bold text-slate-700 mb-1">Nincs találat</h3>
              <p className="text-sm text-slate-500 max-w-md mx-auto">
                {searchQuery
                  ? `Nem találtunk eredményt a(z) "${searchQuery}" kifejezésre.`
                  : 'A rendszer még nem talált automatikusan adatkezeléseket, vagy a kiválasztott szűrőnek nem felel meg egy sem.'}
              </p>
            </div>
          ) : (
            systems.map((sys) => {
              const website   = websites.find((w) => w.id === sys.website_id)
              const isPending = sys.status === 'pending'
              const isManual  = sys.source_type === 'manual'

              // Kezelés vége – timezone-safe formázás
              let retentionLabel: string | null = null
              if (isManual && sys.retention_until) {
                const parts = String(sys.retention_until).split('-').map(Number)
                if (parts.length === 3 && parts.every((n: number) => !isNaN(n))) {
                  const d = new Date(parts[0], parts[1] - 1, parts[2])
                  if (!isNaN(d.getTime())) {
                    retentionLabel = new Intl.DateTimeFormat('hu-HU', {
                      year: 'numeric', month: 'long', day: 'numeric',
                      timeZone: 'Europe/Budapest',
                    }).format(d)
                  }
                }
              }

              // Megőrzési idő szöveges megjelenítés (pl. "5 év")
              const retentionDisplay: string | null =
                sys.retention_display ?? null

              return (
                <div
                  key={sys.id}
                  className="grid grid-cols-[2rem_280px_200px_160px_160px_7rem] gap-4 px-5 py-5 items-center hover:bg-slate-50/80 transition-colors group"
                >
                  {/* Ikon */}
                  <div className="flex items-center justify-center">
                    <span
                      title={isManual ? 'Manuálisan rögzítve' : 'Scanner által azonosítva'}
                      className={`inline-flex items-center justify-center w-5 h-5 rounded-md shrink-0 ${
                        isManual
                          ? 'bg-violet-50 text-violet-500 border border-violet-100'
                          : 'bg-sky-50 text-sky-500 border border-sky-100'
                      }`}
                    >
                      {isManual ? <PenLine size={10} /> : <ScanSearch size={10} />}
                    </span>
                  </div>

                  {/* Adattípus neve + kategória + kezelés vége */}
                  <div className="min-w-0">
                    <div className="font-bold text-[14px] text-slate-800 line-clamp-2 leading-snug">
                      {sys.system_name}
                    </div>
                    <div className="text-[12px] text-slate-500 font-medium truncate mt-0.5">
                      {sys.purpose || 'Nincs megadva kategória'}
                    </div>
                    {/* Megőrzési idő: "5 év" formátum prioritás, különben pontos dátum */}
                    {(retentionDisplay || retentionLabel) && (
                      <div className="text-[11px] text-slate-400 mt-1 flex items-center gap-1">
                        <span>🗓</span>
                        {retentionDisplay
                          ? <span>Megőrzés: {retentionDisplay}</span>
                          : <span>Kezelés vége: {retentionLabel}</span>
                        }
                      </div>
                    )}
                  </div>

                  {/* Kezelt adatok */}
                  <div className="text-[13px] font-medium text-slate-600 line-clamp-2 leading-snug">
                    {sys.collected_data || 'Nincs megadva'}
                  </div>

                  {/* Forrás */}
                  <div>
                    <span className="bg-slate-100 text-slate-600 px-2 py-1 rounded-md text-[11px] font-bold truncate max-w-full inline-block">
                      {website
                        ? website.status === 'offline'
                          ? website.url
                          : website.url.replace(/^https?:\/\//, '')
                        : 'Ismeretlen forrás'}
                    </span>
                  </div>

                  {/* Státusz */}
                  <div>
                    {isPending ? (
                      <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-amber-50 text-amber-700 text-[12px] font-bold shadow-sm">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                        Jóváhagyásra vár
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 text-[12px] font-bold shadow-sm">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        Elfogadva
                      </span>
                    )}
                  </div>

                  {/* Műveletek */}
                  <div className="flex justify-end items-center gap-2 pr-4 opacity-0 group-hover:opacity-100 transition-opacity">
                    {isPending && <AcceptSystemButton id={sys.id} />}
                    <DeleteConfirmDialog
                      id={sys.id}
                      systemName={sys.system_name}
                      websiteId={sys.website_id}
                      deleteAction={deleteSystem}
                    />
                  </div>
                </div>
              )
            })
          )}
        </div>
      </section>
    </div>
  )
}