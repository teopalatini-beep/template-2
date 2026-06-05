'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Plus, ChevronRight, Megaphone } from 'lucide-react'
import { Campana } from '@/lib/types'
import StatusBadge from '@/components/StatusBadge'
import { SkeletonTable } from '@/components/Skeleton'
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
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="flex items-center gap-2 mb-0.5">
            <Megaphone size={13} className="text-zinc-600" />
            <span className="text-[11px] text-zinc-600 uppercase tracking-widest font-medium">Campañas</span>
          </div>
          <h1 className="text-xl font-semibold text-white">
            Historial
            <span className="ml-2 text-[13px] font-normal text-zinc-600">{campanas.length}</span>
          </h1>
        </div>
        <Link
          href="/campanas/nueva"
          className="flex items-center gap-2 px-3.5 py-2 bg-violet-600 hover:bg-violet-500 text-white text-[13px] font-medium rounded-lg transition-all shadow-lg shadow-violet-900/20"
        >
          <Plus size={14} />
          Nueva campaña
        </Link>
      </div>

      <div className="bg-[#141414] border border-[#1f1f1f] rounded-xl overflow-hidden">
        {loading ? (
          <table className="w-full"><tbody><SkeletonTable rows={5} cols={5} /></tbody></table>
        ) : !campanas.length ? (
          <div className="py-16 text-center">
            <Megaphone size={26} className="text-zinc-800 mx-auto mb-3" />
            <p className="text-[13px] text-zinc-600 mb-2">No enviaste ninguna campaña todavía</p>
            <Link href="/campanas/nueva" className="text-[12px] text-violet-400 hover:text-violet-300 transition-colors">
              Crear la primera →
            </Link>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#1a1a1a]">
                {['Título', 'Canal', 'Estado', 'Fecha de envío', ''].map(h => (
                  <th key={h} className="px-5 py-2.5 text-left text-[10px] font-medium text-zinc-600 uppercase tracking-widest">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {campanas.map(c => (
                <tr key={c.id} className="border-b border-[#111] last:border-0 hover:bg-white/[0.015] transition-colors group">
                  <td className="px-5 py-4">
                    <p className="text-[13px] font-medium text-zinc-200">{c.titulo}</p>
                    <p className="text-[11px] text-zinc-700 mt-0.5 line-clamp-1 max-w-xs">{c.mensaje}</p>
                  </td>
                  <td className="px-5 py-4"><StatusBadge status={c.canal} /></td>
                  <td className="px-5 py-4"><StatusBadge status={c.estado} /></td>
                  <td className="px-5 py-4 text-[12px] text-zinc-600 font-mono">
                    {c.fecha_envio ? format(new Date(c.fecha_envio), "d MMM yyyy, HH:mm", { locale: es }) : '—'}
                  </td>
                  <td className="px-5 py-4">
                    <Link
                      href={`/campanas/${c.id}`}
                      className="flex items-center gap-1 text-[11px] text-zinc-700 hover:text-violet-400 transition-colors opacity-0 group-hover:opacity-100"
                    >
                      Ver <ChevronRight size={11} />
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
