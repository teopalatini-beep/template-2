export type EstadoProductor = 'prospecto' | 'activo' | 'inactivo'
export type PipelineEtapa = 'nuevo' | 'contactado' | 'propuesta' | 'negociacion' | 'cerrado' | 'perdido'

export interface Productor {
  id: string
  nombre: string
  empresa: string | null
  telefono: string | null
  email: string | null
  tipo_evento: string | null
  estado: EstadoProductor
  notas: string | null
  created_at: string
  pipeline_etapa?: PipelineEtapa | null
  tags?: string[] | null
  valor_estimado?: number | null
  pais?: string | null
  campos_personalizados?: Record<string, string> | null
  asignado_a?: string | null
}

export type EstadoCampana = 'borrador' | 'enviada' | 'fallida'
export type Canal = 'whatsapp' | 'email'

export interface CampanaStats {
  total: number
  enviados: number
  respondidos: number
  deliveryRate: number | null
  responseRate: number | null
}

export interface Campana {
  id: string
  titulo: string
  mensaje: string
  canal: Canal
  estado: EstadoCampana
  fecha_envio: string | null
  created_at: string
  stats?: CampanaStats
}

export type EstadoMensaje = 'pendiente' | 'enviado' | 'fallido'

export interface Mensaje {
  id: string
  productor_id: string
  campana_id: string | null
  canal: Canal
  contenido: string | null
  status: EstadoMensaje
  enviado_at: string | null
  created_at: string
  respondio?: boolean | null
  nota_respuesta?: string | null
  productores?: Productor
  campanas?: Campana
}

export interface CopilotSuggestion {
  action: 'recontactar' | 'agendar' | 'pausar' | 'escalar'
  priority: 'alta' | 'media' | 'baja'
  reason: string
  suggestedMessage: string
}

export type RuleTrigger = 'mensaje_enviado' | 'mensaje_fallido' | 'estado_cambiado' | 'inactividad_detectada'
export type RuleAction = 'cambiar_estado' | 'crear_borrador'

export interface AutomationRule {
  id: string
  nombre: string
  activa: boolean
  trigger: RuleTrigger
  conditions: {
    fromEstado?: EstadoProductor
    toEstado?: EstadoProductor
    canal?: Canal
    inactiveDays?: number
  }
  action: RuleAction
  actionConfig: {
    targetEstado?: EstadoProductor
    titulo?: string
    mensaje?: string
    canal?: Canal
  }
  created_at: string
}

export type EstadoCliente = 'lead' | 'activo' | 'pausado'

export interface Cliente {
  id: string
  nombre: string
  empresa: string | null
  email: string | null
  telefono: string | null
  estado: EstadoCliente
  created_at: string
}

export type EstadoProyecto = 'pre_evento' | 'evento' | 'conclusion'

export interface Proyecto {
  id: string
  cliente_id: string
  nombre: string
  servicio: string
  estado: EstadoProyecto
  fecha_evento: string | null
  created_at: string
}
