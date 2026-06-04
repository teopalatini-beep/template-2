'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { Campana, Mensaje } from '@/lib/types'
import StatusBadge from '@/components/StatusBadge'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

interface CampanaDetail {
  campana: Campana
  mensajes: (Mensaje & { productores?: { nombre: string; empresa: string | null } })[]
}

export default function CampanaDetailPage() {
  const { id } = useParams<{ id: string }>()
  const [data, setData] = useState<CampanaDetail | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`/api/campanas/${id}`)
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false) })
  }, [id])

  if (loading) return <div className="p-8 text-center text-zinc-600 text-sm">Cargando...</div>
  if (!data) return null

  const { campana, mensajes } = data
  const enviados = mensajes.filter(m => m.status === 'enviado').length
  const fallidos = mensajes.filter(m => m.status === 'fallido').length

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <Link href="/campanas" className="flex items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-300 transition-colors mb-6">
        <ArrowLeft size={14} />
        Volver a campañas
      </Link>

      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">{campana.titulo}</h1>
          <div className="flex items-center gap-2 mt-2">
            <StatusBadge status={campana.canal} />
            <StatusBadge status={campana.estado} />
            {campana.fecha_envio && (
              <span className="text-xs text-zinc-500">
                {format(new Date(campana.fecha_envio), "d 'de' MMMM yyyy, HH:mm", { locale: es })}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-white">{mensajes.length}</p>
          <p className="text-xs text-zinc-500 mt-1">Total destinatarios</p>
        </div>
        <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-emerald-400">{enviados}</p>
          <p className="text-xs text-zinc-500 mt-1">Enviados</p>
        </div>
        <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-red-400">{fallidos}</p>
          <p className="text-xs text-zinc-500 mt-1">Fallidos</p>
        </div>
      </div>

      {/* Mensaje */}
      <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-5 mb-6">
        <h2 className="text-xs font-semibold text-zinc-500 uppercase tracking-wide mb-3">Contenido del mensaje</h2>
        <p className="text-sm text-zinc-300 leading-relaxed whitespace-pre-wrap">{campana.mensaje}</p>
      </div>

      {/* Destinatarios */}
      <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-[#2a2a2a]">
          <h2 className="text-sm font-semibold text-white">Destinatarios</h2>
        </div>
        {!mensajes.length ? (
          <div className="p-8 text-center text-zinc-600 text-sm">Sin destinatarios registrados.</div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#2a2a2a]">
                {['Productor', 'Empresa', 'Estado', 'Fecha de envío'].map(h => (
                  <th key={h} className="px-5 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wide">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {mensajes.map(m => (
                <tr key={m.id} className="border-b border-[#1f1f1f] last:border-0 hover:bg-white/[0.02] transition-colors">
                  <td className="px-5 py-3.5">
                    <Link href={`/productores/${m.productor_id}`} className="text-sm text-white hover:text-violet-400 transition-colors">
                      {m.productores?.nombre ?? m.productor_id}
                    </Link>
                  </td>
                  <td className="px-5 py-3.5 text-sm text-zinc-400">{m.productores?.empresa || '-'}</td>
                  <td className="px-5 py-3.5">
                    <StatusBadge status={m.status} />
                  </td>
                  <td className="px-5 py-3.5 text-sm text-zinc-400">
                    {m.enviado_at
                      ? format(new Date(m.enviado_at), "d MMM yyyy, HH:mm", { locale: es })
                      : '-'}
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
