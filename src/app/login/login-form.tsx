'use client'

import { useState } from 'react'
import { login, signup } from './actions'
import { Check, Zap, Infinity } from 'lucide-react'

const PLANS = [
  {
    id: 'free',
    name: 'Free',
    price: '0 Ft / hó',
    quotaLabel: '3 rendszer',
    features: ['3 bekötött rendszer', 'Korlátlan adattípus', 'Tájékoztató generálás'],
  },
  {
    id: 'pro',
    name: 'Pro',
    price: '4 990 Ft / hó',
    quotaLabel: '30 rendszer',
    features: ['30 bekötött rendszer', 'Korlátlan tájékoztató', 'Policy verziókövetés'],
    highlight: true,
  },
  {
    id: 'max',
    name: 'Max',
    price: '14 990 Ft / hó',
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

  const handleNext = () => {
    if (!email || !password) { setLocalError('Add meg az email címed és jelszavad!'); return }
    if (password.length < 6) { setLocalError('A jelszónak legalább 6 karakter kell!'); return }
    if (password !== confirm) { setLocalError('A két jelszó nem egyezik!'); return }
    setLocalError('')
    setStep(2)
  }

  return (
    <div className="bg-white rounded-2xl shadow-[0_8px_30px_rgba(0,0,0,0.06)] border border-slate-100 p-8">

      {/* Tab váltó */}
      <div className="flex bg-slate-100 p-1 rounded-xl mb-8">
        <button
          onClick={() => { setTab('login'); setStep(1); setLocalError('') }}
          className={`flex-1 py-2.5 text-[13px] font-bold rounded-lg transition-all ${tab === 'login' ? 'bg-white shadow-sm text-slate-800' : 'text-slate-500 hover:text-slate-700'}`}
        >
          Bejelentkezés
        </button>
        <button
          onClick={() => { setTab('register'); setStep(1); setLocalError('') }}
          className={`flex-1 py-2.5 text-[13px] font-bold rounded-lg transition-all ${tab === 'register' ? 'bg-white shadow-sm text-slate-800' : 'text-slate-500 hover:text-slate-700'}`}
        >
          Regisztráció
        </button>
      </div>

      {/* Hibaüzenet */}
      {localError && (
        <div className="bg-red-50 text-red-600 text-[13px] p-3 rounded-lg mb-5 border border-red-100 text-center">
          {localError}
        </div>
      )}

      {/* ===== BEJELENTKEZÉS ===== */}
      {tab === 'login' && (
        <form className="space-y-5">
          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-2">Email cím</label>
            <input name="email" type="email" required placeholder="admin@ceg.hu"
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-[13px] focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all" />
          </div>
          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-2">Jelszó</label>
            <input name="password" type="password" required placeholder="••••••••"
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-[13px] focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all" />
          </div>
          <button formAction={login}
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-xl shadow-sm transition-colors text-[14px] mt-2">
            Belépés
          </button>
          <p className="text-center text-[12px] text-slate-400 mt-2">
            Még nincs fiókod?{' '}
            <button type="button" onClick={() => setTab('register')} className="text-emerald-600 font-bold hover:underline">
              Regisztrálj ingyen
            </button>
          </p>
        </form>
      )}

      {/* ===== REGISZTRÁCIÓ — 1. lépés: adatok ===== */}
      {tab === 'register' && step === 1 && (
        <div className="space-y-5">
          <div>
            <div className="flex items-center gap-2 mb-6">
              <div className="w-6 h-6 rounded-full bg-emerald-500 text-white text-[11px] font-bold flex items-center justify-center">1</div>
              <span className="text-[13px] font-bold text-slate-700">Fiók adatok</span>
              <div className="flex-1 h-px bg-slate-200 mx-2"></div>
              <div className="w-6 h-6 rounded-full bg-slate-200 text-slate-400 text-[11px] font-bold flex items-center justify-center">2</div>
              <span className="text-[13px] font-medium text-slate-400">Csomag</span>
            </div>
          </div>
          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-2">Email cím</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="admin@ceg.hu"
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-[13px] focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all" />
          </div>
          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-2">Jelszó</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Minimum 6 karakter"
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-[13px] focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all" />
          </div>
          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-2">Jelszó megerősítése</label>
            <input type="password" value={confirm} onChange={e => setConfirm(e.target.value)} placeholder="••••••••"
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-[13px] focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all" />
          </div>
          <button type="button" onClick={handleNext}
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-xl transition-colors text-[14px]">
            Tovább →
          </button>
          <p className="text-center text-[12px] text-slate-400">
            Van már fiókod?{' '}
            <button type="button" onClick={() => setTab('login')} className="text-emerald-600 font-bold hover:underline">
              Jelentkezz be
            </button>
          </p>
        </div>
      )}

      {/* ===== REGISZTRÁCIÓ — 2. lépés: csomag ===== */}
      {tab === 'register' && step === 2 && (
        <form action={signup} className="space-y-5">
          <input type="hidden" name="email" value={email} />
          <input type="hidden" name="password" value={password} />
          <input type="hidden" name="plan" value={selectedPlan} />

          <div className="flex items-center gap-2 mb-2">
            <button type="button" onClick={() => setStep(1)} className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 text-[11px] font-bold flex items-center justify-center hover:bg-emerald-200 transition-colors">1</button>
            <span className="text-[13px] font-medium text-slate-400">Fiók adatok</span>
            <div className="flex-1 h-px bg-slate-200 mx-2"></div>
            <div className="w-6 h-6 rounded-full bg-emerald-500 text-white text-[11px] font-bold flex items-center justify-center">2</div>
            <span className="text-[13px] font-bold text-slate-700">Csomag</span>
          </div>

          <p className="text-[13px] text-slate-500 mb-2">Válaszd ki az előfizetési csomagod. Később bármikor módosíthatod.</p>

          <div className="flex flex-col gap-3">
            {PLANS.map(plan => (
              <button
                key={plan.id}
                type="button"
                onClick={() => setSelectedPlan(plan.id)}
                className={`w-full flex items-center justify-between p-4 rounded-xl border-2 transition-all text-left ${
                  selectedPlan === plan.id
                    ? 'border-emerald-500 bg-emerald-50/50'
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${selectedPlan === plan.id ? 'border-emerald-500 bg-emerald-500' : 'border-slate-300'}`}>
                    {selectedPlan === plan.id && <Check size={11} className="text-white" />}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-[14px] text-slate-800">{plan.name}</span>
                      {plan.highlight && <span className="text-[9px] font-bold bg-blue-500 text-white px-2 py-0.5 rounded-full uppercase">Népszerű</span>}
                    </div>
                    <div className="text-[11px] text-slate-400">{plan.quotaLabel}</div>
                  </div>
                </div>
                <span className="font-black text-[14px] text-slate-800">{plan.price}</span>
              </button>
            ))}
          </div>

          <button type="submit"
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-xl transition-colors text-[14px]">
            Regisztráció & Kezdés →
          </button>
        </form>
      )}
    </div>
  )
}