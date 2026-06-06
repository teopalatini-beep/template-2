'use client'

import { useState, useEffect, useCallback } from 'react'
import { BarChart2, Plus, X, RefreshCw, TrendingUp, TrendingDown, Minus, AlertTriangle, DollarSign, Target, Zap } from 'lucide-react'

// ─── Types ──────────────────────────────────────────────────────────────────
interface DataItem {
  label: string; value: number; color: string
  enviados?: number; fallidos?: number; tasa?: number; costo?: number; descripcion?: string
}

interface KPIs {
  mensajesMes: number; mensajesAnt: number; tendenciaMensajes: number
  tasaEntrega: number; tasaEntregaAnt: number
  productoresAlcanzables: number; totalProductores: number
  costoEstimadoMes: number; costoFallidosTotal: number
}

interface Grafico { id: string; titulo: string; metrica: string; tipo: 'barras' | 'dona' | 'detalle' }

// ─── Métricas disponibles ───────────────────────────────────────────────────
const METRICAS = [
  { value: 'entrega_por_canal',       label: 'Entrega por canal (email vs WhatsApp)', defaultTipo: 'detalle' as const, categoria: 'mensajeria' },
  { value: 'volumen_7dias',            label: 'Volumen últimos 7 días', defaultTipo: 'barras' as const, categoria: 'mensajeria' },
  { value: 'tasa_exito',              label: 'Tasa de éxito general', defaultTipo: 'dona' as const, categoria: 'mensajeria' },
  { value: 'rendimiento_tipo_evento', label: 'Rendimiento por tipo de evento', defaultTipo: 'detalle' as const, categoria: 'eventos' },
  { value: 'costo_campanas',          label: 'Costo por campaña (USD)', defaultTipo: 'detalle' as const, categoria: 'dinero' },
  { value: 'gaps_contactabilidad',    label: 'Cobertura de contacto', defaultTipo: 'dona' as const, categoria: 'productores' },
  { value: 'productores_por_estado',  label: 'Productores por estado', defaultTipo: 'dona' as const, categoria: 'productores' },
  { value: 'productores_por_tipo',    label: 'Productores por tipo de evento', defaultTipo: 'barras' as const, categoria: 'eventos' },
  { value: 'productores_por_pais',    label: 'Productores por país', defaultTipo: 'barras' as const, categoria: 'productores' },
  { value: 'campanas_por_mes',        label: 'Campañas por mes', defaultTipo: 'barras' as const, categoria: 'mensajeria' },
]

const CATEGORIAS = [
  { key: 'mensajeria', label: 'Mensajería', color: 'text-violet-400' },
  { key: 'dinero', label: 'Dinero y costos', color: 'text-emerald-400' },
  { key: 'productores', label: 'Productores', color: 'text-sky-400' },
  { key: 'eventos', label: 'Eventos', color: 'text-amber-400' },
]

const STORAGE_KEY = 'crm_graficos_v2'

// ─── Chart Components ───────────────────────────────────────────────────────
function BarChart({ data }: { data: DataItem[] }) {
  const max = Math.max(...data.map(d => d.value), 1)
  return (
    <div className="space-y-2.5 mt-3">
      {data.map(item => (
        <div key={item.label}>
          <div className="flex items-center justify-between mb-1">
            <span className="text-[11px] text-zinc-400 truncate max-w-[65%]">{item.label}</span>
            <span className="text-[11px] font-semibold text-zinc-200 tabular-nums">{item.value}</span>
          </div>
          <div className="h-2 bg-[#1a1a1a] rounded-full overflow-hidden">
            <div className="h-full rounded-full transition-all duration-700" style={{ width: `${(item.value / max) * 100}%`, backgroundColor: item.color }} />
          </div>
        </div>
      ))}
    </div>
  )
}

