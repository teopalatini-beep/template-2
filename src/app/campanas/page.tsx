'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { Plus, ChevronRight, Megaphone, Trash2, TrendingUp, AlertTriangle } from 'lucide-react'
import { Campana } from '@/lib/types'
import StatusBadge from '@/components/StatusBadge'
import ConfirmModal from '@/components/ConfirmModal'
import { SkeletonTable } from '@/components/Skeleton'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { toast } from 'sonner'

const DELETE_UNDO_MS = 8000

export default function CampanasPage() {
  const [campanas, setCampanas] = useState<Campana[]>([])
  const [loading, setLoading] = useState(true)
  const [deleteTarget, setDeleteTarget] = useState<Campana | null>(null)
  const [deleting, setDeleting] = useState(false)
  const pendingDeletesRef = useRef(new Map<string, { campana: Campana; timer: ReturnType<typeof setTimeout> }>())

  useEffect(() => {
    fetch('/api/campanas')
      .then(r => r.json())
      .then(data => { setCampanas(data); setLoading(false) })
  }, [])

  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    const campana = deleteTarget
    setDeleteTarget(null)
    setCampanas((prev) => prev.filter((item) => item.id !== campana.id))

    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/campanas/${campana.id}`, { method: 'DELETE' })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error)
        toast.success(`Campaña "${campana.titulo}" eliminada`)
      } catch (error: unknown) {
        setCampanas((prev) => [campana, ...prev].sort((a, b) => b.created_at.localeCompare(a.created_at)))
        const message = error instanceof Error ? error.message : 'No se pudo eliminar la campaña'
        toast.error(message)
      } finally {
        pendingDeletesRef.current.delete(campana.id)
      }
    }, DELETE_UNDO_MS)

    pendingDeletesRef.current.set(campana.id, { campana, timer })
    toast('Campaña marcada para eliminar', {
      action: {
        label: 'Deshacer',
        onClick: () => {
          const pending = pendingDeletesRef.current.get(campana.id)
          if (!pending) return
          clearTimeout(pending.timer)
          pendingDeletesRef.current.delete(campana.id)
          setCampanas((prev) => [pending.campana, ...prev].sort((a, b) => b.created_at.localeCompare(a.created_at)))
          toast.success('Eliminación cancelada')
        },
      },
    })
    setDeleting(false)
  }

  useEffect(() => {
    const pendingDeletes = pendingDeletesRef.current
    return () => {
      pendingDeletes.forEach((pending) => clearTimeout(pending.timer))
      pendingDeletes.clear()
    }
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
                {['Título', 'Canal', 'Estado', 'Métricas', 'Fecha', ''].map(h => (
                  <th key={h} className="px-5 py-2.5 text-left text-[10px] font-medium text-zinc-600 uppercase tracking-widest">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {campanas.map(c => {
                const s = c.stats
                const hasMetrics = c.estado === 'enviada' && s && s.total > 0
                const lowDelivery = hasMetrics && s.deliveryRate !== null && s.deliveryRate < 95
                return (
                  <tr key={c.id} className="border-b border-[#111] last:border-0 hover:bg-white/[0.015] transition-colors group">
                    <td className="px-5 py-4">
                      <Link href={`/campanas/${c.id}`} className="text-[13px] font-medium text-zinc-200 hover:text-violet-400 transition-colors block">
                        {c.titulo}
                      </Link>
                      <p className="text-[11px] text-zinc-700 mt-0.5 line-clamp-1 max-w-xs">{c.mensaje}</p>
                    </td>
                    <td className="px-5 py-4"><StatusBadge status={c.canal} /></td>
                    <td className="px-5 py-4"><StatusBadge status={c.estado} /></td>
                    <td className="px-5 py-4">
                      {hasMetrics && s ? (
                        <div className="space-y-1.5">
                          <div className="flex items-center gap-2">
                            <div className="flex items-center gap-1">
                              {lowDelivery && <AlertTriangle size={9} className="text-amber-400" />}
                              <span className="text-[10px] text-zinc-600">Entrega</span>
                              <span className={`text-[12px] font-semibold tabular-nums ${lowDelivery ? 'text-amber-400' : 'text-emerald-400'}`}>
                                {s.deliveryRate}%
                              </span>
                            </div>
                            <span className="text-zinc-800">·</span>
                            <div className="flex items-center gap-1">
                              <TrendingUp size={9} className="text-violet-400" />
                              <span className="text-[10px] text-zinc-600">Respuesta</span>
                              <span className={`text-[12px] font-semibold tabular-nums ${(s.responseRate ?? 0) >= 45 ? 'text-violet-400' : 'text-zinc-400'}`}>
                                {s.responseRate ?? 0}%
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center gap-1 w-32">
                            <div className="flex-1 h-1 bg-[#1a1a1a] rounded-full overflow-hidden">
                              <div className="h-full bg-violet-500/50 rounded-full" style={{ width: `${s.responseRate ?? 0}%` }} />
                            </div>
                            <span className="text-[10px] text-zinc-700">{s.respondidos}/{s.enviados}</span>
                          </div>
                        </div>
                      ) : (
                        <span className="text-[11px] text-zinc-700">—</span>
                      )}
                    </td>
                    <td className="px-5 py-4 text-[12px] text-zinc-600 font-mono">
                      {c.fecha_envio ? format(new Date(c.fecha_envio), "d MMM yy, HH:mm", { locale: es }) : '—'}
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Link href={`/campanas/${c.id}`} className="flex items-center gap-1 text-[11px] text-zinc-700 hover:text-violet-400 transition-colors px-2 py-1 rounded">
                          Ver <ChevronRight size={11} />
                        </Link>
                        {c.estado === 'enviada' && (
                          <button onClick={() => setDeleteTarget(c)} className="p-1.5 text-zinc-700 hover:text-red-400 hover:bg-red-500/10 rounded transition-colors">
                            <Trash2 size={12} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>

      <ConfirmModal
        open={!!deleteTarget}
        title="Eliminar campaña enviada"
        description={`¿Seguro que querés eliminar "${deleteTarget?.titulo}"? También se eliminará el historial de envíos.`}
        confirmLabel="Eliminar"
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
        loading={deleting}
      />
    </div>
  )
}
