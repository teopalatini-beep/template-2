import { NextResponse } from 'next/server'
import { Resend } from 'resend'
import { supabase } from '@/lib/supabase'

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

  const { campana_id, titulo, mensaje, productor_ids } = await request.json()

  const { data: productores, error: prodError } = await supabase
    .from('productores')
    .select('id, nombre, email')
    .in('id', productor_ids)

  if (prodError) return NextResponse.json({ error: prodError.message }, { status: 500 })

  let campanaId = campana_id
  if (!campanaId) {
    const { data: campana, error: campError } = await supabase
      .from('campanas')
      .insert([{ titulo, mensaje, canal: 'email', estado: 'enviada', fecha_envio: new Date().toISOString() }])
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

  for (const productor of productores ?? []) {
    let status = 'enviado'

    if (!productor.email) {
      status = 'fallido'
    } else {
      try {
        const fromEmail = process.env.RESEND_FROM_EMAIL ?? 'onboarding@resend.dev'
        const { error } = await resend.emails.send({
          from: fromEmail,
          to: productor.email,
          subject: titulo,
          text: mensaje,
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
      contenido: mensaje,
      status,
      enviado_at: status === 'enviado' ? new Date().toISOString() : null,
    }])

    results.push({ productor_id: productor.id, status })
    await delay(500)
  }

  return NextResponse.json({ campana_id: campanaId, results })
}
