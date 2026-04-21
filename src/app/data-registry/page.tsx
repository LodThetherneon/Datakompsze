import { createClient } from '@/utils/supabase/server'
import { addDataProcess, deleteDataProcess, linkWebsiteToProcess, unlinkWebsiteFromProcess, addDepartment, deleteDepartment, updateDataProcess } from './actions'
import { ProcessDetailDialog } from '@/components/process-detail-dialog'
import { AddProcessDialog } from '@/components/add-process-dialog'
import { DeleteProcessButton } from '@/components/delete-process-button'
import { LinkWebsiteDialog } from '@/components/link-website-dialog'
import { ManageDepartmentsDialog } from '@/components/manage-departments-dialog'
import { SearchBar } from '@/components/search-bar'
import { Search, Building2, Clock, Tag, HardDrive, Target, Globe, Settings2, Database, ChevronLeft, ChevronRight } from 'lucide-react'
import { SystemActionsCell } from '@/components/system-actions-cell'
import Link from 'next/link'

const PAGE_SIZE = 20

export default async function DataRegistryPage(props: {
  searchParams: Promise<{ q?: string; page?: string }>
}) {
  const searchParams = await props.searchParams
  const searchQuery = searchParams.q || ''
  const currentPage = Math.max(1, parseInt(searchParams.page || '1'))

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  let processes: any[] = []
  let totalCount = 0
  let allWebsites: any[] = []
  let departments: any[] = []

  if (user) {
    const { data: company } = await supabase
      .from('companies').select('id').eq('user_id', user.id).single()

    if (company) {
      const { data: webData } = await supabase
        .from('websites')
        .select('id, url, status')
        .eq('company_id', company.id)
        .order('created_at', { ascending: false })
      allWebsites = webData ?? []

      const { data: deptData } = await supabase
        .from('departments')
        .select('*')
        .eq('company_id', company.id)
        .order('name', { ascending: true })
      departments = deptData ?? []

      // Összes elem száma a lapozóhoz
      let countQuery = supabase
        .from('data_processes')
        .select('id', { count: 'exact', head: true })
        .eq('company_id', company.id)
      if (searchQuery) {
        countQuery = countQuery.or(
          `department_name.ilike.%${searchQuery}%,process_name.ilike.%${searchQuery}%,purpose.ilike.%${searchQuery}%`
        )
      }
      const { count } = await countQuery
      totalCount = count ?? 0

      // Lapozott lekérdezés
      let query = supabase
        .from('data_processes')
        .select('*, process_system_links(system_id, systems(id, website_id))')
        .eq('company_id', company.id)
        .order('created_at', { ascending: false })
        .range((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE - 1)

      if (searchQuery) {
        query = query.or(
          `department_name.ilike.%${searchQuery}%,process_name.ilike.%${searchQuery}%,purpose.ilike.%${searchQuery}%`
        )
      }

      const { data } = await query
      processes = data ?? []

      const allSystemIds = processes.flatMap(p =>
        (p.process_system_links ?? []).map((l: any) => l.system_id)
      ).filter(Boolean)

      if (allSystemIds.length > 0) {
        const { data: sysData } = await supabase
          .from('systems')
          .select('id, website_id')
          .in('id', allSystemIds)
        // systemWebsiteMap ha kell
      }
    }
  }

  const totalPages = Math.ceil(totalCount / PAGE_SIZE)
  const knownProcessNames = [...new Set(processes.map((p) => p.process_name))]

  // Lapozó URL builder – megőrzi a keresést
  function pageUrl(page: number) {
    const params = new URLSearchParams()
    if (searchQuery) params.set('q', searchQuery)
    params.set('page', String(page))
    return `/data-registry?${params.toString()}`
  }

  // Oldalszámok generálása (max 5 látható)
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
          <h1 className="text-3xl font-bold text-slate-800 tracking-tight">Folyamatnyilvántartás</h1>
          <p className="text-[14px] text-slate-500 mt-2 font-medium">
            Az adatkezelési tevékenységek nyilvántartása.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <ManageDepartmentsDialog
            departments={departments}
            addAction={addDepartment}
            deleteAction={deleteDepartment}
          />
          <AddProcessDialog
            addAction={addDataProcess}
            addDepartmentAction={addDepartment}
            departments={departments}
            knownProcessNames={knownProcessNames}
          />
        </div>
      </header>

      <section className="bg-white rounded-2xl border border-slate-100 shadow-[0_4px_20px_rgba(0,0,0,0.02)] overflow-hidden w-full flex-1">

        <div className="p-4 border-b border-slate-100 flex items-center gap-3 bg-slate-50/30">
          <SearchBar defaultValue={searchQuery} />
        </div>

        <div className="grid grid-cols-[1.2fr_1.4fr_1.4fr_1.8fr_1.2fr_1fr_72px] gap-4 px-5 py-4 border-b border-slate-100 bg-slate-50/80 text-[11px] font-bold text-slate-400 uppercase tracking-widest">
          <div className="flex items-center gap-1.5"><Building2 size={11} /> Szervezeti egység</div>
          <div className="flex items-center gap-1.5"><Tag size={11} /> Folyamat neve</div>
          <div className="flex items-center gap-1.5"><Database size={11} /> Kezelt adatok</div>
          <div className="flex items-center gap-1.5"><Target size={11} /> Adatkezelés célja</div>
          <div className="flex items-center gap-1.5"><Clock size={11} /> Megőrzési idő</div>
          <div className="flex items-center gap-1.5"><HardDrive size={11} /> Helye</div>
          <div className="flex items-center justify-end gap-1.5 pr-2"><Settings2 size={11} className="shrink-0" /> Műveletek</div>
        </div>

        <div className="divide-y divide-slate-50">
          {processes.length === 0 ? (
            <div className="p-12 text-center flex flex-col items-center justify-center">
              <div className="w-16 h-16 rounded-full bg-slate-50 flex items-center justify-center mb-4">
                <Search className="text-slate-300" size={24} />
              </div>
              <h3 className="text-lg font-bold text-slate-700 mb-1">Még nincs folyamat rögzítve</h3>
              <p className="text-sm text-slate-500 max-w-md mx-auto">
                {searchQuery
                  ? `Nem találtunk eredményt a(z) "${searchQuery}" kifejezésre.`
                  : 'Kattintson az „Új folyamat rögzítése" gombra az első folyamat hozzáadásához.'}
              </p>
            </div>
          ) : (
            processes.map((proc) => {
              const linkedWebsiteIds: string[] = (proc.process_system_links ?? [])
                .map((l: any) => l.systems?.website_id)
                .filter(Boolean)
              const linkedWebsites = allWebsites.filter((w) => linkedWebsiteIds.includes(w.id))

              const createdAt = new Intl.DateTimeFormat('hu-HU', {
                year: 'numeric', month: '2-digit', day: '2-digit'
              }).format(new Date(proc.created_at))

              return (
                <div
                  key={proc.id}
                  className="relative grid grid-cols-[1.2fr_1.4fr_1.4fr_1.8fr_1.2fr_1fr_72px] gap-4 px-5 py-4 items-start hover:bg-slate-50/80 transition-colors group">
                  <ProcessDetailDialog
                    proc={proc}
                    linkedWebsites={linkedWebsites}
                    updateAction={updateDataProcess}
                  />
                  <div className="min-w-0">
                    <div className="font-bold text-[13px] text-slate-800 truncate">
                      {proc.department_name}
                    </div>
                    <div className="text-[11px] text-slate-400 mt-0.5">{createdAt}</div>
                    {linkedWebsites.length > 0 && (
                      <div className="mt-1.5 flex flex-wrap gap-1">
                        {linkedWebsites.map((w) => (
                          <span
                            key={w.id}
                            className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-100 truncate max-w-[140px]"
                          >
                            <Globe size={8} />
                            {w.status === 'offline' ? w.url : w.url.replace(/^https?:\/\//, '')}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="font-semibold text-[13px] text-slate-700 line-clamp-2 leading-snug pt-0.5">
                    {proc.process_name}
                  </div>
                  <div className="text-[13px] text-slate-600 line-clamp-3 leading-snug pt-0.5">
                    {proc.collected_data || <span className="text-slate-300 italic">Nincs megadva</span>}
                  </div>
                  <div className="text-[13px] text-slate-600 line-clamp-3 leading-snug pt-0.5">
                    {proc.purpose || '—'}
                  </div>
                  <div className="text-[13px] text-slate-600 truncate pt-0.5" title={proc.retention_period}>
                    {proc.retention_period || '—'}
                  </div>
                  <div className="text-[13px] text-slate-600 truncate pt-0.5" title={proc.storage_location}>
                    {proc.storage_location || '—'}
                  </div>
                  <SystemActionsCell>
                    <LinkWebsiteDialog
                      processId={proc.id}
                      allWebsites={allWebsites}
                      linkedWebsiteIds={linkedWebsiteIds}
                      linkAction={linkWebsiteToProcess}
                      unlinkAction={unlinkWebsiteFromProcess}
                    />
                    <DeleteProcessButton
                      id={proc.id}
                      processName={proc.process_name}
                      deleteAction={deleteDataProcess}
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
              {(currentPage - 1) * PAGE_SIZE + 1}–{Math.min(currentPage * PAGE_SIZE, totalCount)} / {totalCount} folyamat
            </p>
            <div className="flex items-center gap-1">
              {/* Előző */}
              {currentPage > 1 ? (
                <Link
                  href={pageUrl(currentPage - 1)}
                  className="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-white hover:border-emerald-300 hover:text-emerald-600 transition-all"
                >
                  <ChevronLeft size={15} />
                </Link>
              ) : (
                <span className="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-100 text-slate-300 cursor-not-allowed">
                  <ChevronLeft size={15} />
                </span>
              )}

              {/* Oldalszámok */}
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

              {/* Következő */}
              {currentPage < totalPages ? (
                <Link
                  href={pageUrl(currentPage + 1)}
                  className="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-white hover:border-emerald-300 hover:text-emerald-600 transition-all"
                >
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