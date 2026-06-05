'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Users, Megaphone, MessageSquare, ArrowRight, PlusCircle, TrendingUp } from 'lucide-react'
import StatusBadge from '@/components/StatusBadge'
import { SkeletonCard, SkeletonTable } from '@/components/Skeleton'
import { Campana } from '@/lib/types'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

interface DashboardData {
  totalProductores: number
  campanasEsteMes: number
  totalMensajes: number
  ultimasCampanas: Campana[]
}

function StatCard({ icon: Icon, label, value, color, loading }: {
  icon: React.ElementType
  label: string
  value: number
  color: string
  loading: boolean
}) {
  if (loading) return <SkeletonCard />

  return (
    <div className="bg-[#141414] border border-[#1f1f1f] rounded-xl p-5 hover:border-[#2a2a2a] transition-colors">
      <div className={`w-8 h-8 rounded-lg ${color} flex items-center justify-center mb-4`}>
        <Icon size={14} className="text-white" />
      </div>
      <p className="text-2xl font-bold text-white tracking-tight mb-0.5">
        {value.toLocaleString('es-AR')}
      </p>
      <p className="text-[12px] text-zinc-500">{label}</p>
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

  return (
    <div className="p-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-1">
          <TrendingUp size={14} className="text-violet-400" />
          <span className="text-[11px] font-medium text-violet-400 uppercase tracking-widest">Overview</span>
        </div>
        <h1 className="text-xl font-semibold text-white">Dashboard</h1>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <StatCard icon={Users}         label="Productores"          value={data?.totalProductores ?? 0} color="bg-violet-600"  loading={loading} />
        <StatCard icon={Megaphone}     label="Campañas este mes"    value={data?.campanasEsteMes ?? 0}  color="bg-emerald-600" loading={loading} />
        <StatCard icon={MessageSquare} label="Mensajes enviados"    value={data?.totalMensajes ?? 0}    color="bg-sky-600"     loading={loading} />
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-2 gap-3 mb-8">
        {[
          { href: '/productores', icon: Users,      label: 'Ver productores', sub: 'Gestioná tu base de contactos' },
          { href: '/campanas/nueva', icon: PlusCircle, label: 'Nueva campaña', sub: 'Enviá mensajes por WhatsApp o email' },
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
          <p className="text-[13px] font-medium text-white">Últimas campañas</p>
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
