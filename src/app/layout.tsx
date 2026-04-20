import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Link from "next/link";
import Image from "next/image";
import { NavLinks } from '@/components/nav-links'
import { GlobalSearch } from '@/components/global-search'
import { Suspense } from "react";
import {
  Bell,
  HelpCircle,
} from "lucide-react";

import { createClient } from "@/utils/supabase/server";
import { logout } from "@/app/login/actions";
import { Providers } from "@/components/providers";

const inter = Inter({ 
  subsets: ["latin"],
  display: 'swap',
  preload: true,
});

export const metadata: Metadata = {
  title: "DataKomp | Adatvédelmi Menedzser",
  description: "Automatizált GDPR és Adatvédelmi megfelelőség.",
};

// --- Kvóta szekció külön Server Component → Suspense-be kerül ---
async function SidebarQuota({ userId }: { userId: string }) {
  const supabase = await createClient();

  const { data: company } = await supabase
    .from('companies')
    .select('id, plan, websites(count)')
    .eq('user_id', userId)
    .single();

  const plan = company?.plan ?? 'free';
  const websiteCount = (company?.websites as any)?.[0]?.count ?? 0;
  const quota = plan === 'free' ? 3 : plan === 'pro' ? 30 : null;
  const planLabel = plan === 'free' ? 'Free' : plan === 'pro' ? 'Pro' : 'Max';
  const quotaPercent = quota ? Math.min((websiteCount / quota) * 100, 100) : 100;
  const isOverQuota = quota !== null && websiteCount >= quota;
  const quotaColor = isOverQuota ? 'bg-red-500' : 'bg-emerald-500';

  return (
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
  );
}

// --- Kvóta skeleton (Suspense fallback) ---
function QuotaSkeleton() {
  return (
    <div className="p-5 border-t border-slate-50 mt-auto">
      <div className="bg-slate-50 rounded-[12px] p-4 border border-slate-100 animate-pulse">
        <div className="flex justify-between items-center mb-3">
          <div className="h-3 w-24 bg-slate-200 rounded"></div>
          <div className="h-5 w-12 bg-slate-200 rounded-md"></div>
        </div>
        <div className="w-full bg-slate-200/60 rounded-full h-1.5 mb-4"></div>
        <div className="h-3 w-28 bg-slate-200 rounded"></div>
      </div>
    </div>
  );
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const userInitials = user?.email ? user.email.substring(0, 2).toUpperCase() : "DK";

  return (
    <html lang="hu">
      <body className={`${inter.className} bg-[#f8faf9] text-slate-800 overflow-hidden`}>
        <Providers>
          <div className="flex h-screen w-full">

            {/* ================= SIDEBAR ================= */}
            {user && (
              <aside className="hidden md:flex flex-col w-[280px] bg-white border-r border-slate-100 z-20 shadow-[2px_0_20px_rgba(0,0,0,0.015)]">

                {/* Logó */}
                <div className="h-[72px] flex items-center px-6 border-b border-slate-50">
                  <Link href="/" className="flex items-center gap-3">
                    <Image
                      src="/szelogo.png"
                      alt="Széchenyi István Egyetem"
                      width={160}
                      height={68}
                      priority
                      className="h-17 w-auto object-contain"
                    />
                  </Link>
                </div>

                <NavLinks />

                {/* Kvóta — Suspense-be csomagolva, nem blokkolja az oldalt */}
                <Suspense fallback={<QuotaSkeleton />}>
                  <SidebarQuota userId={user.id} />
                </Suspense>

              </aside>
            )}

            {/* ================= FŐ TARTALOM ================= */}
            <div className="flex-1 flex flex-col h-screen overflow-hidden relative bg-[#f8faf9]">

              {/* ================= HEADER ================= */}
              {user && (
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
              )}

              {/* ================= TARTALOM & FOOTER ================= */}
              <main
                className={`flex-1 ${!user ? 'overflow-hidden' : 'overflow-y-auto'} scroll-smooth`}
                style={user ? { scrollbarGutter: 'stable' } : undefined}
              >
                <div className={user
                  ? "min-h-[calc(100vh-72px-76px)] p-6 lg:p-12 xl:px-16 w-full"
                  : "h-full w-full p-0 m-0"
                }>
                  {children}
                </div>
                {user && (
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
                )}
              </main>
            </div>
          </div>
        </Providers>
      </body>
    </html>
  );
}