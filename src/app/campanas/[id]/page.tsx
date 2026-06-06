'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Send, CheckCircle, XCircle } from 'lucide-react'
import { Campana, Mensaje } from '@/lib/types'
import StatusBadge from '@/components/StatusBadge'
import { SkeletonText, SkeletonTable } from '@/components/Skeleton'
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
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch(`/api/campanas/${id}`)
      .then(r => r.json())
      .then(d => {
        if (d.error) throw new Error(d.error)
        setData(d)
      })
      .catch(e => setError(e.message ?? 'Error al cargar la campaña'))
      .finally(() => setLoading(false))
  }, [id])

  if (loading) {
    return (
      <div className="p-8 max-w-4xl mx-auto">
        <SkeletonText className="h-3 w-20 mb-5" />
        <SkeletonText className="h-6 w-64 mb-2" />
        <SkeletonText className="h-3 w-40 mb-8" />
        <div className="grid grid-cols-3 gap-4 mb-6">
          {[1, 2, 3].map(i => <div key={i} className="bg-[#141414] border border-[#1f1f1f] rounded-xl p-4 space-y-2"><SkeletonText className="h-6 w-8" /><SkeletonText className="h-3 w-24" /></div>)}
        </div>
        <div className="bg-[#141414] border border-[#1f1f1f] rounded-xl overflow-hidden">
          <table className="w-full"><tbody><SkeletonTable rows={4} cols={4} /></tbody></table>
        </div>
      </div>
    )
  }

  if (error) return (
    <div className="p-8 max-w-4xl mx-auto">
      <Link href="/campanas" className="inline-flex items-center gap-1.5 text-[12px] text-zinc-600 hover:text-zinc-300 transition-colors mb-5">
        <ArrowLeft size={13} />
        Campañas
      </Link>
      <p className="text-[13px] text-red-400">{error}</p>
    </div>
  )

  if (!data) return null

  const { campana, mensajes } = data
  const enviados = mensajes.filter(m => m.status === 'enviado').length
  const fallidos = mensajes.filter(m => m.status === 'fallido').length
  const tasa = mensajes.length > 0 ? Math.round((enviados / mensajes.length) * 100) : 0

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <Link href="/campanas" className="inline-flex items-center gap-1.5 text-[12px] text-zinc-600 hover:text-zinc-300 transition-colors mb-5">
        <ArrowLeft size={13} />
        Campañas
      </Link>

      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-white mb-2">{campana.titulo}</h1>
          <div className="flex items-center gap-2">
            <StatusBadge status={campana.canal} />
            <StatusBadge status={campana.estado} />
            {campana.fecha_envio && (
              <span className="text-[11px] text-zinc-600">
                {format(new Date(campana.fecha_envio), "d 'de' MMMM yyyy, HH:mm", { locale: es })}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-3 mb-6">
        {[
          { label: 'Total',    value: mensajes.length, icon: Send,         color: 'text-zinc-400' },
          { label: 'Enviados', value: enviados,         icon: CheckCircle,  color: 'text-emerald-400' },
          { label: 'Fallidos', value: fallidos,         icon: XCircle,      color: 'text-red-400' },
          { label: 'Tasa éxito', value: `${tasa}%`,    icon: null,         color: 'text-violet-400' },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="bg-[#141414] border border-[#1f1f1f] rounded-xl p-4">
            <div className={`text-xl font-bold mb-0.5 ${color}`}>{value}</div>
            <div className="flex items-center gap-1.5">
              {Icon && <Icon size={11} className={color} />}
              <p className="text-[11px] text-zinc-600">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Mensaje */}
      <div className="bg-[#141414] border border-[#1f1f1f] rounded-xl p-5 mb-5">
        <p className="text-[10px] font-medium text-zinc-600 uppercase tracking-widest mb-3">Contenido</p>
        <p className="text-[13px] text-zinc-400 leading-relaxed whitespace-pre-wrap">{campana.mensaje}</p>
      </div>

      {/* Destinatarios */}
      <div className="bg-[#141414] border border-[#1f1f1f] rounded-xl overflow-hidden">
        <div className="px-5 py-3.5 border-b border-[#1a1a1a]">
          <p className="text-[13px] font-medium text-white">Destinatarios</p>
        </div>
        {!mensajes.length ? (
          <div className="py-10 text-center text-[12px] text-zinc-700">Sin destinatarios</div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#1a1a1a]">
                {['Productor', 'Empresa', 'Estado', 'Enviado'].map(h => (
                  <th key={h} className="px-5 py-2.5 text-left text-[10px] font-medium text-zinc-600 uppercase tracking-widest">
                    {h}
                  </th>
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
                  <td className="px-5 py-3.5 text-[12px] text-zinc-600 font-mono">
                    {m.enviado_at ? format(new Date(m.enviado_at), "HH:mm:ss", { locale: es }) : '—'}
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
