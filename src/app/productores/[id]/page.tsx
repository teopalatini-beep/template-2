'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Pencil, Mail, Phone, Building2, Tag, StickyNote, MessageSquare, Phone as PhoneIcon, Users, FileText, Send, Trash2, Plus, Loader2 } from 'lucide-react'
import { Productor, Mensaje, Actividad, TipoActividad } from '@/lib/types'
import StatusBadge from '@/components/StatusBadge'
import ProductorModal from '@/components/ProductorModal'
import { SkeletonText } from '@/components/Skeleton'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

const TIPOS: { key: TipoActividad; label: string; icon: React.ElementType; color: string; bg: string }[] = [
  { key: 'llamada',  label: 'Llamada',  icon: PhoneIcon,   color: 'text-sky-400',    bg: 'bg-sky-500/10' },
  { key: 'reunion',  label: 'Reunión',  icon: Users,       color: 'text-violet-400', bg: 'bg-violet-500/10' },
  { key: 'nota',     label: 'Nota',     icon: FileText,    color: 'text-amber-400',  bg: 'bg-amber-500/10' },
  { key: 'email',    label: 'Email',    icon: Send,        color: 'text-emerald-400',bg: 'bg-emerald-500/10' },
]

function ActividadItem({ actividad, onDelete }: { actividad: Actividad; onDelete: (id: string) => void }) {
  const tipo = TIPOS.find(t => t.key === actividad.tipo)!
  const Icon = tipo.icon
  return (
    <div className="flex gap-3 group">
      <div className="flex flex-col items-center shrink-0">
        <div className={`w-7 h-7 rounded-lg ${tipo.bg} flex items-center justify-center`}>
          <Icon size={12} className={tipo.color} />
        </div>
        <div className="w-px flex-1 bg-[#1f1f1f] mt-1.5" />
      </div>
      <div className="flex-1 pb-4">
        <div className="flex items-start justify-between gap-2">
          <div>
            <span className={`text-[11px] font-medium ${tipo.color}`}>{tipo.label}</span>
            <span className="text-[11px] text-zinc-700 ml-2">
              {format(new Date(actividad.created_at), "d MMM yyyy, HH:mm", { locale: es })}
            </span>
          </div>
          <button
            onClick={() => onDelete(actividad.id)}
            className="opacity-0 group-hover:opacity-100 transition-opacity text-zinc-700 hover:text-red-400 shrink-0"
          >
            <Trash2 size={12} />
          </button>
        </div>
        <p className="text-[13px] text-zinc-400 mt-1 leading-relaxed">{actividad.descripcion}</p>
      </div>
    </div>
  )
}

