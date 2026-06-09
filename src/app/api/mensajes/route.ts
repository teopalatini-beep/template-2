import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { evaluateRules } from '@/lib/automation'
import { Canal } from '@/lib/types'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const productorId = searchParams.get('productor_id')

  let query = supabase
    .from('mensajes')
    .select('*, campanas(titulo)')
    .order('created_at', { ascending: false })

  if (productorId) {
    query = query.eq('productor_id', productorId)
  }

  const { data, error } = await query

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(request: Request) {
  const body = await request.json()

  const { data, error } = await supabase
    .from('mensajes')
    .insert([{
      productor_id: body.productor_id,
      campana_id: body.campana_id ?? null,
      canal: body.canal,
      contenido: body.contenido ?? null,
      status: body.status ?? 'pendiente',
      enviado_at: body.status === 'enviado' ? new Date().toISOString() : null,
    }])
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  if (body.status === 'enviado' || body.status === 'fallido') {
    await evaluateRules({
      trigger: body.status === 'enviado' ? 'mensaje_enviado' : 'mensaje_fallido',
      productorId: body.productor_id,
      canal: (body.canal ?? 'whatsapp') as Canal,
    })
  }

  return NextResponse.json(data, { status: 201 })
}
