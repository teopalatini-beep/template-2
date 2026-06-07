'use client'

import { useEffect, useState } from 'react'
import { Zap, Plus, Trash2, ToggleLeft, ToggleRight, Clock, Mail, ChevronRight } from 'lucide-react'
import { toast } from 'sonner'

interface Paso {
  id?: string
  delay_dias: number
  titulo: string
  mensaje: string
  orden: number
}

interface Secuencia {
  id: string
  nombre: string
  descripcion: string | null
  activo: boolean
  pasos_secuencia: Paso[]
  created_at: string
}

const DEFAULT_SECUENCIAS: Omit<Secuencia, 'id' | 'created_at'>[] = [
  {
    nombre: 'Bienvenida',
    descripcion: 'Se envía automáticamente cuando se agrega un productor nuevo',
    activo: true,
    pasos_secuencia: [
      { delay_dias: 0, titulo: '¡Bienvenido a Ticketera!', mensaje: 'Hola, gracias por sumarte. Estamos para ayudarte con todo lo que necesites para tu próximo evento.', orden: 0 },
    ],
  },
  {
    nombre: 'Seguimiento 15 días',
    descripcion: 'Recordatorio y oferta a los 15 días de haberse sumado',
    activo: true,
    pasos_secuencia: [
      { delay_dias: 15, titulo: '¿Cómo va tu próximo evento?', mensaje: 'Han pasado 15 días desde que te sumaste. ¿Tenés algún evento en mente? Te podemos ayudar a vender más entradas.', orden: 0 },
    ],
  },
  {
    nombre: 'Reactivación 30 días',
    descripcion: 'Email de reactivación a productores que no respondieron',
    activo: false,
    pasos_secuencia: [
      { delay_dias: 30, titulo: 'Te extrañamos 👋', mensaje: 'Ya pasó un mes. Tenemos nuevas funciones y promos especiales para productores como vos. ¿Charlamos?', orden: 0 },
    ],
  },
]

