import { NextResponse } from 'next/server'
import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses'
import { supabase } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

const delay = (ms: number) => new Promise(res => setTimeout(res, ms))

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

function sanitizeHtml(html: string): string {
  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<\/?(iframe|object|embed|form|base|meta|link)\b[^>]*>/gi, '')
    .replace(/\s+on\w+="[^"]*"/gi, '')
    .replace(/\s+on\w+='[^']*'/gi, '')
}

function buildEmailHTML(titulo: string, contenido: string): string {
  const safeTitle = escapeHtml(titulo)
  const safeContenido = sanitizeHtml(contenido)
  return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>${safeTitle}</title>
</head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:32px 16px">
<tr><td align="center">
<table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px">

  <!-- Header -->
  <tr><td style="background:#7c3aed;background:linear-gradient(135deg,#8b5cf6,#6d28d9);border-radius:12px 12px 0 0;padding:20px 28px">
    <table cellpadding="0" cellspacing="0">
      <tr>
        <td style="background:rgba(255,255,255,0.15);border-radius:8px;padding:5px 10px">
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
    <h1 style="margin:0 0 20px;font-size:20px;font-weight:700;color:#111827;letter-spacing:-0.3px">${safeTitle}</h1>
    <div style="color:#374151;font-size:14px;line-height:1.7">
      ${safeContenido}
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

function getSESClient() {
  const accessKeyId = process.env.AWS_ACCESS_KEY_ID
  const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY
  const region = process.env.AWS_SES_REGION ?? 'sa-east-1'

  if (!accessKeyId || !secretAccessKey) return null

  return new SESClient({
    region,
    credentials: { accessKeyId, secretAccessKey },
  })
}

export async function POST(request: Request) {
  const ses = getSESClient()
  if (!ses) {
    return NextResponse.json(
      { error: 'Faltan AWS_ACCESS_KEY_ID o AWS_SECRET_ACCESS_KEY en variables de entorno' },
      { status: 500 }
    )
  }

  const fromEmail = process.env.AWS_SES_FROM_EMAIL ?? 'simplepass@simplepass.com.ar'
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
  const textBody = mensaje.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim()

  const results: { productor_id: string; status: string; error?: string }[] = []

  for (const productor of productores ?? []) {
    let status = 'enviado'
    let errorMsg: string | undefined

    if (!productor.email) {
      status = 'fallido'
      errorMsg = 'Sin email'
    } else {
      try {
        await ses.send(new SendEmailCommand({
          Source: fromEmail,
          Destination: { ToAddresses: [productor.email] },
          Message: {
            Subject: { Data: titulo, Charset: 'UTF-8' },
            Body: {
              Html: { Data: htmlBody, Charset: 'UTF-8' },
              Text: { Data: textBody, Charset: 'UTF-8' },
            },
          },
        }))
      } catch (e: unknown) {
        status = 'fallido'
        errorMsg = e instanceof Error ? e.message : 'Error desconocido'
      }
    }

    const { error: insertError } = await supabase.from('mensajes').insert([{
      productor_id: productor.id,
      campana_id: campanaId,
      canal: 'email',
      contenido: mensaje,
      status,
      enviado_at: status === 'enviado' ? new Date().toISOString() : null,
    }])
    if (insertError) console.error(`mensajes insert failed for ${productor.id}:`, insertError.message)

    results.push({ productor_id: productor.id, status, ...(errorMsg ? { error: errorMsg } : {}) })
    await delay(300)
  }

  return NextResponse.json({ campana_id: campanaId, results, warnings: [] })
}
