'use client'

import { useEffect, useRef, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Send, CheckCircle2, XCircle, Trash2, MessageSquare, Clock, AlertTriangle, TrendingUp, Users, LayoutList, BarChart3 } from 'lucide-react'
import { Campana, Mensaje } from '@/lib/types'
import StatusBadge from '@/components/StatusBadge'
import ConfirmModal from '@/components/ConfirmModal'
import { SkeletonText, SkeletonTable } from '@/components/Skeleton'
import { format, formatDistanceToNow } from 'date-fns'
import { es } from 'date-fns/locale'
import { toast } from 'sonner'

const DELETE_UNDO_MS = 8000
const RESPONSE_RATE_HEALTHY = 45
const DELIVERY_RATE_HEALTHY = 95

interface CampanaDetail {
  campana: Campana
  mensajes: (Mensaje & { productores?: { nombre: string; empresa: string | null } })[]
}

function getVariant(content: string | null): 'A' | 'B' | null {
  if (!content) return null
  if (content.startsWith('[A]')) return 'A'
  if (content.startsWith('[B]')) return 'B'
  return null
}

function FunnelBar({ label, value, total, color, benchmark }: {
  label: string; value: number; total: number; color: string; benchmark?: number
}) {
  const pct = total > 0 ? Math.round((value / total) * 100) : 0
  const isUnhealthy = benchmark !== undefined && pct < benchmark
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-[11px] text-zinc-500">{label}</span>
        <div className="flex items-center gap-1.5">
          {isUnhealthy && <AlertTriangle size={10} className="text-amber-400" />}
          <span className={`text-[13px] font-semibold tabular-nums ${isUnhealthy ? 'text-amber-400' : color}`}>{pct}%</span>
          <span className="text-[10px] text-zinc-700">({value}/{total})</span>
        </div>
      </div>
      <div className="h-1.5 bg-[#1a1a1a] rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${isUnhealthy ? 'bg-amber-500/60' : color.replace('text-', 'bg-').replace('-400', '-500/60')}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      {isUnhealthy && benchmark !== undefined && (
        <p className="text-[10px] text-amber-500/70 mt-1">Por debajo del benchmark saludable ({benchmark}%)</p>
      )}
    </div>
  )
}

