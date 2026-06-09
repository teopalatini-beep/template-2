import { NextResponse } from 'next/server'
import { Resend } from 'resend'
import { supabase } from '@/lib/supabase'
import { evaluateRules } from '@/lib/automation'

export const dynamic = 'force-dynamic'

const delay = (ms: number) => new Promise(res => setTimeout(res, ms))

export async function POST(request: Request) {
  const resendApiKey = process.env.RESEND_API_KEY
  if (!resendApiKey) {
    return NextResponse.json(
      { error: 'Falta RESEND_API_KEY en variables de entorno' },
      { status: 500 }
    )
  }
  const resend = new Resend(resendApiKey)

  const { campana_id, titulo, mensaje, productor_ids, ab_test, mensaje_a, mensaje_b } = await request.json()
  const varianteA = (mensaje_a || mensaje || '').trim()
  const varianteB = (mensaje_b || mensaje || '').trim()
  const usaAB = Boolean(ab_test && varianteA && varianteB && varianteA !== varianteB)
  const campaignBody = usaAB
    ? `A/B Test\n\n[A]\n${varianteA}\n\n[B]\n${varianteB}`
    : mensaje

  const { data: productores, error: prodError } = await supabase
    .from('productores')
    .select('id, nombre, email')
    .in('id', productor_ids)

  if (prodError) return NextResponse.json({ error: prodError.message }, { status: 500 })

  let campanaId = campana_id
  if (!campanaId) {
    const { data: campana, error: campError } = await supabase
      .from('campanas')
      .insert([{ titulo, mensaje: campaignBody, canal: 'email', estado: 'enviada', fecha_envio: new Date().toISOString() }])
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

    if (!productor.email) {
      status = 'fallido'
    } else {
      try {
        const { error } = await resend.emails.send({
          from: 'contacto@ticketera.com.ar',
          to: productor.email,
          subject: titulo,
          text: outboundMessage,
        })
        if (error) status = 'fallido'
      } catch {
        status = 'fallido'
      }
    }

    await supabase.from('mensajes').insert([{
      productor_id: productor.id,
      campana_id: campanaId,
      canal: 'email',
      contenido: variant ? `[${variant}] ${outboundMessage}` : outboundMessage,
      status,
      enviado_at: status === 'enviado' ? new Date().toISOString() : null,
    }])

    results.push({ productor_id: productor.id, status })
    await evaluateRules({
      trigger: status === 'enviado' ? 'mensaje_enviado' : 'mensaje_fallido',
      productorId: productor.id,
      canal: 'email',
    })
    await delay(500)
  }

  return NextResponse.json({ campana_id: campanaId, results, ab_test: usaAB })
}
