'use client'

import { FormEvent, useEffect, useState } from 'react'
import { Plus, Trash2, Bot, RefreshCw } from 'lucide-react'
import { AutomationRule, Canal, EstadoProductor, RuleAction, RuleTrigger } from '@/lib/types'
import { toast } from 'sonner'

const triggers: RuleTrigger[] = ['mensaje_enviado', 'mensaje_fallido', 'estado_cambiado', 'inactividad_detectada']
const actions: RuleAction[] = ['cambiar_estado', 'crear_borrador']
const estados: EstadoProductor[] = ['prospecto', 'activo', 'inactivo']
const canales: Canal[] = ['whatsapp', 'email']

type RuleForm = {
  nombre: string
  trigger: RuleTrigger
  action: RuleAction
  targetEstado: EstadoProductor
  canal: Canal
  inactiveDays: number
}

const initialForm: RuleForm = {
  nombre: '',
  trigger: 'mensaje_enviado',
  action: 'cambiar_estado',
  targetEstado: 'activo',
  canal: 'whatsapp',
  inactiveDays: 7,
}

export default function ReglasPage() {
  const [rules, setRules] = useState<AutomationRule[]>([])
  const [form, setForm] = useState<RuleForm>(initialForm)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const loadRules = async () => {
    const res = await fetch('/api/reglas')
    const data = await res.json()
    setRules(data)
    setLoading(false)
  }

  useEffect(() => {
    loadRules()
  }, [])

  const onCreate = async (e: FormEvent) => {
    e.preventDefault()
    if (!form.nombre.trim()) {
      toast.error('Necesitas un nombre de regla')
      return
    }
    setSaving(true)
    try {
      const body = {
        nombre: form.nombre,
        trigger: form.trigger,
        action: form.action,
        activa: true,
        conditions: {
          canal: form.trigger.includes('mensaje') ? form.canal : undefined,
          inactiveDays: form.trigger === 'inactividad_detectada' ? form.inactiveDays : undefined,
        },
        actionConfig: {
          targetEstado: form.action === 'cambiar_estado' ? form.targetEstado : undefined,
          canal: form.canal,
        },
      }
      const res = await fetch('/api/reglas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (!res.ok) throw new Error()
      setForm(initialForm)
      toast.success('Regla creada')
      await loadRules()
    } catch {
      toast.error('No se pudo crear la regla')
    } finally {
      setSaving(false)
    }
  }

  const toggleRule = async (rule: AutomationRule) => {
    setRules((prev) => prev.map((item) => (item.id === rule.id ? { ...item, activa: !item.activa } : item)))
    await fetch(`/api/reglas/${rule.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ activa: !rule.activa }),
    })
  }

  const removeRule = async (id: string) => {
    const res = await fetch(`/api/reglas/${id}`, { method: 'DELETE' })
    if (!res.ok) {
      toast.error('No se pudo eliminar')
      return
    }
    setRules((prev) => prev.filter((rule) => rule.id !== id))
  }

  const runInactiveCheck = async () => {
    const res = await fetch('/api/reglas/evaluar-inactividad', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ inactiveDays: form.inactiveDays }),
    })
    if (!res.ok) {
      toast.error('No se pudo ejecutar la evaluacion')
      return
    }
    toast.success('Evaluacion de inactividad ejecutada')
  }

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="flex items-center gap-2 mb-0.5">
            <Bot size={13} className="text-zinc-600" />
            <span className="text-[11px] text-zinc-600 uppercase tracking-widest font-medium">Automation</span>
          </div>
          <h1 className="text-xl font-semibold text-white">Reglas automáticas</h1>
        </div>
        <button
          onClick={runInactiveCheck}
          className="inline-flex items-center gap-2 px-3 py-2 text-[12px] border border-[#2a2a2a] text-zinc-300 hover:text-white rounded-lg transition-colors"
        >
          <RefreshCw size={12} />
          Evaluar inactividad
        </button>
      </div>

      <div className="grid grid-cols-5 gap-5">
        <form onSubmit={onCreate} className="col-span-2 bg-[#141414] border border-[#1f1f1f] rounded-xl p-4 space-y-3">
          <p className="text-[12px] text-zinc-400">Nueva regla</p>
          <input
            value={form.nombre}
            onChange={(e) => setForm((prev) => ({ ...prev, nombre: e.target.value }))}
            placeholder="Nombre de la regla"
            className="w-full bg-[#0f0f0f] border border-[#262626] rounded-lg px-3 py-2 text-[13px] text-zinc-200"
          />
          <select
            value={form.trigger}
            onChange={(e) => setForm((prev) => ({ ...prev, trigger: e.target.value as RuleTrigger }))}
            className="w-full bg-[#0f0f0f] border border-[#262626] rounded-lg px-3 py-2 text-[13px] text-zinc-300"
          >
            {triggers.map((trigger) => <option key={trigger} value={trigger}>{trigger}</option>)}
          </select>
          <select
            value={form.action}
            onChange={(e) => setForm((prev) => ({ ...prev, action: e.target.value as RuleAction }))}
            className="w-full bg-[#0f0f0f] border border-[#262626] rounded-lg px-3 py-2 text-[13px] text-zinc-300"
          >
            {actions.map((action) => <option key={action} value={action}>{action}</option>)}
          </select>

          {form.action === 'cambiar_estado' && (
            <select
              value={form.targetEstado}
              onChange={(e) => setForm((prev) => ({ ...prev, targetEstado: e.target.value as EstadoProductor }))}
              className="w-full bg-[#0f0f0f] border border-[#262626] rounded-lg px-3 py-2 text-[13px] text-zinc-300"
            >
              {estados.map((estado) => <option key={estado} value={estado}>{estado}</option>)}
            </select>
          )}

          <select
            value={form.canal}
            onChange={(e) => setForm((prev) => ({ ...prev, canal: e.target.value as Canal }))}
            className="w-full bg-[#0f0f0f] border border-[#262626] rounded-lg px-3 py-2 text-[13px] text-zinc-300"
          >
            {canales.map((canal) => <option key={canal} value={canal}>{canal}</option>)}
          </select>

          {form.trigger === 'inactividad_detectada' && (
            <input
              type="number"
              min={1}
              value={form.inactiveDays}
              onChange={(e) => setForm((prev) => ({ ...prev, inactiveDays: Number(e.target.value) || 1 }))}
              className="w-full bg-[#0f0f0f] border border-[#262626] rounded-lg px-3 py-2 text-[13px] text-zinc-300"
            />
          )}

          <button
            type="submit"
            disabled={saving}
            className="w-full inline-flex items-center justify-center gap-2 px-3 py-2 bg-violet-600 hover:bg-violet-500 rounded-lg text-[13px] font-medium text-white disabled:opacity-60"
          >
            <Plus size={12} />
            {saving ? 'Guardando...' : 'Crear regla'}
          </button>
        </form>

        <div className="col-span-3 bg-[#141414] border border-[#1f1f1f] rounded-xl overflow-hidden">
          <div className="px-4 py-3 border-b border-[#1a1a1a] text-[12px] text-zinc-500">Reglas activas</div>
          {loading ? (
            <div className="p-4 text-[12px] text-zinc-600">Cargando...</div>
          ) : !rules.length ? (
            <div className="p-6 text-[12px] text-zinc-600">No hay reglas creadas todavía.</div>
          ) : (
            <div className="divide-y divide-[#111]">
              {rules.map((rule) => (
                <div key={rule.id} className="flex items-start justify-between gap-3 px-4 py-3">
                  <div>
                    <p className="text-[13px] text-zinc-200">{rule.nombre}</p>
                    <p className="text-[11px] text-zinc-600 mt-0.5">
                      {rule.trigger}{' -> '}{rule.action}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => toggleRule(rule)}
                      className={`px-2 py-1 rounded text-[10px] border ${rule.activa ? 'border-emerald-500/40 text-emerald-300' : 'border-zinc-700 text-zinc-500'}`}
                    >
                      {rule.activa ? 'Activa' : 'Pausada'}
                    </button>
                    <button onClick={() => removeRule(rule.id)} className="p-1.5 rounded text-zinc-600 hover:text-red-400 hover:bg-red-500/10">
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