function DonaChart({ data }: { data: DataItem[] }) {
  const total = data.reduce((s, d) => s + d.value, 0)
  if (total === 0) return <div className="text-center py-8 text-[12px] text-zinc-700">Sin datos todavía</div>
  let acumulado = 0
  const segments = data.map(d => { const pct = (d.value / total) * 100; const start = acumulado; acumulado += pct; return { ...d, pct, start } })
  const gradient = segments.map(s => `${s.color} ${s.start.toFixed(1)}% ${(s.start + s.pct).toFixed(1)}%`).join(', ')
  return (
    <div className="flex items-center gap-5 mt-3">
      <div className="relative shrink-0">
        <div className="w-24 h-24 rounded-full" style={{ background: `conic-gradient(${gradient})`, mask: 'radial-gradient(circle at center, transparent 36%, black 37%)' }} />
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-[11px] font-bold text-zinc-300 tabular-nums">{total}</span>
        </div>
      </div>
      <div className="space-y-1.5 flex-1 min-w-0">
        {segments.map(s => (
          <div key={s.label} className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: s.color }} />
            <span className="text-[11px] text-zinc-400 truncate flex-1">{s.label}</span>
            <span className="text-[11px] font-semibold text-zinc-200 tabular-nums">{s.value}</span>
            <span className="text-[10px] text-zinc-600 tabular-nums w-8 text-right">{s.pct.toFixed(0)}%</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function DetalleChart({ data, metrica }: { data: DataItem[]; metrica: string }) {
  if (data.length === 0) return <div className="text-center py-8 text-[12px] text-zinc-700">Sin datos todavía</div>

  if (metrica === 'entrega_por_canal') {
    return (
      <div className="space-y-3 mt-3">
        {data.map(item => (
          <div key={item.label} className="bg-[#0f0f0f] border border-[#1a1a1a] rounded-xl p-3">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                <span className="text-[13px] font-medium text-zinc-200">{item.label}</span>
              </div>
              <span className="text-[13px] font-bold tabular-nums" style={{ color: item.tasa && item.tasa >= 80 ? '#10b981' : item.tasa && item.tasa >= 60 ? '#f59e0b' : '#ef4444' }}>
                {item.tasa ?? 0}%
              </span>
            </div>
            <div className="h-1.5 bg-[#1a1a1a] rounded-full overflow-hidden mb-2">
              <div className="h-full rounded-full" style={{ width: `${item.tasa ?? 0}%`, backgroundColor: item.color }} />
            </div>
            <div className="flex gap-3 text-[10px] text-zinc-600">
              <span className="text-emerald-400">{item.enviados ?? 0} entregados</span>
              <span className="text-red-400">{item.fallidos ?? 0} fallidos</span>
              <span className="ml-auto">{item.value} total</span>
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (metrica === 'rendimiento_tipo_evento') {
    return (
      <div className="space-y-2 mt-3">
        {data.map(item => (
          <div key={item.label} className="flex items-center gap-3">
            <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
            <span className="text-[11px] text-zinc-400 flex-1 truncate">{item.label}</span>
            <div className="flex items-center gap-2 shrink-0">
              <span className="text-[11px] text-zinc-500 tabular-nums">{item.value} env.</span>
              <span className={`text-[11px] font-bold tabular-nums w-10 text-right ${(item.tasa ?? 0) >= 80 ? 'text-emerald-400' : (item.tasa ?? 0) >= 60 ? 'text-amber-400' : 'text-red-400'}`}>
                {item.tasa ?? 0}%
              </span>
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (metrica === 'costo_campanas') {
    const totalCosto = data.reduce((s, d) => s + (d.costo ?? 0), 0)
    return (
      <div className="mt-3">
        <div className="text-[10px] text-zinc-600 uppercase tracking-widest mb-2 flex justify-between">
          <span>Campaña</span><span>Enviados · Costo USD</span>
        </div>
        <div className="space-y-1.5">
          {data.map(item => (
            <div key={item.label} className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
              <span className="text-[11px] text-zinc-400 flex-1 truncate">{item.label}</span>
              <span className="text-[10px] text-zinc-600 tabular-nums">{item.enviados}</span>
              <span className="text-[11px] font-semibold text-emerald-400 tabular-nums w-14 text-right">${item.costo?.toFixed(4)}</span>
            </div>
          ))}
        </div>
        <div className="mt-3 pt-2 border-t border-[#1a1a1a] flex justify-between">
          <span className="text-[10px] text-zinc-600">Total estimado</span>
          <span className="text-[12px] font-bold text-emerald-400">${totalCosto.toFixed(4)} USD</span>
        </div>
        <p className="text-[9px] text-zinc-700 mt-1">Email: $0.001/msg · WhatsApp: $0.03/msg</p>
      </div>
    )
  }

  return <BarChart data={data} />
}

// ─── KPI Card ───────────────────────────────────────────────────────────────
function KPICard({ label, value, tendencia: t, suffix = '', icon: Icon, color, sub }: {
  label: string; value: string | number; tendencia?: number; suffix?: string
  icon: React.ElementType; color: string; sub?: string
}) {
  return (
    <div className="bg-[#141414] border border-[#1f1f1f] rounded-xl p-5 hover:border-[#2a2a2a] transition-colors">
      <div className="flex items-start justify-between mb-3">
        <div className={`w-8 h-8 rounded-lg ${color} flex items-center justify-center`}>
          <Icon size={14} className="text-white" />
        </div>
        {t !== undefined && (
          <div className={`flex items-center gap-1 text-[10px] font-medium ${t > 0 ? 'text-emerald-400' : t < 0 ? 'text-red-400' : 'text-zinc-600'}`}>
            {t > 0 ? <TrendingUp size={11} /> : t < 0 ? <TrendingDown size={11} /> : <Minus size={11} />}
            {t > 0 ? '+' : ''}{t}% vs mes ant.
          </div>
        )}
      </div>
      <p className="text-2xl font-bold text-white tabular-nums mb-0.5">{value}{suffix}</p>
      <p className="text-[11px] text-zinc-500">{label}</p>
      {sub && <p className="text-[10px] text-zinc-700 mt-0.5">{sub}</p>}
    </div>
  )
}

// ─── Grafico Card ───────────────────────────────────────────────────────────
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
      <div className="flex items-center justify-between">
        <p className="text-[13px] font-semibold text-white">{grafico.titulo}</p>
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
        <div className="space-y-2 mt-4">
          {[80, 55, 70, 40].map((w, i) => <div key={i} className="h-3 bg-[#1a1a1a] rounded animate-pulse" style={{ width: `${w}%` }} />)}
        </div>
      ) : grafico.tipo === 'dona' ? (
        <DonaChart data={data} />
      ) : grafico.tipo === 'detalle' ? (
        <DetalleChart data={data} metrica={grafico.metrica} />
      ) : (
        <BarChart data={data} />
      )}
    </div>
  )
}

// ─── Insight automático ─────────────────────────────────────────────────────
function Insights({ kpis }: { kpis: KPIs | null }) {
  if (!kpis) return null
  const insights: { tipo: 'good' | 'warn' | 'bad'; texto: string }[] = []

  if (kpis.tasaEntrega >= 90) insights.push({ tipo: 'good', texto: `Excelente tasa de entrega (${kpis.tasaEntrega}%) — tus mensajes llegan bien.` })
  else if (kpis.tasaEntrega < 70) insights.push({ tipo: 'bad', texto: `Tasa de entrega baja (${kpis.tasaEntrega}%). Revisá emails inválidos o spam filters.` })

  if (kpis.productoresAlcanzables < 80) {
    const sinContacto = kpis.totalProductores - Math.round((kpis.productoresAlcanzables / 100) * kpis.totalProductores)
    insights.push({ tipo: 'warn', texto: `${sinContacto} productores sin contacto válido — no reciben tus campañas.` })
  }

  if (kpis.costoFallidosTotal > 0.05) insights.push({ tipo: 'bad', texto: `Perdés ~$${kpis.costoFallidosTotal.toFixed(2)} USD en mensajes fallidos. Limpiar la base reduce el costo.` })

  if (kpis.tendenciaMensajes > 20) insights.push({ tipo: 'good', texto: `Volumen de mensajes creció +${kpis.tendenciaMensajes}% vs el mes pasado.` })
  else if (kpis.tendenciaMensajes < -10) insights.push({ tipo: 'warn', texto: `Actividad bajó ${Math.abs(kpis.tendenciaMensajes)}% respecto al mes anterior.` })

  if (insights.length === 0) return null

  const colores = { good: 'bg-emerald-500/5 border-emerald-500/15 text-emerald-400', warn: 'bg-amber-500/5 border-amber-500/15 text-amber-400', bad: 'bg-red-500/5 border-red-500/15 text-red-400' }

  return (
    <div className="mb-6 space-y-2">
      <p className="text-[10px] font-medium text-zinc-600 uppercase tracking-widest mb-2">Insights automáticos</p>
      {insights.map((ins, i) => (
        <div key={i} className={`flex items-start gap-2.5 border rounded-xl px-4 py-3 ${colores[ins.tipo]}`}>
          {ins.tipo === 'bad' ? <AlertTriangle size={13} className="shrink-0 mt-0.5" /> : ins.tipo === 'warn' ? <AlertTriangle size={13} className="shrink-0 mt-0.5" /> : <Zap size={13} className="shrink-0 mt-0.5" />}
          <p className="text-[12px]">{ins.texto}</p>
        </div>
      ))}
    </div>
  )
}

// ─── Main Page ──────────────────────────────────────────────────────────────
export default function ReportesPage() {
  const [kpis, setKpis] = useState<KPIs | null>(null)
  const [kpisLoading, setKpisLoading] = useState(true)
  const [graficos, setGraficos] = useState<Grafico[]>([])
  const [showBuilder, setShowBuilder] = useState(false)
  const [metricaSeleccionada, setMetricaSeleccionada] = useState(METRICAS[0].value)
  const [tipoSeleccionado, setTipoSeleccionado] = useState<'barras' | 'dona' | 'detalle'>(METRICAS[0].defaultTipo)
  const [tituloCustom, setTituloCustom] = useState('')
  const [categoriaFilter, setCategoriaFilter] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/reportes?metrica=kpis').then(r => r.json()).then(d => { if (!d.error) setKpis(d) }).finally(() => setKpisLoading(false))
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) setGraficos(JSON.parse(saved))
    } catch { /* ignore */ }
  }, [])

  const saveGraficos = (next: Grafico[]) => { setGraficos(next); localStorage.setItem(STORAGE_KEY, JSON.stringify(next)) }

  const addGrafico = () => {
    const metrica = METRICAS.find(m => m.value === metricaSeleccionada)!
    saveGraficos([...graficos, { id: Date.now().toString(), titulo: tituloCustom.trim() || metrica.label, metrica: metricaSeleccionada, tipo: tipoSeleccionado }])
    setShowBuilder(false); setTituloCustom(''); setMetricaSeleccionada(METRICAS[0].value)
  }

  const onMetricaChange = (value: string) => {
    setMetricaSeleccionada(value)
    const m = METRICAS.find(x => x.value === value)
    if (m) setTipoSeleccionado(m.defaultTipo)
  }

  const metricasFiltradas = categoriaFilter ? METRICAS.filter(m => m.categoria === categoriaFilter) : METRICAS

  return (
    <div className="p-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <BarChart2 size={14} className="text-violet-400" />
            <span className="text-[11px] font-medium text-violet-400 uppercase tracking-widest">Analytics</span>
          </div>
          <h1 className="text-xl font-semibold text-white">Reportes</h1>
          <p className="text-[12px] text-zinc-600 mt-0.5">Datos de impacto, costos y rendimiento de tus campañas</p>
        </div>
        <button onClick={() => setShowBuilder(true)} className="flex items-center gap-2 px-3.5 py-2 bg-violet-600 hover:bg-violet-500 text-white text-[13px] font-medium rounded-lg transition-all shadow-lg shadow-violet-900/20">
          <Plus size={14} /> Agregar gráfico
        </button>
      </div>

      {/* KPIs siempre visibles */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {kpisLoading ? (
          [1,2,3,4].map(i => <div key={i} className="h-[100px] bg-[#141414] border border-[#1f1f1f] rounded-xl animate-pulse" />)
        ) : kpis ? (
          <>
            <KPICard icon={TrendingUp} color="bg-violet-600" label="Mensajes este mes" value={kpis.mensajesMes} tendencia={kpis.tendenciaMensajes} sub={`${kpis.mensajesAnt} el mes pasado`} />
            <KPICard icon={Target} color="bg-emerald-600" label="Tasa de entrega" value={kpis.tasaEntrega} suffix="%" tendencia={kpis.tasaEntrega - kpis.tasaEntregaAnt} />
            <KPICard icon={Zap} color="bg-sky-600" label="Productores alcanzables" value={kpis.productoresAlcanzables} suffix="%" sub={`${kpis.totalProductores} en total`} />
            <KPICard icon={DollarSign} color="bg-amber-600" label="Costo estimado mes" value={`$${kpis.costoEstimadoMes.toFixed(3)}`} sub={`$${kpis.costoFallidosTotal.toFixed(3)} en fallidos`} />
          </>
        ) : null}
      </div>

      {/* Insights automáticos */}
      <Insights kpis={kpis} />

      {/* Grid de gráficos */}
      {graficos.length === 0 ? (
        <div className="text-center py-16 bg-[#141414] border border-dashed border-[#2a2a2a] rounded-xl">
          <BarChart2 size={28} className="text-zinc-800 mx-auto mb-4" />
          <p className="text-[14px] font-medium text-zinc-500 mb-1">Armá tu dashboard</p>
          <p className="text-[12px] text-zinc-700 mb-5">Elegí las métricas que más te importan y construí tu vista personalizada</p>
          <button onClick={() => setShowBuilder(true)} className="px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white text-[13px] font-medium rounded-lg transition-all">
            Agregar primer gráfico →
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          {graficos.map(g => <GraficoCard key={g.id} grafico={g} onRemove={() => saveGraficos(graficos.filter(x => x.id !== g.id))} />)}
        </div>
      )}

      {/* Builder modal */}
      {showBuilder && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#141414] border border-[#2a2a2a] rounded-2xl w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#1f1f1f]">
              <h2 className="text-[15px] font-semibold text-white">Nuevo gráfico</h2>
              <button onClick={() => setShowBuilder(false)} className="w-7 h-7 flex items-center justify-center rounded-lg text-zinc-600 hover:text-zinc-300 hover:bg-white/5 transition-all"><X size={15} /></button>
            </div>
            <div className="p-6 space-y-4">
              {/* Filtro categorías */}
              <div className="flex flex-wrap gap-1.5">
                <button onClick={() => setCategoriaFilter(null)} className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all border ${!categoriaFilter ? 'bg-violet-500/15 border-violet-500/30 text-violet-300' : 'border-[#2a2a2a] text-zinc-600 hover:text-zinc-400'}`}>Todas</button>
                {CATEGORIAS.map(c => (
                  <button key={c.key} onClick={() => setCategoriaFilter(c.key)} className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all border ${categoriaFilter === c.key ? 'bg-violet-500/15 border-violet-500/30 text-violet-300' : 'border-[#2a2a2a] text-zinc-600 hover:text-zinc-400'}`}>{c.label}</button>
                ))}
              </div>

              <div>
                <label className="block text-[10px] font-medium text-zinc-600 uppercase tracking-widest mb-1.5">Métrica</label>
                <select value={metricaSeleccionada} onChange={e => onMetricaChange(e.target.value)} className="w-full bg-[#0f0f0f] border border-[#1f1f1f] rounded-lg px-3 py-2.5 text-[13px] text-white focus:outline-none focus:border-violet-500/40 transition-all">
                  {metricasFiltradas.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-medium text-zinc-600 uppercase tracking-widest mb-1.5">Visualización</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['barras', 'dona', 'detalle'] as const).map(tipo => (
                    <button key={tipo} type="button" onClick={() => setTipoSeleccionado(tipo)} className={`px-3 py-2.5 rounded-xl border text-[12px] transition-all flex flex-col items-center gap-1.5 ${tipoSeleccionado === tipo ? 'border-violet-500/40 bg-violet-500/8 text-violet-300' : 'border-[#1f1f1f] text-zinc-500 hover:border-[#2a2a2a] hover:text-zinc-300'}`}>
                      {tipo === 'barras' && <div className="flex items-end gap-0.5 h-5">{[60,100,45,80].map((h,i) => <div key={i} className={`w-2 rounded-t ${tipoSeleccionado==='barras'?'bg-violet-500':'bg-zinc-700'}`} style={{height:`${h}%`}} />)}</div>}
                      {tipo === 'dona' && <div className={`w-5 h-5 rounded-full border-4 ${tipoSeleccionado==='dona'?'border-violet-500':'border-zinc-700'}`} />}
                      {tipo === 'detalle' && <div className="space-y-1">{[1,2,3].map(i => <div key={i} className={`h-1 rounded ${tipoSeleccionado==='detalle'?'bg-violet-500':'bg-zinc-700'}`} style={{width:`${i*25+25}px`}} />)}</div>}
                      <span className="capitalize">{tipo}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-medium text-zinc-600 uppercase tracking-widest mb-1.5">Título (opcional)</label>
                <input value={tituloCustom} onChange={e => setTituloCustom(e.target.value)} placeholder={METRICAS.find(m => m.value === metricaSeleccionada)?.label} className="w-full bg-[#0f0f0f] border border-[#1f1f1f] rounded-lg px-3 py-2 text-[13px] text-white placeholder-zinc-700 focus:outline-none focus:border-violet-500/40 transition-all" />
              </div>
            </div>
            <div className="px-6 py-4 border-t border-[#1f1f1f] flex justify-end gap-3">
              <button onClick={() => setShowBuilder(false)} className="px-4 py-2 text-[13px] text-zinc-400 hover:text-zinc-200 transition-colors">Cancelar</button>
              <button onClick={addGrafico} className="px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white text-[13px] font-medium rounded-lg transition-all flex items-center gap-2"><Plus size={13} />Agregar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
