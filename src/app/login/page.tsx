import { ShieldCheck } from "lucide-react";
import { login, signup } from "./actions";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error: string }>;
}) {
  const error = (await searchParams).error;

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f8faf9] p-4 font-sans">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-[0_8px_30px_rgba(0,0,0,0.04)] border border-slate-100 p-8">
        
        {/* Logó */}
        <div className="flex flex-col items-center justify-center mb-8">
          <div className="w-12 h-12 rounded-xl bg-emerald-500 flex items-center justify-center shadow-lg shadow-emerald-500/20 mb-4">
            <ShieldCheck className="text-white" size={24} />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Data<span className="text-emerald-600">Komp</span></h1>
          <p className="text-sm text-slate-500 mt-1">Jelentkezz be a fiókodba!</p>
        </div>

        {/* Hibaüzenet (ha van) */}
        {error && (
          <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg mb-6 text-center border border-red-100">
            {error}
          </div>
        )}

        {/* Űrlap */}
        <form className="space-y-5">
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Email cím</label>
            <input 
              id="email" 
              name="email" 
              type="email" 
              required 
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
              placeholder="admin@datakomp.hu"
            />
          </div>
          
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Jelszó</label>
            <input 
              id="password" 
              name="password" 
              type="password" 
              required 
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
              placeholder="••••••••"
            />
          </div>

          <div className="pt-2 flex gap-3">
            <button formAction={login} className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-3 rounded-xl shadow-sm transition-colors">
              Belépés
            </button>
            <button formAction={signup} className="flex-1 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-semibold py-3 rounded-xl transition-colors">
              Regisztráció
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}