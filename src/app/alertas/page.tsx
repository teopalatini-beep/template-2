'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Bell, AlertTriangle, Clock, ChevronRight, RefreshCw, TrendingUp } from 'lucide-react'

type AlertaProductor = {
  id: string
  nombre: string
  empresa: string | null
  pipeline_etapa: string | null
  dias_sin_actividad: number
  tiene_actividad: boolean
  valor_estimado?: number | null
  asignado_a?: string | null
}

const ETAPA_LABELS: Record<string, string> = {
  nuevo: 'Nuevo',
  contactado: 'Contactado',
  propuesta: 'Propuesta',
  negociacion: 'Negociación',
  cerrado: 'Cerrado',
}

const ETAPA_COLORS: Record<string, string> = {
  nuevo: 'text-sky-400 bg-sky-500/10 border-sky-500/20',
  contactado: 'text-violet-400 bg-violet-500/10 border-violet-500/20',
  propuesta: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
  negociacion: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
}

function urgenciaColor(dias: number) {
  if (dias >= 14) return 'text-red-400'
  if (dias >= 7) return 'text-amber-400'
  return 'text-zinc-500'
}

export default function AlertasPage() {
  const [alertas, setAlertas] = useState<AlertaProductor[]>([])
  const [loading, setLoading] = useState(true)
  const [filtroAltoValor, setFiltroAltoValor] = useState(false)
  const [refreshing, setRefreshing] = useState(false)

  const fetchAlertas = async () => {
    setRefreshing(true)
    try {
      const [aRes, pRes] = await Promise.all([
        fetch('/api/alertas'),
        fetch('/api/productores'),
      ])
      const [stale, productores] = await Promise.all([aRes.json(), pRes.json()])

      const productorMap: Record<string, { valor_estimado?: number | null; asignado_a?: string | null }> = {}
      for (const p of (productores ?? [])) {
        productorMap[p.id] = { valor_estimado: p.valor_estimado, asignado_a: p.asignado_a }
      }

      const enriquecidos = (stale ?? []).map((a: AlertaProductor) => ({
        ...a,
        valor_estimado: productorMap[a.id]?.valor_estimado ?? null,
        asignado_a: productorMap[a.id]?.asignado_a ?? null,
      }))

      setAlertas(enriquecidos)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => { fetchAlertas() }, [])

  const filtrados = filtroAltoValor
    ? alertas.filter(a => a.valor_estimado != null && a.valor_estimado > 0)
    : alertas

  const criticas = filtrados.filter(a => a.dias_sin_actividad >= 14).length
  const moderadas = filtrados.filter(a => a.dias_sin_actividad >= 7 && a.dias_sin_actividad < 14).length

  return (
    <div className="p-8 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-7">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Bell size={16} className="text-amber-400" />
            <h1 className="text-xl font-semibold text-white">Alertas prioritarias</h1>
          </div>
          <p className="text-[12px] text-zinc-600">Productores en pipeline activo sin actividad reciente</p>
        </div>
        <button
          onClick={fetchAlertas}
          disabled={refreshing}
          className="flex items-center gap-1.5 px-3 py-1.5 text-[12px] text-zinc-400 border border-[#1f1f1f] rounded-lg hover:text-white transition-colors disabled:opacity-50"
        >
          <RefreshCw size={12} className={refreshing ? 'animate-spin' : ''} />
          Actualizar
        </button>
      </div>

      {/* KPI strip */}
      {!loading && (
        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="bg-[#141414] border border-[#1f1f1f] rounded-xl p-4">
            <p className="text-[10px] text-zinc-600 uppercase tracking-widest mb-1">Total alertas</p>
            <p className="text-2xl font-bold text-white">{filtrados.length}</p>
          </div>
          <div className="bg-[#141414] border border-red-500/10 rounded-xl p-4">
            <p className="text-[10px] text-zinc-600 uppercase tracking-widest mb-1">Críticas (+14d)</p>
            <p className="text-2xl font-bold text-red-400">{criticas}</p>
          </div>
          <div className="bg-[#141414] border border-amber-500/10 rounded-xl p-4">
            <p className="text-[10px] text-zinc-600 uppercase tracking-widest mb-1">Moderadas (7-14d)</p>
            <p className="text-2xl font-bold text-amber-400">{moderadas}</p>
          </div>
        </div>
      )}

      {/* Filtros */}
      <div className="flex items-center gap-3 mb-5">
        <button
          onClick={() => setFiltroAltoValor(false)}
          className={`px-3 py-1.5 text-[12px] rounded-lg border transition-colors ${!filtroAltoValor ? 'border-violet-500/50 text-violet-300 bg-violet-500/10' : 'border-[#1f1f1f] text-zinc-500 hover:text-zinc-300'}`}
        >
          Todos
        </button>
        <button
          onClick={() => setFiltroAltoValor(true)}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-[12px] rounded-lg border transition-colors ${filtroAltoValor ? 'border-emerald-500/50 text-emerald-300 bg-emerald-500/10' : 'border-[#1f1f1f] text-zinc-500 hover:text-zinc-300'}`}
        >
          <TrendingUp size={11} />
          Alto valor
        </button>
      </div>

      {/* Lista */}
      {loading ? (
        <div className="space-y-2">
          {[1,2,3].map(i => (
            <div key={i} className="bg-[#141414] border border-[#1f1f1f] rounded-xl h-20 animate-pulse" />
          ))}
        </div>
      ) : !filtrados.length ? (
        <div className="bg-[#141414] border border-[#1f1f1f] rounded-xl py-16 text-center">
          <Bell size={24} className="text-zinc-800 mx-auto mb-3" />
          <p className="text-[13px] text-zinc-600">Sin alertas activas</p>
          <p className="text-[11px] text-zinc-700 mt-1">Todos los productores tienen actividad reciente</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtrados.map(alerta => (
            <Link
              key={alerta.id}
              href={`/productores/${alerta.id}`}
              className="flex items-center gap-4 bg-[#141414] border border-[#1f1f1f] hover:border-[#2a2a2a] rounded-xl px-5 py-4 transition-all group"
            >
              {/* Urgencia icon */}
              <div className="shrink-0">
                {alerta.dias_sin_actividad >= 14
                  ? <AlertTriangle size={16} className="text-red-400" />
                  : <Clock size={16} className="text-amber-400" />}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <p className="text-[13px] font-medium text-white truncate">{alerta.nombre}</p>
                  {alerta.empresa && (
                    <span className="text-[11px] text-zinc-600 truncate">— {alerta.empresa}</span>
                  )}
                  {alerta.valor_estimado != null && alerta.valor_estimado > 0 && (
                    <span className="text-[10px] text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-md px-1.5 py-0.5 shrink-0">
                      ${alerta.valor_estimado.toLocaleString()}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  {alerta.pipeline_etapa && (
                    <span className={`text-[10px] font-medium border rounded-md px-1.5 py-0.5 ${ETAPA_COLORS[alerta.pipeline_etapa] ?? 'text-zinc-500 bg-zinc-500/10 border-zinc-500/20'}`}>
                      {ETAPA_LABELS[alerta.pipeline_etapa] ?? alerta.pipeline_etapa}
                    </span>
                  )}
                  {alerta.asignado_a && (
                    <span className="text-[11px] text-zinc-600">→ {alerta.asignado_a}</span>
                  )}
                  <span className={`text-[11px] font-medium ${urgenciaColor(alerta.dias_sin_actividad)}`}>
                    {alerta.dias_sin_actividad}d sin actividad
                  </span>
                </div>
              </div>

              <ChevronRight size={14} className="text-zinc-700 group-hover:text-zinc-400 transition-colors shrink-0" />
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
