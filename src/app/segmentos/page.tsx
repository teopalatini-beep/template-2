'use client'

import { useEffect, useState, useMemo } from 'react'
import { Plus, Trash2, Users, Layers, Send, X } from 'lucide-react'
import Link from 'next/link'
import { Productor } from '@/lib/types'
import {
  Segment, SegmentCondition, SegmentField, SegmentOperator,
  FIELD_LABELS, OPERATOR_LABELS, FIELD_OPTIONS, FIELD_OPERATORS,
  loadSegments, saveSegments, applySegment,
} from '@/lib/segments'
import { toast } from 'sonner'

const DEFAULT_CONDITION: SegmentCondition = { field: 'estado', operator: 'eq', value: 'prospecto' }

export default function SegmentosPage() {
  const [productores, setProductores] = useState<Productor[]>([])
  const [segments, setSegments] = useState<Segment[]>([])
  const [nombre, setNombre] = useState('')
  const [logic, setLogic] = useState<'AND' | 'OR'>('AND')
  const [conditions, setConditions] = useState<SegmentCondition[]>([{ ...DEFAULT_CONDITION }])
  const [saving, setSaving] = useState(false)
  const [previewId, setPreviewId] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/productores').then(r => r.json()).then(setProductores)
    setSegments(loadSegments())
  }, [])

  const previewSegment: Segment | null = useMemo(() => {
    if (!previewId) return null
    return segments.find(s => s.id === previewId) ?? null
  }, [previewId, segments])

  const previewMatches = useMemo(() => {
    if (!previewSegment) return []
    return applySegment(productores, previewSegment)
  }, [previewSegment, productores])

  const draftMatches = useMemo(() => {
    const draft: Segment = { id: 'draft', nombre: '', logic, conditions, created_at: '' }
    return applySegment(productores, draft)
  }, [productores, logic, conditions])

  const updateCondition = (i: number, patch: Partial<SegmentCondition>) => {
    setConditions(prev => prev.map((c, j) => {
      if (j !== i) return c
      const updated = { ...c, ...patch }
      if (patch.field) {
        const ops = FIELD_OPERATORS[patch.field]
        updated.operator = ops[0]
        const opts = FIELD_OPTIONS[patch.field]
        updated.value = opts ? opts[0] : ''
      }
      if (patch.operator === 'any') updated.value = ''
      return updated
    }))
  }

  const handleSave = () => {
    if (!nombre.trim()) { toast.error('Ponele un nombre al segmento'); return }
    if (!conditions.length) { toast.error('Agregá al menos una condición'); return }
    setSaving(true)
    const newSeg: Segment = {
      id: Date.now().toString(),
      nombre: nombre.trim(),
      logic,
      conditions,
      created_at: new Date().toISOString(),
    }
    const updated = [...segments, newSeg]
    saveSegments(updated)
    setSegments(updated)
    setNombre('')
    setLogic('AND')
    setConditions([{ ...DEFAULT_CONDITION }])
    toast.success(`Segmento "${newSeg.nombre}" guardado`)
    setSaving(false)
  }

  const handleDelete = (id: string) => {
    const updated = segments.filter(s => s.id !== id)
    saveSegments(updated)
    setSegments(updated)
    if (previewId === id) setPreviewId(null)
    toast.success('Segmento eliminado')
  }

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-0.5">
          <Layers size={13} className="text-zinc-600" />
          <span className="text-[11px] text-zinc-600 uppercase tracking-widest font-medium">Audiencias</span>
        </div>
        <h1 className="text-xl font-semibold text-white">Segmentos
          <span className="ml-2 text-[13px] font-normal text-zinc-600">{segments.length}</span>
        </h1>
        <p className="text-[12px] text-zinc-600 mt-0.5">Crea audiencias reutilizables con condiciones combinadas para tus campañas</p>
      </div>

      <div className="grid grid-cols-5 gap-5">
        {/* Builder */}
        <div className="col-span-3 space-y-4">
          <div className="bg-[#141414] border border-[#1f1f1f] rounded-xl p-5">
            <p className="text-[10px] font-medium text-zinc-600 uppercase tracking-widest mb-3">Nuevo segmento</p>
            <input
              value={nombre}
              onChange={e => setNombre(e.target.value)}
              placeholder="Ej: Prospectos calientes Argentina"
              className="w-full bg-[#0f0f0f] border border-[#1f1f1f] rounded-lg px-3 py-2.5 text-[13px] text-white placeholder-zinc-700 focus:outline-none focus:border-violet-500/40 transition-all mb-4"
            />

            {/* Logic toggle */}
            <div className="flex items-center gap-2 mb-4">
              <span className="text-[11px] text-zinc-600">Unir condiciones con:</span>
              {(['AND', 'OR'] as const).map(l => (
                <button
                  key={l}
                  onClick={() => setLogic(l)}
                  className={`px-3 py-1 text-[11px] font-mono rounded-md border transition-all ${
                    logic === l
                      ? 'bg-violet-500/15 border-violet-500/40 text-violet-300'
                      : 'border-[#2a2a2a] text-zinc-600 hover:text-zinc-300'
                  }`}
                >
                  {l}
                </button>
              ))}
              <span className="text-[10px] text-zinc-700 ml-1">
                {logic === 'AND' ? '(todas las condiciones)' : '(al menos una)'}
              </span>
            </div>

            {/* Conditions */}
            <div className="space-y-2.5 mb-4">
              {conditions.map((cond, i) => {
                const ops = FIELD_OPERATORS[cond.field]
                const opts = FIELD_OPTIONS[cond.field]
                return (
                  <div key={i} className="flex items-center gap-2 flex-wrap">
                    <select
                      value={cond.field}
                      onChange={e => updateCondition(i, { field: e.target.value as SegmentField })}
                      className="bg-[#0f0f0f] border border-[#1f1f1f] rounded-lg px-2.5 py-1.5 text-[12px] text-zinc-300 focus:outline-none focus:border-violet-500/40 transition-all"
                    >
                      {(Object.keys(FIELD_LABELS) as SegmentField[]).map(f => (
                        <option key={f} value={f}>{FIELD_LABELS[f]}</option>
                      ))}
                    </select>

                    <select
                      value={cond.operator}
                      onChange={e => updateCondition(i, { operator: e.target.value as SegmentOperator })}
                      className="bg-[#0f0f0f] border border-[#1f1f1f] rounded-lg px-2.5 py-1.5 text-[12px] text-zinc-300 focus:outline-none focus:border-violet-500/40 transition-all"
                    >
                      {ops.map(op => (
                        <option key={op} value={op}>{OPERATOR_LABELS[op]}</option>
                      ))}
                    </select>

                    {cond.operator !== 'any' && (
                      opts ? (
                        <select
                          value={cond.value}
                          onChange={e => updateCondition(i, { value: e.target.value })}
                          className="bg-[#0f0f0f] border border-[#1f1f1f] rounded-lg px-2.5 py-1.5 text-[12px] text-zinc-300 focus:outline-none focus:border-violet-500/40 transition-all"
                        >
                          {opts.map(o => <option key={o} value={o}>{o}</option>)}
                        </select>
                      ) : (
                        <input
                          value={cond.value}
                          onChange={e => updateCondition(i, { value: e.target.value })}
                          placeholder={cond.field === 'tags' ? 'ej: rock' : 'valor...'}
                          className="bg-[#0f0f0f] border border-[#1f1f1f] rounded-lg px-2.5 py-1.5 text-[12px] text-zinc-300 placeholder-zinc-700 focus:outline-none focus:border-violet-500/40 transition-all w-28"
                        />
                      )
                    )}

                    {conditions.length > 1 && (
                      <button onClick={() => setConditions(prev => prev.filter((_, j) => j !== i))} className="text-zinc-700 hover:text-red-400 transition-colors ml-auto">
                        <X size={13} />
                      </button>
                    )}
                  </div>
                )
              })}
            </div>

            <div className="flex items-center justify-between">
              <button
                onClick={() => setConditions(prev => [...prev, { ...DEFAULT_CONDITION }])}
                className="flex items-center gap-1.5 text-[12px] text-zinc-600 hover:text-violet-300 transition-colors"
              >
                <Plus size={12} />
                Agregar condición
              </button>
              <div className="flex items-center gap-3">
                <span className="text-[11px] text-zinc-600">
                  <span className="text-white font-medium">{draftMatches.length}</span> productores coinciden
                </span>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="px-4 py-2 bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white text-[13px] font-medium rounded-lg transition-all"
                >
                  Guardar segmento
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Saved segments list */}
        <div className="col-span-2 bg-[#141414] border border-[#1f1f1f] rounded-xl overflow-hidden flex flex-col">
          <div className="px-4 py-3.5 border-b border-[#1a1a1a]">
            <p className="text-[13px] font-medium text-white">Segmentos guardados</p>
          </div>
          {!segments.length ? (
            <div className="flex-1 flex items-center justify-center py-10">
              <div className="text-center">
                <Layers size={22} className="text-zinc-800 mx-auto mb-2" />
                <p className="text-[12px] text-zinc-700">Sin segmentos todavía</p>
              </div>
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto divide-y divide-[#111]">
              {segments.map(seg => {
                const matches = applySegment(productores, seg)
                const isPreview = previewId === seg.id
                return (
                  <div key={seg.id} className={`px-4 py-3.5 transition-colors ${isPreview ? 'bg-violet-500/5' : 'hover:bg-white/[0.015]'}`}>
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-[13px] font-medium text-zinc-200 truncate">{seg.nombre}</p>
                        <p className="text-[10px] text-zinc-600 mt-0.5">
                          {seg.conditions.length} condición{seg.conditions.length !== 1 ? 'es' : ''} · {seg.logic}
                        </p>
                        <div className="flex items-center gap-1 mt-1">
                          <Users size={10} className="text-zinc-700" />
                          <span className="text-[11px] text-zinc-500">
                            <span className="font-medium text-zinc-300">{matches.length}</span> productores
                          </span>
                        </div>
                      </div>
                      <div className="flex gap-1 shrink-0">
                        <button
                          onClick={() => setPreviewId(isPreview ? null : seg.id)}
                          className={`p-1.5 rounded-md text-[10px] transition-all border ${isPreview ? 'border-violet-500/40 text-violet-300 bg-violet-500/10' : 'border-[#2a2a2a] text-zinc-600 hover:text-zinc-300'}`}
                        >
                          Ver
                        </button>
                        <Link
                          href={`/campanas/nueva?segmento=${seg.id}`}
                          className="p-1.5 rounded-md border border-[#2a2a2a] text-zinc-600 hover:text-violet-300 hover:border-violet-500/30 transition-all"
                        >
                          <Send size={11} />
                        </Link>
                        <button
                          onClick={() => handleDelete(seg.id)}
                          className="p-1.5 rounded-md border border-[#2a2a2a] text-zinc-600 hover:text-red-400 hover:border-red-500/30 transition-all"
                        >
                          <Trash2 size={11} />
                        </button>
                      </div>
                    </div>

                    {/* Preview list */}
                    {isPreview && (
                      <div className="mt-3 pt-3 border-t border-[#1a1a1a] space-y-1.5">
                        {previewMatches.slice(0, 5).map(p => (
                          <div key={p.id} className="flex items-center gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-violet-500 shrink-0" />
                            <span className="text-[11px] text-zinc-400 truncate">{p.nombre}</span>
                            {p.empresa && <span className="text-[10px] text-zinc-700 truncate">{p.empresa}</span>}
                          </div>
                        ))}
                        {previewMatches.length > 5 && (
                          <p className="text-[10px] text-zinc-700 pl-3.5">+{previewMatches.length - 5} más</p>
                        )}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
