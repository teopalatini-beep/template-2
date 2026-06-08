import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export async function GET(_: Request, { params }: { params: { id: string } }) {
  if (!UUID_RE.test(params.id)) {
    return NextResponse.json({ error: `ID de campaña inválido: "${params.id}"` }, { status: 400 })
  }

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

  const productorIds = Array.from(
    new Set((mensajes ?? []).map((m: { productor_id: string }) => m.productor_id))
  ).filter(id => UUID_RE.test(id))

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
