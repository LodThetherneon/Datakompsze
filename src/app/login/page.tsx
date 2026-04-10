import { ShieldCheck } from "lucide-react";
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
    <div className="min-h-screen flex bg-[#f8faf9] font-sans">
      
      {/* Bal oldal — branding */}
      <div className="hidden lg:flex flex-col justify-between w-[45%] bg-gradient-to-br from-emerald-600 to-emerald-800 p-12 text-white">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center">
            <ShieldCheck size={20} className="text-white" />
          </div>
          <span className="text-xl font-bold tracking-tight">DataKomp</span>
        </div>
        <div>
          <h2 className="text-4xl font-black leading-tight mb-4">
            GDPR megfelelőség,<br />automatizálva.
          </h2>
          <p className="text-emerald-100 text-[15px] leading-relaxed max-w-sm">
            Kezeld az adatvédelmi kötelezettségeidet egyetlen helyen — adattérképezéstől a tájékoztatók generálásáig.
          </p>
          <div className="mt-8 flex flex-col gap-3">
            {['Automatikus adattérkép', 'Tájékoztató generálás', 'GDPR megfelelőség követés', 'Rendszer integráció'].map(f => (
              <div key={f} className="flex items-center gap-2 text-[14px] text-emerald-100">
                <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
                  <span className="text-[10px]">✓</span>
                </div>
                {f}
              </div>
            ))}
          </div>
        </div>
        <p className="text-emerald-200/60 text-[12px]">© 2026 DataKomp. Minden jog fenntartva.</p>
      </div>

      {/* Jobb oldal — form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <div className="lg:hidden flex items-center gap-2 mb-8 justify-center">
            <div className="w-9 h-9 rounded-xl bg-emerald-500 flex items-center justify-center">
              <ShieldCheck size={20} className="text-white" />
            </div>
            <span className="text-xl font-bold text-slate-900">Data<span className="text-emerald-600">Komp</span></span>
          </div>

          <LoginForm initialTab={tab} error={error} />
        </div>
      </div>
    </div>
  );
}