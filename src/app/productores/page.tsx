'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { Plus, Search, Pencil, Trash2, ChevronRight, Users, LayoutGrid, List } from 'lucide-react'
import { Productor } from '@/lib/types'
import StatusBadge from '@/components/StatusBadge'
import ProductorModal from '@/components/ProductorModal'
import ConfirmModal from '@/components/ConfirmModal'
import { SkeletonTable } from '@/components/Skeleton'
import { toast } from 'sonner'

const tiposEvento = ['Recital', 'Fiesta', 'Teatro', 'Corporativo', 'Deportivo', 'Otro']

const estadoColors: Record<string, string> = {
  prospecto: 'bg-amber-500',
  activo: 'bg-emerald-500',
  inactivo: 'bg-zinc-500',
}

function KanbanView({ productores, onEdit, onDelete }: {
  productores: Productor[]
  onEdit: (p: Productor) => void
  onDelete: (p: Productor) => void
}) {
  const grupos = [
    { key: 'prospecto', label: 'Prospectos' },
    { key: 'activo',    label: 'Activos' },
    { key: 'inactivo',  label: 'Inactivos' },
  ]

  return (
    <div className="grid grid-cols-3 gap-4">
      {grupos.map(({ key, label }) => {
        const items = productores.filter(p => p.estado === key)
        return (
          <div key={key} className="bg-[#141414] border border-[#1f1f1f] rounded-xl overflow-hidden">
            <div className="flex items-center gap-2 px-4 py-3 border-b border-[#1a1a1a]">
              <div className={`w-1.5 h-1.5 rounded-full ${estadoColors[key]}`} />
              <span className="text-[12px] font-medium text-zinc-400">{label}</span>
              <span className="ml-auto text-[11px] text-zinc-600 bg-[#1a1a1a] rounded-md px-1.5 py-0.5">{items.length}</span>
            </div>
            <div className="p-2 space-y-1.5 min-h-[200px]">
              {items.map(p => (
                <div key={p.id} className="group bg-[#0f0f0f] border border-[#1a1a1a] hover:border-[#2a2a2a] rounded-lg p-3 transition-all">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <Link href={`/productores/${p.id}`} className="text-[13px] font-medium text-zinc-200 hover:text-violet-400 transition-colors truncate block">
                        {p.nombre}
                      </Link>
                      {p.empresa && <p className="text-[11px] text-zinc-600 truncate">{p.empresa}</p>}
                    </div>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                      <button onClick={() => onEdit(p)} className="p-1 text-zinc-600 hover:text-violet-400 hover:bg-violet-500/10 rounded transition-all">
                        <Pencil size={11} />
                      </button>
                      <button onClick={() => onDelete(p)} className="p-1 text-zinc-600 hover:text-red-400 hover:bg-red-500/10 rounded transition-all">
                        <Trash2 size={11} />
                      </button>
                    </div>
                  </div>
                  {p.tipo_evento && (
                    <span className="mt-2 inline-block text-[10px] text-zinc-600 bg-[#1a1a1a] rounded px-1.5 py-0.5">{p.tipo_evento}</span>
                  )}
                </div>
              ))}
              {items.length === 0 && (
                <div className="py-6 text-center text-[11px] text-zinc-700">Sin contactos</div>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}

export default function ProductoresPage() {
  const [productores, setProductores] = useState<Productor[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [estadoFilter, setEstadoFilter] = useState('')
  const [tipoFilter, setTipoFilter] = useState('')
  const [view, setView] = useState<'list' | 'kanban'>('list')
  const [modalOpen, setModalOpen] = useState(false)
  const [editProductor, setEditProductor] = useState<Productor | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Productor | null>(null)
  const [deleting, setDeleting] = useState(false)

  const fetchProductores = useCallback(async () => {
    const res = await fetch('/api/productores')
    const data = await res.json()
    setProductores(data)
    setLoading(false)
  }, [])

  useEffect(() => { fetchProductores() }, [fetchProductores])

  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      await fetch(`/api/productores/${deleteTarget.id}`, { method: 'DELETE' })
      setProductores(prev => prev.filter(p => p.id !== deleteTarget.id))
      toast.success(`${deleteTarget.nombre} eliminado`)
      setDeleteTarget(null)
    } catch {
      toast.error('Error al eliminar el productor')
    } finally {
      setDeleting(false)
    }
  }

  const handleSave = useCallback(() => {
    toast.success(editProductor ? 'Productor actualizado' : 'Productor agregado')
    fetchProductores()
  }, [editProductor, fetchProductores])

  const openEdit = (p: Productor) => { setEditProductor(p); setModalOpen(true) }

  const filtered = productores.filter(p => {
    const q = search.toLowerCase()
    const matchSearch = !search || p.nombre.toLowerCase().includes(q) || (p.empresa ?? '').toLowerCase().includes(q)
    const matchEstado = !estadoFilter || p.estado === estadoFilter
    const matchTipo = !tipoFilter || p.tipo_evento === tipoFilter
    return matchSearch && matchEstado && matchTipo
  })

  return (
    <div className="p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="flex items-center gap-2 mb-0.5">
            <Users size={13} className="text-zinc-600" />
            <span className="text-[11px] text-zinc-600 uppercase tracking-widest font-medium">Contactos</span>
          </div>
          <h1 className="text-xl font-semibold text-white">Productores
            <span className="ml-2 text-[13px] font-normal text-zinc-600">{productores.length}</span>
          </h1>
        </div>
        <button
          onClick={() => { setEditProductor(null); setModalOpen(true) }}
          className="flex items-center gap-2 px-3.5 py-2 bg-violet-600 hover:bg-violet-500 text-white text-[13px] font-medium rounded-lg transition-all shadow-lg shadow-violet-900/20"
        >
          <Plus size={14} />
          Agregar
        </button>
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2 mb-5">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-600" />
          <input
            type="text"
            placeholder="Buscar productor o empresa..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full bg-[#141414] border border-[#1f1f1f] rounded-lg pl-8 pr-3 py-2 text-[13px] text-zinc-200 placeholder-zinc-700 focus:outline-none focus:border-violet-500/40 transition-all"
          />
        </div>

        <select
          value={estadoFilter}
          onChange={e => setEstadoFilter(e.target.value)}
          className="bg-[#141414] border border-[#1f1f1f] rounded-lg px-3 py-2 text-[13px] text-zinc-400 focus:outline-none focus:border-violet-500/40 transition-all"
        >
          <option value="">Estado</option>
          <option value="prospecto">Prospecto</option>
          <option value="activo">Activo</option>
          <option value="inactivo">Inactivo</option>
        </select>

        <select
          value={tipoFilter}
          onChange={e => setTipoFilter(e.target.value)}
          className="bg-[#141414] border border-[#1f1f1f] rounded-lg px-3 py-2 text-[13px] text-zinc-400 focus:outline-none focus:border-violet-500/40 transition-all"
        >
          <option value="">Tipo de evento</option>
          {tiposEvento.map(t => <option key={t} value={t}>{t}</option>)}
        </select>

        {(search || estadoFilter || tipoFilter) && (
          <button
            onClick={() => { setSearch(''); setEstadoFilter(''); setTipoFilter('') }}
            className="text-[12px] text-zinc-600 hover:text-zinc-300 transition-colors"
          >
            Limpiar filtros
          </button>
        )}

        <div className="ml-auto flex items-center gap-1 bg-[#141414] border border-[#1f1f1f] rounded-lg p-1">
          <button
            onClick={() => setView('list')}
            className={`p-1.5 rounded-md transition-all ${view === 'list' ? 'bg-[#2a2a2a] text-white' : 'text-zinc-600 hover:text-zinc-400'}`}
          >
            <List size={13} />
          </button>
          <button
            onClick={() => setView('kanban')}
            className={`p-1.5 rounded-md transition-all ${view === 'kanban' ? 'bg-[#2a2a2a] text-white' : 'text-zinc-600 hover:text-zinc-400'}`}
          >
            <LayoutGrid size={13} />
          </button>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="bg-[#141414] border border-[#1f1f1f] rounded-xl overflow-hidden">
          <table className="w-full"><tbody><SkeletonTable rows={6} cols={6} /></tbody></table>
        </div>
      ) : !filtered.length ? (
        <div className="bg-[#141414] border border-[#1f1f1f] rounded-xl py-16 text-center">
          <Users size={28} className="text-zinc-800 mx-auto mb-3" />
          <p className="text-[13px] text-zinc-600 mb-1">
            {search || estadoFilter || tipoFilter ? 'Sin resultados para este filtro' : 'Todavía no hay productores'}
          </p>
          {!search && !estadoFilter && !tipoFilter && (
            <button onClick={() => { setEditProductor(null); setModalOpen(true) }} className="text-[12px] text-violet-400 hover:text-violet-300 transition-colors mt-1">
              Agregar el primero →
            </button>
          )}
        </div>
      ) : view === 'kanban' ? (
        <KanbanView productores={filtered} onEdit={openEdit} onDelete={setDeleteTarget} />
      ) : (
        <div className="bg-[#141414] border border-[#1f1f1f] rounded-xl overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#1a1a1a]">
                {['Nombre', 'Empresa', 'Teléfono', 'Email', 'Tipo', 'Estado', ''].map(h => (
                  <th key={h} className="px-4 py-2.5 text-left text-[10px] font-medium text-zinc-600 uppercase tracking-widest first:pl-5 last:pr-5">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(p => (
                <tr key={p.id} className="border-b border-[#111] last:border-0 hover:bg-white/[0.015] transition-colors group">
                  <td className="px-4 py-3.5 pl-5">
                    <Link href={`/productores/${p.id}`} className="flex items-center gap-1 text-[13px] font-medium text-zinc-200 hover:text-violet-400 transition-colors">
                      {p.nombre}
                      <ChevronRight size={11} className="text-zinc-700 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </Link>
                  </td>
                  <td className="px-4 py-3.5 text-[13px] text-zinc-500">{p.empresa || '—'}</td>
                  <td className="px-4 py-3.5 text-[12px] text-zinc-600 font-mono">{p.telefono || '—'}</td>
                  <td className="px-4 py-3.5 text-[12px] text-zinc-600">{p.email || '—'}</td>
                  <td className="px-4 py-3.5 text-[12px] text-zinc-600">{p.tipo_evento || '—'}</td>
                  <td className="px-4 py-3.5"><StatusBadge status={p.estado} /></td>
                  <td className="px-4 py-3.5 pr-5">
                    <div className="flex items-center gap-1 justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => openEdit(p)} className="p-1.5 text-zinc-600 hover:text-violet-400 hover:bg-violet-500/8 rounded-md transition-all">
                        <Pencil size={12} />
                      </button>
                      <button onClick={() => setDeleteTarget(p)} className="p-1.5 text-zinc-600 hover:text-red-400 hover:bg-red-500/8 rounded-md transition-all">
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <ProductorModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSave={handleSave}
        productor={editProductor}
      />

      <ConfirmModal
        open={!!deleteTarget}
        title="Eliminar productor"
        description={`¿Seguro que querés eliminar a ${deleteTarget?.nombre}? Esta acción no se puede deshacer.`}
        confirmLabel="Eliminar"
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
        loading={deleting}
      />
    </div>
  )
}
