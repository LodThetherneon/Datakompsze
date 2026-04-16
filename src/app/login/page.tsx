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
    <div className="h-screen flex bg-[#193A47] font-sans overflow-hidden">

      {/* Háttér geometria */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Zöld glow bal felül */}
        <div className="absolute -top-60 -left-60 w-[2500px] h-[500px] rounded-full bg-emerald-400/20 blur-[200px]" />
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
      <div className="hidden lg:flex flex-col justify-between w-[60%] p-15 pl-30 relative">

        {/* Logo */}
        <div className="flex items-center gap-3">
          <img
            src="/szelogo-removebg-preview.png"
            alt="Széchenyi István Egyetem"
            className="h-22 w-auto object-contain"
            style={{ mixBlendMode: 'multiply' }}
          />
        </div>

        {/* Közép tartalom */}
        <div className="max-w-3xl pl-2">
      
          <h1 className="text-5xl font-black text-white leading-tight mb-5 tracking-tight">
            Adatvagyont & Adatvédelmet<br />
            <span className="text-emerald-400"> kezelő rendszer </span>
          </h1>

          <p className="text-white/80 text-[15px] leading-relaxed mb-10">
            Kezelje az adatvédelmi kötelezettségeit, adatvagyonát egyetlen platformon. 
          </p>

          {/* Feature kártyák */}
          <div className="grid grid-cols-2 gap-3">
            {[
              { icon: Map, label: 'Adattérkép', desc: 'Adatvagyon adatbázis' },
              { icon: FileText, label: 'Tájékoztatók', desc: 'Generálás egy kattintással' },
              { icon: Lock, label: 'Adatkezelések', desc: 'Folyamatos megfelelőség' },
              { icon: ShieldCheck, label: 'Integráció', desc: 'Meglévő rendszerekhez, folyamatokhoz' },
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

        <p className="text-white/80 text-[12px] mt-8">© 2026 Széchenyi István Egyetem. Minden jog fenntartva.</p>
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
          <p className="text-center text-[11px] text-white/80 mt-6">
            A belépéssel elfogadod az{' '}
            <a href="#" className="text-white/80 hover:text-white/90 underline underline-offset-2 transition-colors">Adatvédelmi tájékoztatót</a>
            {' '}és az{' '}
            <a href="#" className="text-white/80 hover:text-white/90 underline underline-offset-2 transition-colors">ÁSZF-et</a>.
          </p>
        </div>
      </div>
    </div>
  );
}