import { createClient } from '@/utils/supabase/server'
import { notFound } from 'next/navigation'
import { FileText, Database } from 'lucide-react'
import Link from 'next/link'

export default async function WebsiteDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return notFound()

  const { data: website } = await supabase
    .from('websites').select('*').eq('id', id).single()
  if (!website) return notFound()

  const { data: systems } = await supabase
    .from('systems').select('*').eq('website_id', id).order('created_at', { ascending: false })

  const { data: policies } = await supabase
    .from('policies').select('*').eq('website_id', id).order('valid_from', { ascending: false })

  const siteName = website.status === 'offline'
    ? website.url
    : website.url.replace(/^https?:\/\//, '')

  const pendingCount = systems?.filter(s => s.status === 'pending').length ?? 0

  return (
    <div className="w-full flex flex-col space-y-8 font-sans">
      {/* Fejléc */}
      <header className="flex items-end justify-between pb-6 border-b border-slate-200/80">
        <div>
          <div className="text-[12px] font-bold text-slate-400 uppercase tracking-widest mb-2">
            <Link href="/" className="hover:text-emerald-600 transition-colors">Irányítópult</Link>
            <span className="mx-2">›</span> {siteName}
          </div>
          <h1 className="text-3xl font-bold text-slate-800 tracking-tight">{siteName}</h1>
          <p className="text-[14px] text-slate-500 mt-2 font-medium">
            {website.status === 'offline' ? 'Belső rendszer' : 'Weboldal'} · {systems?.length ?? 0} adattípus · {policies?.length ?? 0} tájékoztató
          </p>
        </div>
        {pendingCount > 0 && (
          <span className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-50 text-amber-700 text-[13px] font-bold border border-amber-100">
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
            {pendingCount} db függőben
          </span>
        )}
      </header>

      {/* Adattípusok */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <Database size={16} className="text-slate-400" />
          <h2 className="text-[15px] font-bold text-slate-800">Adattípusok</h2>
        </div>
        <div className="bg-white rounded-2xl border border-slate-100 shadow-[0_4px_20px_rgba(0,0,0,0.02)] overflow-hidden">
          {!systems?.length ? (
            <div className="p-8 text-center text-slate-400 text-[13px]">Nincsenek rögzített adattípusok.</div>
          ) : (
            <div className="divide-y divide-slate-50">
              {systems.map(sys => (
                <div key={sys.id} className="grid grid-cols-12 gap-4 p-4 items-center hover:bg-slate-50 transition-colors">
                  <div className="col-span-4 pl-2">
                    <div className="font-bold text-[14px] text-slate-800">{sys.system_name}</div>
                    <div className="text-[12px] text-slate-400 mt-0.5">{sys.collected_data}</div>
                  </div>
                  <div className="col-span-4 text-[13px] text-slate-500">{sys.purpose}</div>
                  <div className="col-span-2 text-[11px] font-bold text-slate-400 uppercase">{sys.source_type}</div>
                  <div className="col-span-2 flex justify-end">
                    {sys.status === 'pending' ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-50 text-amber-700 text-[11px] font-bold">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span> Függőben
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 text-[11px] font-bold">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Elfogadva
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Tájékoztatók */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <FileText size={16} className="text-slate-400" />
          <h2 className="text-[15px] font-bold text-slate-800">Tájékoztatók</h2>
        </div>
        <div className="bg-white rounded-2xl border border-slate-100 shadow-[0_4px_20px_rgba(0,0,0,0.02)] overflow-hidden">
          {!policies?.length ? (
            <div className="p-8 text-center text-slate-400 text-[13px]">Még nem generáltak tájékoztatót.</div>
          ) : (
            <div className="divide-y divide-slate-50">
              {policies.map(p => (
                <div key={p.id} className="flex items-center justify-between p-4 hover:bg-slate-50 transition-colors">
                  <div>
                    <span className="font-bold text-[14px] text-slate-800">v{p.version}</span>
                    <span className={`ml-3 px-2.5 py-0.5 rounded-md text-[11px] font-bold ${p.status === 'current' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-400'}`}>
                      {p.status === 'current' ? 'Hatályos' : 'Archivált'}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-[12px] text-slate-400">
                      {new Date(p.valid_from).toLocaleDateString('hu-HU')}
                    </span>
                    <Link
                      href={`/policies?id=${p.id}`}
                      className="text-[12px] font-bold text-emerald-600 hover:text-emerald-800 transition-colors"
                    >
                      Megtekintés →
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  )
}