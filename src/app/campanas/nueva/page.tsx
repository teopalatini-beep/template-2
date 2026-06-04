'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Sparkles, Send, Search, CheckSquare, Square } from 'lucide-react'
import { Productor, Canal } from '@/lib/types'
import StatusBadge from '@/components/StatusBadge'

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
  const [error, setError] = useState('')
  const [iaError, setIAError] = useState('')

  useEffect(() => {
    fetch('/api/productores')
      .then(r => r.json())
      .then(setProductores)
  }, [])

  const generarConIA = async () => {
    setLoadingIA(true)
    setIAError('')
    try {
      const res = await fetch('/api/generate-message', { method: 'POST' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setMensaje(data.message)
    } catch (err: unknown) {
      setIAError(err instanceof Error ? err.message : 'Error al generar mensaje')
    } finally {
      setLoadingIA(false)
    }
  }

  const toggleSelectAll = () => {
    if (selected.size === filteredProductores.length) {
      setSelected(new Set())
    } else {
      setSelected(new Set(filteredProductores.map(p => p.id)))
    }
  }

  const toggleSelect = (id: string) => {
    setSelected(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const filteredProductores = productores.filter(p => {
    const matchCanal = canal === 'whatsapp' ? !!p.telefono : !!p.email
    const matchSearch =
      !search ||
      p.nombre.toLowerCase().includes(search.toLowerCase()) ||
      (p.empresa ?? '').toLowerCase().includes(search.toLowerCase())
    return matchCanal && matchSearch
  })

  const handleEnviar = async () => {
    if (!titulo.trim()) { setError('El título es obligatorio.'); return }
    if (!mensaje.trim()) { setError('El mensaje es obligatorio.'); return }
    if (selected.size === 0) { setError('Seleccioná al menos un destinatario.'); return }

    setLoadingEnvio(true)
    setError('')

    try {
      const endpoint = canal === 'whatsapp' ? '/api/send-whatsapp' : '/api/send-email'
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          titulo,
          mensaje,
          productor_ids: Array.from(selected),
        }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error)

      router.push(`/campanas/${data.campana_id}`)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al enviar')
    } finally {
      setLoadingEnvio(false)
    }
  }

  const allSelected = filteredProductores.length > 0 && selected.size === filteredProductores.length

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Nueva campaña</h1>
        <p className="text-zinc-500 text-sm mt-1">Redactá y enviá un mensaje masivo a tus productores</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Columna izquierda: formulario */}
        <div className="space-y-5">
          {/* Título */}
          <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-5">
            <label className="block text-xs font-medium text-zinc-400 mb-2">
              Título de la campaña <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={titulo}
              onChange={e => setTitulo(e.target.value)}
              placeholder="Ej: Promo enero 2025"
              className="w-full bg-[#111] border border-[#2a2a2a] rounded-lg px-3 py-2 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-violet-500 transition-colors"
            />
          </div>

          {/* Canal */}
          <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-5">
            <label className="block text-xs font-medium text-zinc-400 mb-3">Canal de envío</label>
            <div className="flex gap-4">
              {(['whatsapp', 'email'] as Canal[]).map(c => (
                <label key={c} className="flex items-center gap-2.5 cursor-pointer">
                  <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center transition-colors ${canal === c ? 'border-violet-500' : 'border-zinc-600'}`}>
                    {canal === c && <div className="w-2 h-2 rounded-full bg-violet-500" />}
                  </div>
                  <input type="radio" value={c} checked={canal === c} onChange={() => setCanal(c)} className="hidden" />
                  <StatusBadge status={c} />
                </label>
              ))}
            </div>
          </div>

          {/* Mensaje */}
          <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-5">
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-medium text-zinc-400">
                Mensaje <span className="text-red-400">*</span>
              </label>
              <button
                type="button"
                onClick={generarConIA}
                disabled={loadingIA}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-violet-400 bg-violet-500/10 hover:bg-violet-500/20 border border-violet-500/20 rounded-lg transition-colors disabled:opacity-50"
              >
                <Sparkles size={12} />
                {loadingIA ? 'Generando...' : 'Generar con IA'}
              </button>
            </div>
            {iaError && (
              <p className="text-xs text-red-400 mb-2">{iaError}</p>
            )}
            <textarea
              value={mensaje}
              onChange={e => setMensaje(e.target.value)}
              rows={10}
              placeholder="Escribí tu mensaje acá o usá el botón 'Generar con IA'..."
              className="w-full bg-[#111] border border-[#2a2a2a] rounded-lg px-3 py-2 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-violet-500 transition-colors resize-none"
            />
            <p className="text-xs text-zinc-600 mt-1">{mensaje.length} caracteres</p>
          </div>
        </div>

        {/* Columna derecha: destinatarios */}
        <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl flex flex-col">
          <div className="px-5 py-4 border-b border-[#2a2a2a]">
            <h2 className="text-sm font-semibold text-white mb-3">
              Destinatarios
              {selected.size > 0 && (
                <span className="ml-2 text-xs font-normal text-violet-400">{selected.size} seleccionados</span>
              )}
            </h2>
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
              <input
                type="text"
                placeholder="Buscar..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full bg-[#111] border border-[#2a2a2a] rounded-lg pl-9 pr-3 py-2 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-violet-500 transition-colors"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto max-h-[400px]">
            {filteredProductores.length === 0 ? (
              <div className="p-6 text-center text-zinc-600 text-sm">
                {canal === 'whatsapp'
                  ? 'No hay productores con teléfono cargado.'
                  : 'No hay productores con email cargado.'}
              </div>
            ) : (
              <>
                <button
                  onClick={toggleSelectAll}
                  className="w-full flex items-center gap-3 px-5 py-3 text-sm text-zinc-400 hover:bg-white/[0.02] border-b border-[#1f1f1f] transition-colors"
                >
                  {allSelected
                    ? <CheckSquare size={14} className="text-violet-400" />
                    : <Square size={14} className="text-zinc-600" />}
                  Seleccionar todos ({filteredProductores.length})
                </button>
                {filteredProductores.map(p => (
                  <button
                    key={p.id}
                    onClick={() => toggleSelect(p.id)}
                    className="w-full flex items-center gap-3 px-5 py-3 hover:bg-white/[0.02] border-b border-[#1f1f1f] last:border-0 transition-colors"
                  >
                    {selected.has(p.id)
                      ? <CheckSquare size={14} className="text-violet-400 shrink-0" />
                      : <Square size={14} className="text-zinc-600 shrink-0" />}
                    <div className="text-left min-w-0">
                      <p className="text-sm text-white truncate">{p.nombre}</p>
                      <p className="text-xs text-zinc-500 truncate">
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

      {/* Botón enviar */}
      <div className="mt-6 flex items-center justify-between">
        {error ? (
          <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-2">{error}</p>
        ) : <div />}
        <button
          onClick={handleEnviar}
          disabled={loadingEnvio}
          className="flex items-center gap-2 px-6 py-2.5 bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors"
        >
          <Send size={14} />
          {loadingEnvio ? 'Enviando...' : `Enviar campaña (${selected.size})`}
        </button>
      </div>
    </div>
  )
}
