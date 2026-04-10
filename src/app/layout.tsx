import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Link from "next/link";
import { NavLinks } from '@/components/nav-links'
import { GlobalSearch } from '@/components/global-search'
import {
  Bell,
  HelpCircle,
  ShieldCheck,
} from "lucide-react";

// --- SUPABASE IMPORTOK ---
import { createClient } from "@/utils/supabase/server";
import { logout } from "@/app/login/actions";

// --- PROVIDERS ---
import { Providers } from "@/components/providers";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "DataKomp | Adatvédelmi Menedzser",
  description: "Automatizált GDPR és Adatvédelmi megfelelőség.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const userInitials = user?.email ? user.email.substring(0, 2).toUpperCase() : "DK";

  let companyData: { id: string; plan: string } | null = null
  let websiteCount = 0

  if (user) {
    const { data: company } = await supabase
      .from('companies')
      .select('id, plan')
      .eq('user_id', user.id)
      .single()

    if (company) {
      companyData = company
      const { count } = await supabase
        .from('websites')
        .select('id', { count: 'exact', head: true })
        .eq('company_id', company.id)
      websiteCount = count ?? 0
    }
  }

  const plan = companyData?.plan ?? 'free'
  const quota = plan === 'free' ? 3 : plan === 'pro' ? 30 : null
  const planLabel = plan === 'free' ? 'Free' : plan === 'pro' ? 'Pro' : 'Max'
  const quotaPercent = quota ? Math.min((websiteCount / quota) * 100, 100) : 100
  const isOverQuota = quota !== null && websiteCount >= quota
  const quotaColor = isOverQuota ? 'bg-red-500' : 'bg-emerald-500'

  return (
    <html lang="hu">
      <body className={`${inter.className} bg-[#f8faf9] text-slate-800 overflow-hidden`}>
        <Providers>
          <div className="flex h-screen w-full">

            {/* ================= SIDEBAR ================= */}
            <aside className="hidden md:flex flex-col w-[280px] bg-white border-r border-slate-100 z-20 shadow-[2px_0_20px_rgba(0,0,0,0.015)]">

              {/* Logó */}
              <div className="h-[72px] flex items-center px-6 border-b border-slate-50">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-[10px] bg-emerald-500 flex items-center justify-center shadow-[0_4px_12px_rgba(16,185,129,0.3)]">
                    <ShieldCheck className="text-white" size={18} />
                  </div>
                  <span className="text-xl font-bold text-slate-900 tracking-tight">
                    Data<span className="text-emerald-600">Komp</span>
                  </span>
                </div>
              </div>

              {/* Csomag blokk */}
              <div className="px-5 py-6">
                <div className="w-full flex items-center justify-between px-4 py-3 bg-white border border-slate-200 rounded-[12px] shadow-sm">
                  <div className="flex flex-col text-left">
                    <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-0.5">Csomag</span>
                    <span className="text-sm font-bold text-slate-800 flex items-center gap-2">
                      {planLabel}
                      <span className={`text-[10px] px-2 py-0.5 rounded-md font-bold ${
                        plan === 'free' ? 'bg-slate-100 text-slate-500' :
                        plan === 'pro' ? 'bg-blue-50 text-blue-600' :
                        'bg-amber-50 text-amber-600'
                      }`}>
                        {quota === null ? '∞ végtelen' : `${websiteCount} / ${quota} oldal`}
                      </span>
                    </span>
                  </div>
                </div>
              </div>

              <NavLinks />

              {/* Kvóta szekció */}
              <div className="p-5 border-t border-slate-50 mt-auto">
                <div className="bg-slate-50 rounded-[12px] p-4 border border-slate-100">
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-[12px] text-slate-600 font-medium">Rendszer kvóta</span>
                    <span className={`text-[12px] font-bold px-2.5 py-0.5 rounded-md ${
                      isOverQuota ? 'text-red-700 bg-red-100' : 'text-emerald-700 bg-emerald-100'
                    }`}>
                      {quota === null ? '∞ / ∞' : `${websiteCount} / ${quota}`}
                    </span>
                  </div>
                  <div className="w-full bg-slate-200/60 rounded-full h-1.5 mb-4">
                    {quota === null ? (
                      <div className="bg-amber-400 h-1.5 rounded-full w-full"></div>
                    ) : (
                      <div
                        className={`${quotaColor} h-1.5 rounded-full transition-all`}
                        style={{ width: `${quotaPercent}%` }}
                      ></div>
                    )}
                  </div>
                  <Link
                    href="/settings"
                    className="w-full text-[12px] font-semibold text-slate-600 hover:text-emerald-700 transition-colors text-left flex items-center justify-between"
                  >
                    <span>Csomag bővítése</span>
                    <span className="text-lg leading-none">→</span>
                  </Link>
                </div>
              </div>
            </aside>

            {/* ================= FŐ TARTALOM ================= */}
            <div className="flex-1 flex flex-col h-screen overflow-hidden relative bg-[#f8faf9]">

              {/* ================= HEADER ================= */}
              <header className="h-[72px] bg-white border-b border-slate-200/80 flex items-center justify-between px-8 z-10 shadow-[0_2px_10px_rgba(0,0,0,0.01)]">

                <GlobalSearch />

                <div className="flex items-center gap-5 ml-auto">
                  <button className="text-slate-400 hover:text-slate-700 transition-colors w-9 h-9 flex items-center justify-center rounded-full hover:bg-slate-100">
                    <HelpCircle size={20} />
                  </button>

                  <button className="relative text-slate-400 hover:text-slate-700 transition-colors w-9 h-9 flex items-center justify-center rounded-full hover:bg-slate-100">
                    <Bell size={20} />
                    <span className="absolute top-2 right-2 flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                    </span>
                  </button>

                  <div className="h-6 w-px bg-slate-200 mx-1"></div>

                  <div className="flex items-center gap-3 cursor-pointer group pl-1">
                    <div className="text-right hidden sm:block">
                      <div className="text-[13px] font-bold text-slate-700 group-hover:text-emerald-700 transition-colors">
                        {user?.email || "Vendég Felhasználó"}
                      </div>
                      <form action={logout}>
                        <button type="submit" className="text-[11px] text-slate-500 hover:text-red-500 font-semibold uppercase tracking-widest mt-0.5 transition-colors">
                          Kijelentkezés
                        </button>
                      </form>
                    </div>
                    <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold text-sm border border-emerald-100 group-hover:bg-emerald-100 transition-colors">
                      {userInitials}
                    </div>
                  </div>
                </div>
              </header>

              {/* ================= TARTALOM & FOOTER ================= */}
              <main className="flex-1 overflow-y-auto scroll-smooth">
                <div className="min-h-[calc(100vh-72px-76px)] p-6 lg:p-12 xl:px-16 w-full">
                  {children}
                </div>

                <footer className="border-t border-slate-200 bg-white py-6 px-6 lg:px-12 xl:px-16 w-full">
                  <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-[13px] text-slate-500">
                    <div>
                      &copy; 2026 <span className="font-bold text-slate-700">DataKomp</span>. Minden jog fenntartva.
                    </div>
                    <div className="flex gap-8 font-medium">
                      <a href="#" className="hover:text-emerald-600 transition-colors">Adatvédelmi tájékoztató</a>
                      <a href="#" className="hover:text-emerald-600 transition-colors">Általános Szerződési Feltételek</a>
                      <a href="#" className="hover:text-emerald-600 transition-colors">Súgóközpont</a>
                    </div>
                  </div>
                </footer>
              </main>
            </div>
          </div>
        </Providers>
      </body>
    </html>
  );
}