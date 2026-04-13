import { createClient } from "@/utils/supabase/server";
import { changePlan } from "./actions";
import { Crown, Zap, Check, Infinity } from "lucide-react";


const PLANS = [
  {
    id: 'free',
    name: 'Free',
    price: '0 Ft / hó',
    quotaLabel: '3 weboldal / rendszer',
    features: ['3 bekötött rendszer', 'Korlátlan adattípus', 'Tájékoztató generálás', 'Alapszintű scan'],
  },
  {
    id: 'pro',
    name: 'Pro',
    price: '4 990 Ft / hó',
    quotaLabel: '30 weboldal / rendszer',
    features: ['30 bekötött rendszer', 'Korlátlan adattípus', 'Korlátlan tájékoztató', 'Mélyebb scan', 'Policy verziókövetés'],
    highlight: true,
  },
  {
    id: 'max',
    name: 'Max',
    price: '14 990 Ft / hó',
    quotaLabel: 'Korlátlan rendszer',
    features: ['Korlátlan bekötött rendszer', 'Korlátlan adattípus', 'Korlátlan tájékoztató', 'Prioritásos scan', 'Audit log', 'Dedikált support'],
  },
]

export default async function SettingsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  let company: any = null;
  if (user) {
    const { data } = await supabase
      .from("companies").select("*").eq("user_id", user.id).single();
    company = data;
  }

  const currentPlan = company?.plan ?? 'free';

  const { count: websiteCount } = await supabase
    .from('websites')
    .select('id', { count: 'exact', head: true })
    .eq('company_id', company?.id ?? '');

  const used = websiteCount ?? 0;
  const quota = currentPlan === 'free' ? 3 : currentPlan === 'pro' ? 30 : null;
  const quotaPercent = quota ? Math.min((used / quota) * 100, 100) : 100;
  const isOverQuota = quota !== null && used >= quota;

  return (
    <div className="max-w-4xl space-y-10 font-sans">

      <header className="pb-6 border-b border-slate-200/80">
        <h1 className="text-3xl font-bold text-slate-800 tracking-tight">Előfizetés</h1>
        <p className="text-[14px] text-slate-500 mt-2 font-medium">
          Jelenlegi csomag és kvóta áttekintése, csomag módosítása.
        </p>
      </header>

      {/* JELENLEGI CSOMAG STÁTUSZ */}
      <section className="bg-white rounded-2xl border border-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.03)] p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-50 flex items-center justify-center border border-amber-100">
              <Crown size={18} className="text-amber-500" />
            </div>
            <div>
              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Jelenlegi csomag</div>
              <div className="text-[15px] font-bold text-slate-800 capitalize">{currentPlan} Plan</div>
            </div>
          </div>
          <span className="px-3 py-1.5 bg-emerald-50 text-emerald-700 text-[11px] font-bold rounded-lg border border-emerald-100">
            Aktív
          </span>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between text-[13px] font-medium text-slate-600">
            <span>Felhasznált kvóta</span>
            <span className="font-bold">{used} / {quota ?? '∞'} rendszer</span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-2">
            <div
              className={`h-2 rounded-full transition-all ${isOverQuota ? 'bg-red-500' : 'bg-emerald-500'}`}
              style={{ width: `${quota === null ? 40 : quotaPercent}%` }}
            />
          </div>
          {isOverQuota && (
            <p className="text-[12px] text-red-500 font-medium">
              Elérted a kvótát! Válts magasabb csomagra az új rendszerek hozzáadásához.
            </p>
          )}
        </div>
      </section>

      {/* CSOMAGOK */}
      <section>
        <h3 className="text-[15px] font-bold text-slate-800 mb-4">Csomagok</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {PLANS.map(plan => {
            const isActive = currentPlan === plan.id;
            return (
              <div key={plan.id} className={`relative bg-white rounded-2xl border-2 p-6 flex flex-col gap-4 transition-all ${
                isActive
                  ? 'border-emerald-500 shadow-[0_0_0_4px_rgba(16,185,129,0.08)]'
                  : plan.highlight
                  ? 'border-blue-200 shadow-md'
                  : 'border-slate-100'
              }`}>
                {isActive && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-emerald-500 text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-widest whitespace-nowrap">
                    Jelenlegi
                  </div>
                )}
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    {plan.id === 'max'
                      ? <Infinity size={15} className="text-amber-500" />
                      : <Zap size={15} className="text-blue-500" />}
                    <span className="font-black text-[16px] text-slate-800">{plan.name}</span>
                  </div>
                  <div className="text-[22px] font-black text-slate-900">{plan.price}</div>
                  <div className="text-[12px] text-slate-400 mt-0.5">{plan.quotaLabel}</div>
                </div>
                <ul className="space-y-2 flex-1">
                  {plan.features.map(f => (
                    <li key={f} className="flex items-center gap-2 text-[13px] text-slate-600">
                      <Check size={13} className="text-emerald-500 flex-shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
                {!isActive ? (
                  <form action={changePlan}>
                    <input type="hidden" name="plan" value={plan.id} />
                    <button type="submit" className={`w-full py-2.5 rounded-xl font-bold text-[13px] transition-all ${
                      plan.highlight
                        ? 'bg-blue-500 hover:bg-blue-600 text-white shadow-[0_4px_12px_rgba(59,130,246,0.3)]'
                        : plan.id === 'max'
                        ? 'bg-amber-500 hover:bg-amber-600 text-white shadow-[0_4px_12px_rgba(245,158,11,0.3)]'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                    }`}>
                      {plan.id === 'free' ? 'Visszaváltás Free-re' : `Váltás ${plan.name}-ra`}
                    </button>
                  </form>
                ) : (
                  <div className="w-full py-2.5 rounded-xl font-bold text-[13px] text-center bg-emerald-50 text-emerald-700 border border-emerald-100">
                    Aktív csomag
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

    </div>
  );
}