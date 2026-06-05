'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { ArrowLeft, FolderKanban } from 'lucide-react'
import type { Proyecto } from '@/lib/types'
import StatusBadge from '@/components/StatusBadge'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

export default function ProyectoDetallePage() {
  const { id } = useParams<{ id: string }>()
  const [proyecto, setProyecto] = useState<Proyecto | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`/api/proyectos/${id}`)
      .then((r) => r.json())
      .then((data) => setProyecto(data))
      .finally(() => setLoading(false))
  }, [id])

  if (loading) {
    return <div className="p-8 text-zinc-600">Cargando proyecto...</div>
  }

  if (!proyecto || !proyecto.id) {
    return <div className="p-8 text-zinc-600">Proyecto no encontrado.</div>
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <Link href="/proyectos" className="inline-flex items-center gap-2 text-[12px] text-zinc-500 hover:text-violet-400 transition-colors mb-5">
        <ArrowLeft size={12} />
        Volver a proyectos
      </Link>

      <div className="bg-[#141414] border border-[#1f1f1f] rounded-xl p-6">
        <div className="flex items-start justify-between gap-4 mb-5">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <FolderKanban size={13} className="text-zinc-600" />
              <span className="text-[11px] text-zinc-600 uppercase tracking-widest font-medium">Simplespass</span>
            </div>
            <h1 className="text-xl font-semibold text-white">{proyecto.nombre}</h1>
          </div>
          <StatusBadge status={proyecto.estado} />
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div className="rounded-lg border border-[#1f1f1f] bg-[#101010] p-3">
            <p className="text-[10px] text-zinc-600 uppercase tracking-widest mb-1">Servicio</p>
            <p className="text-[13px] text-zinc-300">{proyecto.servicio}</p>
          </div>
          <div className="rounded-lg border border-[#1f1f1f] bg-[#101010] p-3">
            <p className="text-[10px] text-zinc-600 uppercase tracking-widest mb-1">Fecha de evento</p>
            <p className="text-[13px] text-zinc-300">
              {proyecto.fecha_evento ? format(new Date(proyecto.fecha_evento), 'd MMM yyyy, HH:mm', { locale: es }) : 'Sin fecha'}
            </p>
          </div>
          <div className="rounded-lg border border-[#1f1f1f] bg-[#101010] p-3">
            <p className="text-[10px] text-zinc-600 uppercase tracking-widest mb-1">Cliente ID</p>
            <p className="text-[13px] text-zinc-300 font-mono">{proyecto.cliente_id}</p>
          </div>
        </div>
      </div>
    </div>
  )
}
