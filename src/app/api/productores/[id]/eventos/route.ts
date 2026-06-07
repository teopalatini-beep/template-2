import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

export async function GET(_: Request, { params }: { params: { id: string } }) {
  const { data, error } = await supabase
    .from('eventos')
    .select('*')
    .eq('productor_id', params.id)
    .order('fecha_evento', { ascending: true, nullsFirst: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data ?? [])
}

export async function POST(request: Request, { params }: { params: { id: string } }) {
  const body = await request.json()

  const { data, error } = await supabase
    .from('eventos')
    .insert({
      productor_id: params.id,
      nombre: body.nombre,
      lugar: body.lugar || null,
      fecha_evento: body.fecha_evento || null,
      estado: body.estado ?? 'pre_evento',
      notas: body.notas || null,
      capacidad: body.capacidad ? Number(body.capacidad) : null,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}
