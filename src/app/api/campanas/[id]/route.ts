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
