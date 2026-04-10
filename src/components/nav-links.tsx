'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, FileText, Database, Settings } from 'lucide-react'

const navItems = [
  { href: '/', label: 'Irányítópult', icon: LayoutDashboard },
  { href: '/systems', label: 'Kezelt adattípusok', icon: Database },
  { href: '/policies', label: 'Tájékoztatók', icon: FileText },
  { href: '/settings', label: 'Beállítások & Előfizetés', icon: Settings },
]

export function NavLinks() {
  const pathname = usePathname()

  return (
    <nav className="flex-1 px-5 space-y-1.5 overflow-y-auto">
      <div className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-4 px-3 mt-2">Főmenü</div>
      {navItems.map((item) => {
        const Icon = item.icon
        const isActive = item.href === '/'
          ? pathname === '/'
          : pathname.startsWith(item.href)

        return (
          <Link
            key={item.href}
            href={item.href}
            className={`group flex items-center gap-3 px-3 py-2.5 rounded-[10px] text-[14px] font-medium transition-all duration-200 ${
              isActive
                ? 'bg-emerald-50 text-emerald-700 font-semibold'
                : 'text-slate-600 hover:bg-emerald-50 hover:text-emerald-700'
            }`}
          >
            <Icon
              size={18}
              className={`transition-colors ${
                isActive
                  ? 'text-emerald-600'
                  : 'text-slate-400 group-hover:text-emerald-600'
              }`}
            />
            <span>{item.label}</span>
          </Link>
        )
      })}
    </nav>
  )
}