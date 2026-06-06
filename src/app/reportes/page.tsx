'use client'

import { useState, useEffect, useCallback } from 'react'
import { BarChart2, Plus, X, RefreshCw, GripVertical } from 'lucide-react'

interface DataItem { label: string; value: number; color: string }

interface Grafico {
  id: string
  titulo: string
  metrica: string
  tipo: 'barras' | 'dona'
}

const METRICAS = [
  { value: 'productores_por_estado', label: 'Productores por estado', defaultTipo: 'dona' as const },
  { value: 'productores_por_tipo', label: 'Productores por tipo de evento', defaultTipo: 'barras' as const },
  { value: 'productores_por_pais', label: 'Productores por país', defaultTipo: 'barras' as const },
  { value: 'campanas_por_mes', label: 'Campañas por mes', defaultTipo: 'barras' as const },
  { value: 'mensajes_por_canal', label: 'Mensajes por canal', defaultTipo: 'dona' as const },
  { value: 'tasa_exito', label: 'Tasa de éxito de envíos', defaultTipo: 'dona' as const },
]

function BarChart({ data }: { data: DataItem[] }) {
  const max = Math.max(...data.map(d => d.value), 1)
  return (
    <div className="space-y-2 mt-3">
      {data.map(item => (
        <div key={item.label}>
          <div className="flex items-center justify-between mb-1">
            <span className="text-[11px] text-zinc-400 truncate max-w-[70%]">{item.label}</span>
            <span className="text-[11px] font-medium text-zinc-300 tabular-nums">{item.value}</span>
          </div>
          <div className="h-1.5 bg-[#1a1a1a] rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{ width: `${(item.value / max) * 100}%`, backgroundColor: item.color }}
            />
          </div>
        </div>
      ))}
    </div>
  )
}

function DonaChart({ data }: { data: DataItem[] }) {
  const total = data.reduce((s, d) => s + d.value, 0)
  if (total === 0) return <div className="text-center py-6 text-[12px] text-zinc-700">Sin datos</div>

  let acumulado = 0
  const segments = data.map(d => {
    const pct = (d.value / total) * 100
    const start = acumulado
    acumulado += pct
    return { ...d, pct, start }
  })

  const gradient = segments.map(s => `${s.color} ${s.start.toFixed(1)}% ${(s.start + s.pct).toFixed(1)}%`).join(', ')

  return (
    <div className="flex items-center gap-4 mt-3">
      <div
        className="w-20 h-20 rounded-full shrink-0"
        style={{ background: `conic-gradient(${gradient})`, mask: 'radial-gradient(circle at center, transparent 38%, black 39%)' }}
      />
      <div className="space-y-1.5 flex-1 min-w-0">
        {segments.map(s => (
          <div key={s.label} className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: s.color }} />
            <span className="text-[11px] text-zinc-400 truncate flex-1">{s.label}</span>
            <span className="text-[11px] font-medium text-zinc-300 tabular-nums">{s.value}</span>
            <span className="text-[10px] text-zinc-600 tabular-nums">{s.pct.toFixed(0)}%</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function GraficoCard({ grafico, onRemove }: { grafico: Grafico; onRemove: () => void }) {
  const [data, setData] = useState<DataItem[]>([])
  const [loading, setLoading] = useState(true)

  const fetchData = useCallback(() => {
    setLoading(true)
    fetch(`/api/reportes?metrica=${grafico.metrica}`)
      .then(r => r.json())
      .then(d => { if (Array.isArray(d)) setData(d) })
      .finally(() => setLoading(false))
  }, [grafico.metrica])

  useEffect(() => { fetchData() }, [fetchData])

  return (
    <div className="bg-[#141414] border border-[#1f1f1f] rounded-xl p-5 hover:border-[#2a2a2a] transition-colors group">
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-2">
          <GripVertical size={13} className="text-zinc-700 cursor-grab" />
          <p className="text-[13px] font-medium text-white">{grafico.titulo}</p>
        </div>
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button onClick={fetchData} className="p-1.5 text-zinc-600 hover:text-zinc-300 hover:bg-white/5 rounded-md transition-all">
            <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />
          </button>
          <button onClick={onRemove} className="p-1.5 text-zinc-600 hover:text-red-400 hover:bg-red-500/8 rounded-md transition-all">
            <X size={12} />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="space-y-2 mt-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-4 bg-[#1a1a1a] rounded animate-pulse" style={{ width: `${[80, 55, 40][i - 1]}%` }} />
          ))}
        </div>
      ) : data.length === 0 ? (
        <p className="text-[12px] text-zinc-700 mt-4 text-center py-4">Sin datos todavía</p>
      ) : grafico.tipo === 'dona' ? (
        <DonaChart data={data} />
      ) : (
        <BarChart data={data} />
      )}
    </div>
  )
}

const STORAGE_KEY = 'crm_graficos'

