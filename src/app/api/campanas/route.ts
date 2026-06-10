import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

export async function GET() {
  const { data, error } = await supabase
    .from('campanas')
    .select('*, mensajes(status, respondio)')
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const enriched = (data ?? []).map(c => {
    const msgs: { status: string; respondio: boolean | null }[] = c.mensajes ?? []
    const total = msgs.length
    const enviados = msgs.filter(m => m.status === 'enviado').length
    const respondidos = msgs.filter(m => m.respondio).length
    const { mensajes: _msgs, ...rest } = c
    return {
      ...rest,
      stats: {
        total,
        enviados,
        respondidos,
        deliveryRate: total > 0 ? Math.round((enviados / total) * 100) : null,
        responseRate: enviados > 0 ? Math.round((respondidos / enviados) * 100) : null,
      },
    }
  })

  return NextResponse.json(enriched)
}

export async function POST(request: Request) {
  const body = await request.json()
  const tieneAB = Boolean(body.ab_test && body.mensaje_a && body.mensaje_b)
  const mensaje = tieneAB
    ? `A/B Test\n\n[A]\n${body.mensaje_a}\n\n[B]\n${body.mensaje_b}`
    : body.mensaje

  const { data, error } = await supabase
    .from('campanas')
    .insert([{
      titulo: body.titulo,
      mensaje,
      canal: body.canal,
      estado: 'borrador',
    }])
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}
