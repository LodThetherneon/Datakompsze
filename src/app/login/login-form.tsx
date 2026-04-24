'use client'

import { useState, useTransition } from 'react'
import { login, signup } from './actions'
import { Eye, EyeOff, ArrowRight, ShieldAlert, ArrowLeft } from 'lucide-react'

export function LoginForm({ initialTab, error }: { initialTab: string; error?: string }) {
  const [tab, setTab] = useState<'login' | 'register'>(initialTab === 'register' ? 'register' : 'login')
  const [isAdminMode, setIsAdminMode] = useState(false)

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [localError, setLocalError] = useState(error ?? '')
  const [showPass, setShowPass] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [isPending, startTransition] = useTransition()

  const inputClass = "w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-[14px] text-slate-800 placeholder-slate-400 focus:ring-2 focus:ring-emerald-400/30 focus:border-emerald-400 outline-none transition-all"
  const labelClass = "block text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-2"

  const Spinner = () => (
    <span className="w-4 h-4 border-[3px] border-emerald-300 border-t-white rounded-full animate-spin inline-block" />
  )

  const handleRegister = () => {
    if (!email || !password) { setLocalError('Add meg az email címed és jelszavad!'); return }
    if (password.length < 6) { setLocalError('A jelszónak legalább 6 karakter kell!'); return }
    if (password !== confirm) { setLocalError('A két jelszó nem egyezik!'); return }
    setLocalError('')
    const formData = new FormData()
    formData.set('email', email)
    formData.set('password', password)
    startTransition(() => { signup(formData) })
  }

  const switchToAdmin = () => {
    setIsAdminMode(true)
    setLocalError('')
    setEmail('')
    setPassword('')
    setShowPass(false)
  }

  const switchToNormal = () => {
    setIsAdminMode(false)
    setTab('login')
    setLocalError('')
    setEmail('')
    setPassword('')
    setShowPass(false)
  }

  // ===== ADMIN BELÉPÉS NÉZET =====
  if (isAdminMode) {
    return (
      <div className="w-full">

        {/* Fejléc */}
        <div className="mb-7">
          <div className="flex items-center gap-2.5 mb-3">
            <div className="w-8 h-8 rounded-xl bg-slate-800 flex items-center justify-center">
              <ShieldAlert size={18} className="text-white" />
            </div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Admin belépés</span>
          </div>
          <h2 className="text-[22px] font-black text-slate-800 tracking-tight">
            Rendszergazda hozzáférés
          </h2>
          <p className="text-[13px] text-slate-400 mt-1">
            Csak jogosult adminisztrátorok számára
          </p>
        </div>

        {/* Hibaüzenet */}
        {localError && (
          <div className="bg-red-50 text-red-600 text-[13px] p-3 rounded-xl mb-5 border border-red-100 text-center">
            {localError}
          </div>
        )}

        {/* Admin login form */}
        <form className="space-y-4">
          <div>
            <label className={labelClass}>Email cím</label>
            <input
              name="email"
              type="email"
              required
              placeholder="admin@sze.hu"
              className={inputClass}
              disabled={isPending}
            />
          </div>
          <div>
            <label className={labelClass}>Jelszó</label>
            <div className="relative">
              <input
                name="password"
                type={showPass ? 'text' : 'password'}
                required
                placeholder="••••••••"
                className={inputClass + ' pr-11'}
                disabled={isPending}
              />
              <button
                type="button"
                onClick={() => setShowPass(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
              >
                {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {/* Figyelmeztető sáv */}
          <div className="flex items-start gap-2.5 bg-amber-50 border border-amber-100 rounded-xl p-3">
            <ShieldAlert size={14} className="text-amber-500 flex-shrink-0 mt-0.5" />
            <p className="text-[12px] text-amber-700 font-medium leading-relaxed">
              Ez a felület kizárólag rendszergazdák számára elérhető. Jogosulatlan belépési kísérlet naplózásra kerül.
            </p>
          </div>

          <button
            type="button"
            disabled={isPending}
            onClick={(e) => {
              const form = (e.currentTarget as HTMLElement).closest('form') as HTMLFormElement
              const formData = new FormData(form)
              startTransition(() => { login(formData) })
            }}
            className="w-full bg-slate-800 hover:bg-slate-900 disabled:opacity-80 disabled:cursor-not-allowed text-white font-bold py-3.5 rounded-xl shadow-lg shadow-slate-800/20 transition-all text-[14px] flex items-center justify-center gap-2 group"
          >
            {isPending ? (
              <>
                <span className="w-4 h-4 border-[3px] border-slate-500 border-t-white rounded-full animate-spin inline-block" />
                Belépés folyamatban...
              </>
            ) : (
              <>
                Admin belépés
                <ArrowRight size={16} className="group-hover:translate-x-0.5 transition-transform" />
              </>
            )}
          </button>
        </form>

        {/* Vissza link */}
        <button
          type="button"
          onClick={switchToNormal}
          className="mt-5 flex items-center gap-1.5 text-[12px] text-black-400 hover:text-emerald-700 transition-colors mx-auto"
        >
          <ArrowLeft size={13} />
          Vissza a normál belépéshez
        </button>

      </div>
    )
  }

  // ===== NORMÁL BEJELENTKEZÉS / REGISZTRÁCIÓ NÉZET =====
  return (
    <div className="w-full">

      {/* Fejléc */}
      <div className="mb-7">
        <h2 className="text-[22px] font-black text-slate-800 tracking-tight">
          {tab === 'login' ? 'Üdvözöljük újra' : 'Hozzon létre fiókot'}
        </h2>
        <p className="text-[13px] text-slate-400 mt-1">
          {tab === 'login' ? 'Jelentkezzen be fiókjába' : 'Regisztráljon ingyenesen'}
        </p>
      </div>

      {/* Tab váltó */}
      <div className="flex bg-slate-100 p-1 rounded-xl mb-7">
        <button
          onClick={() => { setTab('login'); setLocalError('') }}
          disabled={isPending}
          className={`flex-1 py-2 text-[13px] font-bold rounded-lg transition-all ${tab === 'login' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
        >
          Bejelentkezés
        </button>
        <button
          onClick={() => { setTab('register'); setLocalError('') }}
          disabled={isPending}
          className={`flex-1 py-2 text-[13px] font-bold rounded-lg transition-all ${tab === 'register' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
        >
          Regisztráció
        </button>
      </div>

      {/* Hibaüzenet */}
      {localError && (
        <div className="bg-red-50 text-red-600 text-[13px] p-3 rounded-xl mb-5 border border-red-100 text-center">
          {localError}
        </div>
      )}

      {/* ===== BEJELENTKEZÉS ===== */}
      {tab === 'login' && (
        <form className="space-y-4">
          <div>
            <label className={labelClass}>Email cím</label>
            <input
              name="email"
              type="email"
              required
              placeholder="adatvedelem@sze.hu"
              className={inputClass}
              disabled={isPending}
            />
          </div>
          <div>
            <label className={labelClass}>Jelszó</label>
            <div className="relative">
              <input
                name="password"
                type={showPass ? 'text' : 'password'}
                required
                placeholder="••••••••"
                className={inputClass + ' pr-11'}
                disabled={isPending}
              />
              <button
                type="button"
                onClick={() => setShowPass(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
              >
                {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>
          <button
            type="button"
            disabled={isPending}
            onClick={(e) => {
              const form = (e.currentTarget as HTMLElement).closest('form') as HTMLFormElement
              const formData = new FormData(form)
              startTransition(() => { login(formData) })
            }}
            className="w-full bg-emerald-500 hover:bg-emerald-600 disabled:opacity-80 disabled:cursor-not-allowed text-white font-bold py-3.5 rounded-xl shadow-lg shadow-emerald-500/20 transition-all text-[14px] flex items-center justify-center gap-2 mt-1 group"
          >
            {isPending ? (
              <>
                <Spinner />
                Belépés folyamatban...
              </>
            ) : (
              <>
                Belépés
                <ArrowRight size={16} className="group-hover:translate-x-0.5 transition-transform" />
              </>
            )}
          </button>
          <p className="text-center text-[12px] text-slate-400 pt-1">
            Még nincs fiókja?{' '}
            <button
              type="button"
              onClick={() => setTab('register')}
              className="text-emerald-600 font-bold hover:text-emerald-700 transition-colors"
            >
              Regisztráljon ingyen
            </button>
          </p>
        </form>
      )}

      {/* ===== REGISZTRÁCIÓ ===== */}
      {tab === 'register' && (
        <div className="space-y-4">
          <div>
            <label className={labelClass}>Email cím</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="adatvedelem@sze.hu"
              className={inputClass}
              disabled={isPending}
            />
          </div>
          <div>
            <label className={labelClass}>Jelszó</label>
            <div className="relative">
              <input
                type={showPass ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Minimum 6 karakter"
                className={inputClass + ' pr-11'}
                disabled={isPending}
              />
              <button type="button" onClick={() => setShowPass(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors">
                {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>
          <div>
            <label className={labelClass}>Jelszó megerősítése</label>
            <div className="relative">
              <input
                type={showConfirm ? 'text' : 'password'}
                value={confirm}
                onChange={e => setConfirm(e.target.value)}
                placeholder="••••••••"
                className={inputClass + ' pr-11'}
                disabled={isPending}
              />
              <button type="button" onClick={() => setShowConfirm(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors">
                {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>
          <button
            type="button"
            disabled={isPending}
            onClick={handleRegister}
            className="w-full bg-emerald-500 hover:bg-emerald-600 disabled:opacity-80 disabled:cursor-not-allowed text-white font-bold py-3.5 rounded-xl shadow-lg shadow-emerald-500/20 transition-all text-[14px] flex items-center justify-center gap-2 group"
          >
            {isPending ? (
              <>
                <Spinner />
                Regisztráció folyamatban...
              </>
            ) : (
              <>
                Regisztráció & Kezdés
                <ArrowRight size={16} className="group-hover:translate-x-0.5 transition-transform" />
              </>
            )}
          </button>
          <p className="text-center text-[12px] text-slate-400">
            Van már fiókod?{' '}
            <button type="button" onClick={() => setTab('login')} className="text-emerald-600 font-bold hover:text-emerald-700 transition-colors">
              Jelentkezz be
            </button>
          </p>
        </div>
      )}

      {/* ===== ADMIN BELÉPÉS LINK — alul, diszkrét ===== */}
      <div className="mt-6 pt-5 border-t border-slate-100 flex justify-center">
        <button
          type="button"
          onClick={switchToAdmin}
          className="flex items-center gap-1.5 text-[12px] text-black-400 hover:text-emerald-700 transition-colors"
        >
          <ShieldAlert size={12} />
          Rendszergazda belépés
        </button>
      </div>

    </div>
  )
}