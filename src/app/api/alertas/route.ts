import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

const DIAS_UMBRAL = 7
const ETAPAS_ACTIVAS = ['nuevo', 'contactado', 'propuesta', 'negociacion']

export async function GET() {
  // Producers in active pipeline stages
  const { data: productores, error: pError } = await supabase
    .from('productores')
    .select('id, nombre, empresa, pipeline_etapa, created_at')
    .in('pipeline_etapa', ETAPAS_ACTIVAS)

  if (pError) return NextResponse.json({ error: pError.message }, { status: 500 })
  if (!productores?.length) return NextResponse.json([])

  // Latest activity per producer
  const { data: actividades } = await supabase
    .from('actividades')
    .select('productor_id, created_at')
    .in('productor_id', productores.map(p => p.id))
    .order('created_at', { ascending: false })

  // Build map: productor_id -> last activity date
  const lastActivity: Record<string, string> = {}
  for (const a of actividades ?? []) {
    if (!lastActivity[a.productor_id]) lastActivity[a.productor_id] = a.created_at
  }

  const ahora = Date.now()
  const umbralMs = DIAS_UMBRAL * 86400000

  const stale = productores.filter(p => {
    const ultimaActividad = lastActivity[p.id]
    const referencia = ultimaActividad ?? p.created_at
    const diasSinContacto = (ahora - new Date(referencia).getTime()) / 86400000
    return diasSinContacto >= DIAS_UMBRAL
  }).map(p => {
    const ultimaActividad = lastActivity[p.id]
    const referencia = ultimaActividad ?? p.created_at
    const dias = Math.floor((ahora - new Date(referencia).getTime()) / 86400000)
    return {
      id: p.id,
      nombre: p.nombre,
      empresa: p.empresa,
      pipeline_etapa: p.pipeline_etapa,
      dias_sin_actividad: dias,
      tiene_actividad: !!ultimaActividad,
    }
  }).sort((a, b) => b.dias_sin_actividad - a.dias_sin_actividad)

  return NextResponse.json(stale)
}
