'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { LayoutDashboard, Users, Megaphone, PlusCircle, Ticket, Search, Zap, BarChart2, Kanban, LogOut } from 'lucide-react'
import { createClient } from '@/lib/supabase-browser'

const navItems = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/productores', label: 'Productores', icon: Users },
  { href: '/pipeline', label: 'Pipeline', icon: Kanban },
  { href: '/campanas', label: 'Campañas', icon: Megaphone },
  { href: '/campanas/nueva', label: 'Nueva campaña', icon: PlusCircle },
  { href: '/automatizaciones', label: 'Automatizaciones', icon: Zap },
  { href: '/reportes', label: 'Reportes', icon: BarChart2 },
]

export default function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    window.location.href = '/login'
  }

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/'
    if (href === '/campanas') return pathname === '/campanas' || pathname.startsWith('/campanas/') && !pathname.startsWith('/campanas/nueva')
    return pathname.startsWith(href)
  }

  return (
    <aside className="w-[220px] flex-shrink-0 bg-[#0f0f0f] border-r border-[#1a1a1a] flex flex-col">
      {/* Logo */}
      <div className="px-4 py-5 border-b border-[#1a1a1a]">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-violet-500 to-violet-700 flex items-center justify-center shadow-lg shadow-violet-900/30">
            <Ticket size={13} className="text-white" />
          </div>
          <div>
            <p className="text-[13px] font-semibold text-white tracking-tight leading-none">CRM Productora</p>
            <p className="text-[10px] text-zinc-600 leading-none mt-0.5">CRM</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-3 space-y-0.5">
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = isActive(href)
          return (
            <Link
              key={href}
              href={href}
              className={`group flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] font-medium transition-all duration-150 ${
                active
                  ? 'bg-violet-600/12 text-violet-300'
                  : 'text-zinc-500 hover:text-zinc-200 hover:bg-white/[0.04]'
              }`}
            >
              <Icon
                size={14}
                className={`shrink-0 transition-colors ${
                  active ? 'text-violet-400' : 'text-zinc-600 group-hover:text-zinc-400'
                }`}
              />
              {label}
              {active && (
                <div className="ml-auto w-1 h-1 rounded-full bg-violet-400" />
              )}
            </Link>
          )
        })}
      </nav>

      {/* Logout */}
      <div className="px-3 pb-2">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-zinc-600 hover:text-red-400 hover:bg-red-500/5 transition-all group"
        >
          <LogOut size={13} className="shrink-0" />
          <span className="text-[12px] font-medium">Cerrar sesión</span>
        </button>
      </div>

      {/* Command palette hint */}
      <div className="px-3 pb-4">
        <button
          onClick={() => {
            const event = new KeyboardEvent('keydown', { key: 'k', metaKey: true, ctrlKey: true, bubbles: true })
            document.dispatchEvent(event)
          }}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-lg border border-[#1f1f1f] bg-[#0a0a0a] hover:border-[#2a2a2a] transition-colors group"
        >
          <Search size={12} className="text-zinc-600" />
          <span className="text-[11px] text-zinc-600 flex-1 text-left">Buscar...</span>
          <div className="flex items-center gap-0.5">
            <kbd className="text-[9px] text-zinc-700 bg-[#1a1a1a] rounded px-1 py-0.5">⌘</kbd>
            <kbd className="text-[9px] text-zinc-700 bg-[#1a1a1a] rounded px-1 py-0.5">K</kbd>
          </div>
        </button>
      </div>
    </aside>
  )
}
