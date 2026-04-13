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
    <div className="h-screen flex bg-[#133636] font-sans overflow-hidden">

      {/* Háttér geometria */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Zöld glow bal felül */}
        <div className="absolute -top-40 -left-40 w-[600px] h-[600px] rounded-full bg-emerald-500/10 blur-[120px]" />
        {/* Sötét zöld glow jobb alul */}
        <div className="absolute -bottom-40 -right-20 w-[500px] h-[500px] rounded-full bg-emerald-700/8 blur-[100px]" />
        {/* Grid pattern */}
        <div className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)`,
            backgroundSize: '40px 40px'
          }}
        />
      </div>

      {/* Bal oldal — branding */}
      <div className="hidden lg:flex flex-col justify-between w-[52%] p-14 pl-50 relative">

        {/* Logo */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-emerald-500 flex items-center justify-center shadow-lg shadow-emerald-500/30">
            <ShieldCheck size={20} className="text-white" />
          </div>
          <span className="text-xl font-bold text-white tracking-tight">
            Data<span className="text-emerald-400">Komp</span>
          </span>
        </div>

        {/* Közép tartalom */}
        <div className="max-w-3xl pl-8">
      
          <h1 className="text-5xl font-black text-white leading-tight mb-5 tracking-tight">
            Adatvagyon & Adatvédelem<br />
            <span className="text-emerald-400"> kezelése egy rendszerben.</span>
          </h1>

          <p className="text-white/40 text-[15px] leading-relaxed mb-10">
            Kezelje az adatvédelmi kötelezettségeit, adatvagyonát egyetlen platformon. 
          </p>

          {/* Feature kártyák */}
          <div className="grid grid-cols-2 gap-3">
            {[
              { icon: Map, label: 'Adattérkép', desc: 'Automatikus rendszertérkép' },
              { icon: FileText, label: 'Tájékoztatók', desc: 'Generálás egy kattintással' },
              { icon: Lock, label: 'GDPR követés', desc: 'Folyamatos megfelelőség' },
              { icon: ShieldCheck, label: 'Integráció', desc: 'Meglévő rendszerek' },
            ].map(({ icon: Icon, label, desc }) => (
              <div key={label} className="flex items-start gap-3 p-4 bg-white/[0.03] border border-white/[0.06] rounded-2xl hover:bg-white/[0.05] transition-colors">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/15 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Icon size={15} className="text-emerald-400" />
                </div>
                <div>
                  <div className="text-[13px] font-bold text-white/80">{label}</div>
                  <div className="text-[11px] text-white/30 mt-0.5">{desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <p className="text-white/70 text-[12px]">© 2026 DataKomp. Minden jog fenntartva.</p>
      </div>

      {/* Jobb oldal — form panel */}
      <div className="flex-1 flex items-center justify-center p-8 relative">

        {/* Panel */}
        <div className="w-full max-w-[420px]">

          {/* Mobil logo */}
          <div className="lg:hidden flex items-center gap-2 mb-8 justify-center">
            <div className="w-9 h-9 rounded-xl bg-emerald-500 flex items-center justify-center">
              <ShieldCheck size={20} className="text-white" />
            </div>
            <span className="text-xl font-bold text-white">Data<span className="text-emerald-400">Komp</span></span>
          </div>

          {/* Form kártya */}
          <div className="bg-white/[0.04] border border-white/10 rounded-3xl p-8 backdrop-blur-sm shadow-2xl shadow-black/40">
            <LoginForm initialTab={tab} error={error} />
          </div>

          {/* Lábléc */}
          <p className="text-center text-[11px] text-white/70 mt-6">
            A belépéssel elfogadod az{' '}
            <a href="#" className="text-white/80 hover:text-white/60 underline underline-offset-2 transition-colors">Adatvédelmi tájékoztatót</a>
            {' '}és az{' '}
            <a href="#" className="text-white/80 hover:text-white/60 underline underline-offset-2 transition-colors">ÁSZF-et</a>.
          </p>
        </div>
      </div>
    </div>
  );
}