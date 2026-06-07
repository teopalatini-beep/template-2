'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  Users, Megaphone, MessageSquare, ArrowRight, PlusCircle,
  Kanban, AlertTriangle, Phone, FileText, Send, Mail,
  TrendingUp, Activity,
} from 'lucide-react'
import StatusBadge from '@/components/StatusBadge'
import { SkeletonCard, SkeletonTable } from '@/components/Skeleton'
import { Campana } from '@/lib/types'
import { format, formatDistanceToNow } from 'date-fns'
import { es } from 'date-fns/locale'

interface PipelineStats {
  total: number
  valorTotal: number
  porEtapa: Record<string, number>
  dealsVencidos: number
}

interface UltimaActividad {
  id: string
  tipo: string
  descripcion: string
  created_at: string
  productor_id: string
  productores: { nombre: string } | null
}

interface DashboardData {
  totalProductores: number
  campanasEsteMes: number
  totalMensajes: number
  ultimasCampanas: Campana[]
  pipeline: PipelineStats
  ultimasActividades: UltimaActividad[]
}

function fmt(n: number) {
  if (n >= 1000000) return `$${(n / 1000000).toFixed(1)}M`
  if (n >= 1000) return `$${(n / 1000).toFixed(n % 1000 === 0 ? 0 : 1)}k`
  return `$${n}`
}

