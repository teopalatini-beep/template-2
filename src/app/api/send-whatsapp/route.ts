import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { evaluateRules } from '@/lib/automation'

export const dynamic = 'force-dynamic'

const delay = (ms: number) => new Promise(res => setTimeout(res, ms))

export async function POST(request: Request) {
  const { campana_id, titulo, mensaje, productor_ids, ab_test, mensaje_a, mensaje_b } = await request.json()
  const varianteA = (mensaje_a || mensaje || '').trim()
  const varianteB = (mensaje_b || mensaje || '').trim()
  const usaAB = Boolean(ab_test && varianteA && varianteB && varianteA !== varianteB)
  const campaignBody = usaAB
    ? `A/B Test\n\n[A]\n${varianteA}\n\n[B]\n${varianteB}`
    : mensaje

  const { data: productores, error: prodError } = await supabase
    .from('productores')
    .select('id, nombre, telefono')
    .in('id', productor_ids)

  if (prodError) return NextResponse.json({ error: prodError.message }, { status: 500 })

  let campanaId = campana_id
  if (!campanaId) {
    const { data: campana, error: campError } = await supabase
      .from('campanas')
      .insert([{ titulo, mensaje: campaignBody, canal: 'whatsapp', estado: 'enviada', fecha_envio: new Date().toISOString() }])
      .select()
      .single()

    if (campError) return NextResponse.json({ error: campError.message }, { status: 500 })
    campanaId = campana.id
  } else {
    await supabase
      .from('campanas')
      .update({ estado: 'enviada', fecha_envio: new Date().toISOString() })
      .eq('id', campanaId)
  }

  const results: { productor_id: string; status: string }[] = []

  for (const [index, productor] of (productores ?? []).entries()) {
    let status = 'enviado'
    const variant = usaAB ? (index % 2 === 0 ? 'A' : 'B') : null
    const outboundMessage = variant === 'B' ? varianteB : varianteA

    try {
      const res = await fetch(
        `https://graph.facebook.com/v18.0/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            messaging_product: 'whatsapp',
            to: productor.telefono,
            type: 'text',
            text: { body: outboundMessage },
          }),
        }
      )

      if (!res.ok) status = 'fallido'
    } catch {
      status = 'fallido'
    }

    await supabase.from('mensajes').insert([{
      productor_id: productor.id,
      campana_id: campanaId,
      canal: 'whatsapp',
      contenido: variant ? `[${variant}] ${outboundMessage}` : outboundMessage,
      status,
      enviado_at: status === 'enviado' ? new Date().toISOString() : null,
    }])

    results.push({ productor_id: productor.id, status })
    await evaluateRules({
      trigger: status === 'enviado' ? 'mensaje_enviado' : 'mensaje_fallido',
      productorId: productor.id,
      canal: 'whatsapp',
    })
    await delay(500)
  }

  return NextResponse.json({ campana_id: campanaId, results, ab_test: usaAB })
}
