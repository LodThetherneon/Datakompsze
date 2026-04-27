import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { adminLogin } from './actions'

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  const params = await searchParams
  const error = params.error

  // Ha már be van lépve admin jogon, rögtön az admin panelre
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (user) {
    const { data } = await supabase
      .from('profiles').select('role').eq('id', user.id).single()
    const role = data?.role ?? ''
    if (['superadmin', 'admin', 'admin_reader'].includes(role)) {
      redirect('/admin')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <div className="bg-white rounded-2xl border border-slate-100 shadow-xl w-full max-w-[380px] p-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Admin belépő</h1>
          <p className="text-[13px] text-slate-400 mt-1">Csak jogosult felhasználók számára</p>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 text-[13px] p-3 rounded-xl mb-5 border border-red-100 text-center">
            {error === 'invalid' ? 'Hibás email vagy jelszó.' : 'Nincs jogosultságod a belépéshez.'}
          </div>
        )}

        <form action={adminLogin} className="space-y-4">
          <div>
            <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-2">
              Email
            </label>
            <input
              name="email"
              type="email"
              required
              autoFocus
              placeholder="admin@ceg.hu"
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-[14px] outline-none focus:ring-2 focus:ring-emerald-400/30 focus:border-emerald-400 transition-all"
            />
          </div>
          <div>
            <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-2">
              Jelszó
            </label>
            <input
              name="password"
              type="password"
              required
              placeholder="••••••••"
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-[14px] outline-none focus:ring-2 focus:ring-emerald-400/30 focus:border-emerald-400 transition-all"
            />
          </div>
          <button
            type="submit"
            className="w-full h-11 bg-emerald-600 hover:bg-emerald-700 text-white text-[13px] font-semibold rounded-xl transition-all mt-2"
          >
            Belépés
          </button>
        </form>
      </div>
    </div>
  )
}