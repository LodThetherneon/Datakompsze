import { Search, FolderKanban, Upload, Plus, GitBranch } from 'lucide-react'
import { createClient } from '@/utils/supabase/server'
import Link from 'next/link'
import { SearchBar } from '@/components/search-bar'
// Ide majd létre kell hoznod ezeket a gombokat/dialogokat a systems/page.tsx mintájára:
// import { AddProcessDialog } from '@/components/add-process-dialog'
// import { ImportCsvDialog } from '@/components/import-csv-dialog'

export default async function DataRegistryPage(props: {
  searchParams: Promise<{ filter?: string; q?: string; department?: string }>
}) {
  const searchParams = await props.searchParams
  const currentFilter = searchParams.filter || 'all'
  const searchQuery = searchParams.q || ''

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  let processes: any[] = []
  
  // Dummy adat a dizájn teszteléséhez (ezt cseréld le a Supabase lekérdezésre később)
  if (user) {
    processes = [
      {
        id: '1',
        name: 'Munkavállalók bérszámfejtése',
        department_name: 'HR Osztály',
        purpose: 'Jogi kötelezettség teljesítése, bérfizetés',
        linked_systems_count: 2, // pl. össze van kötve a felderített "Kulcs-Soft" rendszerrel
        status: 'active'
      },
      {
        id: '2',
        name: 'Hírlevél feliratkozók kezelése',
        department_name: 'Marketing',
        purpose: 'Kereskedelmi célú kapcsolattartás',
        linked_systems_count: 1, // pl. össze van kötve a "Mailchimp" rendszerrel
        status: 'draft'
      }
    ]
  }

  return (
    <div className="w-full h-full flex flex-col space-y-8 font-sans">
      {/* === FEJLÉC ÉS GOMBOK === */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-6 border-b border-slate-200/80">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 tracking-tight">Adatkezelési folyamatok</h1>
          <p className="text-[14px] text-slate-500 mt-2 font-medium">
            GDPR 30. cikk szerinti nyilvántartás. Rögzítsd az üzleti folyamatokat és kösd össze az IT rendszerekkel.
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          {/* ÁLLAPOT SZŰRŐ - A systems oldalról átemelve */}
          <div className="flex bg-slate-100/80 p-1 rounded-lg border border-slate-200/60">
            <Link
              href={`/data-registry?filter=all`}
              className={`px-3 py-1.5 text-[13px] font-bold rounded-md transition-all ${currentFilter === 'all' ? 'bg-white shadow-sm text-slate-800' : 'text-slate-500 hover:text-slate-700'}`}
            >
              Összes
            </Link>
            <Link
              href={`/data-registry?filter=active`}
              className={`px-3 py-1.5 text-[13px] font-bold rounded-md transition-all ${currentFilter === 'active' ? 'bg-white shadow-sm text-slate-800' : 'text-slate-500 hover:text-slate-700'}`}
            >
              Kész
            </Link>
            <Link
              href={`/data-registry?filter=draft`}
              className={`px-3 py-1.5 text-[13px] font-bold rounded-md transition-all ${currentFilter === 'draft' ? 'bg-white shadow-sm text-slate-800' : 'text-slate-500 hover:text-slate-700'}`}
            >
              Hiányos
            </Link>
          </div>

          {/* IMPORT GOMB */}
          <button className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg text-[13px] font-bold hover:bg-slate-50 transition-colors shadow-sm">
            <Upload size={16} />
            CSV Import
          </button>

          {/* ÚJ FOLYAMAT GOMB */}
          <button className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[13px] font-bold transition-colors shadow-sm">
            <Plus size={16} />
            Új folyamat
          </button>
        </div>
      </header>

      {/* === TÁBLÁZAT === */}
      <section className="bg-white rounded-2xl border border-slate-100 shadow-[0_4px_20px_rgba(0,0,0,0.02)] overflow-hidden w-full flex-1">
        
        {/* KERESŐ SÁV */}
        <div className="p-4 border-b border-slate-100 flex items-center gap-3 bg-slate-50/30">
          <SearchBar defaultValue={searchQuery} />
          <div className="ml-auto shrink-0 flex gap-2">
            <button className="px-3 py-1.5 bg-slate-100 text-slate-600 rounded-md text-[12px] font-bold hover:bg-slate-200 transition-colors">
              Szervezeti egységek kezelése
            </button>
            <button className="px-3 py-1.5 bg-slate-100 text-slate-600 rounded-md text-[12px] font-bold hover:bg-slate-200 transition-colors">
              Kategóriák szerkesztése
            </button>
          </div>
        </div>

        {/* Táblázat Fejléc - Pontosan a systems oldal grid méreteivel */}
        <div className="grid grid-cols-[2rem_280px_200px_160px_140px_7rem] gap-4 px-5 py-4 border-b border-slate-100 bg-slate-50/80 text-[11px] font-bold text-slate-400 uppercase tracking-widest">
          <div />
          <div>Folyamat / Szerv. egység</div>
          <div>Adatkezelés célja</div>
          <div>Kapcsolt IT rendszerek</div>
          <div>Státusz</div>
          <div className="text-right pr-4">Műveletek</div>
        </div>

        {/* Táblázat Sorok */}
        <div className="divide-y divide-slate-50">
          {processes.length === 0 ? (
            <div className="p-12 text-center flex flex-col items-center justify-center">
              <div className="w-16 h-16 rounded-full bg-slate-50 flex items-center justify-center mb-4">
                <Search className="text-slate-300" size={24} />
              </div>
              <h3 className="text-lg font-bold text-slate-700 mb-1">Nincs még adatkezelési folyamat</h3>
              <p className="text-sm text-slate-500 max-w-md mx-auto">
                Kezdd el manuálisan rögzíteni az üzleti folyamatokat, vagy importálj meglévő Excel/CSV táblázatot a gyors induláshoz.
              </p>
            </div>
          ) : (
            processes.map((proc) => (
              <div
                key={proc.id}
                className="grid grid-cols-[2rem_280px_200px_160px_140px_7rem] gap-4 px-5 py-5 items-center hover:bg-slate-50/80 transition-colors group cursor-pointer"
              >
                {/* Ikon */}
                <div className="flex items-center justify-center">
                  <span className="inline-flex items-center justify-center w-6 h-6 rounded-md shrink-0 bg-indigo-50 text-indigo-500 border border-indigo-100">
                    <FolderKanban size={12} />
                  </span>
                </div>

                {/* Folyamat neve és részleg */}
                <div className="min-w-0">
                  <div className="font-bold text-[14px] text-slate-800 line-clamp-2 leading-snug">
                    {proc.name}
                  </div>
                  <div className="text-[12px] text-slate-500 font-medium truncate mt-0.5 flex items-center gap-1">
                    {proc.department_name}
                  </div>
                </div>

                {/* Adatkezelés célja */}
                <div className="text-[13px] font-medium text-slate-600 line-clamp-2 leading-snug">
                  {proc.purpose}
                </div>

                {/* Kapcsolt IT rendszerek a systems modulból */}
                <div>
                  {proc.linked_systems_count > 0 ? (
                    <span className="bg-sky-50 text-sky-700 border border-sky-100 px-2.5 py-1 rounded-md text-[11px] font-bold flex items-center gap-1.5 w-fit">
                      <GitBranch size={12} />
                      {proc.linked_systems_count} rendszer csatolva
                    </span>
                  ) : (
                    <span className="text-slate-400 text-[11px] font-medium italic">
                      Nincs csatolva
                    </span>
                  )}
                </div>

                {/* Státusz */}
                <div>
                  {proc.status === 'draft' ? (
                    <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-amber-50 text-amber-700 text-[12px] font-bold shadow-sm">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                      Hiányos adat
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 text-[12px] font-bold shadow-sm">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      Kész
                    </span>
                  )}
                </div>

                {/* Műveletek */}
                <div className="flex justify-end items-center gap-2 pr-4 font-bold text-[12px] text-emerald-600 opacity-0 group-hover:opacity-100 transition-opacity">
                  Szerkesztés →
                </div>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  )
}