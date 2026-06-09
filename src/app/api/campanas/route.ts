import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

export async function GET() {
  const { data, error } = await supabase
    .from('campanas')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
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
