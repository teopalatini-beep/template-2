'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Command } from 'cmdk'
import {
  LayoutDashboard, Users, Megaphone, PlusCircle, Search,
  Kanban, Zap, BarChart2, Building2, User, Loader2,
} from 'lucide-react'
import { Productor } from '@/lib/types'

const NAV = [
  { label: 'Dashboard',      href: '/',               icon: LayoutDashboard },
  { label: 'Productores',    href: '/productores',    icon: Users },
  { label: 'Pipeline',       href: '/pipeline',       icon: Kanban },
  { label: 'Campañas',       href: '/campanas',       icon: Megaphone },
  { label: 'Nueva campaña',  href: '/campanas/nueva', icon: PlusCircle },
  { label: 'Automatizaciones', href: '/automatizaciones', icon: Zap },
  { label: 'Reportes',       href: '/reportes',       icon: BarChart2 },
]

export default function CommandPalette() {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [productores, setProductores] = useState<Productor[]>([])
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setOpen(prev => !prev)
      }
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('keydown', down)
    return () => document.removeEventListener('keydown', down)
  }, [])

  useEffect(() => {
    if (!open) { setQuery(''); setProductores([]); return }
    setLoading(true)
    fetch('/api/productores')
      .then(r => r.json())
      .then(d => { setProductores(Array.isArray(d) ? d : []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [open])

  const go = useCallback((href: string) => {
    setOpen(false)
    router.push(href)
  }, [router])

  const filteredNav = query
    ? NAV.filter(n => n.label.toLowerCase().includes(query.toLowerCase()))
    : NAV

  const filteredProductores = query.length >= 1
    ? productores.filter(p =>
        p.nombre.toLowerCase().includes(query.toLowerCase()) ||
        (p.empresa ?? '').toLowerCase().includes(query.toLowerCase()) ||
        (p.email ?? '').toLowerCase().includes(query.toLowerCase())
      ).slice(0, 6)
    : []

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[18vh]">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setOpen(false)} />
      <div className="relative z-10 w-full max-w-[480px]">
        <Command
          className="bg-[#141414] border border-[#2a2a2a] rounded-xl shadow-2xl overflow-hidden"
          shouldFilter={false}
        >
          <div className="flex items-center gap-2.5 px-4 border-b border-[#2a2a2a]">
            {loading
              ? <Loader2 size={14} className="text-zinc-500 shrink-0 animate-spin" />
              : <Search size={14} className="text-zinc-500 shrink-0" />
            }
            <Command.Input
              value={query}
              onValueChange={setQuery}
              placeholder="Buscar productores, navegar..."
              className="flex-1 bg-transparent py-3.5 text-[14px] text-zinc-200 placeholder-zinc-600 outline-none"
              autoFocus
            />
            <kbd className="text-[10px] text-zinc-600 bg-[#1f1f1f] border border-[#2a2a2a] rounded px-1.5 py-0.5 shrink-0">
              ESC
            </kbd>
          </div>

          <Command.List className="max-h-[320px] overflow-y-auto py-2">
            <Command.Empty className="py-8 text-center text-[13px] text-zinc-600">
              Sin resultados para &ldquo;{query}&rdquo;
            </Command.Empty>

            {filteredProductores.length > 0 && (
              <Command.Group
                heading="Productores"
                className="[&_[cmdk-group-heading]]:px-4 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-[10px] [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-zinc-600 [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-widest"
              >
                {filteredProductores.map(p => (
                  <Command.Item
                    key={p.id}
                    value={`productor-${p.id}`}
                    onSelect={() => go(`/productores/${p.id}`)}
                    className="flex items-center gap-3 mx-2 px-3 py-2.5 rounded-lg cursor-pointer data-[selected=true]:bg-violet-600/15 transition-colors group"
                  >
                    <div className="w-6 h-6 rounded-md bg-[#1f1f1f] flex items-center justify-center shrink-0">
                      <User size={11} className="text-zinc-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] text-zinc-200 truncate group-data-[selected=true]:text-violet-200">{p.nombre}</p>
                      {(p.empresa || p.tipo_evento) && (
                        <p className="text-[11px] text-zinc-600 truncate">
                          {[p.empresa, p.tipo_evento].filter(Boolean).join(' · ')}
                        </p>
                      )}
                    </div>
                    {p.pipeline_etapa && p.pipeline_etapa !== 'nuevo' && (
                      <span className="text-[10px] text-zinc-600 shrink-0 capitalize">{p.pipeline_etapa}</span>
                    )}
                  </Command.Item>
                ))}
              </Command.Group>
            )}

            {filteredNav.length > 0 && (
              <Command.Group
                heading="Navegación"
                className="[&_[cmdk-group-heading]]:px-4 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-[10px] [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-zinc-600 [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-widest"
              >
                {filteredNav.map(({ label, href, icon: Icon }) => (
                  <Command.Item
                    key={href}
                    value={`nav-${href}`}
                    onSelect={() => go(href)}
                    className="flex items-center gap-3 mx-2 px-3 py-2.5 rounded-lg text-[13px] text-zinc-300 cursor-pointer data-[selected=true]:bg-violet-600/15 data-[selected=true]:text-violet-300 transition-colors"
                  >
                    <Icon size={14} className="text-zinc-500 shrink-0" />
                    {label}
                  </Command.Item>
                ))}
              </Command.Group>
            )}
          </Command.List>

          <div className="px-4 py-2.5 border-t border-[#1f1f1f] flex items-center gap-3">
            <span className="text-[10px] text-zinc-600">Navegá con</span>
            <kbd className="text-[10px] text-zinc-600 bg-[#1f1f1f] border border-[#2a2a2a] rounded px-1.5 py-0.5">↑↓</kbd>
            <kbd className="text-[10px] text-zinc-600 bg-[#1f1f1f] border border-[#2a2a2a] rounded px-1.5 py-0.5">↵</kbd>
            <span className="ml-auto text-[10px] text-zinc-700">{productores.length} productores cargados</span>
          </div>
        </Command>
      </div>
    </div>
  )
}
