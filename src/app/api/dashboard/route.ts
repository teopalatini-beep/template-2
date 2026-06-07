import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

const ETAPAS_ACTIVAS = ['nuevo', 'contactado', 'propuesta', 'negociacion']
const DIAS_STALE = 7

export async function GET() {
  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()

  const [
    totalProductores,
    campanasEsteMes,
    totalMensajes,
    ultimasCampanas,
    pipelineActivo,
    ultimasActividades,
  ] = await Promise.all([
    supabase.from('productores').select('*', { count: 'exact', head: true }),
    supabase.from('campanas').select('*', { count: 'exact', head: true }).eq('estado', 'enviada').gte('fecha_envio', startOfMonth),
    supabase.from('mensajes').select('*', { count: 'exact', head: true }),
    supabase.from('campanas').select('*').eq('estado', 'enviada').order('fecha_envio', { ascending: false }).limit(5),
    supabase.from('productores').select('id, pipeline_etapa, valor_estimado').in('pipeline_etapa', ETAPAS_ACTIVAS),
    supabase.from('actividades').select('id, tipo, descripcion, created_at, productor_id, productores(nombre)').order('created_at', { ascending: false }).limit(8),
  ])

  // Pipeline stats
  const deals = pipelineActivo.data ?? []
  const valorPipeline = deals.reduce((sum, p) => sum + (p.valor_estimado ?? 0), 0)
  const dealsPorEtapa = ETAPAS_ACTIVAS.reduce((acc, etapa) => {
    acc[etapa] = deals.filter(p => p.pipeline_etapa === etapa).length
    return acc
  }, {} as Record<string, number>)

  // Stale count (no activity in 7+ days)
  const productorIds = deals.map(p => p.id)
  let dealsVencidos = 0
  if (productorIds.length > 0) {
    const { data: actividades } = await supabase
      .from('actividades')
      .select('productor_id, created_at')
      .in('productor_id', productorIds)
      .order('created_at', { ascending: false })

    const lastActivity: Record<string, string> = {}
    for (const a of actividades ?? []) {
      if (!lastActivity[a.productor_id]) lastActivity[a.productor_id] = a.created_at
    }

    const umbralMs = DIAS_STALE * 86400000
    dealsVencidos = deals.filter(p => {
      const ref = lastActivity[p.id]
      if (!ref) return true
      return Date.now() - new Date(ref).getTime() >= umbralMs
    }).length
  }

  return NextResponse.json({
    totalProductores: totalProductores.count ?? 0,
    campanasEsteMes: campanasEsteMes.count ?? 0,
    totalMensajes: totalMensajes.count ?? 0,
    ultimasCampanas: ultimasCampanas.data ?? [],
    pipeline: {
      total: deals.length,
      valorTotal: valorPipeline,
      porEtapa: dealsPorEtapa,
      dealsVencidos,
    },
    ultimasActividades: ultimasActividades.data ?? [],
  })
}
