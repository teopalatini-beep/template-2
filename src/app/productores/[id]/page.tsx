'use client'

'use client'

import { useCallback, useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Pencil, Mail, Phone, Building2, Tag, StickyNote, MessageSquare, Sparkles, CheckCircle2, Clock, ChevronDown, ChevronUp } from 'lucide-react'
import { Productor, Mensaje, CopilotSuggestion } from '@/lib/types'
import StatusBadge from '@/components/StatusBadge'
import ProductorModal from '@/components/ProductorModal'
import { SkeletonText } from '@/components/Skeleton'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

export default function ProductorDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [productor, setProductor] = useState<Productor | null>(null)
  const [mensajes, setMensajes] = useState<Mensaje[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [copilot, setCopilot] = useState<CopilotSuggestion | null>(null)
  const [copilotMessage, setCopilotMessage] = useState('')
  const [loadingCopilot, setLoadingCopilot] = useState(false)
  const [expandedMsg, setExpandedMsg] = useState<string | null>(null)
  const [notaInputs, setNotaInputs] = useState<Record<string, string>>({})

  const fetchData = useCallback(async () => {
    const [pRes, mRes] = await Promise.all([
      fetch(`/api/productores/${id}`),
      fetch(`/api/mensajes?productor_id=${id}`),
    ])
    if (!pRes.ok) { router.push('/productores'); return }
    const [p, m] = await Promise.all([pRes.json(), mRes.json()])
    setProductor(p)
    setMensajes(m)
    setLoading(false)
  }, [id, router])

  useEffect(() => { fetchData() }, [fetchData])

  const handleSave = () => {
    toast.success('Productor actualizado')
    fetchData()
  }

  const toggleRespondio = async (m: Mensaje) => {
    const next = !m.respondio
    setMensajes(prev => prev.map(x => x.id === m.id ? { ...x, respondio: next } : x))
    try {
      const nota = notaInputs[m.id] ?? m.nota_respuesta ?? ''
      const res = await fetch(`/api/mensajes/${m.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ respondio: next, nota_respuesta: next ? nota : null }),
      })
      if (!res.ok) throw new Error()
      toast.success(next ? 'Marcado como respondido' : 'Marcado sin respuesta')
      if (next) setExpandedMsg(m.id)
    } catch {
      setMensajes(prev => prev.map(x => x.id === m.id ? { ...x, respondio: m.respondio } : x))
      toast.error('No se pudo actualizar. Verificá que la columna respondio exista en Supabase.')
    }
  }

  const saveNota = async (m: Mensaje) => {
    const nota = notaInputs[m.id] ?? ''
    try {
      await fetch(`/api/mensajes/${m.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nota_respuesta: nota }),
      })
      setMensajes(prev => prev.map(x => x.id === m.id ? { ...x, nota_respuesta: nota } : x))
      toast.success('Nota guardada')
    } catch {
      toast.error('Error al guardar la nota')
    }
  }

  const loadCopilot = async () => {
    setLoadingCopilot(true)
    try {
      const res = await fetch('/api/copilot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productor_id: id }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setCopilot(data)
      setCopilotMessage(data.suggestedMessage ?? '')
      toast.success('Sugerencia cargada')
    } catch {
      toast.error('No se pudo generar sugerencia')
    } finally {
      setLoadingCopilot(false)
    }
  }

  if (loading) {
    return (
      <div className="p-8 max-w-4xl mx-auto">
        <div className="mb-6">
          <SkeletonText className="h-3 w-24 mb-4" />
          <SkeletonText className="h-6 w-48 mb-2" />
          <SkeletonText className="h-3 w-32" />
        </div>
        <div className="grid grid-cols-2 gap-4 mb-6">
          {[1, 2].map(i => (
            <div key={i} className="bg-[#141414] border border-[#1f1f1f] rounded-xl p-5 space-y-3">
              {[1, 2, 3].map(j => <SkeletonText key={j} className="h-3" />)}
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (!productor) return null

  return (
    <div className="p-8 max-w-4xl mx-auto">
      {/* Back */}
      <Link href="/productores" className="inline-flex items-center gap-1.5 text-[12px] text-zinc-600 hover:text-zinc-300 transition-colors mb-5">
        <ArrowLeft size={13} />
        Productores
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-white mb-1">{productor.nombre}</h1>
          <div className="flex items-center gap-2">
            <StatusBadge status={productor.estado} />
            {productor.tipo_evento && (
              <span className="text-[11px] text-zinc-600 bg-[#1a1a1a] rounded-md px-2 py-0.5 border border-[#222]">
                {productor.tipo_evento}
              </span>
            )}
          </div>
        </div>
        <button
          onClick={() => setModalOpen(true)}
          className="flex items-center gap-2 px-3.5 py-2 text-[13px] text-zinc-400 hover:text-white border border-[#1f1f1f] hover:border-[#2a2a2a] rounded-lg transition-all"
        >
          <Pencil size={13} />
          Editar
        </button>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-6">
        {/* Contacto */}
        <div className="bg-[#141414] border border-[#1f1f1f] rounded-xl p-5">
          <p className="text-[10px] font-medium text-zinc-600 uppercase tracking-widest mb-4">Contacto</p>
          <div className="space-y-3">
            {[
              { icon: Mail,      value: productor.email,    mono: false },
              { icon: Phone,     value: productor.telefono, mono: true  },
              { icon: Building2, value: productor.empresa,  mono: false },
              { icon: Tag,       value: productor.tipo_evento, mono: false },
            ].filter(r => r.value).map(({ icon: Icon, value, mono }) => (
              <div key={value} className="flex items-center gap-2.5">
                <Icon size={13} className="text-zinc-700 shrink-0" />
                <span className={`text-[13px] text-zinc-400 ${mono ? 'font-mono' : ''}`}>{value}</span>
              </div>
            ))}
            {!productor.email && !productor.telefono && !productor.empresa && (
              <p className="text-[12px] text-zinc-700 italic">Sin datos de contacto</p>
            )}
          </div>
        </div>

        {/* Notas */}
        <div className="bg-[#141414] border border-[#1f1f1f] rounded-xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <StickyNote size={12} className="text-zinc-700" />
            <p className="text-[10px] font-medium text-zinc-600 uppercase tracking-widest">Notas</p>
          </div>
          <p className="text-[13px] text-zinc-500 leading-relaxed whitespace-pre-wrap">
            {productor.notas || <span className="text-zinc-700 italic">Sin notas</span>}
          </p>
        </div>
      </div>

      {/* Copiloto IA */}
      <div className="bg-[#141414] border border-[#1f1f1f] rounded-xl p-5 mb-6">
        <div className="flex items-center justify-between gap-3 mb-3">
          <div className="flex items-center gap-2">
            <Sparkles size={12} className="text-violet-400" />
            <p className="text-[10px] font-medium text-zinc-600 uppercase tracking-widest">Copiloto comercial IA</p>
          </div>
          <button
            onClick={loadCopilot}
            disabled={loadingCopilot}
            className="px-3 py-1.5 text-[11px] text-violet-300 border border-violet-500/30 bg-violet-500/10 rounded-lg hover:bg-violet-500/20 transition-colors disabled:opacity-60"
          >
            {loadingCopilot ? 'Analizando...' : 'Sugerir siguiente paso'}
          </button>
        </div>

        {!copilot ? (
          <p className="text-[12px] text-zinc-600">Genera una recomendación para saber cuál es la próxima mejor acción con este contacto.</p>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-[12px]">
              <StatusBadge status={copilot.action} />
              <span className="text-zinc-500">Prioridad:</span>
              <StatusBadge status={copilot.priority} />
            </div>
            <p className="text-[12px] text-zinc-500 leading-relaxed">{copilot.reason}</p>
            <textarea
              rows={4}
              value={copilotMessage}
              onChange={(e) => setCopilotMessage(e.target.value)}
              className="w-full bg-[#0f0f0f] border border-[#1f1f1f] rounded-lg px-3 py-2 text-[12px] text-zinc-300 resize-none"
            />
            <button
              onClick={() => {
                navigator.clipboard.writeText(copilotMessage)
                toast.success('Mensaje copiado')
              }}
              className="px-3 py-1.5 text-[11px] text-zinc-300 border border-[#2a2a2a] rounded-lg hover:text-white transition-colors"
            >
              Copiar mensaje sugerido
            </button>
          </div>
        )}
      </div>

      {/* Timeline omnicanal */}
      <div className="bg-[#141414] border border-[#1f1f1f] rounded-xl overflow-hidden">
        <div className="flex items-center gap-2 px-5 py-3.5 border-b border-[#1a1a1a]">
          <MessageSquare size={13} className="text-zinc-600" />
          <p className="text-[13px] font-medium text-white">Conversación</p>
          <span className="text-[11px] text-zinc-600 ml-1">{mensajes.length} mensaje{mensajes.length !== 1 ? 's' : ''}</span>
          <div className="ml-auto flex items-center gap-3 text-[10px] text-zinc-700">
            <span className="flex items-center gap-1"><CheckCircle2 size={10} className="text-emerald-500" /> {mensajes.filter(m => m.respondio).length} respondidos</span>
            <span className="flex items-center gap-1"><Clock size={10} className="text-amber-500" /> {mensajes.filter(m => m.status === 'enviado' && !m.respondio).length} sin respuesta</span>
          </div>
        </div>

        {!mensajes.length ? (
          <div className="py-12 text-center">
            <MessageSquare size={22} className="text-zinc-800 mx-auto mb-3" />
            <p className="text-[12px] text-zinc-700">No se enviaron mensajes aún</p>
          </div>
        ) : (
          <div className="divide-y divide-[#111]">
            {mensajes.map(m => {
              const isExpanded = expandedMsg === m.id
              const respondio = m.respondio ?? false
              return (
                <div key={m.id} className="px-5 py-4 hover:bg-white/[0.01] transition-colors">
                  <div className="flex items-center justify-between gap-3 mb-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <StatusBadge status={m.canal} />
                      <StatusBadge status={m.status} />
                      {m.campanas && (
                        <span className="text-[10px] text-zinc-600 bg-[#1a1a1a] rounded px-1.5 py-0.5 border border-[#222]">
                          {(m.campanas as { titulo?: string }).titulo}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-[11px] text-zinc-700">
                        {format(new Date(m.enviado_at ?? m.created_at), "d MMM, HH:mm", { locale: es })}
                      </span>
                      {m.status === 'enviado' && (
                        <button
                          onClick={() => toggleRespondio(m)}
                          className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] border transition-all ${
                            respondio
                              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                              : 'bg-amber-500/8 border-amber-500/20 text-amber-500 hover:border-amber-500/40'
                          }`}
                        >
                          {respondio ? <CheckCircle2 size={10} /> : <Clock size={10} />}
                          {respondio ? 'Respondió' : 'Sin respuesta'}
                        </button>
                      )}
                      <button
                        onClick={() => setExpandedMsg(isExpanded ? null : m.id)}
                        className="text-zinc-700 hover:text-zinc-400 transition-colors"
                      >
                        {isExpanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                      </button>
                    </div>
                  </div>

                  {m.contenido && (
                    <p className={`text-[12px] text-zinc-600 leading-relaxed ${isExpanded ? '' : 'line-clamp-2'}`}>
                      {m.contenido}
                    </p>
                  )}

                  {isExpanded && (
                    <div className="mt-3 pt-3 border-t border-[#1a1a1a] space-y-2">
                      <p className="text-[10px] text-zinc-600 uppercase tracking-widest">Nota de respuesta</p>
                      <textarea
                        rows={2}
                        placeholder="Qué respondió, próximo paso, etc..."
                        value={notaInputs[m.id] ?? m.nota_respuesta ?? ''}
                        onChange={e => setNotaInputs(prev => ({ ...prev, [m.id]: e.target.value }))}
                        className="w-full bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg px-3 py-2 text-[12px] text-zinc-300 resize-none focus:outline-none focus:border-violet-500/40 transition-all"
                      />
                      <button
                        onClick={() => saveNota(m)}
                        className="px-3 py-1 text-[11px] text-zinc-400 border border-[#2a2a2a] hover:text-white hover:border-[#3a3a3a] rounded-lg transition-all"
                      >
                        Guardar nota
                      </button>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      <ProductorModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSave={handleSave}
        productor={productor}
      />
    </div>
  )
}
