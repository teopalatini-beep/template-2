import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

const DIAS_UMBRAL = 7
const ETAPAS_ACTIVAS = ['nuevo', 'contactado', 'propuesta', 'negociacion']

export async function GET() {
  const { data: productores, error: pError } = await supabase
    .from('productores')
    .select('id, nombre, empresa, pipeline_etapa, created_at, valor_estimado, asignado_a')
    .in('pipeline_etapa', ETAPAS_ACTIVAS)

  if (pError) return NextResponse.json({ error: pError.message }, { status: 500 })
  if (!productores?.length) return NextResponse.json([])

  const { data: actividades } = await supabase
    .from('actividades')
    .select('productor_id, created_at')
    .in('productor_id', productores.map(p => p.id))
    .order('created_at', { ascending: false })

  const lastActivity: Record<string, string> = {}
  for (const a of actividades ?? []) {
    if (!lastActivity[a.productor_id]) lastActivity[a.productor_id] = a.created_at
  }

  const ahora = Date.now()

  const stale = productores
    .filter(p => {
      const ref = lastActivity[p.id] ?? p.created_at
      return (ahora - new Date(ref).getTime()) / 86400000 >= DIAS_UMBRAL
    })
    .map(p => {
      const ref = lastActivity[p.id] ?? p.created_at
      const dias = Math.floor((ahora - new Date(ref).getTime()) / 86400000)
      return {
        id: p.id,
        nombre: p.nombre,
        empresa: p.empresa,
        pipeline_etapa: p.pipeline_etapa,
        valor_estimado: p.valor_estimado,
        asignado_a: p.asignado_a,
        dias_sin_actividad: dias,
        tiene_actividad: !!lastActivity[p.id],
      }
    })
    .sort((a, b) => b.dias_sin_actividad - a.dias_sin_actividad)

  return NextResponse.json(stale)
}
