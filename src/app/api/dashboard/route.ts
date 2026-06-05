import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

export async function GET() {
  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()

  const [totalProductores, campanasEstesMes, totalMensajes, ultimasCampanas] = await Promise.all([
    supabase.from('productores').select('*', { count: 'exact', head: true }),
    supabase
      .from('campanas')
      .select('*', { count: 'exact', head: true })
      .eq('estado', 'enviada')
      .gte('fecha_envio', startOfMonth),
    supabase.from('mensajes').select('*', { count: 'exact', head: true }),
    supabase
      .from('campanas')
      .select('*')
      .eq('estado', 'enviada')
      .order('fecha_envio', { ascending: false })
      .limit(5),
  ])

  return NextResponse.json({
    totalProductores: totalProductores.count ?? 0,
    campanasEsteMes: campanasEstesMes.count ?? 0,
    totalMensajes: totalMensajes.count ?? 0,
    ultimasCampanas: ultimasCampanas.data ?? [],
  })
}
