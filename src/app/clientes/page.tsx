'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { Building2, Search, ChevronRight } from 'lucide-react'
import type { Cliente } from '@/lib/types'
import StatusBadge from '@/components/StatusBadge'
import { SkeletonTable } from '@/components/Skeleton'

export default function ClientesPage() {
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    fetch('/api/clientes')
      .then((r) => r.json())
      .then((data) => setClientes(data))
      .finally(() => setLoading(false))
  }, [])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return clientes
    return clientes.filter((cliente) =>
      cliente.nombre.toLowerCase().includes(q) ||
      (cliente.empresa ?? '').toLowerCase().includes(q) ||
      (cliente.email ?? '').toLowerCase().includes(q)
    )
  }, [clientes, search])

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="mb-6 flex items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 mb-0.5">
            <Building2 size={13} className="text-zinc-600" />
            <span className="text-[11px] text-zinc-600 uppercase tracking-widest font-medium">CRM Productora</span>
          </div>
          <h1 className="text-xl font-semibold text-white">
            Clientes
            <span className="ml-2 text-[13px] font-normal text-zinc-600">{clientes.length}</span>
          </h1>
        </div>

        <Link
          href="/productores"
          className="text-[12px] text-zinc-500 hover:text-violet-400 transition-colors"
        >
          Gestión avanzada →
        </Link>
      </div>

      <div className="relative mb-4 max-w-sm">
        <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-600" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar cliente, marca o email..."
          className="w-full bg-[#141414] border border-[#1f1f1f] rounded-lg pl-8 pr-3 py-2 text-[13px] text-zinc-200 placeholder-zinc-700 focus:outline-none focus:border-violet-500/40 transition-all"
        />
      </div>

      <div className="bg-[#141414] border border-[#1f1f1f] rounded-xl overflow-hidden">
        {loading ? (
          <table className="w-full"><tbody><SkeletonTable rows={6} cols={5} /></tbody></table>
        ) : !filtered.length ? (
          <div className="py-16 text-center text-[13px] text-zinc-600">No hay clientes para este filtro.</div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#1a1a1a]">
                {['Cliente', 'Empresa', 'Contacto', 'Estado', ''].map((h) => (
                  <th key={h} className="px-5 py-2.5 text-left text-[10px] font-medium text-zinc-600 uppercase tracking-widest">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((cliente) => (
                <tr key={cliente.id} className="border-b border-[#111] last:border-0 hover:bg-white/[0.015] transition-colors group">
                  <td className="px-5 py-3.5 text-[13px] font-medium text-zinc-200">{cliente.nombre}</td>
                  <td className="px-5 py-3.5 text-[12px] text-zinc-500">{cliente.empresa || '—'}</td>
                  <td className="px-5 py-3.5 text-[12px] text-zinc-600">{cliente.email || cliente.telefono || '—'}</td>
                  <td className="px-5 py-3.5"><StatusBadge status={cliente.estado} /></td>
                  <td className="px-5 py-3.5">
                    <Link
                      href={`/productores/${cliente.id}`}
                      className="inline-flex items-center gap-1 text-[11px] text-zinc-700 hover:text-violet-400 opacity-0 group-hover:opacity-100 transition-all"
                    >
                      Ver ficha <ChevronRight size={11} />
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
