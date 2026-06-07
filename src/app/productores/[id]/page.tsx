'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft, Pencil, Mail, Phone, Building2, Tag, StickyNote, MessageSquare,
  Phone as PhoneIcon, Users, FileText, Send, Trash2, Plus, Loader2,
  CalendarDays, MapPin, Ticket,
} from 'lucide-react'
import { Productor, Mensaje, Actividad, TipoActividad, Evento, EstadoEvento } from '@/lib/types'
import StatusBadge from '@/components/StatusBadge'
import ProductorModal from '@/components/ProductorModal'
import { SkeletonText } from '@/components/Skeleton'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

const TIPOS_ACT: { key: TipoActividad; label: string; icon: React.ElementType; color: string; bg: string }[] = [
  { key: 'llamada',  label: 'Llamada',  icon: PhoneIcon, color: 'text-sky-400',     bg: 'bg-sky-500/10' },
  { key: 'reunion',  label: 'Reunión',  icon: Users,     color: 'text-violet-400',  bg: 'bg-violet-500/10' },
  { key: 'nota',     label: 'Nota',     icon: FileText,  color: 'text-amber-400',   bg: 'bg-amber-500/10' },
  { key: 'email',    label: 'Email',    icon: Send,      color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
]

const ESTADOS_EVENTO: { key: EstadoEvento; label: string; color: string; dot: string }[] = [
  { key: 'pre_evento',  label: 'Pre-evento',  color: 'text-sky-400',     dot: 'bg-sky-500' },
  { key: 'en_vivo',     label: 'En vivo',     color: 'text-emerald-400', dot: 'bg-emerald-500' },
  { key: 'finalizado',  label: 'Finalizado',  color: 'text-zinc-500',    dot: 'bg-zinc-600' },
]

function ActividadItem({ actividad, onDelete }: { actividad: Actividad; onDelete: (id: string) => void }) {
  const tipo = TIPOS_ACT.find(t => t.key === actividad.tipo)!
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

function EventoCard({ evento, onDelete, onChangeEstado }: {
  evento: Evento
  onDelete: (id: string) => void
  onChangeEstado: (id: string, estado: EstadoEvento) => void
}) {
  const estadoInfo = ESTADOS_EVENTO.find(e => e.key === evento.estado)!
  return (
    <div className="group bg-[#0f0f0f] border border-[#1f1f1f] hover:border-[#2a2a2a] rounded-xl p-4 transition-all">
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex items-center gap-2 min-w-0">
          <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${estadoInfo.dot}`} />
          <p className="text-[13px] font-semibold text-zinc-100 truncate">{evento.nombre}</p>
        </div>
        <button
          onClick={() => onDelete(evento.id)}
          className="opacity-0 group-hover:opacity-100 transition-opacity text-zinc-700 hover:text-red-400 shrink-0"
        >
          <Trash2 size={12} />
        </button>
      </div>

      <div className="flex flex-wrap gap-x-3 gap-y-1 mb-3">
        {evento.fecha_evento && (
          <div className="flex items-center gap-1.5">
            <CalendarDays size={11} className="text-zinc-700" />
            <span className="text-[11px] text-zinc-500">
              {format(new Date(evento.fecha_evento + 'T12:00:00'), "d MMM yyyy", { locale: es })}
            </span>
          </div>
        )}
        {evento.lugar && (
          <div className="flex items-center gap-1.5">
            <MapPin size={11} className="text-zinc-700" />
            <span className="text-[11px] text-zinc-500 truncate max-w-[140px]">{evento.lugar}</span>
          </div>
        )}
        {evento.capacidad && (
          <div className="flex items-center gap-1.5">
            <Ticket size={11} className="text-zinc-700" />
            <span className="text-[11px] text-zinc-500">{evento.capacidad.toLocaleString()} cap.</span>
          </div>
        )}
      </div>

      {evento.notas && (
        <p className="text-[11px] text-zinc-600 leading-relaxed mb-3 line-clamp-2">{evento.notas}</p>
      )}

      <div className="flex gap-1">
        {ESTADOS_EVENTO.map(e => (
          <button
            key={e.key}
            onClick={() => onChangeEstado(evento.id, e.key)}
            className={`px-2.5 py-1 rounded-md text-[10px] font-medium transition-all ${
              evento.estado === e.key
                ? `${e.color} bg-white/5 border border-current/20`
                : 'text-zinc-700 hover:text-zinc-400'
            }`}
          >
            {e.label}
          </button>
        ))}
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
  const [eventos, setEventos] = useState<Evento[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)

  const [tipoNueva, setTipoNueva] = useState<TipoActividad>('nota')
  const [descripcion, setDescripcion] = useState('')
  const [savingAct, setSavingAct] = useState(false)

  const [showEventoForm, setShowEventoForm] = useState(false)
  const [eventoForm, setEventoForm] = useState({ nombre: '', lugar: '', fecha_evento: '', capacidad: '', notas: '' })
  const [savingEvento, setSavingEvento] = useState(false)

  const fetchData = useCallback(async () => {
    const [pRes, mRes, aRes, eRes] = await Promise.all([
      fetch(`/api/productores/${id}`),
      fetch(`/api/mensajes?productor_id=${id}`),
      fetch(`/api/productores/${id}/actividades`),
      fetch(`/api/productores/${id}/eventos`),
    ])
    if (!pRes.ok) { router.push('/productores'); return }
    const [p, m, a, e] = await Promise.all([pRes.json(), mRes.json(), aRes.json(), eRes.json()])
    setProductor(p)
    setMensajes(m)
    setActividades(a)
    setEventos(e)
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
    setSavingAct(true)
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
    setSavingAct(false)
  }

  const handleDeleteActividad = async (actId: string) => {
    setActividades(prev => prev.filter(a => a.id !== actId))
    const res = await fetch(`/api/actividades/${actId}`, { method: 'DELETE' })
    if (!res.ok) { toast.error('Error al eliminar'); fetchData() }
  }

  const handleAddEvento = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!eventoForm.nombre.trim()) return
    setSavingEvento(true)
    const res = await fetch(`/api/productores/${id}/eventos`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(eventoForm),
    })
    if (res.ok) {
      const nuevo = await res.json()
      setEventos(prev => [...prev, nuevo])
      setEventoForm({ nombre: '', lugar: '', fecha_evento: '', capacidad: '', notas: '' })
      setShowEventoForm(false)
      toast.success('Evento agregado')
    } else {
      toast.error('Error al guardar')
    }
    setSavingEvento(false)
  }

  const handleDeleteEvento = async (eventoId: string) => {
    setEventos(prev => prev.filter(e => e.id !== eventoId))
    const res = await fetch(`/api/eventos/${eventoId}`, { method: 'DELETE' })
    if (!res.ok) { toast.error('Error al eliminar'); fetchData() }
  }

  const handleChangeEstado = async (eventoId: string, estado: EstadoEvento) => {
    setEventos(prev => prev.map(e => e.id === eventoId ? { ...e, estado } : e))
    const res = await fetch(`/api/eventos/${eventoId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ estado }),
    })
    if (!res.ok) { toast.error('Error al actualizar'); fetchData() }
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
      <Link href="/productores" className="inline-flex items-center gap-1.5 text-[12px] text-zinc-600 hover:text-zinc-300 transition-colors mb-5">
        <ArrowLeft size={13} />
        Productores
      </Link>

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
            {productor.valor_estimado != null && productor.valor_estimado > 0 && (
              <span className="text-[11px] text-emerald-400 bg-emerald-500/8 rounded-md px-2 py-0.5 border border-emerald-500/15">
                ${productor.valor_estimado.toLocaleString()}
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

      <div className="grid grid-cols-2 gap-4 mb-4">
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

      {/* Eventos */}
      <div className="bg-[#141414] border border-[#1f1f1f] rounded-xl overflow-hidden mb-4">
        <div className="flex items-center gap-2 px-5 py-3.5 border-b border-[#1a1a1a]">
          <CalendarDays size={13} className="text-zinc-600" />
          <p className="text-[13px] font-medium text-white">Eventos</p>
          <span className="text-[11px] text-zinc-600 ml-1">{eventos.length}</span>
          <button
            onClick={() => setShowEventoForm(v => !v)}
            className="ml-auto flex items-center gap-1.5 px-2.5 py-1 text-[11px] text-zinc-500 hover:text-violet-400 border border-[#2a2a2a] hover:border-violet-500/30 rounded-lg transition-all"
          >
            <Plus size={11} />
            Agregar
          </button>
        </div>

        {showEventoForm && (
          <form onSubmit={handleAddEvento} className="p-4 border-b border-[#1a1a1a] space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <input
                value={eventoForm.nombre}
                onChange={e => setEventoForm(p => ({ ...p, nombre: e.target.value }))}
                placeholder="Nombre del evento *"
                className="col-span-2 bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg px-3 py-2 text-[13px] text-white placeholder-zinc-700 focus:outline-none focus:border-violet-500/60 transition-all"
              />
              <input
                value={eventoForm.lugar}
                onChange={e => setEventoForm(p => ({ ...p, lugar: e.target.value }))}
                placeholder="Lugar / Venue"
                className="bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg px-3 py-2 text-[13px] text-white placeholder-zinc-700 focus:outline-none focus:border-violet-500/60 transition-all"
              />
              <input
                type="date"
                value={eventoForm.fecha_evento}
                onChange={e => setEventoForm(p => ({ ...p, fecha_evento: e.target.value }))}
                className="bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg px-3 py-2 text-[13px] text-zinc-400 focus:outline-none focus:border-violet-500/60 transition-all"
              />
              <input
                type="number"
                value={eventoForm.capacidad}
                onChange={e => setEventoForm(p => ({ ...p, capacidad: e.target.value }))}
                placeholder="Capacidad"
                className="bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg px-3 py-2 text-[13px] text-white placeholder-zinc-700 focus:outline-none focus:border-violet-500/60 transition-all"
              />
              <input
                value={eventoForm.notas}
                onChange={e => setEventoForm(p => ({ ...p, notas: e.target.value }))}
                placeholder="Notas (opcional)"
                className="bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg px-3 py-2 text-[13px] text-white placeholder-zinc-700 focus:outline-none focus:border-violet-500/60 transition-all"
              />
            </div>
            <div className="flex gap-2 justify-end">
              <button type="button" onClick={() => setShowEventoForm(false)} className="px-3 py-1.5 text-[12px] text-zinc-500 hover:text-white border border-[#2a2a2a] rounded-lg transition-all">
                Cancelar
              </button>
              <button
                type="submit"
                disabled={savingEvento || !eventoForm.nombre.trim()}
                className="flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-medium bg-violet-600 hover:bg-violet-500 disabled:opacity-40 text-white rounded-lg transition-all"
              >
                {savingEvento ? <Loader2 size={11} className="animate-spin" /> : <Plus size={11} />}
                Guardar evento
              </button>
            </div>
          </form>
        )}

        {eventos.length === 0 && !showEventoForm ? (
          <div className="py-10 text-center">
            <CalendarDays size={22} className="text-zinc-800 mx-auto mb-3" />
            <p className="text-[12px] text-zinc-700">Sin eventos registrados</p>
          </div>
        ) : (
          <div className="p-4 grid grid-cols-2 gap-3">
            {eventos.map(ev => (
              <EventoCard
                key={ev.id}
                evento={ev}
                onDelete={handleDeleteEvento}
                onChangeEstado={handleChangeEstado}
              />
            ))}
          </div>
        )}
      </div>

      {/* Actividad */}
      <div className="bg-[#141414] border border-[#1f1f1f] rounded-xl overflow-hidden mb-4">
        <div className="flex items-center gap-2 px-5 py-3.5 border-b border-[#1a1a1a]">
          <Plus size={13} className="text-zinc-600" />
          <p className="text-[13px] font-medium text-white">Registrar actividad</p>
        </div>
        <form onSubmit={handleAddActividad} className="p-4 space-y-3">
          <div className="flex gap-2">
            {TIPOS_ACT.map(t => {
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
              disabled={savingAct || !descripcion.trim()}
              className="flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-500 disabled:opacity-40 text-white text-[13px] font-medium rounded-lg transition-all"
            >
              {savingAct ? <Loader2 size={13} className="animate-spin" /> : <Plus size={13} />}
              Guardar
            </button>
          </div>
        </form>
      </div>

      {actividades.length > 0 && (
        <div className="bg-[#141414] border border-[#1f1f1f] rounded-xl p-5 mb-4">
          <p className="text-[10px] font-medium text-zinc-600 uppercase tracking-widest mb-4">
            Historial de actividad · {actividades.length}
          </p>
          <div>
            {actividades.map(a => (
              <ActividadItem key={a.id} actividad={a} onDelete={handleDeleteActividad} />
            ))}
          </div>
        </div>
      )}

      {/* Mensajes */}
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
