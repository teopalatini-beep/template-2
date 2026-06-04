'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Users, Megaphone, MessageSquare, ArrowRight, PlusCircle } from 'lucide-react'
import StatusBadge from '@/components/StatusBadge'
import { Campana } from '@/lib/types'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

interface DashboardData {
  totalProductores: number
  campanasEsteMes: number
  totalMensajes: number
  ultimasCampanas: Campana[]
}

function StatCard({ icon: Icon, label, value, color }: {
  icon: React.ElementType
  label: string
  value: number
  color: string
}) {
  return (
    <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-5">
      <div className="flex items-start justify-between mb-4">
        <div className={`w-9 h-9 rounded-lg ${color} flex items-center justify-center`}>
          <Icon size={16} className="text-white" />
        </div>
      </div>
      <p className="text-3xl font-bold text-white mb-1">{value.toLocaleString('es-AR')}</p>
      <p className="text-sm text-zinc-500">{label}</p>
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
    <div className="p-8 max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Dashboard</h1>
        <p className="text-zinc-500 text-sm mt-1">Resumen de actividad del CRM</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <StatCard
          icon={Users}
          label="Total de productores"
          value={loading ? 0 : (data?.totalProductores ?? 0)}
          color="bg-violet-600"
        />
        <StatCard
          icon={Megaphone}
          label="Campañas enviadas este mes"
          value={loading ? 0 : (data?.campanasEsteMes ?? 0)}
          color="bg-emerald-600"
        />
        <StatCard
          icon={MessageSquare}
          label="Mensajes enviados"
          value={loading ? 0 : (data?.totalMensajes ?? 0)}
          color="bg-blue-600"
        />
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        <Link
          href="/productores"
          className="group bg-[#1a1a1a] border border-[#2a2a2a] hover:border-violet-500/40 rounded-xl p-5 transition-all flex items-center justify-between"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-violet-600/15 flex items-center justify-center">
              <Users size={16} className="text-violet-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-white">Ver productores</p>
              <p className="text-xs text-zinc-500">Gestioná tu base de contactos</p>
            </div>
          </div>
          <ArrowRight size={15} className="text-zinc-600 group-hover:text-violet-400 transition-colors" />
        </Link>

        <Link
          href="/campanas/nueva"
          className="group bg-[#1a1a1a] border border-[#2a2a2a] hover:border-violet-500/40 rounded-xl p-5 transition-all flex items-center justify-between"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-violet-600/15 flex items-center justify-center">
              <PlusCircle size={16} className="text-violet-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-white">Nueva campaña</p>
              <p className="text-xs text-zinc-500">Enviá mensajes masivos</p>
            </div>
          </div>
          <ArrowRight size={15} className="text-zinc-600 group-hover:text-violet-400 transition-colors" />
        </Link>
      </div>

      {/* Últimas campañas */}
      <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#2a2a2a]">
          <h2 className="text-sm font-semibold text-white">Últimas campañas enviadas</h2>
          <Link href="/campanas" className="text-xs text-violet-400 hover:text-violet-300 transition-colors">
            Ver todas
          </Link>
        </div>

        {loading ? (
          <div className="p-8 text-center text-zinc-600 text-sm">Cargando...</div>
        ) : !data?.ultimasCampanas?.length ? (
          <div className="p-8 text-center text-zinc-600 text-sm">
            Todavía no enviaste ninguna campaña.{' '}
            <Link href="/campanas/nueva" className="text-violet-400 hover:underline">
              Crear la primera
            </Link>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#2a2a2a]">
                {['Título', 'Canal', 'Fecha de envío', 'Estado'].map(h => (
                  <th key={h} className="px-5 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wide">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.ultimasCampanas.map(c => (
                <tr key={c.id} className="border-b border-[#1f1f1f] last:border-0 hover:bg-white/[0.02] transition-colors">
                  <td className="px-5 py-3.5">
                    <Link href={`/campanas/${c.id}`} className="text-sm text-white hover:text-violet-400 transition-colors">
                      {c.titulo}
                    </Link>
                  </td>
                  <td className="px-5 py-3.5">
                    <StatusBadge status={c.canal} />
                  </td>
                  <td className="px-5 py-3.5 text-sm text-zinc-400">
                    {c.fecha_envio
                      ? format(new Date(c.fecha_envio), "d MMM yyyy, HH:mm", { locale: es })
                      : '-'}
                  </td>
                  <td className="px-5 py-3.5">
                    <StatusBadge status={c.estado} />
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
