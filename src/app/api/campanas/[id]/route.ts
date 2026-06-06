import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

export async function GET(_: Request, { params }: { params: { id: string } }) {
  const { data: campana, error: campanaError } = await supabase
    .from('campanas')
    .select('*')
    .eq('id', params.id)
    .single()

  if (campanaError) return NextResponse.json({ error: campanaError.message }, { status: 404 })

  const { data: mensajes } = await supabase
    .from('mensajes')
    .select('*')
    .eq('campana_id', params.id)
    .order('enviado_at', { ascending: false })

  const productorIds = [...new Set((mensajes ?? []).map((m: { productor_id: string }) => m.productor_id))]

  let productoresMap: Record<string, { nombre: string; empresa: string | null }> = {}
  if (productorIds.length > 0) {
    const { data: productores } = await supabase
      .from('productores')
      .select('id, nombre, empresa')
      .in('id', productorIds)
    for (const p of productores ?? []) {
      productoresMap[p.id] = { nombre: p.nombre, empresa: p.empresa }
    }
  }

  const mensajesConProductor = (mensajes ?? []).map((m: Record<string, unknown>) => ({
    ...m,
    productores: productoresMap[m.productor_id as string] ?? null,
  }))

  return NextResponse.json({ campana, mensajes: mensajesConProductor })
}
