import { Search, Clock, Target } from 'lucide-react'
import { createClient } from '@/utils/supabase/server'
import Link from 'next/link'
import { addManualSystem, deleteSystem } from '@/app/actions'
import { AddManualSystemDialog } from '@/components/add-manual-system-dialog'
import { DeleteConfirmDialog } from '@/components/delete-confirm-dialog'
import { SearchBar } from '@/components/search-bar'
import { AcceptAllButton } from '@/components/accept-all-button'
import { SourceTypeFilter } from '@/components/source-type-filter'
import { AcceptSystemButton } from '@/components/accept-system-button'
import { PenLine, ScanSearch, Tag, Database, CheckCircle2, GitBranch, Settings2, ChevronLeft, ChevronRight } from 'lucide-react'
import { SystemDetailDialog } from '@/components/system-detail-dialog'
import { updateSystem } from '@/app/actions'
import { SystemActionsCell } from '@/components/system-actions-cell'

const PAGE_SIZE = 20

export default async function SystemsPage(props: {
  searchParams: Promise<{ filter?: string; q?: string; source?: string; source_type?: string; page?: string }>
}) {
  const searchParams  = await props.searchParams
  const currentFilter = searchParams.filter      || 'all'
  const searchQuery   = searchParams.q           || ''
  const sourceId      = searchParams.source      || ''
  const sourceType    = searchParams.source_type || 'all'
  const currentPage   = Math.max(1, parseInt(searchParams.page || '1'))

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  let systems: any[]      = []
  let websites: any[]     = []
  let processes: any[]    = []
  let processLinks: any[] = []
  let pendingCount        = 0
  let totalCount          = 0

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

        // Alap query builder (szűrők)
        const buildQuery = (client: typeof supabase) => {
          let q = client
            .from('systems')
            .select('*')
            .in('website_id', websiteIds)
            .order('created_at', { ascending: false })
          if (currentFilter !== 'all') q = q.eq('status', currentFilter)
          if (sourceId)                q = q.eq('website_id', sourceId)
          if (sourceType !== 'all')    q = q.eq('source_type', sourceType)
          if (searchQuery) {
            q = q.or(
              `system_name.ilike.%${searchQuery}%,purpose.ilike.%${searchQuery}%,collected_data.ilike.%${searchQuery}%`
            )
          }
          return q
        }

        // count + pendingCount + lapozott adat egyszerre
        let countQuery = supabase
          .from('systems')
          .select('*', { count: 'exact', head: true })
          .in('website_id', websiteIds)
          .order('created_at', { ascending: false })
        if (currentFilter !== 'all') countQuery = countQuery.eq('status', currentFilter)
        if (sourceId)                countQuery = countQuery.eq('website_id', sourceId)
        if (sourceType !== 'all')    countQuery = countQuery.eq('source_type', sourceType)
        if (searchQuery) {
          countQuery = countQuery.or(
            `system_name.ilike.%${searchQuery}%,purpose.ilike.%${searchQuery}%,collected_data.ilike.%${searchQuery}%`
          )
        }

        const [{ count: total }, { count: pending }, { data: sysData }] = await Promise.all([
          countQuery,
          supabase
            .from('systems')
            .select('*', { count: 'exact', head: true })
            .in('website_id', websiteIds)
            .eq('status', 'pending'),
          buildQuery(supabase).range(
            (currentPage - 1) * PAGE_SIZE,
            currentPage * PAGE_SIZE - 1
          ),
        ])

          totalCount   = total   ?? 0
          pendingCount = pending ?? 0
          if (sysData) systems = sysData

        if (systems.some(s => s.source_type === 'process')) {
          const systemIds = systems.map(s => s.id)
          const [{ data: procData }, { data: linkData }] = await Promise.all([
            supabase
              .from('data_processes')
              .select('id, process_name')
              .eq('company_id', company.id),
            supabase
              .from('process_system_links')
              .select('process_id, system_id')
              .in('system_id', systemIds)
          ])
          if (procData) processes = procData
          if (linkData) processLinks = linkData
        }
      }
    }
  }

  const totalPages = Math.ceil(totalCount / PAGE_SIZE)

  // URL builder – minden aktív szűrőt megőriz
  function pageUrl(page: number) {
    const params = new URLSearchParams()
    if (currentFilter !== 'all') params.set('filter', currentFilter)
    if (searchQuery)             params.set('q', searchQuery)
    if (sourceId)                params.set('source', sourceId)
    if (sourceType !== 'all')    params.set('source_type', sourceType)
    params.set('page', String(page))
    return `/systems?${params.toString()}`
  }

  function getPageNumbers() {
    const pages: (number | '...')[] = []
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i)
    } else {
      pages.push(1)
      if (currentPage > 3) pages.push('...')
      for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) {
        pages.push(i)
      }
      if (currentPage < totalPages - 2) pages.push('...')
      pages.push(totalPages)
    }
    return pages
  }

  return (
    <div className="w-full h-full flex flex-col space-y-8 font-sans">

      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-6 border-b border-slate-200/80">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 tracking-tight">Kezelt adattípusok</h1>
          <p className="text-[14px] text-slate-500 mt-2 font-medium">
            A rendszerek és weboldalak által gyűjtött és feldolgozott konkrét adatok listája.
          </p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
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

        <div className="p-4 border-b border-slate-100 flex items-center gap-3 bg-slate-50/30">
          <SearchBar defaultValue={searchQuery} />
          <div className="ml-auto shrink-0">
            <AcceptAllButton pendingCount={pendingCount} />
          </div>
        </div>

        <div className="grid grid-cols-[2fr_1.6fr_1.9fr_1.1fr_1.2fr_6rem] gap-4 px-5 py-4 border-b border-slate-100 bg-slate-50/80 text-[11px] font-bold text-slate-400 uppercase tracking-widest">
          <div className="flex items-center gap-1.5"><Tag size={11} /> Kategória / Folyamat</div>
          <div className="flex items-center gap-1.5"><Database size={11} /> Kezelt adatok</div>
          <div className="flex items-center gap-1.5"><Target size={11} /> Adatkezelés célja</div>
          <div className="flex items-center gap-1.5"><Clock size={11} /> Megőrzési idő</div>
          <div className="flex items-center gap-1.5"><CheckCircle2 size={11} /> Státusz</div>
          <div className="flex items-center justify-end gap-1.5 pr-4"><Settings2 size={11} /> Műveletek</div>
        </div>

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
                  : 'A rendszer még nem talált adattípusokat. Kérem adjon hozzá kapcsolatokat vagy manuálisan rögzítse a kezelt adattípusokat.'}
              </p>
            </div>
          ) : (
            systems.map((sys) => {
              const website   = websites.find((w) => w.id === sys.website_id)
              const isPending = sys.status === 'pending'
              const isManual  = sys.source_type === 'manual'
              const isLinkedFromProcess = sys.source_type === 'process'

              const linkedProcess = isLinkedFromProcess
                ? (() => {
                    const link = processLinks.find((l: any) => l.system_id === sys.id)
                    return link ? processes.find((p: any) => p.id === link.process_id) : null
                  })()
                : null

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

              const retentionDisplay: string | null = sys.retention_display ?? null

              return (
                <div
                  key={sys.id}
                  className="grid grid-cols-[2fr_1.6fr_2fr_1.1fr_1.2fr_6rem] gap-4 px-5 py-5 items-start hover:bg-slate-50/80 transition-colors group relative">

                  <SystemDetailDialog sys={sys} website={website} updateAction={updateSystem} processName={linkedProcess?.process_name ?? null} />

                  <div className="min-w-0 pt-0.5">
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <span className={`inline-flex items-center justify-center w-4 h-4 rounded shrink-0 ${
                        isManual ? 'bg-amber-50 text-amber-500 border border-amber-100'
                                 : 'bg-sky-50 text-sky-500 border border-sky-100'
                      }`}>
                        {isManual ? <PenLine size={9} /> : <ScanSearch size={9} />}
                      </span>
                      <div className="font-bold text-[13px] text-slate-800 truncate">
                        {sys.system_name}
                      </div>
                    </div>
                    {!isLinkedFromProcess && (
                      <div className="text-[11px] text-slate-400 truncate pl-5">
                        {website?.url?.replace(/^https?:\/\//, '') ?? '—'}
                      </div>
                    )}
                    {isLinkedFromProcess && linkedProcess && (
                      <div className="flex items-center gap-1 pl-5 mt-0.5">
                        <GitBranch size={9} className="text-emerald-500 shrink-0" />
                        <span className="text-[11px] text-emerald-700 font-semibold truncate">
                          {linkedProcess.process_name}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="min-w-0 pt-0.5">
                    {sys.collected_data?.trim() ? (
                      <div className="text-[13px] text-slate-600 line-clamp-3 leading-snug">{sys.collected_data}</div>
                    ) : (
                      <span className="text-[13px] text-slate-300 italic">Nincs megadva</span>
                    )}
                  </div>

                  <div className="min-w-0 pt-0.5">
                    {sys.purpose?.trim() ? (
                      <div className="text-[13px] text-slate-600 line-clamp-3 leading-snug">{sys.purpose}</div>
                    ) : (
                      <span className="text-[13px] text-slate-300 italic">Nincs megadva</span>
                    )}
                  </div>

                  <div className="pt-0.5">
                    <span className="text-[13px] text-slate-600">
                      {sys.retention_period ?? retentionDisplay ?? retentionLabel ?? <span className="text-slate-300">—</span>}
                    </span>
                  </div>

                  <div className="pt-0.5">
                    {isPending ? (
                      <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-amber-50 text-amber-700 text-[12px] font-bold shadow-sm">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                        Jóváhagyandó
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 text-[12px] font-bold shadow-sm">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        Elfogadva
                      </span>
                    )}
                  </div>

                  <SystemActionsCell>
                    {isPending && <AcceptSystemButton id={sys.id} />}
                    <DeleteConfirmDialog
                      id={sys.id}
                      systemName={sys.system_name}
                      websiteId={sys.website_id}
                      simpleConfirm={true}
                      deleteAction={deleteSystem}
                    />
                  </SystemActionsCell>
                </div>
              )
            })
          )}
        </div>

        {/* ── Lapozó ── */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-5 py-4 border-t border-slate-100 bg-slate-50/30">
            <p className="text-[12px] text-slate-400 font-medium">
              {(currentPage - 1) * PAGE_SIZE + 1}–{Math.min(currentPage * PAGE_SIZE, totalCount)} / {totalCount} elem
            </p>
            <div className="flex items-center gap-1">
              {currentPage > 1 ? (
                <Link href={pageUrl(currentPage - 1)} className="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-white hover:border-emerald-300 hover:text-emerald-600 transition-all">
                  <ChevronLeft size={15} />
                </Link>
              ) : (
                <span className="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-100 text-slate-300 cursor-not-allowed">
                  <ChevronLeft size={15} />
                </span>
              )}

              {getPageNumbers().map((p, i) =>
                p === '...' ? (
                  <span key={`ellipsis-${i}`} className="w-8 h-8 flex items-center justify-center text-slate-400 text-[13px]">…</span>
                ) : (
                  <Link
                    key={p}
                    href={pageUrl(p as number)}
                    className={`w-8 h-8 flex items-center justify-center rounded-lg text-[13px] font-semibold transition-all border ${
                      p === currentPage
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                        : 'border-slate-200 text-slate-600 hover:bg-white hover:border-emerald-300 hover:text-emerald-600'
                    }`}
                  >
                    {p}
                  </Link>
                )
              )}

              {currentPage < totalPages ? (
                <Link href={pageUrl(currentPage + 1)} className="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-white hover:border-emerald-300 hover:text-emerald-600 transition-all">
                  <ChevronRight size={15} />
                </Link>
              ) : (
                <span className="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-100 text-slate-300 cursor-not-allowed">
                  <ChevronRight size={15} />
                </span>
              )}
            </div>
          </div>
        )}

      </section>
    </div>
  )
}