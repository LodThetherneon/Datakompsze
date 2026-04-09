import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Link from "next/link";
import { NavLinks } from '@/components/nav-links'
import { 
  LayoutDashboard, 
  FileText, 
  Database, 
  Settings, 
  Search, 
  Bell, 
  HelpCircle,
  ShieldCheck,
  ChevronRight
} from "lucide-react";

// --- SUPABASE IMPORTOK ---
import { createClient } from "@/utils/supabase/server";
import { logout } from "@/app/login/actions";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "DataKomp | Adatvédelmi Menedzser",
  description: "Automatizált GDPR és Adatvédelmi megfelelőség.",
};

const navItems = [
  { href: "/", label: "Irányítópult", icon: LayoutDashboard },
  { href: "/systems", label: "Kezelt adattípusok", icon: Database },
  { href: "/policies", label: "Tájékoztatók", icon: FileText },
  { href: "/settings", label: "Beállítások & Elöfizetés", icon: Settings },
];

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  
  // --- SUPABASE FELHASZNÁLÓ LEKÉRDEZÉSE ---
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Csak a név rövidítését generáljuk az emailből (pl. admin@... -> AD)
  const userInitials = user?.email ? user.email.substring(0, 2).toUpperCase() : "DK";

  return (
    <html lang="hu">
      <body className={`${inter.className} bg-[#f8faf9] text-slate-800 overflow-hidden`}>
        <div className="flex h-screen w-full">
          
          {/* ================= SIDEBAR (Bal oldali menü) ================= */}
          <aside className="hidden md:flex flex-col w-[280px] bg-white border-r border-slate-100 z-20 shadow-[2px_0_20px_rgba(0,0,0,0.015)]">
            
            {/* Logó */}
            <div className="h-[72px] flex items-center px-6 border-b border-slate-50">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-[10px] bg-emerald-500 flex items-center justify-center shadow-[0_4px_12px_rgba(16,185,129,0.3)]">
                  <ShieldCheck className="text-white" size={18} />
                </div>
                <div className="flex flex-col">
                  <span className="text-xl font-bold text-slate-900 tracking-tight">Data<span className="text-emerald-600">Komp</span></span>
                </div>
              </div>
            </div>

            {/* Munkaterület választó */}
            <div className="px-5 py-6">
              <button className="w-full flex items-center justify-between px-4 py-3 bg-white hover:bg-slate-50 border border-slate-200 rounded-[12px] shadow-sm transition-all duration-200">
                <div className="flex flex-col text-left">
                  <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-0.5">Munkaterület</span>
                  <span className="text-sm font-bold text-slate-800">Pro Workspace</span>
                </div>
                <ChevronRight size={16} className="text-slate-400" />
              </button>
            </div>

            <NavLinks />
            {/* Alsó Kvóta Szekció */}
            <div className="p-5 border-t border-slate-50">
              <div className="bg-slate-50 rounded-[12px] p-4 border border-slate-100">
                <div className="flex justify-between items-center mb-3">
                  <span className="text-[12px] text-slate-600 font-medium">Rendszer kvóta</span>
                  <span className="text-[12px] text-emerald-700 font-bold bg-emerald-100 px-2.5 py-0.5 rounded-md">5 / 20</span>
                </div>
                <div className="w-full bg-slate-200/60 rounded-full h-1.5 mb-4">
                  <div className="bg-emerald-500 h-1.5 rounded-full w-1/4"></div>
                </div>
                <button className="w-full text-[12px] font-semibold text-slate-600 hover:text-emerald-700 transition-colors text-left flex items-center justify-between">
                  <span>Csomag bővítése</span>
                  <span className="text-lg leading-none">&rarr;</span>
                </button>
              </div>
            </div>
          </aside>

          {/* ================= FŐ TARTALOM ================= */}
          <div className="flex-1 flex flex-col h-screen overflow-hidden relative bg-[#f8faf9]">
            
            {/* ================= HEADER (Fejléc) ================= */}
            <header className="h-[72px] bg-white border-b border-slate-200/80 flex items-center justify-between px-8 z-10 shadow-[0_2px_10px_rgba(0,0,0,0.01)]">
              
              {/* Keresőmező */}
              <div className="relative w-[480px] hidden lg:block">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input 
                  type="text" 
                  placeholder="Keresés rendszerek, weboldalak vagy tájékoztatók között..." 
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-[10px] text-[13px] focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 focus:bg-white transition-all outline-none text-slate-700 placeholder:text-slate-400"
                />
              </div>

              {/* Jobb oldali sáv */}
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

                {/* --- PROFIL ÉS KIJELENTKEZÉS BLOKK --- */}
                <div className="flex items-center gap-3 cursor-pointer group pl-1">
                  <div className="text-right hidden sm:block">
                    {/* Itt jelenik meg a bejelentkezett felhasználó email címe! */}
                    <div className="text-[13px] font-bold text-slate-700 group-hover:text-emerald-700 transition-colors">
                      {user?.email || "Vendég Felhasználó"}
                    </div>
                    {/* Kijelentkezés gomb funkciója */}
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

            {/* ================= GÖRDÍTHETŐ TARTALOM & FOOTER ================= */}
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
      </body>
    </html>
  );
}