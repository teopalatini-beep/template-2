'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Command } from 'cmdk'
import { LayoutDashboard, Users, Megaphone, PlusCircle, Search } from 'lucide-react'

const commands = [
  { label: 'Dashboard', href: '/', icon: LayoutDashboard, group: 'Navegación' },
  { label: 'Productores', href: '/productores', icon: Users, group: 'Navegación' },
  { label: 'Campañas', href: '/campanas', icon: Megaphone, group: 'Navegación' },
  { label: 'Nueva campaña', href: '/campanas/nueva', icon: PlusCircle, group: 'Acciones' },
]

export default function CommandPalette() {
  const [open, setOpen] = useState(false)
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

  const runCommand = useCallback((href: string) => {
    setOpen(false)
    router.push(href)
  }, [router])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[20vh]">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={() => setOpen(false)}
      />
      <div className="relative z-10 w-full max-w-md">
        <Command
          className="bg-[#141414] border border-[#2a2a2a] rounded-xl shadow-2xl overflow-hidden"
          shouldFilter={true}
        >
          <div className="flex items-center gap-2 px-4 border-b border-[#2a2a2a]">
            <Search size={14} className="text-zinc-500 shrink-0" />
            <Command.Input
              placeholder="Buscar o navegar..."
              className="flex-1 bg-transparent py-3.5 text-sm text-zinc-200 placeholder-zinc-600 outline-none"
              autoFocus
            />
            <kbd className="text-[10px] text-zinc-600 bg-[#1f1f1f] border border-[#2a2a2a] rounded px-1.5 py-0.5">
              ESC
            </kbd>
          </div>

          <Command.List className="max-h-64 overflow-y-auto py-2">
            <Command.Empty className="py-6 text-center text-sm text-zinc-600">
              Sin resultados.
            </Command.Empty>

            {['Navegación', 'Acciones'].map(group => {
              const items = commands.filter(c => c.group === group)
              return (
                <Command.Group
                  key={group}
                  heading={group}
                  className="[&_[cmdk-group-heading]]:px-4 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-[10px] [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-zinc-600 [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-widest"
                >
                  {items.map(({ label, href, icon: Icon }) => (
                    <Command.Item
                      key={href}
                      value={label}
                      onSelect={() => runCommand(href)}
                      className="flex items-center gap-3 mx-2 px-3 py-2.5 rounded-lg text-sm text-zinc-300 cursor-pointer data-[selected=true]:bg-violet-600/15 data-[selected=true]:text-violet-300 transition-colors"
                    >
                      <Icon size={14} className="text-zinc-500" />
                      {label}
                    </Command.Item>
                  ))}
                </Command.Group>
              )
            })}
          </Command.List>

          <div className="px-4 py-2.5 border-t border-[#1f1f1f] flex items-center gap-3">
            <span className="text-[10px] text-zinc-600">Navegá con</span>
            <kbd className="text-[10px] text-zinc-600 bg-[#1f1f1f] border border-[#2a2a2a] rounded px-1.5 py-0.5">↑↓</kbd>
            <kbd className="text-[10px] text-zinc-600 bg-[#1f1f1f] border border-[#2a2a2a] rounded px-1.5 py-0.5">↵</kbd>
          </div>
        </Command>
      </div>
    </div>
  )
}
