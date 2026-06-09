import { randomUUID } from 'crypto'
import { supabase } from '@/lib/supabase'
import { AutomationRule, Canal, EstadoProductor, RuleTrigger } from '@/lib/types'

type RuleEvent =
  | { trigger: 'estado_cambiado'; productorId: string; fromEstado?: EstadoProductor; toEstado?: EstadoProductor }
  | { trigger: 'mensaje_enviado' | 'mensaje_fallido'; productorId: string; canal: Canal }
  | { trigger: 'inactividad_detectada'; productorId: string; inactiveDays: number }

const rulesStore = new Map<string, AutomationRule>()

function seedDefaultRules() {
  if (rulesStore.size > 0) return

  const now = new Date().toISOString()
  const defaults: AutomationRule[] = [
    {
      id: randomUUID(),
      nombre: 'Pasar a activo cuando hay envio exitoso',
      activa: true,
      trigger: 'mensaje_enviado',
      conditions: {},
      action: 'cambiar_estado',
      actionConfig: { targetEstado: 'activo' },
      created_at: now,
    },
    {
      id: randomUUID(),
      nombre: 'Crear borrador de seguimiento por fallo',
      activa: true,
      trigger: 'mensaje_fallido',
      conditions: {},
      action: 'crear_borrador',
      actionConfig: {
        titulo: 'Seguimiento por entrega fallida',
        mensaje: 'Hola {{nombre}}, te escribo de nuevo para asegurarme de que recibas la propuesta.',
        canal: 'whatsapp',
      },
      created_at: now,
    },
  ]

  defaults.forEach((rule) => rulesStore.set(rule.id, rule))
}

seedDefaultRules()

export function listRules(): AutomationRule[] {
  return Array.from(rulesStore.values()).sort((a, b) => b.created_at.localeCompare(a.created_at))
}

export function createRule(input: Omit<AutomationRule, 'id' | 'created_at'>): AutomationRule {
  const rule: AutomationRule = {
    ...input,
    id: randomUUID(),
    created_at: new Date().toISOString(),
  }
  rulesStore.set(rule.id, rule)
  return rule
}

export function updateRule(id: string, patch: Partial<Omit<AutomationRule, 'id' | 'created_at'>>): AutomationRule | null {
  const current = rulesStore.get(id)
  if (!current) return null
  const next = { ...current, ...patch }
  rulesStore.set(id, next)
  return next
}

export function deleteRule(id: string): boolean {
  return rulesStore.delete(id)
}

function ruleMatches(event: RuleEvent, rule: AutomationRule): boolean {
  if (!rule.activa || rule.trigger !== event.trigger) return false

  if (event.trigger === 'estado_cambiado') {
    if (rule.conditions.fromEstado && event.fromEstado !== rule.conditions.fromEstado) return false
    if (rule.conditions.toEstado && event.toEstado !== rule.conditions.toEstado) return false
  }

  if ((event.trigger === 'mensaje_enviado' || event.trigger === 'mensaje_fallido') && rule.conditions.canal) {
    if (event.canal !== rule.conditions.canal) return false
  }

  if (event.trigger === 'inactividad_detectada' && rule.conditions.inactiveDays) {
    if (event.inactiveDays < rule.conditions.inactiveDays) return false
  }

  return true
}

async function applyRuleAction(rule: AutomationRule, productorId: string): Promise<void> {
  if (rule.action === 'cambiar_estado' && rule.actionConfig.targetEstado) {
    await supabase
      .from('productores')
      .update({ estado: rule.actionConfig.targetEstado })
      .eq('id', productorId)
    return
  }

  if (rule.action === 'crear_borrador') {
    const { data: productor } = await supabase
      .from('productores')
      .select('nombre')
      .eq('id', productorId)
      .single()

    const nombre = productor?.nombre ?? 'contacto'
    const titulo = rule.actionConfig.titulo ?? 'Seguimiento automatico'
    const body = (rule.actionConfig.mensaje ?? 'Hola {{nombre}}, queria retomar contacto.')
      .replaceAll('{{nombre}}', nombre)

    await supabase.from('campanas').insert([{
      titulo,
      mensaje: body,
      canal: rule.actionConfig.canal ?? 'whatsapp',
      estado: 'borrador',
    }])
  }
}

export async function evaluateRules(event: RuleEvent): Promise<{ executed: string[] }> {
  const matched = listRules().filter((rule) => ruleMatches(event, rule))
  const executed: string[] = []

  for (const rule of matched) {
    await applyRuleAction(rule, event.productorId)
    executed.push(rule.id)
  }

  return { executed }
}
