import { ShieldCheck, Lock, FileText, Map } from "lucide-react";
import { LoginForm } from "./login-form";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; tab?: string }>;
}) {
  const params = await searchParams;
  const error = params.error;
  const tab = params.tab ?? 'login';

  return (
    <div className="min-h-screen flex font-sans overflow-hidden">

      {/* Bal oldal — zöldes branding */}
      <div className="hidden lg:flex flex-col justify-between w-[60%] p-16 pl-20 relative bg-emerald-600 overflow-hidden">

        {/* Háttér rétegek */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-40 -left-40 w-[600px] h-[600px] rounded-full bg-emerald-500/40 blur-[120px]" />
          <div className="absolute -bottom-40 right-0 w-[500px] h-[500px] rounded-full bg-emerald-800/50 blur-[100px]" />
          <div className="absolute inset-0 opacity-[0.04]"
            style={{
              backgroundImage: `linear-gradient(rgba(255,255,255,0.6) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.6) 1px, transparent 1px)`,
              backgroundSize: '36px 36px'
            }}
          />
        </div>

        {/* Logo */}
        <div className="relative z-10 flex items-center gap-3">
          <img
            src="/szelogo-removebg-preview.png"
            alt="Széchenyi István Egyetem"
            className="h-28 w-auto object-contain brightness-0 invert opacity-90"
          />
        </div>

        {/* Közép tartalom */}
        <div className="relative z-10 max-w-2xl">
          <h1 className="text-[46px] font-black text-white leading-[1.1] mb-5 tracking-tight">
            Adatvagyont & Adatvédelmet{' '}
            <span className="text-emerald-200">kezelő rendszer</span>
          </h1>

          <p className="text-emerald-100/80 text-[15px] leading-relaxed mb-10 [max-width:none]">
            Kezelje az adatvédelmi kötelezettségeit, adatvagyonát egyetlen platformon.
          </p>

          {/* Feature kártyák */}
          <div className="grid grid-cols-2 gap-3">
            {[
              { icon: Map, label: 'Adattérkép', desc: 'Adatvagyon adatbázis' },
              { icon: FileText, label: 'Tájékoztatók', desc: 'Generálás egy kattintással' },
              { icon: Lock, label: 'Adatkezelések', desc: 'Folyamatos megfelelőség' },
              { icon: ShieldCheck, label: 'Integráció', desc: 'Meglévő rendszerekhez' },
            ].map(({ icon: Icon, label, desc }) => (
              <div key={label} className="flex items-start gap-3 p-4 bg-white/10 border border-white/20 rounded-2xl hover:bg-white/15 transition-colors backdrop-blur-sm">
                <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Icon size={15} className="text-white" />
                </div>
                <div>
                  <div className="text-[13px] font-bold text-white">{label}</div>
                  <div className="text-[11px] text-emerald-100/60 mt-0.5">{desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <p className="relative z-10 text-emerald-100/50 text-[12px]">
          © 2026 Széchenyi István Egyetem. Minden jog fenntartva.
        </p>
      </div>

      {/* Jobb oldal — form panel, fehér */}
      <div className="flex-1 flex items-center justify-center p-8 bg-white relative">

        {/* Éles bal oldali árnyék/elválasztás */}
        <div className="hidden lg:block absolute left-0 inset-y-0 w-px bg-emerald-700/30" />
        <div className="hidden lg:block absolute left-0 inset-y-0 w-8 bg-gradient-to-r from-emerald-900/5 to-transparent" />

        <div className="w-full max-w-[390px]">

          {/* Mobil logo */}
          <div className="lg:hidden flex items-center gap-2.5 mb-10 justify-center">
            <div className="w-9 h-9 rounded-xl bg-emerald-500 flex items-center justify-center shadow-lg shadow-emerald-500/30">
              <ShieldCheck size={18} className="text-white" />
            </div>
            <span className="text-xl font-black text-slate-800">Data<span className="text-emerald-500">Komp</span></span>
          </div>

          {/* Form kártya */}
          <div className="bg-white border border-slate-200/80 rounded-3xl p-8 shadow-xl shadow-slate-200/60">
            <LoginForm initialTab={tab} error={error} />
          </div>

          {/* Lábléc */}
          <p className="text-center text-[11px] text-slate-400 mt-5">
            A belépéssel elfogadod az{' '}
            <a href="#" className="text-slate-500 hover:text-slate-700 underline underline-offset-2 transition-colors">Adatvédelmi tájékoztatót</a>
            {' '}és az{' '}
            <a href="#" className="text-slate-500 hover:text-slate-700 underline underline-offset-2 transition-colors">ÁSZF-et</a>.
          </p>
        </div>
      </div>
    </div>
  );
}