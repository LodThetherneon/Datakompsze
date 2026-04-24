'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, FileText, Database, Settings, Building2, FolderKanban, Shield } from 'lucide-react'

const navItems = [
  { href: '/',              label: 'Irányítópult',        icon: LayoutDashboard },
  { href: '/systems',       label: 'Kezelt adattípusok',  icon: Database },
  { href: '/data-registry', label: 'Folyamatnyilvántartás', icon: FolderKanban },
  { href: '/policies',      label: 'Tájékoztatók',        icon: FileText },
  { href: '/company',       label: 'Cégadatok',           icon: Building2 },
  { href: '/settings',      label: 'Beállítások',         icon: Settings },
]

const adminNavItem = { href: '/admin', label: 'Admin panel', icon: Shield }

export function NavLinks({ role }: { role?: string }) {
  const pathname = usePathname()
  const isAdmin = role === 'superadmin' || role === 'admin'

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
                ? 'bg-blue-50 text-blue-700 font-semibold'
                : 'text-slate-600 hover:bg-blue-50 hover:text-blue-700'
            }`}
          >
            <Icon size={18} className={`transition-colors ${isActive ? 'text-blue-600' : 'text-slate-400 group-hover:text-blue-600'}`} />
            <span>{item.label}</span>
          </Link>
        )
      })}

      {/* Admin panel — csak superadmin és admin látja */}
      {isAdmin && (
        <>
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-2 mt-5 px-3">
            Rendszergazda
          </div>
          <Link
            href={adminNavItem.href}
            className={`group flex items-center gap-3 px-3 py-2.5 rounded-[10px] text-[14px] font-medium transition-all duration-200 ${
              pathname.startsWith('/admin')
                ? 'bg-blue-50 text-blue-700 font-semibold'
                : 'text-slate-600 hover:bg-blue-50 hover:text-blue-700'
            }`}
          >
            <Shield size={18} className={`transition-colors ${pathname.startsWith('/admin') ? 'text-blue-600' : 'text-slate-400 group-hover:text-blue-600'}`} />
            <span>{adminNavItem.label}</span>
          </Link>
        </>
      )}
    </nav>
  )
}