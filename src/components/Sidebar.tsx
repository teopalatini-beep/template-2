'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, Users, Megaphone, PlusCircle, Ticket } from 'lucide-react'

const navItems = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/productores', label: 'Productores', icon: Users },
  { href: '/campanas', label: 'Campañas', icon: Megaphone },
  { href: '/campanas/nueva', label: 'Nueva campaña', icon: PlusCircle },
]

export default function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="w-60 flex-shrink-0 bg-[#111111] border-r border-[#1f1f1f] flex flex-col">
      <div className="px-5 py-5 border-b border-[#1f1f1f]">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-md bg-violet-600 flex items-center justify-center">
            <Ticket size={14} className="text-white" />
          </div>
          <div>
            <p className="text-sm font-semibold text-white leading-tight">Ticketera CRM</p>
            <p className="text-[10px] text-zinc-500 leading-tight">Panel interno</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-3">
        <p className="text-[10px] font-medium text-zinc-600 uppercase tracking-widest px-2 mb-2">
          Navegación
        </p>
        <ul className="space-y-0.5">
          {navItems.map(({ href, label, icon: Icon }) => {
            const isActive = href === '/' ? pathname === '/' : pathname.startsWith(href) && !(href === '/campanas' && pathname === '/campanas/nueva')
            return (
              <li key={href}>
                <Link
                  href={href}
                  className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all ${
                    isActive
                      ? 'bg-violet-600/15 text-violet-400 font-medium'
                      : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/5'
                  }`}
                >
                  <Icon size={15} />
                  {label}
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>

      <div className="px-4 py-4 border-t border-[#1f1f1f]">
        <p className="text-[10px] text-zinc-600">v1.0.0</p>
      </div>
    </aside>
  )
}
