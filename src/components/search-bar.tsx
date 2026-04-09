"use client";

import { Search } from "lucide-react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useTransition } from "react";

export function SearchBar({ defaultValue }: { defaultValue: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();

  const handleSearch = (term: string) => {
    // URL paraméterek klónozása (hogy a filter paraméter megmaradjon)
    const params = new URLSearchParams(searchParams.toString());
    
    if (term) {
      params.set('q', term);
    } else {
      params.delete('q');
    }

    // A transition segít, hogy a gépelés ne akadjon meg, míg a szerver válaszol
    startTransition(() => {
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    });
  };

  return (
    <div className="relative flex-1 max-w-md">
      <Search 
        className={`absolute left-3 top-1/2 -translate-y-1/2 transition-colors ${isPending ? 'text-emerald-500' : 'text-slate-400'}`} 
        size={16} 
      />
      <input 
        type="text" 
        defaultValue={defaultValue}
        onChange={(e) => {
          // Debounce: Ne küldjön kérést minden egyes leütésnél, hanem csak ha befejezte a gépelést
          handleSearch(e.target.value);
        }}
        placeholder="Keresés rendszer, adat vagy cél alapján..." 
        className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-[13px] focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all outline-none shadow-sm"
      />
      
      {/* Töltés indikátor (opcionális, de jó UX) */}
      {isPending && (
        <div className="absolute right-3 top-1/2 -translate-y-1/2">
          <div className="w-4 h-4 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      )}
    </div>
  );
}