'use client'

import { useEffect, useState, useMemo } from 'react'
import Link from 'next/link'
import { Kanban, Mail, Phone, ChevronRight, Plus, Filter } from 'lucide-react'
import { Productor, PipelineEtapa } from '@/lib/types'
import { toast } from 'sonner'

const ETAPAS: { key: PipelineEtapa; label: string; color: string; dot: string; border: string }[] = [
  { key: 'nuevo',       label: 'Nuevo',       color: 'text-zinc-400',    dot: 'bg-zinc-500',    border: 'border-zinc-500/25' },
  { key: 'contactado',  label: 'Contactado',  color: 'text-sky-400',     dot: 'bg-sky-500',     border: 'border-sky-500/25' },
  { key: 'propuesta',   label: 'Propuesta',   color: 'text-violet-400',  dot: 'bg-violet-500',  border: 'border-violet-500/25' },
  { key: 'negociacion', label: 'Negociación', color: 'text-amber-400',   dot: 'bg-amber-500',   border: 'border-amber-500/25' },
  { key: 'cerrado',     label: 'Cerrado ✓',   color: 'text-emerald-400', dot: 'bg-emerald-500', border: 'border-emerald-500/25' },
  { key: 'perdido',     label: 'Perdido',     color: 'text-red-400',     dot: 'bg-red-500',     border: 'border-red-500/25' },
]

function fmt(n: number) {
  if (n >= 1000) return `$${(n / 1000).toFixed(n % 1000 === 0 ? 0 : 1)}k`
  return `$${n}`
}

function PipelineCard({ productor, isDragging, onDragStart, onDragEnd }: {
  productor: Productor
  isDragging: boolean
  onDragStart: (e: React.DragEvent) => void
  onDragEnd: () => void
}) {
  const dias = Math.floor((Date.now() - new Date(productor.created_at).getTime()) / 86400000)

  return (
    <div
      draggable
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      className={`group bg-[#0f0f0f] border border-[#1f1f1f] hover:border-[#2a2a2a] rounded-xl p-3.5 cursor-grab active:cursor-grabbing transition-all select-none ${isDragging ? 'opacity-40 scale-95' : ''}`}
    >
      <div className="flex items-start justify-between gap-2 mb-1.5">
        <div className="min-w-0 flex-1">
          <p className="text-[13px] font-semibold text-zinc-100 truncate">{productor.nombre}</p>
          {productor.empresa && <p className="text-[11px] text-zinc-600 truncate">{productor.empresa}</p>}
        </div>
        <Link
          href={`/productores/${productor.id}`}
          onClick={e => e.stopPropagation()}
          className="opacity-0 group-hover:opacity-100 transition-opacity text-zinc-700 hover:text-violet-400 shrink-0"
        >
          <ChevronRight size={13} />
        </Link>
      </div>

      <div className="flex flex-wrap gap-1 mb-2">
        {productor.tipo_evento && (
          <span className="text-[10px] text-zinc-500 bg-[#1a1a1a] border border-[#2a2a2a] rounded-md px-1.5 py-0.5">
            {productor.tipo_evento}
          </span>
        )}
        {productor.tags?.slice(0, 2).map(tag => (
          <span key={tag} className="text-[10px] text-violet-400/70 bg-violet-500/5 border border-violet-500/10 rounded-md px-1.5 py-0.5">
            {tag}
          </span>
        ))}
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {productor.email && <Mail size={10} className="text-zinc-700" />}
          {productor.telefono && <Phone size={10} className="text-zinc-700" />}
          {productor.valor_estimado != null && productor.valor_estimado > 0 && (
            <span className="text-[10px] text-emerald-500 font-medium">{fmt(productor.valor_estimado)}</span>
          )}
        </div>
        <span className="text-[10px] text-zinc-700">{dias === 0 ? 'Hoy' : `${dias}d`}</span>
      </div>
    </div>
  )
}

