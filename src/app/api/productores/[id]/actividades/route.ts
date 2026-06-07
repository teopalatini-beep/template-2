import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

export async function GET(_: Request, { params }: { params: { id: string } }) {
  const { data, error } = await supabase
    .from('actividades')
    .select('*')
    .eq('productor_id', params.id)
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data ?? [])
}

export async function POST(request: Request, { params }: { params: { id: string } }) {
  const body = await request.json()

  const { data, error } = await supabase
    .from('actividades')
    .insert({ productor_id: params.id, tipo: body.tipo, descripcion: body.descripcion })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}
