import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

export async function GET(_: Request, { params }: { params: { id: string } }) {
  const [campanaRes, mensajesRes] = await Promise.all([
    supabase.from('campanas').select('*').eq('id', params.id).single(),
    supabase
      .from('mensajes')
      .select('*, productores(nombre, empresa)')
      .eq('campana_id', params.id)
      .order('created_at', { ascending: false }),
  ])

  if (campanaRes.error) return NextResponse.json({ error: campanaRes.error.message }, { status: 404 })

  return NextResponse.json({ campana: campanaRes.data, mensajes: mensajesRes.data ?? [] })
}

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  const { data: campana, error: campanaError } = await supabase
    .from('campanas')
    .select('id, estado')
    .eq('id', params.id)
    .single()

  if (campanaError) return NextResponse.json({ error: campanaError.message }, { status: 404 })
  if (campana.estado !== 'enviada') {
    return NextResponse.json({ error: 'Solo se pueden eliminar campañas enviadas' }, { status: 400 })
  }

  const { error: mensajesError } = await supabase
    .from('mensajes')
    .delete()
    .eq('campana_id', params.id)

  if (mensajesError) return NextResponse.json({ error: mensajesError.message }, { status: 500 })

  const { error } = await supabase
    .from('campanas')
    .delete()
    .eq('id', params.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
