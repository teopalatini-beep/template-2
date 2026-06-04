'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Plus, ChevronRight } from 'lucide-react'
import { Campana } from '@/lib/types'
import StatusBadge from '@/components/StatusBadge'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

export default function CampanasPage() {
  const [campanas, setCampanas] = useState<Campana[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/campanas')
      .then(r => r.json())
      .then(data => { setCampanas(data); setLoading(false) })
  }, [])

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white">Historial de campañas</h1>
          <p className="text-zinc-500 text-sm mt-1">{campanas.length} campaña{campanas.length !== 1 ? 's' : ''} en total</p>
        </div>
        <Link
          href="/campanas/nueva"
          className="flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white text-sm font-medium rounded-lg transition-colors"
        >
          <Plus size={15} />
          Nueva campaña
        </Link>
      </div>

      <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl overflow-hidden">
        {loading ? (
          <div className="p-10 text-center text-zinc-600 text-sm">Cargando campañas...</div>
        ) : !campanas.length ? (
          <div className="p-10 text-center text-zinc-600 text-sm">
            Todavía no creaste ninguna campaña.{' '}
            <Link href="/campanas/nueva" className="text-violet-400 hover:underline">
              Crear la primera
            </Link>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#2a2a2a]">
                {['Título', 'Canal', 'Estado', 'Fecha de envío', ''].map(h => (
                  <th key={h} className="px-5 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wide">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {campanas.map(c => (
                <tr key={c.id} className="border-b border-[#1f1f1f] last:border-0 hover:bg-white/[0.02] transition-colors group">
                  <td className="px-5 py-4">
                    <p className="text-sm font-medium text-white">{c.titulo}</p>
                    <p className="text-xs text-zinc-600 mt-0.5 line-clamp-1">{c.mensaje}</p>
                  </td>
                  <td className="px-5 py-4">
                    <StatusBadge status={c.canal} />
                  </td>
                  <td className="px-5 py-4">
                    <StatusBadge status={c.estado} />
                  </td>
                  <td className="px-5 py-4 text-sm text-zinc-400">
                    {c.fecha_envio
                      ? format(new Date(c.fecha_envio), "d MMM yyyy, HH:mm", { locale: es })
                      : '-'}
                  </td>
                  <td className="px-5 py-4">
                    <Link
                      href={`/campanas/${c.id}`}
                      className="flex items-center gap-1 text-xs text-zinc-600 hover:text-violet-400 transition-colors opacity-0 group-hover:opacity-100"
                    >
                      Ver detalle
                      <ChevronRight size={12} />
                    </Link>
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
