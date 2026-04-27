'use client'

import { useState, useTransition } from 'react'
import { adminLogin } from './actions'
import { ArrowRight, ShieldAlert } from 'lucide-react'

export default function AdminLoginPage() {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const Spinner = () => (
    <span className="w-4 h-4 border-[3px] border-emerald-300 border-t-white rounded-full animate-spin inline-block" />
  )

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)
    const formData = new FormData(e.currentTarget)
    startTransition(async () => {
      try {
        await adminLogin(formData)
      } catch (err: any) {
        // A Next.js redirect() belsőleg hibát dob — azt ne kapjuk el
        if (err?.digest?.startsWith('NEXT_REDIRECT')) return
        if (err.message === 'invalid') setError('invalid')
        else if (err.message === 'forbidden') setError('forbidden')
        else setError('invalid')
      }
    })
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <div className="bg-white rounded-2xl border border-slate-100 shadow-xl w-full max-w-[380px] p-8">
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-3">
            <ShieldAlert size={20} className="text-emerald-600" />
            <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Admin belépő</h1>
          </div>
          <p className="text-[13px] text-slate-400">Csak jogosult felhasználók számára</p>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 text-[13px] p-3 rounded-xl mb-5 border border-red-100 text-center">
            {error === 'invalid' ? 'Hibas email vagy jelszo.' : 'Nincs jogosultságod a belépéshez.'}
          </div>
        )}

        <form onSubmit={handleSubmit} autoComplete="off" className="space-y-4">
          <div>
            <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-2">
              Email
            </label>
            <input
              name="email"
              type="email"
              required
              autoFocus
              autoComplete="username"
              placeholder="admin@ceg.hu"
              disabled={isPending}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-[14px] outline-none focus:ring-2 focus:ring-emerald-400/30 focus:border-emerald-400 transition-all disabled:opacity-60"
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
              autoComplete="current-password"
              placeholder="••••••••"
              disabled={isPending}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-[14px] outline-none focus:ring-2 focus:ring-emerald-400/30 focus:border-emerald-400 transition-all disabled:opacity-60"
            />
          </div>
          <button
            type="submit"
            disabled={isPending}
            className="w-full h-11 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-80 disabled:cursor-not-allowed text-white text-[13px] font-semibold rounded-xl transition-all mt-2 flex items-center justify-center gap-2"
          >
            {isPending ? (
              <><Spinner />Belépés folyamatban...</>
            ) : (
              <><ArrowRight size={16} />Belépés</>
            )}
          </button>
        </form>
      </div>
    </div>
  )
}