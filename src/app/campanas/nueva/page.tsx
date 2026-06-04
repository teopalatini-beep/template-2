'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Sparkles, Send, Search, CheckSquare, Square, ChevronLeft } from 'lucide-react'
import Link from 'next/link'
import { Productor, Canal } from '@/lib/types'
import StatusBadge from '@/components/StatusBadge'
import { toast } from 'sonner'

export default function NuevaCampanaPage() {
  const router = useRouter()
  const [titulo, setTitulo] = useState('')
  const [mensaje, setMensaje] = useState('')
  const [canal, setCanal] = useState<Canal>('whatsapp')
  const [productores, setProductores] = useState<Productor[]>([])
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [search, setSearch] = useState('')
  const [loadingIA, setLoadingIA] = useState(false)
  const [loadingEnvio, setLoadingEnvio] = useState(false)

  useEffect(() => {
    fetch('/api/productores').then(r => r.json()).then(setProductores)
  }, [])

  const generarConIA = async () => {
    setLoadingIA(true)
    const toastId = toast.loading('Generando mensaje con IA...')
    try {
      const res = await fetch('/api/generate-message', { method: 'POST' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setMensaje(data.message)
      toast.success('Mensaje generado', { id: toastId })
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Error al generar', { id: toastId })
    } finally {
      setLoadingIA(false)
    }
  }

  const filteredProductores = productores.filter(p => {
    const hasContact = canal === 'whatsapp' ? !!p.telefono : !!p.email
    const matchSearch = !search ||
      p.nombre.toLowerCase().includes(search.toLowerCase()) ||
      (p.empresa ?? '').toLowerCase().includes(search.toLowerCase())
    return hasContact && matchSearch
  })

  const allSelected = filteredProductores.length > 0 && selected.size === filteredProductores.length

  const toggleSelectAll = () => {
    setSelected(allSelected ? new Set() : new Set(filteredProductores.map(p => p.id)))
  }

  const toggleSelect = (id: string) => {
    setSelected(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const handleEnviar = async () => {
    if (!titulo.trim()) { toast.error('El título es obligatorio'); return }
    if (!mensaje.trim()) { toast.error('El mensaje no puede estar vacío'); return }
    if (selected.size === 0) { toast.error('Seleccioná al menos un destinatario'); return }

    setLoadingEnvio(true)
    const toastId = toast.loading(`Enviando a ${selected.size} destinatario${selected.size > 1 ? 's' : ''}...`)

    try {
      const endpoint = canal === 'whatsapp' ? '/api/send-whatsapp' : '/api/send-email'
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ titulo, mensaje, productor_ids: Array.from(selected) }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      toast.success('Campaña enviada exitosamente', { id: toastId })
      router.push(`/campanas/${data.campana_id}`)
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Error al enviar', { id: toastId })
    } finally {
      setLoadingEnvio(false)
    }
  }

  return (
    <div className="p-8 max-w-5xl mx-auto">
      {/* Header */}
      <Link href="/campanas" className="inline-flex items-center gap-1.5 text-[12px] text-zinc-600 hover:text-zinc-300 transition-colors mb-5">
        <ChevronLeft size={13} />
        Campañas
      </Link>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-white">Nueva campaña</h1>
          <p className="text-[12px] text-zinc-600 mt-0.5">Redactá y enviá un mensaje a tus productores</p>
        </div>
        <button
          onClick={handleEnviar}
          disabled={loadingEnvio || selected.size === 0}
          className="flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-500 disabled:opacity-40 text-white text-[13px] font-medium rounded-lg transition-all shadow-lg shadow-violet-900/20"
        >
          <Send size={13} />
          {loadingEnvio ? 'Enviando...' : `Enviar${selected.size > 0 ? ` (${selected.size})` : ''}`}
        </button>
      </div>

      <div className="grid grid-cols-5 gap-5">
        {/* Formulario — 3 cols */}
        <div className="col-span-3 space-y-4">
          {/* Título */}
          <div className="bg-[#141414] border border-[#1f1f1f] rounded-xl p-5">
            <label className="block text-[10px] font-medium text-zinc-600 uppercase tracking-widest mb-2">
              Título
            </label>
            <input
              type="text"
              value={titulo}
              onChange={e => setTitulo(e.target.value)}
              placeholder="Ej: Promo Enero 2025"
              className="w-full bg-[#0f0f0f] border border-[#1f1f1f] rounded-lg px-3 py-2.5 text-[14px] text-white placeholder-zinc-700 focus:outline-none focus:border-violet-500/40 transition-all"
            />
          </div>

          {/* Canal */}
          <div className="bg-[#141414] border border-[#1f1f1f] rounded-xl p-5">
            <p className="text-[10px] font-medium text-zinc-600 uppercase tracking-widest mb-3">Canal</p>
            <div className="flex gap-3">
              {(['whatsapp', 'email'] as Canal[]).map(c => (
                <button
                  key={c}
                  type="button"
                  onClick={() => { setCanal(c); setSelected(new Set()) }}
                  className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl border text-[13px] transition-all ${
                    canal === c
                      ? 'border-violet-500/40 bg-violet-500/8 text-violet-300'
                      : 'border-[#1f1f1f] text-zinc-500 hover:border-[#2a2a2a] hover:text-zinc-300'
                  }`}
                >
                  <div className={`w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center transition-colors ${canal === c ? 'border-violet-500' : 'border-zinc-600'}`}>
                    {canal === c && <div className="w-1.5 h-1.5 rounded-full bg-violet-500" />}
                  </div>
                  <StatusBadge status={c} />
                </button>
              ))}
            </div>
          </div>

          {/* Mensaje */}
          <div className="bg-[#141414] border border-[#1f1f1f] rounded-xl p-5">
            <div className="flex items-center justify-between mb-2">
              <label className="text-[10px] font-medium text-zinc-600 uppercase tracking-widest">Mensaje</label>
              <button
                type="button"
                onClick={generarConIA}
                disabled={loadingIA}
                className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-medium text-violet-400 bg-violet-500/8 hover:bg-violet-500/15 border border-violet-500/20 rounded-lg transition-all disabled:opacity-50"
              >
                <Sparkles size={11} />
                {loadingIA ? 'Generando...' : 'Generar con IA'}
              </button>
            </div>
            <textarea
              value={mensaje}
              onChange={e => setMensaje(e.target.value)}
              rows={11}
              placeholder="Escribí el mensaje acá o usá la IA para generar uno..."
              className="w-full bg-[#0f0f0f] border border-[#1f1f1f] rounded-lg px-3 py-2.5 text-[13px] text-zinc-200 placeholder-zinc-700 focus:outline-none focus:border-violet-500/40 transition-all resize-none leading-relaxed"
            />
            <p className="text-[10px] text-zinc-700 mt-1.5">{mensaje.length} caracteres</p>
          </div>
        </div>

        {/* Destinatarios — 2 cols */}
        <div className="col-span-2 bg-[#141414] border border-[#1f1f1f] rounded-xl flex flex-col overflow-hidden">
          <div className="px-4 py-3.5 border-b border-[#1a1a1a]">
            <div className="flex items-center justify-between mb-3">
              <p className="text-[13px] font-medium text-white">Destinatarios</p>
              {selected.size > 0 && (
                <span className="text-[11px] text-violet-400 bg-violet-500/8 border border-violet-500/15 rounded-md px-2 py-0.5">
                  {selected.size} sel.
                </span>
              )}
            </div>
            <div className="relative">
              <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-600" />
              <input
                type="text"
                placeholder="Filtrar..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full bg-[#0f0f0f] border border-[#1f1f1f] rounded-lg pl-8 pr-3 py-2 text-[12px] text-zinc-300 placeholder-zinc-700 focus:outline-none focus:border-violet-500/40 transition-all"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {filteredProductores.length === 0 ? (
              <div className="py-10 text-center">
                <p className="text-[12px] text-zinc-700">
                  {canal === 'whatsapp' ? 'Sin productores con teléfono' : 'Sin productores con email'}
                </p>
              </div>
            ) : (
              <>
                <button
                  onClick={toggleSelectAll}
                  className="w-full flex items-center gap-2.5 px-4 py-2.5 hover:bg-white/[0.02] border-b border-[#111] text-[12px] text-zinc-500 transition-colors"
                >
                  {allSelected
                    ? <CheckSquare size={13} className="text-violet-400 shrink-0" />
                    : <Square size={13} className="text-zinc-700 shrink-0" />}
                  Todos ({filteredProductores.length})
                </button>
                {filteredProductores.map(p => (
                  <button
                    key={p.id}
                    onClick={() => toggleSelect(p.id)}
                    className="w-full flex items-center gap-2.5 px-4 py-3 hover:bg-white/[0.015] border-b border-[#0f0f0f] last:border-0 transition-colors text-left"
                  >
                    {selected.has(p.id)
                      ? <CheckSquare size={13} className="text-violet-400 shrink-0" />
                      : <Square size={13} className="text-zinc-700 shrink-0" />}
                    <div className="min-w-0 flex-1">
                      <p className="text-[12px] font-medium text-zinc-300 truncate">{p.nombre}</p>
                      <p className="text-[10px] text-zinc-700 truncate font-mono">
                        {canal === 'whatsapp' ? p.telefono : p.email}
                      </p>
                    </div>
                    <StatusBadge status={p.estado} />
                  </button>
                ))}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
