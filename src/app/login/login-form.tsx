'use client'

import { useState, useTransition } from 'react'
import { login, signup } from './actions'
import { Check, Eye, EyeOff, ArrowRight } from 'lucide-react'

const PLANS = [
  {
    id: 'free',
    name: 'Free',
    price: '0 Ft',
    per: '/ hó',
    quotaLabel: '3 rendszer',
    features: ['3 bekötött rendszer', 'Korlátlan adattípus', 'Tájékoztató generálás'],
  },
  {
    id: 'pro',
    name: 'Pro',
    price: '4 990 Ft',
    per: '/ hó',
    quotaLabel: '30 rendszer',
    features: ['30 bekötött rendszer', 'Korlátlan tájékoztató', 'Policy verziókövetés'],
    highlight: true,
  },
  {
    id: 'max',
    name: 'Max',
    price: '14 990 Ft',
    per: '/ hó',
    quotaLabel: 'Korlátlan',
    features: ['Korlátlan rendszer', 'Audit log', 'Dedikált support'],
  },
]

export function LoginForm({ initialTab, error }: { initialTab: string; error?: string }) {
  const [tab, setTab] = useState<'login' | 'register'>(initialTab === 'register' ? 'register' : 'login')
  const [step, setStep] = useState<1 | 2>(1)
  const [selectedPlan, setSelectedPlan] = useState('free')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [localError, setLocalError] = useState(error ?? '')
  const [showPass, setShowPass] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [isPending, startTransition] = useTransition()

  const handleNext = () => {
    if (!email || !password) { setLocalError('Add meg az email címed és jelszavad!'); return }
    if (password.length < 6) { setLocalError('A jelszónak legalább 6 karakter kell!'); return }
    if (password !== confirm) { setLocalError('A két jelszó nem egyezik!'); return }
    setLocalError('')
    setStep(2)
  }

  const inputClass = "w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-[14px] text-slate-800 placeholder-slate-400 focus:ring-2 focus:ring-emerald-400/30 focus:border-emerald-400 outline-none transition-all"
  const labelClass = "block text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-2"

  const Spinner = () => (
    <span className="w-4 h-4 border-[3px] border-emerald-300 border-t-white rounded-full animate-spin inline-block" />
  )

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
          onClick={() => { setTab('login'); setStep(1); setLocalError('') }}
          disabled={isPending}
          className={`flex-1 py-2 text-[13px] font-bold rounded-lg transition-all ${tab === 'login' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
        >
          Bejelentkezés
        </button>
        <button
          onClick={() => { setTab('register'); setStep(1); setLocalError('') }}
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

      {/* ===== REGISZTRÁCIÓ — 1. lépés ===== */}
      {tab === 'register' && step === 1 && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 mb-6">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-emerald-500 text-white text-[11px] font-bold flex items-center justify-center shadow-sm shadow-emerald-200">1</div>
              <span className="text-[12px] font-bold text-slate-700">Fiók adatok</span>
            </div>
            <div className="flex-1 h-px bg-slate-200 mx-1"></div>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-slate-100 text-slate-400 text-[11px] font-bold flex items-center justify-center">2</div>
              <span className="text-[12px] font-medium text-slate-400">Csomag</span>
            </div>
          </div>

          <div>
            <label className={labelClass}>Email cím</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="adatvedelem@sze.hu" className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Jelszó</label>
            <div className="relative">
              <input type={showPass ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} placeholder="Minimum 6 karakter" className={inputClass + ' pr-11'} />
              <button type="button" onClick={() => setShowPass(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors">
                {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>
          <div>
            <label className={labelClass}>Jelszó megerősítése</label>
            <div className="relative">
              <input type={showConfirm ? 'text' : 'password'} value={confirm} onChange={e => setConfirm(e.target.value)} placeholder="••••••••" className={inputClass + ' pr-11'} />
              <button type="button" onClick={() => setShowConfirm(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors">
                {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>
          <button type="button" onClick={handleNext}
            className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-emerald-500/20 transition-all text-[14px] flex items-center justify-center gap-2 group">
            Tovább
            <ArrowRight size={16} className="group-hover:translate-x-0.5 transition-transform" />
          </button>
          <p className="text-center text-[12px] text-slate-400">
            Van már fiókod?{' '}
            <button type="button" onClick={() => setTab('login')} className="text-emerald-600 font-bold hover:text-emerald-700 transition-colors">
              Jelentkezz be
            </button>
          </p>
        </div>
      )}

      {/* ===== REGISZTRÁCIÓ — 2. lépés ===== */}
      {tab === 'register' && step === 2 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 mb-5">
            <div className="flex items-center gap-2">
              <button type="button" onClick={() => setStep(1)} disabled={isPending} className="w-6 h-6 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200 text-[11px] font-bold flex items-center justify-center hover:bg-emerald-100 transition-colors">1</button>
              <span className="text-[12px] font-medium text-slate-400">Fiók adatok</span>
            </div>
            <div className="flex-1 h-px bg-emerald-200 mx-1"></div>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-emerald-500 text-white text-[11px] font-bold flex items-center justify-center shadow-sm shadow-emerald-200">2</div>
              <span className="text-[12px] font-bold text-slate-700">Csomag</span>
            </div>
          </div>

          <p className="text-[12px] text-slate-400 mb-3">Válaszd ki az előfizetési csomagodat. Később bármikor módosíthatod.</p>

          <div className="flex flex-col gap-2">
            {PLANS.map(plan => (
              <button
                key={plan.id}
                type="button"
                disabled={isPending}
                onClick={() => setSelectedPlan(plan.id)}
                className={`w-full flex items-center justify-between p-3.5 rounded-xl border transition-all text-left ${
                  selectedPlan === plan.id
                    ? 'border-emerald-400 bg-emerald-50 shadow-sm'
                    : 'border-slate-200 hover:border-slate-300 bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${selectedPlan === plan.id ? 'border-emerald-500 bg-emerald-500' : 'border-slate-300'}`}>
                    {selectedPlan === plan.id && <Check size={10} className="text-white" />}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-[13px] text-slate-800">{plan.name}</span>
                      {plan.highlight && <span className="text-[9px] font-bold bg-emerald-500 text-white px-2 py-0.5 rounded-full uppercase">Népszerű</span>}
                    </div>
                    <div className="text-[11px] text-slate-400">{plan.quotaLabel}</div>
                  </div>
                </div>
                <div className="text-right">
                  <span className="font-black text-[13px] text-slate-800">{plan.price}</span>
                  <span className="text-[11px] text-slate-400 ml-1">{plan.per}</span>
                </div>
              </button>
            ))}
          </div>

          <button
            type="button"
            disabled={isPending}
            onClick={() => {
              const formData = new FormData()
              formData.set('email', email)
              formData.set('password', password)
              formData.set('plan', selectedPlan)
              startTransition(() => { signup(formData) })
            }}
            className="w-full bg-emerald-500 hover:bg-emerald-600 disabled:opacity-80 disabled:cursor-not-allowed text-white font-bold py-3.5 rounded-xl shadow-lg shadow-emerald-500/20 transition-all text-[14px] flex items-center justify-center gap-2 group mt-1"
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
        </div>
      )}
    </div>
  )
}