function KanbanColumn({ etapa, productores, draggedId, onDragStart, onDragEnd, onDrop }: {
  etapa: typeof ETAPAS[0]
  productores: Productor[]
  draggedId: string | null
  onDragStart: (id: string, e: React.DragEvent) => void
  onDragEnd: () => void
  onDrop: (etapaKey: PipelineEtapa) => void
}) {
  const [isOver, setIsOver] = useState(false)
  const totalValor = productores.reduce((sum, p) => sum + (p.valor_estimado ?? 0), 0)

  return (
    <div
      className={`flex flex-col w-[240px] shrink-0 rounded-2xl border transition-all ${isOver ? `${etapa.border} bg-white/[0.015]` : 'border-[#1a1a1a] bg-[#141414]'}`}
      onDragOver={e => { e.preventDefault(); setIsOver(true) }}
      onDragLeave={() => setIsOver(false)}
      onDrop={() => { setIsOver(false); onDrop(etapa.key) }}
    >
      <div className="flex items-center gap-2.5 px-4 py-3.5 border-b border-[#1a1a1a]">
        <div className={`w-2 h-2 rounded-full shrink-0 ${etapa.dot}`} />
        <span className={`text-[12px] font-semibold flex-1 ${etapa.color}`}>{etapa.label}</span>
        <span className="text-[11px] text-zinc-600 bg-[#111] rounded-md px-1.5 py-0.5 tabular-nums">{productores.length}</span>
      </div>

      {totalValor > 0 && (
        <div className="px-4 py-2 border-b border-[#1a1a1a]">
          <span className="text-[11px] text-emerald-500/70 font-medium tabular-nums">{fmt(totalValor)}</span>
        </div>
      )}

      <div className="flex-1 p-2.5 space-y-2 overflow-y-auto max-h-[calc(100vh-300px)] min-h-[80px]">
        {productores.map(p => (
          <PipelineCard
            key={p.id}
            productor={p}
            isDragging={draggedId === p.id}
            onDragStart={e => onDragStart(p.id, e)}
            onDragEnd={onDragEnd}
          />
        ))}
        {isOver && draggedId && (
          <div className={`h-14 border-2 border-dashed ${etapa.border} rounded-xl flex items-center justify-center`}>
            <span className={`text-[11px] ${etapa.color}`}>Soltar aquí</span>
          </div>
        )}
        {productores.length === 0 && !isOver && (
          <div className="py-8 text-center text-[11px] text-zinc-800">Sin deals</div>
        )}
      </div>
    </div>
  )
}

