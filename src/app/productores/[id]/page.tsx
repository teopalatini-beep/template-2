'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Pencil, Mail, Phone, Building2, Tag, StickyNote } from 'lucide-react'
import { Productor, Mensaje } from '@/lib/types'
import StatusBadge from '@/components/StatusBadge'
import ProductorModal from '@/components/ProductorModal'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

export default function ProductorDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [productor, setProductor] = useState<Productor | null>(null)
  const [mensajes, setMensajes] = useState<Mensaje[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)

  const fetchData = async () => {
    const [pRes, mRes] = await Promise.all([
      fetch(`/api/productores/${id}`),
      fetch(`/api/mensajes?productor_id=${id}`),
    ])
    if (!pRes.ok) { router.push('/productores'); return }
    const [p, m] = await Promise.all([pRes.json(), mRes.json()])
    setProductor(p)
    setMensajes(m)
    setLoading(false)
  }

  useEffect(() => { fetchData() }, [id])

  if (loading) {
    return (
      <div className="p-8 text-center text-zinc-600 text-sm">Cargando...</div>
    )
  }

  if (!productor) return null

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="mb-6">
        <Link href="/productores" className="flex items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-300 transition-colors mb-4">
          <ArrowLeft size={14} />
          Volver a productores
        </Link>
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">{productor.nombre}</h1>
            {productor.empresa && (
              <p className="text-zinc-500 text-sm mt-1">{productor.empresa}</p>
            )}
          </div>
          <div className="flex items-center gap-3">
            <StatusBadge status={productor.estado} />
            <button
              onClick={() => setModalOpen(true)}
              className="flex items-center gap-2 px-3 py-2 text-sm text-zinc-400 hover:text-white border border-[#2a2a2a] hover:border-[#3a3a3a] rounded-lg transition-colors"
            >
              <Pencil size={13} />
              Editar
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        {/* Info card */}
        <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-5">
          <h2 className="text-xs font-semibold text-zinc-500 uppercase tracking-wide mb-4">Datos de contacto</h2>
          <div className="space-y-3">
            {productor.email && (
              <div className="flex items-center gap-3">
                <Mail size={14} className="text-zinc-600 shrink-0" />
                <span className="text-sm text-zinc-300">{productor.email}</span>
              </div>
            )}
            {productor.telefono && (
              <div className="flex items-center gap-3">
                <Phone size={14} className="text-zinc-600 shrink-0" />
                <span className="text-sm text-zinc-300 font-mono">{productor.telefono}</span>
              </div>
            )}
            {productor.empresa && (
              <div className="flex items-center gap-3">
                <Building2 size={14} className="text-zinc-600 shrink-0" />
                <span className="text-sm text-zinc-300">{productor.empresa}</span>
              </div>
            )}
            {productor.tipo_evento && (
              <div className="flex items-center gap-3">
                <Tag size={14} className="text-zinc-600 shrink-0" />
                <span className="text-sm text-zinc-300">{productor.tipo_evento}</span>
              </div>
            )}
          </div>
        </div>

        {/* Notas */}
        <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <StickyNote size={13} className="text-zinc-600" />
            <h2 className="text-xs font-semibold text-zinc-500 uppercase tracking-wide">Notas</h2>
          </div>
          <p className="text-sm text-zinc-400 leading-relaxed whitespace-pre-wrap">
            {productor.notas || <span className="text-zinc-600 italic">Sin notas</span>}
          </p>
        </div>
      </div>

      {/* Historial de mensajes */}
      <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl">
        <div className="px-5 py-4 border-b border-[#2a2a2a]">
          <h2 className="text-sm font-semibold text-white">Historial de comunicaciones</h2>
          <p className="text-xs text-zinc-500 mt-0.5">{mensajes.length} mensaje{mensajes.length !== 1 ? 's' : ''} enviado{mensajes.length !== 1 ? 's' : ''}</p>
        </div>

        {!mensajes.length ? (
          <div className="p-8 text-center text-zinc-600 text-sm">
            Todavía no se enviaron mensajes a este productor.
          </div>
        ) : (
          <div className="divide-y divide-[#1f1f1f]">
            {mensajes.map(m => (
              <div key={m.id} className="px-5 py-4">
                <div className="flex items-start justify-between gap-4 mb-2">
                  <div className="flex items-center gap-2">
                    <StatusBadge status={m.canal} />
                    <StatusBadge status={m.status} />
                  </div>
                  <span className="text-xs text-zinc-600 shrink-0">
                    {m.enviado_at
                      ? format(new Date(m.enviado_at), "d MMM yyyy, HH:mm", { locale: es })
                      : format(new Date(m.created_at), "d MMM yyyy, HH:mm", { locale: es })}
                  </span>
                </div>
                {m.contenido && (
                  <p className="text-sm text-zinc-400 leading-relaxed line-clamp-3">{m.contenido}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <ProductorModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSave={() => fetchData()}
        productor={productor}
      />
    </div>
  )
}