export default function ProductorDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [productor, setProductor] = useState<Productor | null>(null)
  const [mensajes, setMensajes] = useState<Mensaje[]>([])
  const [actividades, setActividades] = useState<Actividad[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)

  const [tipoNueva, setTipoNueva] = useState<TipoActividad>('nota')
  const [descripcion, setDescripcion] = useState('')
  const [saving, setSaving] = useState(false)

  const fetchData = useCallback(async () => {
    const [pRes, mRes, aRes] = await Promise.all([
      fetch(`/api/productores/${id}`),
      fetch(`/api/mensajes?productor_id=${id}`),
      fetch(`/api/productores/${id}/actividades`),
    ])
    if (!pRes.ok) { router.push('/productores'); return }
    const [p, m, a] = await Promise.all([pRes.json(), mRes.json(), aRes.json()])
    setProductor(p)
    setMensajes(m)
    setActividades(a)
    setLoading(false)
  }, [id, router])

  useEffect(() => { fetchData() }, [fetchData])

  const handleSave = () => {
    toast.success('Productor actualizado')
    fetchData()
  }

  const handleAddActividad = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!descripcion.trim()) return
    setSaving(true)
    const res = await fetch(`/api/productores/${id}/actividades`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tipo: tipoNueva, descripcion: descripcion.trim() }),
    })
    if (res.ok) {
      const nueva = await res.json()
      setActividades(prev => [nueva, ...prev])
      setDescripcion('')
      toast.success('Actividad registrada')
    } else {
      toast.error('Error al guardar')
    }
    setSaving(false)
  }

  const handleDeleteActividad = async (actividadId: string) => {
    setActividades(prev => prev.filter(a => a.id !== actividadId))
    const res = await fetch(`/api/actividades/${actividadId}`, { method: 'DELETE' })
    if (!res.ok) {
      toast.error('Error al eliminar')
      fetchData()
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
              { icon: Mail,      value: productor.email,       mono: false },
              { icon: Phone,     value: productor.telefono,    mono: true  },
              { icon: Building2, value: productor.empresa,     mono: false },
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

      {/* Actividad */}
      <div className="bg-[#141414] border border-[#1f1f1f] rounded-xl overflow-hidden mb-4">
        <div className="flex items-center gap-2 px-5 py-3.5 border-b border-[#1a1a1a]">
          <Plus size={13} className="text-zinc-600" />
          <p className="text-[13px] font-medium text-white">Registrar actividad</p>
        </div>

        <form onSubmit={handleAddActividad} className="p-4 space-y-3">
          {/* Tipo selector */}
          <div className="flex gap-2">
            {TIPOS.map(t => {
              const Icon = t.icon
              const active = tipoNueva === t.key
              return (
                <button
                  key={t.key}
                  type="button"
                  onClick={() => setTipoNueva(t.key)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-medium transition-all border ${
                    active
                      ? `${t.bg} ${t.color} border-current/20`
                      : 'text-zinc-600 border-[#2a2a2a] hover:text-zinc-300 hover:border-[#333]'
                  }`}
                >
                  <Icon size={11} />
                  {t.label}
                </button>
              )
            })}
          </div>

          <div className="flex gap-2">
            <input
              type="text"
              value={descripcion}
              onChange={e => setDescripcion(e.target.value)}
              placeholder={
                tipoNueva === 'llamada' ? 'Ej: Llamé, quedó en confirmar el viernes' :
                tipoNueva === 'reunion' ? 'Ej: Reunión en sus oficinas, le gustó la propuesta' :
                tipoNueva === 'email'   ? 'Ej: Mandé propuesta con precios actualizados' :
                'Ej: Pendiente definir fechas para el evento de diciembre'
              }
              className="flex-1 bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg px-3 py-2 text-[13px] text-white placeholder-zinc-700 focus:outline-none focus:border-violet-500/60 focus:ring-1 focus:ring-violet-500/20 transition-all"
            />
            <button
              type="submit"
              disabled={saving || !descripcion.trim()}
              className="flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-500 disabled:opacity-40 text-white text-[13px] font-medium rounded-lg transition-all"
            >
              {saving ? <Loader2 size={13} className="animate-spin" /> : <Plus size={13} />}
              Guardar
            </button>
          </div>
        </form>
      </div>

      {/* Timeline de actividades */}
      {actividades.length > 0 && (
        <div className="bg-[#141414] border border-[#1f1f1f] rounded-xl p-5 mb-4">
          <p className="text-[10px] font-medium text-zinc-600 uppercase tracking-widest mb-4">
            Historial de actividad · {actividades.length}
          </p>
          <div>
            {actividades.map((a, i) => (
              <div key={a.id} className={i === actividades.length - 1 ? '[&_.divider]:hidden' : ''}>
                <ActividadItem actividad={a} onDelete={handleDeleteActividad} />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Mensajes de campañas */}
      <div className="bg-[#141414] border border-[#1f1f1f] rounded-xl overflow-hidden">
        <div className="flex items-center gap-2 px-5 py-3.5 border-b border-[#1a1a1a]">
          <MessageSquare size={13} className="text-zinc-600" />
          <p className="text-[13px] font-medium text-white">Mensajes de campañas</p>
          <span className="text-[11px] text-zinc-600 ml-1">{mensajes.length}</span>
        </div>

        {!mensajes.length ? (
          <div className="py-10 text-center">
            <MessageSquare size={22} className="text-zinc-800 mx-auto mb-3" />
            <p className="text-[12px] text-zinc-700">No se enviaron mensajes aún</p>
          </div>
        ) : (
          <div className="divide-y divide-[#111]">
            {mensajes.map(m => (
              <div key={m.id} className="px-5 py-4 hover:bg-white/[0.01] transition-colors">
                <div className="flex items-center justify-between gap-4 mb-2">
                  <div className="flex items-center gap-2">
                    <StatusBadge status={m.canal} />
                    <StatusBadge status={m.status} />
                  </div>
                  <span className="text-[11px] text-zinc-700 shrink-0">
                    {format(new Date(m.enviado_at ?? m.created_at), "d MMM yyyy, HH:mm", { locale: es })}
                  </span>
                </div>
                {m.contenido && (
                  <p className="text-[12px] text-zinc-600 leading-relaxed line-clamp-2">{m.contenido}</p>
                )}
              </div>
            ))}
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
