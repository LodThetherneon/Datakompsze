'use client'

import { useState } from 'react'
import { login, signup } from './actions'
import { Check, Eye, EyeOff, ArrowRight, Shield } from 'lucide-react'

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

  const handleNext = () => {
    if (!email || !password) { setLocalError('Add meg az email címed és jelszavad!'); return }
    if (password.length < 6) { setLocalError('A jelszónak legalább 6 karakter kell!'); return }
    if (password !== confirm) { setLocalError('A két jelszó nem egyezik!'); return }
    setLocalError('')
    setStep(2)
  }

  const inputClass = "w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-[14px] text-white placeholder-white/30 focus:ring-2 focus:ring-emerald-400/40 focus:border-emerald-400/60 outline-none transition-all"
  const labelClass = "block text-[11px] font-bold text-white/40 uppercase tracking-widest mb-2"

  return (
    <div className="w-full">

      {/* Tab váltó */}
      <div className="flex bg-white/5 border border-white/10 p-1 rounded-2xl mb-8">
        <button
          onClick={() => { setTab('login'); setStep(1); setLocalError('') }}
          className={`flex-1 py-2.5 text-[13px] font-bold rounded-xl transition-all ${tab === 'login' ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30' : 'text-white/50 hover:text-white/70'}`}
        >
          Bejelentkezés
        </button>
        <button
          onClick={() => { setTab('register'); setStep(1); setLocalError('') }}
          className={`flex-1 py-2.5 text-[13px] font-bold rounded-xl transition-all ${tab === 'register' ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30' : 'text-white/60 hover:text-white/70'}`}
        >
          Regisztráció
        </button>
      </div>

      {/* Hibaüzenet */}
      {localError && (
        <div className="bg-red-500/10 text-red-400 text-[13px] p-3 rounded-xl mb-6 border border-red-500/30 text-center">
          {localError}
        </div>
      )}

      {/* ===== BEJELENTKEZÉS ===== */}
      {tab === 'login' && (
        <form className="space-y-5">
          <div>
            <label className={labelClass}>Email cím</label>
            <input name="email" type="email" required placeholder="biztosadat@sze.hu" className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Jelszó</label>
            <div className="relative">
              <input name="password" type={showPass ? 'text' : 'password'} required placeholder="••••••••" className={inputClass + ' pr-11'} />
              <button type="button" onClick={() => setShowPass(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-white/70 hover:text-white/80 transition-colors">
                {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>
          <button formAction={login}
            className="w-full bg-emerald-500 hover:bg-emerald-400 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-emerald-500/20 transition-all text-[14px] flex items-center justify-center gap-2 mt-2 group">
            Belépés
            <ArrowRight size={16} className="group-hover:translate-x-0.5 transition-transform" />
          </button>
          <p className="text-center text-[12px] text-white/70 mt-2">
            Még nincs fiókod?{' '}
            <button type="button" onClick={() => setTab('register')} className="text-emerald-400 font-bold hover:text-emerald-300 transition-colors">
              Regisztrálj ingyen
            </button>
          </p>
        </form>
      )}

      {/* ===== REGISZTRÁCIÓ — 1. lépés ===== */}
      {tab === 'register' && step === 1 && (
        <div className="space-y-5">
          {/* Lépésjelző */}
          <div className="flex items-center gap-2 mb-6">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-emerald-500 text-white text-[11px] font-bold flex items-center justify-center">1</div>
              <span className="text-[12px] font-bold text-white">Fiók adatok</span>
            </div>
            <div className="flex-1 h-px bg-white/10 mx-1"></div>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-white/10 text-white/30 text-[11px] font-bold flex items-center justify-center">2</div>
              <span className="text-[12px] font-medium text-white/30">Csomag</span>
            </div>
          </div>

          <div>
            <label className={labelClass}>Email cím</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="admin@ceg.hu" className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Jelszó</label>
            <div className="relative">
              <input type={showPass ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} placeholder="Minimum 6 karakter" className={inputClass + ' pr-11'} />
              <button type="button" onClick={() => setShowPass(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors">
                {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>
          <div>
            <label className={labelClass}>Jelszó megerősítése</label>
            <div className="relative">
              <input type={showConfirm ? 'text' : 'password'} value={confirm} onChange={e => setConfirm(e.target.value)} placeholder="••••••••" className={inputClass + ' pr-11'} />
              <button type="button" onClick={() => setShowConfirm(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors">
                {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>
          <button type="button" onClick={handleNext}
            className="w-full bg-emerald-500 hover:bg-emerald-400 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-emerald-500/20 transition-all text-[14px] flex items-center justify-center gap-2 group">
            Tovább
            <ArrowRight size={16} className="group-hover:translate-x-0.5 transition-transform" />
          </button>
          <p className="text-center text-[12px] text-white/70">
            Van már fiókod?{' '}
            <button type="button" onClick={() => setTab('login')} className="text-emerald-400 font-bold hover:text-emerald-300 transition-colors">
              Jelentkezz be
            </button>
          </p>
        </div>
      )}

      {/* ===== REGISZTRÁCIÓ — 2. lépés ===== */}
      {tab === 'register' && step === 2 && (
        <form action={signup} className="space-y-4">
          <input type="hidden" name="email" value={email} />
          <input type="hidden" name="password" value={password} />
          <input type="hidden" name="plan" value={selectedPlan} />

          {/* Lépésjelző */}
          <div className="flex items-center gap-2 mb-5">
            <div className="flex items-center gap-2">
              <button type="button" onClick={() => setStep(1)} className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 text-[11px] font-bold flex items-center justify-center hover:bg-emerald-500/40 transition-colors">1</button>
              <span className="text-[12px] font-medium text-white/30">Fiók adatok</span>
            </div>
            <div className="flex-1 h-px bg-emerald-500/40 mx-1"></div>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-emerald-500 text-white text-[11px] font-bold flex items-center justify-center">2</div>
              <span className="text-[12px] font-bold text-white">Csomag</span>
            </div>
          </div>

          <p className="text-[12px] text-white/40 mb-3">Válaszd ki az előfizetési csomagodat. Később bármikor módosíthatod.</p>

          <div className="flex flex-col gap-2.5">
            {PLANS.map(plan => (
              <button key={plan.id} type="button" onClick={() => setSelectedPlan(plan.id)}
                className={`w-full flex items-center justify-between p-4 rounded-xl border transition-all text-left ${
                  selectedPlan === plan.id
                    ? 'border-emerald-500/60 bg-emerald-500/10'
                    : 'border-white/10 hover:border-white/20 bg-white/5'
                }`}>
                <div className="flex items-center gap-3">
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${selectedPlan === plan.id ? 'border-emerald-500 bg-emerald-500' : 'border-white/20'}`}>
                    {selectedPlan === plan.id && <Check size={10} className="text-white" />}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-[13px] text-white">{plan.name}</span>
                      {plan.highlight && <span className="text-[9px] font-bold bg-emerald-500 text-white px-2 py-0.5 rounded-full uppercase">Népszerű</span>}
                    </div>
                    <div className="text-[11px] text-white/30">{plan.quotaLabel}</div>
                  </div>
                </div>
                <div className="text-right">
                  <span className="font-black text-[13px] text-white">{plan.price}</span>
                  <span className="text-[11px] text-white/30 ml-1">{plan.per}</span>
                </div>
              </button>
            ))}
          </div>

          <button type="submit"
            className="w-full bg-emerald-500 hover:bg-emerald-400 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-emerald-500/20 transition-all text-[14px] flex items-center justify-center gap-2 group mt-2">
            Regisztráció & Kezdés
            <ArrowRight size={16} className="group-hover:translate-x-0.5 transition-transform" />
          </button>
        </form>
      )}
    </div>
  )
}