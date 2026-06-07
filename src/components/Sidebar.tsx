'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { LayoutDashboard, Users, Megaphone, PlusCircle, Search, Zap, BarChart2, Kanban, LogOut } from 'lucide-react'
import { createClient } from '@/lib/supabase-browser'

function SimplePassLogo() {
  return (
    <svg viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-8 h-8">
      <rect x="1" y="5" width="34" height="26" rx="5" fill="#7c3aed"/>
      <rect x="1" y="5" width="34" height="26" rx="5" fill="url(#sp-grad)"/>
      <circle cx="1" cy="18" r="3" fill="#0f0f0f"/>
      <circle cx="35" cy="18" r="3" fill="#0f0f0f"/>
      <line x1="13" y1="5" x2="13" y2="31" stroke="#6d28d9" strokeWidth="0.75" strokeDasharray="2 2"/>
      <text x="21" y="22" textAnchor="middle" fill="white" fontSize="14" fontWeight="900" fontFamily="-apple-system,BlinkMacSystemFont,sans-serif" letterSpacing="-0.5">S</text>
      <defs>
        <linearGradient id="sp-grad" x1="1" y1="5" x2="35" y2="31" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#8b5cf6"/>
          <stop offset="100%" stopColor="#6d28d9"/>
        </linearGradient>
      </defs>
    </svg>
  )
}

export default function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const [alertas, setAlertas] = useState(0)

  useEffect(() => {
    fetch('/api/alertas')
      .then(r => r.json())
      .then(d => setAlertas(Array.isArray(d) ? d.length : 0))
      .catch(() => {})
  }, [])

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

  const navItems = [
    { href: '/', label: 'Dashboard', icon: LayoutDashboard, badge: 0 },
    { href: '/productores', label: 'Productores', icon: Users, badge: 0 },
    { href: '/pipeline', label: 'Pipeline', icon: Kanban, badge: alertas },
    { href: '/campanas', label: 'Campañas', icon: Megaphone, badge: 0 },
    { href: '/campanas/nueva', label: 'Nueva campaña', icon: PlusCircle, badge: 0 },
    { href: '/automatizaciones', label: 'Automatizaciones', icon: Zap, badge: 0 },
    { href: '/reportes', label: 'Reportes', icon: BarChart2, badge: 0 },
  ]

  return (
    <aside className="w-[220px] flex-shrink-0 bg-[#0f0f0f] border-r border-[#1a1a1a] flex flex-col">
      {/* Logo */}
      <div className="px-4 py-4 border-b border-[#1a1a1a]">
        <div className="flex items-center gap-2.5">
          <SimplePassLogo />
          <div>
            <p className="text-[14px] font-bold text-white tracking-tight leading-none">SimplePass</p>
            <p className="text-[10px] text-violet-500 leading-none mt-0.5 font-semibold uppercase tracking-wider">CRM</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-3 space-y-0.5">
        {navItems.map(({ href, label, icon: Icon, badge }) => {
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
              <span className="flex-1">{label}</span>
              {badge > 0 && (
                <span className="w-4 h-4 rounded-full bg-amber-500 text-[9px] font-bold text-black flex items-center justify-center tabular-nums shrink-0">
                  {badge > 9 ? '9+' : badge}
                </span>
              )}
              {active && badge === 0 && (
                <div className="w-1 h-1 rounded-full bg-violet-400" />
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
