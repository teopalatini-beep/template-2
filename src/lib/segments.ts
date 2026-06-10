import { Productor, Canal } from '@/lib/types'

export type SegmentField =
  | 'estado'
  | 'pipeline_etapa'
  | 'tipo_evento'
  | 'pais'
  | 'tags'
  | 'valor_estimado'
  | 'canal_preferido'

export type SegmentOperator = 'eq' | 'not_eq' | 'includes' | 'gt' | 'lt' | 'any'

export interface SegmentCondition {
  field: SegmentField
  operator: SegmentOperator
  value: string
}

export interface Segment {
  id: string
  nombre: string
  canal?: Canal
  logic: 'AND' | 'OR'
  conditions: SegmentCondition[]
  created_at: string
}

const STORAGE_KEY = 'crm_segments'

export function loadSegments(): Segment[] {
  if (typeof window === 'undefined') return []
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]') } catch { return [] }
}

export function saveSegments(segments: Segment[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(segments))
}

export const FIELD_LABELS: Record<SegmentField, string> = {
  estado: 'Estado',
  pipeline_etapa: 'Etapa pipeline',
  tipo_evento: 'Tipo de evento',
  pais: 'País',
  tags: 'Tag',
  valor_estimado: 'Valor estimado (USD)',
  canal_preferido: 'Canal',
}

export const OPERATOR_LABELS: Record<SegmentOperator, string> = {
  eq: 'es igual a',
  not_eq: 'no es igual a',
  includes: 'incluye',
  gt: 'mayor que',
  lt: 'menor que',
  any: 'tiene algún valor',
}

export const FIELD_OPTIONS: Partial<Record<SegmentField, string[]>> = {
  estado: ['prospecto', 'activo', 'inactivo'],
  pipeline_etapa: ['nuevo', 'contactado', 'propuesta', 'negociacion', 'cerrado', 'perdido'],
  tipo_evento: ['Recital', 'Fiesta', 'Teatro', 'Corporativo', 'Deportivo', 'Otro'],
  pais: ['Argentina', 'Brasil', 'Chile', 'Uruguay', 'Paraguay', 'Bolivia', 'Perú', 'Colombia', 'México', 'España', 'Otro'],
  canal_preferido: ['whatsapp', 'email'],
}

export const FIELD_OPERATORS: Record<SegmentField, SegmentOperator[]> = {
  estado: ['eq', 'not_eq'],
  pipeline_etapa: ['eq', 'not_eq'],
  tipo_evento: ['eq', 'not_eq'],
  pais: ['eq', 'not_eq'],
  tags: ['includes'],
  valor_estimado: ['gt', 'lt', 'any'],
  canal_preferido: ['eq'],
}

function matchCondition(p: Productor, cond: SegmentCondition): boolean {
  switch (cond.field) {
    case 'estado':
      return cond.operator === 'eq' ? p.estado === cond.value : p.estado !== cond.value
    case 'pipeline_etapa': {
      const etapa = p.pipeline_etapa ?? 'nuevo'
      return cond.operator === 'eq' ? etapa === cond.value : etapa !== cond.value
    }
    case 'tipo_evento':
      return cond.operator === 'eq'
        ? (p.tipo_evento ?? '') === cond.value
        : (p.tipo_evento ?? '') !== cond.value
    case 'pais': {
      const pais = (p as Productor & { pais?: string }).pais ?? ''
      return cond.operator === 'eq' ? pais === cond.value : pais !== cond.value
    }
    case 'tags':
      return (p.tags ?? []).includes(cond.value)
    case 'valor_estimado': {
      const val = p.valor_estimado ?? 0
      if (cond.operator === 'any') return val > 0
      if (cond.operator === 'gt') return val > Number(cond.value)
      if (cond.operator === 'lt') return val < Number(cond.value)
      return false
    }
    case 'canal_preferido':
      if (cond.value === 'whatsapp') return !!p.telefono
      if (cond.value === 'email') return !!p.email
      return false
    default:
      return true
  }
}

export function applySegment(productores: Productor[], segment: Segment): Productor[] {
  if (!segment.conditions.length) return productores
  return productores.filter(p => {
    const results = segment.conditions.map(c => matchCondition(p, c))
    return segment.logic === 'AND' ? results.every(Boolean) : results.some(Boolean)
  })
}
