import { createClient } from '@/utils/supabase/server'
import {
  addDataProcess, deleteDataProcess,
  linkWebsiteToProcess, unlinkWebsiteFromProcess,
  addDepartment, deleteDepartment
} from './actions'
import { AddProcessDialog } from '@/components/add-process-dialog'
import { DeleteProcessButton } from '@/components/delete-process-button'
import { LinkWebsiteDialog } from '@/components/link-website-dialog'
import { ManageDepartmentsDialog } from '@/components/manage-departments-dialog'
import { SearchBar } from '@/components/search-bar'
import { Search, Building2, FileText, Clock, HardDrive } from 'lucide-react'

export default async function DataRegistryPage(props: {
  searchParams: Promise<{ q?: string }>
}) {
  const searchParams = await props.searchParams
  const searchQuery = searchParams.q || ''

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  let processes: any[] = []
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

      let query = supabase
        .from('data_processes')
        .select('*, process_system_links(system_id)')
        .eq('company_id', company.id)
        .order('created_at', { ascending: false })

      if (searchQuery) {
        query = query.or(
          `department_name.ilike.%${searchQuery}%,process_name.ilike.%${searchQuery}%,purpose.ilike.%${searchQuery}%`
        )
      }

      const { data } = await query
      processes = data ?? []
    }
  }

  const knownProcessNames = [...new Set(processes.map((p) => p.process_name))]

  return (
    <div className="w-full h-full flex flex-col space-y-8 font-sans">

      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-6 border-b border-slate-200/80">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 tracking-tight">Folyamatnyilvántartás</h1>
          <p className="text-[14px] text-slate-500 mt-2 font-medium">
            Az adatkezelési tevékenységek nyilvántartása a GDPR 30. cikk alapján.
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

        <div className="grid grid-cols-[180px_200px_1fr_130px_130px_72px] gap-3 px-5 py-4 border-b border-slate-100 bg-slate-50/80 text-[11px] font-bold text-slate-400 uppercase tracking-widest">
          <div className="flex items-center gap-1.5"><Building2 size={11} /> Szervezeti egység</div>
          <div className="flex items-center gap-1.5"><FileText size={11} /> Folyamat neve</div>
          <div>Adatkezelés célja</div>
          <div className="flex items-center gap-1.5"><Clock size={11} /> Megőrzési idő</div>
          <div className="flex items-center gap-1.5"><HardDrive size={11} /> Tárolás helye</div>
          <div className="text-right pr-2">Műv.</div>
        </div>

        <div className="divide-y divide-slate-50">
          {processes.length === 0 ? (
            <div className="p-12 text-center flex flex-col items-center justify-center">
              <div className="w-16 h-16 rounded-full bg-slate-50 flex items-center justify-center mb-4">
                <Search className="text-slate-300" size={24} />
              </div>
              <h3 className="text-lg font-bold text-slate-700 mb-1">Nincs még folyamat rögzítve</h3>
              <p className="text-sm text-slate-500 max-w-md mx-auto">
                {searchQuery
                  ? `Nem találtunk eredményt a(z) "${searchQuery}" kifejezésre.`
                  : 'Kattintson az „Új folyamat rögzítése" gombra az első folyamat hozzáadásához.'}
              </p>
            </div>
          ) : (
            processes.map((proc) => {
              const linkedWebsiteIds: string[] = (proc.process_system_links ?? []).map((l: any) => l.system_id)
              const linkedWebsites = allWebsites.filter((w) => linkedWebsiteIds.includes(w.id))

              const createdAt = new Intl.DateTimeFormat('hu-HU', {
                year: 'numeric', month: '2-digit', day: '2-digit'
              }).format(new Date(proc.created_at))

              return (
                <div
                  key={proc.id}
                  className="grid grid-cols-[180px_200px_1fr_130px_130px_72px] gap-3 px-5 py-4 items-start hover:bg-slate-50/80 transition-colors group"
                >
                  <div className="min-w-0">
                    <div className="font-bold text-[13px] text-slate-800 truncate">{proc.department_name}</div>
                    <div className="text-[11px] text-slate-400 mt-0.5">{createdAt}</div>
                    {linkedWebsites.length > 0 && (
                      <div className="mt-1.5 flex flex-wrap gap-1">
                        {linkedWebsites.map((w) => (
                          <span key={w.id} className="inline-block bg-emerald-50 text-emerald-700 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-100 truncate max-w-[140px]">
                            {w.status === 'offline' ? w.url : w.url.replace(/^https?:\/\//, '')}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="font-semibold text-[13px] text-slate-700 line-clamp-2 leading-snug pt-0.5">
                    {proc.process_name}
                  </div>

                  <div className="text-[13px] text-slate-600 line-clamp-2 leading-snug pt-0.5">
                    {proc.purpose || '—'}
                  </div>

                  <div className="text-[13px] text-slate-600 truncate pt-0.5" title={proc.retention_period}>
                    {proc.retention_period || '—'}
                  </div>

                  <div className="text-[13px] text-slate-600 truncate pt-0.5" title={proc.storage_location}>
                    {proc.storage_location || '—'}
                  </div>

                  <div className="flex justify-end items-center gap-1 pr-1 opacity-0 group-hover:opacity-100 transition-opacity pt-0.5">
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