export default function CampanaDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [data, setData] = useState<CampanaDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [deleteScheduled, setDeleteScheduled] = useState(false)
  const [view, setView] = useState<'timeline' | 'table'>('timeline')
  const deleteTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    fetch(`/api/campanas/${id}`)
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false) })
  }, [id])

  useEffect(() => {
    return () => { if (deleteTimerRef.current) clearTimeout(deleteTimerRef.current) }
  }, [])

  if (loading) {
    return (
      <div className="p-8 max-w-4xl mx-auto">
        <SkeletonText className="h-3 w-20 mb-5" />
        <SkeletonText className="h-6 w-64 mb-2" />
        <SkeletonText className="h-3 w-40 mb-8" />
        <div className="grid grid-cols-4 gap-4 mb-6">
          {[1, 2, 3, 4].map(i => <div key={i} className="bg-[#141414] border border-[#1f1f1f] rounded-xl p-4 space-y-2"><SkeletonText className="h-6 w-8" /><SkeletonText className="h-3 w-24" /></div>)}
        </div>
        <div className="bg-[#141414] border border-[#1f1f1f] rounded-xl overflow-hidden">
          <table className="w-full"><tbody><SkeletonTable rows={4} cols={4} /></tbody></table>
        </div>
      </div>
    )
  }

  if (!data) return null

  const { campana, mensajes } = data

  // Core metrics
  const total = mensajes.length
  const enviados = mensajes.filter(m => m.status === 'enviado').length
  const fallidos = mensajes.filter(m => m.status === 'fallido').length
  const respondidos = mensajes.filter(m => m.respondio).length
  const deliveryRate = total > 0 ? Math.round((enviados / total) * 100) : 0
  const responseRate = enviados > 0 ? Math.round((respondidos / enviados) * 100) : 0
  const sinRespuesta = enviados - respondidos

  // A/B stats
  const variantStats = mensajes.reduce(
    (acc, m) => {
      const key = getVariant(m.contenido)
      if (!key) return acc
      acc[key].total += 1
      if (m.status === 'enviado') acc[key].enviados += 1
      if (m.respondio) acc[key].respondidos += 1
      return acc
    },
    { A: { total: 0, enviados: 0, respondidos: 0 }, B: { total: 0, enviados: 0, respondidos: 0 } }
  )
  const rateA = variantStats.A.enviados > 0 ? Math.round((variantStats.A.respondidos / variantStats.A.enviados) * 100) : 0
  const rateB = variantStats.B.enviados > 0 ? Math.round((variantStats.B.respondidos / variantStats.B.enviados) * 100) : 0
  const winner = variantStats.A.total && variantStats.B.total ? (rateA >= rateB ? 'A' : 'B') : null
  const hasAB = variantStats.A.total > 0 || variantStats.B.total > 0

  // Sort messages for timeline (oldest first)
  const timelineMensajes = [...mensajes].sort(
    (a, b) => new Date(a.enviado_at ?? a.created_at).getTime() - new Date(b.enviado_at ?? b.created_at).getTime()
  )

  const handleDelete = async () => {
    setDeleting(true)
    setDeleteOpen(false)
    setDeleteScheduled(true)
    deleteTimerRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/campanas/${campana.id}`, { method: 'DELETE' })
        const result = await res.json()
        if (!res.ok) throw new Error(result.error)
        toast.success('Campaña eliminada')
        router.push('/campanas')
      } catch (error: unknown) {
        setDeleteScheduled(false)
        toast.error(error instanceof Error ? error.message : 'No se pudo eliminar la campaña')
      } finally {
        deleteTimerRef.current = null
      }
    }, DELETE_UNDO_MS)
    toast('Campaña marcada para eliminar', {
      action: {
        label: 'Deshacer',
        onClick: () => {
          if (!deleteTimerRef.current) return
          clearTimeout(deleteTimerRef.current)
          deleteTimerRef.current = null
          setDeleteScheduled(false)
          toast.success('Eliminación cancelada')
        },
      },
    })
    setDeleting(false)
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <Link href="/campanas" className="inline-flex items-center gap-1.5 text-[12px] text-zinc-600 hover:text-zinc-300 transition-colors mb-5">
        <ArrowLeft size={13} />
        Campañas
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between mb-6 gap-3">
        <div>
          <h1 className="text-xl font-semibold text-white mb-2">{campana.titulo}</h1>
          <div className="flex items-center gap-2 flex-wrap">
            <StatusBadge status={campana.canal} />
            <StatusBadge status={campana.estado} />
            {campana.fecha_envio && (
              <span className="text-[11px] text-zinc-600">
                {format(new Date(campana.fecha_envio), "d 'de' MMMM yyyy, HH:mm", { locale: es })}
              </span>
            )}
          </div>
        </div>
        {campana.estado === 'enviada' && (
          <button
            onClick={() => setDeleteOpen(true)}
            disabled={deleteScheduled}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[12px] text-zinc-400 hover:text-red-300 border border-[#2a2a2a] hover:border-red-500/30 rounded-lg transition-colors shrink-0"
          >
            <Trash2 size={12} />
            {deleteScheduled ? 'Pendiente...' : 'Eliminar'}
          </button>
        )}
      </div>

      {/* Delivery alert */}
      {campana.estado === 'enviada' && deliveryRate < DELIVERY_RATE_HEALTHY && total > 0 && (
        <div className="flex items-center gap-3 px-4 py-3 bg-amber-500/8 border border-amber-500/20 rounded-xl mb-5">
          <AlertTriangle size={14} className="text-amber-500 shrink-0" />
          <p className="text-[13px] text-amber-400">
            <span className="font-semibold">Tasa de entrega baja ({deliveryRate}%)</span> — el benchmark saludable es ≥{DELIVERY_RATE_HEALTHY}%. Revisá la calidad de tu lista o el estado de tu cuenta de envío.
          </p>
        </div>
      )}

      {/* KPI cards */}
      <div className="grid grid-cols-4 gap-3 mb-5">
        {[
          { icon: Users,         label: 'Destinatarios',    value: total,       color: 'text-zinc-400',    bg: 'bg-zinc-500/10' },
          { icon: Send,          label: 'Entregados',        value: enviados,    color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
          { icon: MessageSquare, label: 'Respondidos',       value: respondidos, color: 'text-violet-400',  bg: 'bg-violet-500/10' },
          { icon: Clock,         label: 'Sin respuesta',     value: sinRespuesta,color: 'text-amber-400',   bg: 'bg-amber-500/10' },
        ].map(({ icon: Icon, label, value, color, bg }) => (
          <div key={label} className="bg-[#141414] border border-[#1f1f1f] rounded-xl p-4 hover:border-[#2a2a2a] transition-colors">
            <div className={`w-7 h-7 ${bg} rounded-lg flex items-center justify-center mb-3`}>
              <Icon size={12} className={color} />
            </div>
            <p className={`text-2xl font-bold tabular-nums mb-0.5 ${color}`}>{value}</p>
            <p className="text-[11px] text-zinc-600">{label}</p>
          </div>
        ))}
      </div>

      {/* Funnel metrics */}
      <div className="bg-[#141414] border border-[#1f1f1f] rounded-xl p-5 mb-5">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp size={13} className="text-zinc-600" />
          <p className="text-[10px] font-medium text-zinc-600 uppercase tracking-widest">Embudo de rendimiento</p>
        </div>
        <div className="space-y-4">
          <FunnelBar
            label="Tasa de entrega"
            value={enviados}
            total={total}
            color="text-emerald-400"
            benchmark={DELIVERY_RATE_HEALTHY}
          />
          <FunnelBar
            label={`Tasa de respuesta ${campana.canal === 'whatsapp' ? '(benchmark saludable ≥45%)' : ''}`}
            value={respondidos}
            total={enviados}
            color="text-violet-400"
            benchmark={campana.canal === 'whatsapp' ? RESPONSE_RATE_HEALTHY : undefined}
          />
        </div>
        <div className="mt-4 pt-4 border-t border-[#1a1a1a] flex items-center justify-between">
          <span className="text-[11px] text-zinc-600">Tasa de error</span>
          <div className="flex items-center gap-1.5">
            {fallidos > 0 && <XCircle size={11} className="text-red-400" />}
            <span className={`text-[13px] font-semibold tabular-nums ${fallidos > 0 ? 'text-red-400' : 'text-zinc-600'}`}>
              {total > 0 ? Math.round((fallidos / total) * 100) : 0}%
            </span>
            <span className="text-[10px] text-zinc-700">({fallidos} fallidos)</span>
          </div>
        </div>
      </div>

      {/* A/B performance (response-based) */}
      {hasAB && (
        <div className="bg-[#141414] border border-[#1f1f1f] rounded-xl p-5 mb-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <BarChart3 size={13} className="text-zinc-600" />
              <p className="text-[10px] font-medium text-zinc-600 uppercase tracking-widest">A/B — Tasa de respuesta</p>
            </div>
            {winner && (
              <span className="text-[11px] text-emerald-300 bg-emerald-500/10 border border-emerald-500/20 rounded-md px-2 py-0.5">
                Ganadora: Variante {winner}
              </span>
            )}
          </div>
          <div className="grid grid-cols-2 gap-3">
            {(['A', 'B'] as const).map(v => {
              const stat = variantStats[v]
              const rate = v === 'A' ? rateA : rateB
              const isWinner = winner === v
              return (
                <div key={v} className={`bg-[#0f0f0f] border rounded-lg p-4 transition-all ${isWinner ? 'border-emerald-500/30' : 'border-[#1f1f1f]'}`}>
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-[12px] text-zinc-400 font-medium">Variante {v}</p>
                    {isWinner && <CheckCircle2 size={12} className="text-emerald-400" />}
                  </div>
                  <p className={`text-2xl font-bold tabular-nums mb-1 ${isWinner ? 'text-emerald-400' : 'text-white'}`}>{rate}%</p>
                  <p className="text-[11px] text-zinc-600">{stat.respondidos}/{stat.enviados} respondidos</p>
                  <div className="mt-2 h-1 bg-[#1a1a1a] rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${isWinner ? 'bg-emerald-500/60' : 'bg-zinc-500/40'}`} style={{ width: `${rate}%` }} />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Mensaje original */}
      <div className="bg-[#141414] border border-[#1f1f1f] rounded-xl p-5 mb-5">
        <p className="text-[10px] font-medium text-zinc-600 uppercase tracking-widest mb-3">Contenido enviado</p>
        <p className="text-[13px] text-zinc-400 leading-relaxed whitespace-pre-wrap">{campana.mensaje}</p>
      </div>

      {/* Timeline / Tabla de destinatarios */}
      <div className="bg-[#141414] border border-[#1f1f1f] rounded-xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#1a1a1a]">
          <div className="flex items-center gap-2">
            <p className="text-[13px] font-medium text-white">Destinatarios</p>
            <span className="text-[11px] text-zinc-600">{total}</span>
            <span className="text-[10px] text-zinc-700 ml-2 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-violet-500 inline-block" />{respondidos} respondieron
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 inline-block ml-1" />{sinRespuesta} sin respuesta
            </span>
          </div>
          <div className="flex items-center gap-1 bg-[#0f0f0f] border border-[#1f1f1f] rounded-lg p-1">
            <button
              onClick={() => setView('timeline')}
              className={`p-1.5 rounded-md transition-all ${view === 'timeline' ? 'bg-[#2a2a2a] text-white' : 'text-zinc-600 hover:text-zinc-400'}`}
            >
              <MessageSquare size={12} />
            </button>
            <button
              onClick={() => setView('table')}
              className={`p-1.5 rounded-md transition-all ${view === 'table' ? 'bg-[#2a2a2a] text-white' : 'text-zinc-600 hover:text-zinc-400'}`}
            >
              <LayoutList size={12} />
            </button>
          </div>
        </div>

        {!mensajes.length ? (
          <div className="py-10 text-center text-[12px] text-zinc-700">Sin destinatarios</div>
        ) : view === 'timeline' ? (
          <div className="divide-y divide-[#111]">
            {timelineMensajes.map((m, i) => {
              const respondio = m.respondio ?? false
              const ts = m.enviado_at ?? m.created_at
              const elapsed = formatDistanceToNow(new Date(ts), { locale: es, addSuffix: true })
              return (
                <div key={m.id} className="flex items-start gap-3 px-5 py-4 hover:bg-white/[0.01] transition-colors">
                  {/* Timeline connector */}
                  <div className="flex flex-col items-center shrink-0 pt-1">
                    <div className={`w-2 h-2 rounded-full ${respondio ? 'bg-violet-500' : m.status === 'fallido' ? 'bg-red-500' : 'bg-zinc-600'}`} />
                    {i < timelineMensajes.length - 1 && <div className="w-px flex-1 bg-[#1a1a1a] mt-1 min-h-[16px]" />}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <div className="flex items-center gap-2 min-w-0">
                        <Link href={`/productores/${m.productor_id}`} className="text-[13px] font-medium text-zinc-200 hover:text-violet-400 transition-colors truncate">
                          {m.productores?.nombre ?? '—'}
                        </Link>
                        {m.productores?.empresa && (
                          <span className="text-[11px] text-zinc-600 truncate hidden sm:block">{m.productores.empresa}</span>
                        )}
                        <StatusBadge status={m.status} />
                        {getVariant(m.contenido) && (
                          <span className="text-[10px] font-mono text-zinc-600 bg-[#1a1a1a] rounded px-1.5 py-0.5">
                            {getVariant(m.contenido)}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] border ${
                          respondio
                            ? 'bg-violet-500/10 border-violet-500/30 text-violet-300'
                            : 'bg-[#1a1a1a] border-[#2a2a2a] text-zinc-600'
                        }`}>
                          {respondio ? <CheckCircle2 size={9} /> : <Clock size={9} />}
                          {respondio ? 'Respondió' : 'Sin respuesta'}
                        </span>
                        <span className="text-[10px] text-zinc-700">{elapsed}</span>
                      </div>
                    </div>
                    {m.nota_respuesta && (
                      <p className="mt-1 text-[11px] text-zinc-500 italic">"{m.nota_respuesta}"</p>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#1a1a1a]">
                {['Productor', 'Empresa', 'Entregado', 'Respondió', 'Enviado'].map(h => (
                  <th key={h} className="px-5 py-2.5 text-left text-[10px] font-medium text-zinc-600 uppercase tracking-widest">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {mensajes.map(m => (
                <tr key={m.id} className="border-b border-[#111] last:border-0 hover:bg-white/[0.015] transition-colors">
                  <td className="px-5 py-3.5">
                    <Link href={`/productores/${m.productor_id}`} className="text-[13px] text-zinc-200 hover:text-violet-400 transition-colors">
                      {m.productores?.nombre ?? '—'}
                    </Link>
                  </td>
                  <td className="px-5 py-3.5 text-[12px] text-zinc-600">{m.productores?.empresa || '—'}</td>
                  <td className="px-5 py-3.5"><StatusBadge status={m.status} /></td>
                  <td className="px-5 py-3.5">
                    <span className={`flex items-center gap-1 text-[11px] w-fit px-2 py-0.5 rounded-full border ${
                      m.respondio
                        ? 'text-violet-300 border-violet-500/30 bg-violet-500/10'
                        : 'text-zinc-600 border-[#2a2a2a]'
                    }`}>
                      {m.respondio ? <CheckCircle2 size={9} /> : <Clock size={9} />}
                      {m.respondio ? 'Sí' : 'No'}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-[12px] text-zinc-600 font-mono">
                    {m.enviado_at ? format(new Date(m.enviado_at), "HH:mm:ss") : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <ConfirmModal
        open={deleteOpen}
        title="Eliminar campaña enviada"
        description="Se borrará la campaña y su historial de destinatarios. Esta acción no se puede deshacer."
        confirmLabel="Eliminar"
        onConfirm={handleDelete}
        onCancel={() => setDeleteOpen(false)}
        loading={deleting}
      />
    </div>
  )
}
