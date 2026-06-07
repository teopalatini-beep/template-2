import { NextResponse } from 'next/server'
import { Resend } from 'resend'
import { supabase } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

const delay = (ms: number) => new Promise(res => setTimeout(res, ms))

function buildEmailHTML(titulo: string, contenido: string): string {
  return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>${titulo}</title>
</head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:32px 16px">
<tr><td align="center">
<table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px">

  <!-- Header -->
  <tr><td style="background:linear-gradient(135deg,#8b5cf6,#6d28d9);border-radius:12px 12px 0 0;padding:20px 28px">
    <table cellpadding="0" cellspacing="0">
      <tr>
        <td style="background:rgba(255,255,255,0.15);border-radius:8px;padding:5px 10px;margin-right:10px">
          <span style="color:white;font-weight:900;font-size:16px;letter-spacing:-0.5px">S</span>
        </td>
        <td style="padding-left:10px">
          <span style="color:white;font-weight:700;font-size:15px;letter-spacing:-0.2px">SimplePass</span>
        </td>
      </tr>
    </table>
  </td></tr>

  <!-- Body -->
  <tr><td style="background:white;padding:32px 28px 28px;color:#111827;font-size:14px;line-height:1.65">
    <h1 style="margin:0 0 20px;font-size:20px;font-weight:700;color:#111827;letter-spacing:-0.3px">${titulo}</h1>
    <div style="color:#374151;font-size:14px;line-height:1.7">
      ${contenido}
    </div>
  </td></tr>

  <!-- Divider -->
  <tr><td style="background:white;padding:0 28px">
    <hr style="border:none;border-top:1px solid #f3f4f6;margin:0"/>
  </td></tr>

  <!-- Footer -->
  <tr><td style="background:white;border-radius:0 0 12px 12px;padding:16px 28px 20px;text-align:center">
    <p style="margin:0;font-size:11px;color:#9ca3af;line-height:1.5">
      Este mensaje fue enviado desde <strong style="color:#7c3aed">SimplePass CRM</strong>.<br/>
      Si no querés recibir más emails, ignorá este mensaje.
    </p>
  </td></tr>

</table>
</td></tr>
</table>
</body>
</html>`
}

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

  const htmlBody = buildEmailHTML(titulo, mensaje)
  const fromEmail = process.env.RESEND_FROM_EMAIL ?? 'onboarding@resend.dev'
  const results: { productor_id: string; status: string }[] = []

  for (const productor of productores ?? []) {
    let status = 'enviado'

    if (!productor.email) {
      status = 'fallido'
    } else {
      try {
        const { error } = await resend.emails.send({
          from: fromEmail,
          to: productor.email,
          subject: titulo,
          html: htmlBody,
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