export default function ReportesPage() {
  const [graficos, setGraficos] = useState<Grafico[]>([])
  const [showBuilder, setShowBuilder] = useState(false)
  const [metricaSeleccionada, setMetricaSeleccionada] = useState(METRICAS[0].value)
  const [tipoSeleccionado, setTipoSeleccionado] = useState<'barras' | 'dona'>('barras')
  const [tituloCustom, setTituloCustom] = useState('')

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) setGraficos(JSON.parse(saved))
    } catch { /* ignore */ }
  }, [])

  const saveGraficos = (next: Grafico[]) => {
    setGraficos(next)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
  }

  const addGrafico = () => {
    const metrica = METRICAS.find(m => m.value === metricaSeleccionada)!
    const nuevo: Grafico = {
      id: Date.now().toString(),
      titulo: tituloCustom.trim() || metrica.label,
      metrica: metricaSeleccionada,
      tipo: tipoSeleccionado,
    }
    saveGraficos([...graficos, nuevo])
    setShowBuilder(false)
    setTituloCustom('')
    setMetricaSeleccionada(METRICAS[0].value)
  }

  const removeGrafico = (id: string) => saveGraficos(graficos.filter(g => g.id !== id))

  const onMetricaChange = (value: string) => {
    setMetricaSeleccionada(value)
    const metrica = METRICAS.find(m => m.value === value)
    if (metrica) setTipoSeleccionado(metrica.defaultTipo)
  }

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <BarChart2 size={14} className="text-violet-400" />
            <span className="text-[11px] font-medium text-violet-400 uppercase tracking-widest">Análisis</span>
          </div>
          <h1 className="text-xl font-semibold text-white">Reportes</h1>
          <p className="text-[12px] text-zinc-600 mt-0.5">Construí tu dashboard personalizado</p>
        </div>
        <button
          onClick={() => setShowBuilder(true)}
          className="flex items-center gap-2 px-3.5 py-2 bg-violet-600 hover:bg-violet-500 text-white text-[13px] font-medium rounded-lg transition-all shadow-lg shadow-violet-900/20"
        >
          <Plus size={14} />
          Agregar gráfico
        </button>
      </div>

      {graficos.length === 0 ? (
        <div className="text-center py-20 bg-[#141414] border border-[#1f1f1f] rounded-xl">
          <BarChart2 size={28} className="text-zinc-800 mx-auto mb-4" />
          <p className="text-[14px] font-medium text-zinc-500 mb-1">Tu dashboard está vacío</p>
          <p className="text-[12px] text-zinc-700 mb-5">Agregá gráficos para visualizar los datos de tu CRM</p>
          <button onClick={() => setShowBuilder(true)} className="px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white text-[13px] font-medium rounded-lg transition-all">
            Crear primer gráfico →
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          {graficos.map(g => (
            <GraficoCard key={g.id} grafico={g} onRemove={() => removeGrafico(g.id)} />
          ))}
        </div>
      )}

      {/* Builder modal */}
      {showBuilder && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#141414] border border-[#2a2a2a] rounded-2xl w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#1f1f1f]">
              <h2 className="text-[15px] font-semibold text-white">Nuevo gráfico</h2>
              <button onClick={() => setShowBuilder(false)} className="w-7 h-7 flex items-center justify-center rounded-lg text-zinc-600 hover:text-zinc-300 hover:bg-white/5 transition-all">
                <X size={15} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-[10px] font-medium text-zinc-600 uppercase tracking-widest mb-1.5">¿Qué querés ver?</label>
                <select
                  value={metricaSeleccionada}
                  onChange={e => onMetricaChange(e.target.value)}
                  className="w-full bg-[#0f0f0f] border border-[#1f1f1f] rounded-lg px-3 py-2.5 text-[13px] text-white focus:outline-none focus:border-violet-500/40 transition-all"
                >
                  {METRICAS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-medium text-zinc-600 uppercase tracking-widest mb-1.5">Tipo de gráfico</label>
                <div className="grid grid-cols-2 gap-2">
                  {(['barras', 'dona'] as const).map(tipo => (
                    <button
                      key={tipo}
                      type="button"
                      onClick={() => setTipoSeleccionado(tipo)}
                      className={`px-4 py-3 rounded-xl border text-[13px] transition-all flex flex-col items-center gap-2 ${
                        tipoSeleccionado === tipo
                          ? 'border-violet-500/40 bg-violet-500/8 text-violet-300'
                          : 'border-[#1f1f1f] text-zinc-500 hover:border-[#2a2a2a] hover:text-zinc-300'
                      }`}
                    >
                      {tipo === 'barras' ? (
                        <div className="flex items-end gap-0.5 h-6">
                          {[60, 100, 40, 80].map((h, i) => (
                            <div key={i} className={`w-2.5 rounded-t ${tipoSeleccionado === 'barras' ? 'bg-violet-500' : 'bg-zinc-700'}`} style={{ height: `${h}%` }} />
                          ))}
                        </div>
                      ) : (
                        <div className={`w-6 h-6 rounded-full border-4 ${tipoSeleccionado === 'dona' ? 'border-violet-500' : 'border-zinc-700'}`} />
                      )}
                      {tipo === 'barras' ? 'Barras' : 'Dona'}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-medium text-zinc-600 uppercase tracking-widest mb-1.5">Título (opcional)</label>
                <input
                  value={tituloCustom}
                  onChange={e => setTituloCustom(e.target.value)}
                  placeholder={METRICAS.find(m => m.value === metricaSeleccionada)?.label}
                  className="w-full bg-[#0f0f0f] border border-[#1f1f1f] rounded-lg px-3 py-2 text-[13px] text-white placeholder-zinc-700 focus:outline-none focus:border-violet-500/40 transition-all"
                />
              </div>
            </div>
            <div className="px-6 py-4 border-t border-[#1f1f1f] flex justify-end gap-3">
              <button onClick={() => setShowBuilder(false)} className="px-4 py-2 text-[13px] text-zinc-400 hover:text-zinc-200 transition-colors">Cancelar</button>
              <button onClick={addGrafico} className="px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white text-[13px] font-medium rounded-lg transition-all flex items-center gap-2">
                <Plus size={13} />
                Agregar gráfico
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