export default function PipelinePage() {
  const [productores, setProductores] = useState<Productor[]>([])
  const [loading, setLoading] = useState(true)
  const [draggedId, setDraggedId] = useState<string | null>(null)
  const [filtroTipo, setFiltroTipo] = useState<string>('todos')

  useEffect(() => {
    fetch('/api/productores')
      .then(r => r.json())
      .then(d => { setProductores(d); setLoading(false) })
  }, [])

  const tiposEvento = useMemo(() => {
    const tipos = productores.map(p => p.tipo_evento).filter(Boolean) as string[]
    return Array.from(new Set(tipos)).sort()
  }, [productores])

  const producoresFiltrados = useMemo(() =>
    filtroTipo === 'todos' ? productores : productores.filter(p => p.tipo_evento === filtroTipo),
    [productores, filtroTipo]
  )

  const handleDragStart = (id: string, e: React.DragEvent) => {
    setDraggedId(id)
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleDrop = async (etapaKey: PipelineEtapa) => {
    if (!draggedId) return
    const productor = productores.find(p => p.id === draggedId)
    if (!productor || (productor.pipeline_etapa ?? 'nuevo') === etapaKey) { setDraggedId(null); return }

    const prevEtapa = productor.pipeline_etapa ?? 'nuevo'
    setProductores(prev => prev.map(p => p.id === draggedId ? { ...p, pipeline_etapa: etapaKey } : p))
    setDraggedId(null)

    const res = await fetch(`/api/productores/${draggedId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pipeline_etapa: etapaKey }),
    })

    if (!res.ok) {
      setProductores(prev => prev.map(p => p.id === draggedId ? { ...p, pipeline_etapa: prevEtapa } : p))
      toast.error('Error al mover el deal')
    } else {
      toast.success(`Movido a ${ETAPAS.find(e => e.key === etapaKey)?.label}`)
    }
  }

  const porEtapa = (key: PipelineEtapa) =>
    producoresFiltrados.filter(p => (p.pipeline_etapa ?? 'nuevo') === key)

  const enCurso = producoresFiltrados.filter(p => !['cerrado', 'perdido'].includes(p.pipeline_etapa ?? 'nuevo')).length
  const cerrados = porEtapa('cerrado').length
  const tasa = producoresFiltrados.length > 0 ? Math.round((cerrados / producoresFiltrados.length) * 100) : 0
  const valorPipeline = producoresFiltrados
    .filter(p => (p.pipeline_etapa ?? 'nuevo') !== 'perdido')
    .reduce((sum, p) => sum + (p.valor_estimado ?? 0), 0)

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="px-8 py-6 border-b border-[#1a1a1a] flex items-center justify-between shrink-0">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Kanban size={14} className="text-violet-400" />
            <span className="text-[11px] font-medium text-violet-400 uppercase tracking-widest">Ventas</span>
          </div>
          <h1 className="text-xl font-semibold text-white">Pipeline de negocios</h1>
        </div>
        <div className="flex items-center gap-5">
          {tiposEvento.length > 0 && (
            <div className="flex items-center gap-2">
              <Filter size={12} className="text-zinc-600" />
              <select
                value={filtroTipo}
                onChange={e => setFiltroTipo(e.target.value)}
                className="bg-[#141414] border border-[#2a2a2a] rounded-lg px-2.5 py-1.5 text-[12px] text-zinc-400 focus:outline-none focus:border-violet-500/60 transition-all"
              >
                <option value="todos">Todos los tipos</option>
                {tiposEvento.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
          )}
          <div className="text-right">
            <p className="text-[11px] text-zinc-600">En curso</p>
            <p className="text-[18px] font-bold text-white tabular-nums">{enCurso}</p>
          </div>
          <div className="text-right">
            <p className="text-[11px] text-zinc-600">Cerrados</p>
            <p className="text-[18px] font-bold text-emerald-400 tabular-nums">{cerrados}</p>
          </div>
          <div className="text-right">
            <p className="text-[11px] text-zinc-600">Tasa cierre</p>
            <p className="text-[18px] font-bold text-violet-400 tabular-nums">{tasa}%</p>
          </div>
          {valorPipeline > 0 && (
            <div className="text-right">
              <p className="text-[11px] text-zinc-600">Valor pipeline</p>
              <p className="text-[18px] font-bold text-emerald-400 tabular-nums">{fmt(valorPipeline)}</p>
            </div>
          )}
          <Link
            href="/productores"
            className="flex items-center gap-2 px-3.5 py-2 bg-violet-600 hover:bg-violet-500 text-white text-[13px] font-medium rounded-lg transition-all shadow-lg shadow-violet-900/20"
          >
            <Plus size={14} />
            Agregar
          </Link>
        </div>
      </div>

      <div className="flex gap-4 p-6 overflow-x-auto flex-1">
        {loading
          ? ETAPAS.map(e => <div key={e.key} className="w-[240px] shrink-0 h-64 bg-[#141414] border border-[#1a1a1a] rounded-2xl animate-pulse" />)
          : ETAPAS.map(etapa => (
              <KanbanColumn
                key={etapa.key}
                etapa={etapa}
                productores={porEtapa(etapa.key)}
                draggedId={draggedId}
                onDragStart={handleDragStart}
                onDragEnd={() => setDraggedId(null)}
                onDrop={handleDrop}
              />
            ))
        }
      </div>

      <div className="px-8 py-3 border-t border-[#1a1a1a] shrink-0">
        <p className="text-[11px] text-zinc-700">
          Arrastrá los cards entre columnas · Los nuevos productores entran en <span className="text-zinc-500">Nuevo</span>
          {filtroTipo !== 'todos' && <span className="text-violet-400"> · Filtrando: {filtroTipo}</span>}
        </p>
      </div>
    </div>
  )
}
