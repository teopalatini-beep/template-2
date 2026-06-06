import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

export async function GET() {
  const { data, error } = await supabase
    .from('secuencias')
    .select('*, pasos_secuencia(*)')
    .order('created_at', { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data ?? [])
}

export async function POST(request: Request) {
  const { nombre, descripcion, pasos } = await request.json()

  const { data: secuencia, error } = await supabase
    .from('secuencias')
    .insert([{ nombre, descripcion }])
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  if (pasos?.length) {
    const pasosData = pasos.map((p: { delay_dias: number; titulo: string; mensaje: string }, i: number) => ({
      secuencia_id: secuencia.id,
      delay_dias: p.delay_dias,
      titulo: p.titulo,
      mensaje: p.mensaje,
      orden: i,
    }))
    await supabase.from('pasos_secuencia').insert(pasosData)
  }

  return NextResponse.json(secuencia)
}
