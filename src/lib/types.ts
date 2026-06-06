export type EstadoProductor = 'prospecto' | 'activo' | 'inactivo'

export interface Productor {
  id: string
  nombre: string
  empresa: string | null
  telefono: string | null
  email: string | null
  tipo_evento: string | null
  estado: EstadoProductor
  notas: string | null
  pais: string | null
  tags: string[]
  created_at: string
}

export type EstadoCampana = 'borrador' | 'enviada' | 'fallida'
export type Canal = 'whatsapp' | 'email'

export interface Campana {
  id: string
  titulo: string
  mensaje: string
  canal: Canal
  estado: EstadoCampana
  fecha_envio: string | null
  created_at: string
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
  productores?: Productor
  campanas?: Campana
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
