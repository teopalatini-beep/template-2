'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { Plus, Search, Pencil, Trash2, ChevronRight } from 'lucide-react'
import { Productor, EstadoProductor } from '@/lib/types'
import StatusBadge from '@/components/StatusBadge'
import ProductorModal from '@/components/ProductorModal'

const tiposEvento = ['Recital', 'Fiesta', 'Teatro', 'Corporativo', 'Deportivo', 'Otro']

export default function ProductoresPage() {
  const [productores, setProductores] = useState<Productor[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [estadoFilter, setEstadoFilter] = useState('')
  const [tipoFilter, setTipoFilter] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editProductor, setEditProductor] = useState<Productor | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const fetchProductores = useCallback(async () => {
    setLoading(true)
    const res = await fetch('/api/productores')
    const data = await res.json()
    setProductores(data)
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchProductores()
  }, [fetchProductores])

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar este productor? Esta acción no se puede deshacer.')) return
    await fetch(`/api/productores/${id}`, { method: 'DELETE' })
    setProductores(prev => prev.filter(p => p.id !== id))
  }

  const filtered = productores.filter(p => {
    const matchSearch =
      !search ||
      p.nombre.toLowerCase().includes(search.toLowerCase()) ||
      (p.empresa ?? '').toLowerCase().includes(search.toLowerCase())
    const matchEstado = !estadoFilter || p.estado === estadoFilter
    const matchTipo = !tipoFilter || p.tipo_evento === tipoFilter
    return matchSearch && matchEstado && matchTipo
  })

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white">Productores</h1>
          <p className="text-zinc-500 text-sm mt-1">{productores.length} contactos en total</p>
        </div>
        <button
          onClick={() => { setEditProductor(null); setModalOpen(true) }}
          className="flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white text-sm font-medium rounded-lg transition-colors"
        >
          <Plus size={15} />
          Agregar productor
        </button>
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap gap-3 mb-6">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
          <input
            type="text"
            placeholder="Buscar por nombre o empresa..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg pl-9 pr-3 py-2 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-violet-500 transition-colors"
          />
        </div>
        <select
          value={estadoFilter}
          onChange={e => setEstadoFilter(e.target.value)}
          className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg px-3 py-2 text-sm text-zinc-300 focus:outline-none focus:border-violet-500 transition-colors"
        >
          <option value="">Todos los estados</option>
          <option value="prospecto">Prospecto</option>
          <option value="activo">Activo</option>
          <option value="inactivo">Inactivo</option>
        </select>
        <select
          value={tipoFilter}
          onChange={e => setTipoFilter(e.target.value)}
          className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg px-3 py-2 text-sm text-zinc-300 focus:outline-none focus:border-violet-500 transition-colors"
        >
          <option value="">Todos los tipos</option>
          {tiposEvento.map(t => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
      </div>

      {/* Tabla */}
      <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl overflow-hidden">
        {loading ? (
          <div className="p-10 text-center text-zinc-600 text-sm">Cargando productores...</div>
        ) : !filtered.length ? (
          <div className="p-10 text-center text-zinc-600 text-sm">
            {search || estadoFilter || tipoFilter ? 'No hay resultados para este filtro.' : 'Todavía no hay productores.'}
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#2a2a2a]">
                {['Nombre', 'Empresa', 'Teléfono', 'Email', 'Tipo', 'Estado', ''].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wide first:pl-5 last:pr-5">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(p => (
                <tr key={p.id} className="border-b border-[#1f1f1f] last:border-0 hover:bg-white/[0.02] transition-colors group">
                  <td className="px-4 py-3.5 pl-5">
                    <Link href={`/productores/${p.id}`} className="text-sm font-medium text-white hover:text-violet-400 transition-colors flex items-center gap-1">
                      {p.nombre}
                      <ChevronRight size={12} className="text-zinc-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </Link>
                  </td>
                  <td className="px-4 py-3.5 text-sm text-zinc-400">{p.empresa || '-'}</td>
                  <td className="px-4 py-3.5 text-sm text-zinc-400 font-mono">{p.telefono || '-'}</td>
                  <td className="px-4 py-3.5 text-sm text-zinc-400">{p.email || '-'}</td>
                  <td className="px-4 py-3.5 text-sm text-zinc-400">{p.tipo_evento || '-'}</td>
                  <td className="px-4 py-3.5">
                    <StatusBadge status={p.estado} />
                  </td>
                  <td className="px-4 py-3.5 pr-5">
                    <div className="flex items-center gap-1 justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => { setEditProductor(p); setModalOpen(true) }}
                        className="p-1.5 text-zinc-500 hover:text-violet-400 hover:bg-violet-500/10 rounded-md transition-colors"
                      >
                        <Pencil size={13} />
                      </button>
                      <button
                        onClick={() => handleDelete(p.id)}
                        className="p-1.5 text-zinc-500 hover:text-red-400 hover:bg-red-500/10 rounded-md transition-colors"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <ProductorModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSave={fetchProductores}
        productor={editProductor}
      />
    </div>
  )
}
