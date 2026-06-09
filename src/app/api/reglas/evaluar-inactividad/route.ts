import { NextResponse } from 'next/server'
import { evaluateRules } from '@/lib/automation'
import { supabase } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}))
  const inactiveDays = Number(body.inactiveDays ?? 7)
  const cutoff = Date.now() - inactiveDays * 24 * 60 * 60 * 1000

  const { data: productores, error } = await supabase
    .from('productores')
    .select('id, created_at')

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const executedByProductor: Record<string, string[]> = {}

  for (const productor of productores ?? []) {
    const { data: mensaje } = await supabase
      .from('mensajes')
      .select('created_at')
      .eq('productor_id', productor.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    const lastActivity = mensaje?.created_at ?? productor.created_at
    if (!lastActivity) continue

    if (new Date(lastActivity).getTime() < cutoff) {
      const result = await evaluateRules({
        trigger: 'inactividad_detectada',
        productorId: productor.id,
        inactiveDays,
      })
      executedByProductor[productor.id] = result.executed
    }
  }

  return NextResponse.json({ success: true, inactiveDays, executedByProductor })
}