const ACTIVITY_ICONS: Record<string, { icon: React.ElementType; color: string; bg: string }> = {
  llamada: { icon: Phone,    color: 'text-sky-400',     bg: 'bg-sky-500/10' },
  reunion: { icon: Users,    color: 'text-violet-400',  bg: 'bg-violet-500/10' },
  nota:    { icon: FileText, color: 'text-amber-400',   bg: 'bg-amber-500/10' },
  email:   { icon: Send,     color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
}

const ETAPA_LABELS: Record<string, { label: string; color: string }> = {
  nuevo:       { label: 'Nuevo',       color: 'text-zinc-400' },
  contactado:  { label: 'Contactado',  color: 'text-sky-400' },
  propuesta:   { label: 'Propuesta',   color: 'text-violet-400' },
  negociacion: { label: 'Negociación', color: 'text-amber-400' },
}

function StatCard({ icon: Icon, label, value, color, sub, loading }: {
  icon: React.ElementType
  label: string
  value: string | number
  color: string
  sub?: string
  loading: boolean
}) {
  if (loading) return <SkeletonCard />
  return (
    <div className="bg-[#141414] border border-[#1f1f1f] rounded-xl p-5 hover:border-[#2a2a2a] transition-colors">
      <div className={`w-8 h-8 rounded-lg ${color} flex items-center justify-center mb-4`}>
        <Icon size={14} className="text-white" />
      </div>
      <p className="text-2xl font-bold text-white tracking-tight mb-0.5 tabular-nums">{value}</p>
      <p className="text-[12px] text-zinc-500">{label}</p>
      {sub && <p className="text-[11px] text-zinc-700 mt-0.5">{sub}</p>}
    </div>
  )
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/dashboard')
      .then(r => r.json())
      .then(setData)
      .finally(() => setLoading(false))
  }, [])

  const pipeline = data?.pipeline
  const valorStr = pipeline?.valorTotal ? fmt(pipeline.valorTotal) : null

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <TrendingUp size={14} className="text-violet-400" />
          <span className="text-[11px] font-medium text-violet-400 uppercase tracking-widest">Overview</span>
        </div>
        <h1 className="text-xl font-semibold text-white">Dashboard</h1>
      </div>

      {/* Alerta deals vencidos */}
      {!loading && pipeline && pipeline.dealsVencidos > 0 && (
        <Link
          href="/pipeline"
          className="flex items-center gap-3 px-4 py-3 bg-amber-500/8 border border-amber-500/20 rounded-xl hover:border-amber-500/35 transition-colors group"
        >
          <AlertTriangle size={14} className="text-amber-500 shrink-0" />
          <p className="text-[13px] text-amber-400 flex-1">
            <span className="font-semibold">{pipeline.dealsVencidos} deal{pipeline.dealsVencidos > 1 ? 's' : ''}</span> sin actividad hace más de 7 días en el pipeline
          </p>
          <span className="text-[11px] text-amber-500 group-hover:text-amber-400 font-medium shrink-0 flex items-center gap-1">
            Ver pipeline <ArrowRight size={11} />
          </span>
        </Link>
      )}

      {/* Stats principales */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Users}        label="Productores"       value={data?.totalProductores ?? 0}  color="bg-violet-600"  loading={loading} />
        <StatCard icon={Kanban}       label="Deals activos"     value={pipeline?.total ?? 0}         color="bg-sky-600"    loading={loading} sub={valorStr ? `${valorStr} en pipeline` : undefined} />
        <StatCard icon={Megaphone}    label="Campañas este mes" value={data?.campanasEsteMes ?? 0}   color="bg-emerald-600" loading={loading} />
        <StatCard icon={MessageSquare} label="Mensajes enviados" value={data?.totalMensajes ?? 0}    color="bg-rose-600"   loading={loading} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Pipeline breakdown */}
        <div className="bg-[#141414] border border-[#1f1f1f] rounded-xl overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#1a1a1a]">
            <p className="text-[13px] font-medium text-white">Estado del pipeline</p>
            <Link href="/pipeline" className="text-[11px] text-zinc-500 hover:text-violet-400 transition-colors flex items-center gap-1">
              Ver <ArrowRight size={11} />
            </Link>
          </div>
          {loading ? (
            <div className="p-5 space-y-3">
              {[1,2,3,4].map(i => <div key={i} className="h-8 bg-[#1a1a1a] rounded-lg animate-pulse" />)}
            </div>
          ) : !pipeline?.total ? (
            <div className="py-10 text-center">
              <Kanban size={22} className="text-zinc-800 mx-auto mb-2" />
              <p className="text-[12px] text-zinc-600">Sin deals en el pipeline</p>
            </div>
          ) : (
            <div className="p-4 space-y-2">
              {Object.entries(ETAPA_LABELS).map(([key, { label, color }]) => {
                const count = pipeline.porEtapa[key] ?? 0
                const pct = pipeline.total > 0 ? Math.round((count / pipeline.total) * 100) : 0
                return (
                  <div key={key} className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className={`text-[12px] font-medium ${color}`}>{label}</span>
                      <span className="text-[12px] text-zinc-500 tabular-nums">{count}</span>
                    </div>
                    <div className="h-1.5 bg-[#1a1a1a] rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full bg-violet-600/60 transition-all"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                )
              })}
              {pipeline.valorTotal > 0 && (
                <div className="pt-2 mt-2 border-t border-[#1a1a1a] flex items-center justify-between">
                  <span className="text-[11px] text-zinc-600">Valor total</span>
                  <span className="text-[13px] font-semibold text-emerald-400 tabular-nums">{fmt(pipeline.valorTotal)}</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Actividad reciente */}
        <div className="lg:col-span-2 bg-[#141414] border border-[#1f1f1f] rounded-xl overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#1a1a1a]">
            <div className="flex items-center gap-2">
              <Activity size={13} className="text-zinc-500" />
              <p className="text-[13px] font-medium text-white">Actividad reciente</p>
            </div>
          </div>
          {loading ? (
            <div className="p-5 space-y-3">
              {[1,2,3,4,5].map(i => <div key={i} className="h-10 bg-[#1a1a1a] rounded-lg animate-pulse" />)}
            </div>
          ) : !data?.ultimasActividades?.length ? (
            <div className="py-10 text-center">
              <Activity size={22} className="text-zinc-800 mx-auto mb-2" />
              <p className="text-[12px] text-zinc-600">Sin actividad registrada aún</p>
            </div>
          ) : (
            <div className="divide-y divide-[#111]">
              {data.ultimasActividades.map(act => {
                const meta = ACTIVITY_ICONS[act.tipo] ?? ACTIVITY_ICONS.nota
                const Icon = meta.icon
                return (
                  <div key={act.id} className="flex items-start gap-3 px-5 py-3 hover:bg-white/[0.015] transition-colors">
                    <div className={`w-6 h-6 rounded-md ${meta.bg} flex items-center justify-center shrink-0 mt-0.5`}>
                      <Icon size={11} className={meta.color} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 mb-0.5">
                        {act.productores?.nombre && (
                          <Link
                            href={`/productores/${act.productor_id}`}
                            className="text-[12px] font-medium text-zinc-300 hover:text-violet-400 transition-colors truncate"
                          >
                            {act.productores.nombre}
                          </Link>
                        )}
                        <span className={`text-[10px] font-medium capitalize shrink-0 ${meta.color}`}>{act.tipo}</span>
                      </div>
                      <p className="text-[12px] text-zinc-600 truncate">{act.descripcion}</p>
                    </div>
                    <span className="text-[11px] text-zinc-700 shrink-0 tabular-nums">
                      {formatDistanceToNow(new Date(act.created_at), { locale: es, addSuffix: true })}
                    </span>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-2 gap-3">
        {[
          { href: '/productores', icon: Users,      label: 'Ver productores', sub: 'Gestioná tu base de contactos' },
          { href: '/campanas/nueva', icon: PlusCircle, label: 'Nueva campaña', sub: 'WhatsApp o email a tu lista' },
        ].map(({ href, icon: Icon, label, sub }) => (
          <Link
            key={href}
            href={href}
            className="group flex items-center justify-between bg-[#141414] border border-[#1f1f1f] hover:border-violet-500/25 rounded-xl p-4 transition-all duration-200"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-violet-600/10 flex items-center justify-center group-hover:bg-violet-600/15 transition-colors">
                <Icon size={14} className="text-violet-400" />
              </div>
              <div>
                <p className="text-[13px] font-medium text-white">{label}</p>
                <p className="text-[11px] text-zinc-600">{sub}</p>
              </div>
            </div>
            <ArrowRight size={14} className="text-zinc-700 group-hover:text-violet-400 group-hover:translate-x-0.5 transition-all" />
          </Link>
        ))}
      </div>

      {/* Últimas campañas */}
      <div className="bg-[#141414] border border-[#1f1f1f] rounded-xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#1a1a1a]">
          <div className="flex items-center gap-2">
            <Mail size={13} className="text-zinc-500" />
            <p className="text-[13px] font-medium text-white">Últimas campañas</p>
          </div>
          <Link href="/campanas" className="text-[11px] text-zinc-500 hover:text-violet-400 transition-colors flex items-center gap-1">
            Ver todas <ArrowRight size={11} />
          </Link>
        </div>

        {loading ? (
          <table className="w-full"><tbody><SkeletonTable rows={4} cols={4} /></tbody></table>
        ) : !data?.ultimasCampanas?.length ? (
          <div className="py-12 text-center">
            <Megaphone size={24} className="text-zinc-800 mx-auto mb-3" />
            <p className="text-[13px] text-zinc-600 mb-2">Todavía no enviaste ninguna campaña</p>
            <Link href="/campanas/nueva" className="text-[12px] text-violet-400 hover:text-violet-300 transition-colors">
              Crear la primera →
            </Link>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#1a1a1a]">
                {['Título', 'Canal', 'Estado', 'Fecha'].map(h => (
                  <th key={h} className="px-5 py-2.5 text-left text-[10px] font-medium text-zinc-600 uppercase tracking-widest">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.ultimasCampanas.map((c) => (
                <tr key={c.id} className="border-b border-[#111] last:border-0 hover:bg-white/[0.015] transition-colors">
                  <td className="px-5 py-3.5">
                    <Link href={`/campanas/${c.id}`} className="text-[13px] text-zinc-200 hover:text-violet-400 transition-colors font-medium">
                      {c.titulo}
                    </Link>
                  </td>
                  <td className="px-5 py-3.5"><StatusBadge status={c.canal} /></td>
                  <td className="px-5 py-3.5"><StatusBadge status={c.estado} /></td>
                  <td className="px-5 py-3.5 text-[12px] text-zinc-600">
                    {c.fecha_envio ? format(new Date(c.fecha_envio), "d MMM, HH:mm", { locale: es }) : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