export default function AutomatizacionesPage() {
  const [secuencias, setSecuencias] = useState<Secuencia[]>([])
  const [loading, setLoading] = useState(true)
  const [showNew, setShowNew] = useState(false)
  const [newNombre, setNewNombre] = useState('')
  const [newDesc, setNewDesc] = useState('')
  const [newPasos, setNewPasos] = useState<Omit<Paso, 'id'>[]>([
    { delay_dias: 0, titulo: '', mensaje: '', orden: 0 },
  ])
  const [saving, setSaving] = useState(false)

  const fetchSecuencias = () => {
    fetch('/api/secuencias')
      .then(r => r.json())
      .then(d => { if (!d.error) setSecuencias(d) })
      .finally(() => setLoading(false))
  }

  useEffect(() => { fetchSecuencias() }, [])

  const toggleActivo = async (id: string, activo: boolean) => {
    const prev = secuencias
    setSecuencias(s => s.map(sec => sec.id === id ? { ...sec, activo: !activo } : sec))
    const res = await fetch(`/api/secuencias/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ activo: !activo }),
    })
    if (!res.ok) { setSecuencias(prev); toast.error('Error al actualizar') }
    else toast.success(activo ? 'Secuencia pausada' : 'Secuencia activada')
  }

  const eliminar = async (id: string) => {
    const res = await fetch(`/api/secuencias/${id}`, { method: 'DELETE' })
    if (res.ok) { setSecuencias(s => s.filter(sec => sec.id !== id)); toast.success('Eliminada') }
    else toast.error('Error al eliminar')
  }

  const crearDefault = async (def: typeof DEFAULT_SECUENCIAS[0]) => {
    setSaving(true)
    const res = await fetch('/api/secuencias', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nombre: def.nombre, descripcion: def.descripcion, pasos: def.pasos_secuencia }),
    })
    if (res.ok) { fetchSecuencias(); toast.success('Secuencia creada') }
    else toast.error('Error al crear')
    setSaving(false)
  }

  const handleSave = async () => {
    if (!newNombre.trim()) { toast.error('El nombre es obligatorio'); return }
    if (newPasos.some(p => !p.titulo.trim() || !p.mensaje.trim())) { toast.error('Completá todos los pasos'); return }
    setSaving(true)
    const res = await fetch('/api/secuencias', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nombre: newNombre, descripcion: newDesc, pasos: newPasos }),
    })
    if (res.ok) {
      fetchSecuencias()
      setShowNew(false)
      setNewNombre(''); setNewDesc(''); setNewPasos([{ delay_dias: 0, titulo: '', mensaje: '', orden: 0 }])
      toast.success('Automatización creada')
    } else toast.error('Error al guardar')
    setSaving(false)
  }

  const existingNames = new Set(secuencias.map(s => s.nombre))

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Zap size={14} className="text-violet-400" />
            <span className="text-[11px] font-medium text-violet-400 uppercase tracking-widest">Automatizaciones</span>
          </div>
          <h1 className="text-xl font-semibold text-white">Emails automáticos</h1>
          <p className="text-[12px] text-zinc-600 mt-0.5">Se envían solos cuando se agrega un productor nuevo</p>
        </div>
        <button
          onClick={() => setShowNew(true)}
          className="flex items-center gap-2 px-3 py-2 bg-violet-600 hover:bg-violet-500 text-white text-[13px] font-medium rounded-lg transition-all"
        >
          <Plus size={13} />
          Nueva
        </button>
      </div>

      {/* Plantillas rápidas */}
      {DEFAULT_SECUENCIAS.filter(d => !existingNames.has(d.nombre)).length > 0 && (
        <div className="mb-6 bg-violet-500/5 border border-violet-500/15 rounded-xl p-4">
          <p className="text-[11px] font-medium text-violet-400 uppercase tracking-widest mb-3">Plantillas sugeridas</p>
          <div className="space-y-2">
            {DEFAULT_SECUENCIAS.filter(d => !existingNames.has(d.nombre)).map(def => (
              <div key={def.nombre} className="flex items-center justify-between bg-[#111] border border-[#1f1f1f] rounded-lg px-4 py-3">
                <div>
                  <p className="text-[13px] font-medium text-zinc-300">{def.nombre}</p>
                  <p className="text-[11px] text-zinc-600">{def.descripcion}</p>
                </div>
                <button
                  onClick={() => crearDefault(def)}
                  disabled={saving}
                  className="text-[12px] text-violet-400 hover:text-violet-300 flex items-center gap-1 transition-colors"
                >
                  Usar <ChevronRight size={12} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Lista de secuencias */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2].map(i => <div key={i} className="h-20 bg-[#141414] border border-[#1f1f1f] rounded-xl animate-pulse" />)}
        </div>
      ) : secuencias.length === 0 ? (
        <div className="text-center py-16 bg-[#141414] border border-[#1f1f1f] rounded-xl">
          <Zap size={24} className="text-zinc-800 mx-auto mb-3" />
          <p className="text-[13px] text-zinc-600 mb-1">Sin automatizaciones todavía</p>
          <p className="text-[11px] text-zinc-700">Usá las plantillas sugeridas o creá una desde cero</p>
        </div>
      ) : (
        <div className="space-y-3">
          {secuencias.map(sec => (
            <div key={sec.id} className={`bg-[#141414] border rounded-xl p-5 transition-colors ${sec.activo ? 'border-[#1f1f1f]' : 'border-[#181818] opacity-60'}`}>
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="flex items-center gap-2 mb-0.5">
                    <p className="text-[14px] font-medium text-white">{sec.nombre}</p>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-md font-medium ${sec.activo ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/15' : 'bg-zinc-500/10 text-zinc-500 border border-zinc-500/15'}`}>
                      {sec.activo ? 'Activa' : 'Pausada'}
                    </span>
                  </div>
                  {sec.descripcion && <p className="text-[12px] text-zinc-600">{sec.descripcion}</p>}
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => toggleActivo(sec.id, sec.activo)} className="text-zinc-500 hover:text-zinc-300 transition-colors">
                    {sec.activo ? <ToggleRight size={18} className="text-emerald-400" /> : <ToggleLeft size={18} />}
                  </button>
                  <button onClick={() => eliminar(sec.id)} className="text-zinc-700 hover:text-red-400 transition-colors">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
              <div className="space-y-2">
                {(sec.pasos_secuencia ?? []).sort((a, b) => a.orden - b.orden).map((paso, i) => (
                  <div key={i} className="flex items-start gap-3 bg-[#0f0f0f] border border-[#1a1a1a] rounded-lg px-3 py-2.5">
                    <div className="flex items-center gap-1.5 shrink-0 mt-0.5">
                      <Clock size={11} className="text-zinc-600" />
                      <span className="text-[11px] text-zinc-500 font-mono">
                        {paso.delay_dias === 0 ? 'Inmediato' : `+${paso.delay_dias}d`}
                      </span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <Mail size={10} className="text-zinc-600 shrink-0" />
                        <p className="text-[12px] font-medium text-zinc-300 truncate">{paso.titulo}</p>
                      </div>
                      <p className="text-[11px] text-zinc-600 truncate">{paso.mensaje}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal nueva secuencia */}
      {showNew && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#141414] border border-[#2a2a2a] rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-5 border-b border-[#1f1f1f]">
              <h2 className="text-[15px] font-semibold text-white">Nueva automatización</h2>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-[10px] font-medium text-zinc-600 uppercase tracking-widest mb-1.5">Nombre</label>
                <input value={newNombre} onChange={e => setNewNombre(e.target.value)} placeholder="Ej: Seguimiento inicial" className="w-full bg-[#0f0f0f] border border-[#1f1f1f] rounded-lg px-3 py-2 text-[13px] text-white placeholder-zinc-700 focus:outline-none focus:border-violet-500/40" />
              </div>
              <div>
                <label className="block text-[10px] font-medium text-zinc-600 uppercase tracking-widest mb-1.5">Descripción</label>
                <input value={newDesc} onChange={e => setNewDesc(e.target.value)} placeholder="Opcional" className="w-full bg-[#0f0f0f] border border-[#1f1f1f] rounded-lg px-3 py-2 text-[13px] text-white placeholder-zinc-700 focus:outline-none focus:border-violet-500/40" />
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-[10px] font-medium text-zinc-600 uppercase tracking-widest">Pasos</label>
                  <button onClick={() => setNewPasos(p => [...p, { delay_dias: 0, titulo: '', mensaje: '', orden: p.length }])} className="text-[11px] text-violet-400 hover:text-violet-300 flex items-center gap-1">
                    <Plus size={11} /> Agregar paso
                  </button>
                </div>
                <div className="space-y-3">
                  {newPasos.map((paso, i) => (
                    <div key={i} className="bg-[#0f0f0f] border border-[#1f1f1f] rounded-xl p-3 space-y-2">
                      <div className="flex items-center gap-2">
                        <div className="flex-1">
                          <label className="text-[9px] text-zinc-600 uppercase tracking-widest">Días de espera</label>
                          <input type="number" min={0} value={paso.delay_dias} onChange={e => setNewPasos(p => p.map((x, j) => j === i ? { ...x, delay_dias: Number(e.target.value) } : x))} className="w-full bg-[#141414] border border-[#1f1f1f] rounded-lg px-2 py-1.5 text-[12px] text-white focus:outline-none focus:border-violet-500/40 mt-1" />
                        </div>
                        {newPasos.length > 1 && (
                          <button onClick={() => setNewPasos(p => p.filter((_, j) => j !== i))} className="text-zinc-700 hover:text-red-400 mt-4 transition-colors"><Trash2 size={13} /></button>
                        )}
                      </div>
                      <div>
                        <label className="text-[9px] text-zinc-600 uppercase tracking-widest">Asunto</label>
                        <input value={paso.titulo} onChange={e => setNewPasos(p => p.map((x, j) => j === i ? { ...x, titulo: e.target.value } : x))} placeholder="Asunto del email" className="w-full bg-[#141414] border border-[#1f1f1f] rounded-lg px-2 py-1.5 text-[12px] text-white placeholder-zinc-700 focus:outline-none focus:border-violet-500/40 mt-1" />
                      </div>
                      <div>
                        <label className="text-[9px] text-zinc-600 uppercase tracking-widest">Mensaje</label>
                        <textarea value={paso.mensaje} onChange={e => setNewPasos(p => p.map((x, j) => j === i ? { ...x, mensaje: e.target.value } : x))} rows={3} placeholder="Contenido del email..." className="w-full bg-[#141414] border border-[#1f1f1f] rounded-lg px-2 py-1.5 text-[12px] text-zinc-200 placeholder-zinc-700 focus:outline-none focus:border-violet-500/40 resize-none mt-1" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-[#1f1f1f] flex justify-end gap-3">
              <button onClick={() => setShowNew(false)} className="px-4 py-2 text-[13px] text-zinc-400 hover:text-zinc-200 transition-colors">Cancelar</button>
              <button onClick={handleSave} disabled={saving} className="px-4 py-2 bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white text-[13px] font-medium rounded-lg transition-all">
                {saving ? 'Guardando...' : 'Crear automatización'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
