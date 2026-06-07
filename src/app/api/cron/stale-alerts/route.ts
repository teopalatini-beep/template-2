import { NextResponse } from 'next/server'
import { Resend } from 'resend'
import { supabase } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

const DIAS_UMBRAL = 7
const ETAPAS_ACTIVAS = ['nuevo', 'contactado', 'propuesta', 'negociacion']

const ETAPA_LABELS: Record<string, string> = {
  nuevo: 'Nuevo',
  contactado: 'Contactado',
  propuesta: 'Propuesta',
  negociacion: 'Negociación',
}

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const alertEmail = process.env.ALERT_EMAIL
  const resendApiKey = process.env.RESEND_API_KEY
  if (!alertEmail) return NextResponse.json({ error: 'Falta ALERT_EMAIL' }, { status: 500 })
  if (!resendApiKey) return NextResponse.json({ error: 'Falta RESEND_API_KEY' }, { status: 500 })

  const { data: productores, error: pError } = await supabase
    .from('productores')
    .select('id, nombre, empresa, pipeline_etapa, created_at')
    .in('pipeline_etapa', ETAPAS_ACTIVAS)

  if (pError) return NextResponse.json({ error: pError.message }, { status: 500 })
  if (!productores?.length) return NextResponse.json({ enviado: false, motivo: 'Sin deals activos' })

  const { data: actividades } = await supabase
    .from('actividades')
    .select('productor_id, created_at')
    .in('productor_id', productores.map(p => p.id))
    .order('created_at', { ascending: false })

  const lastActivity: Record<string, string> = {}
  for (const a of actividades ?? []) {
    if (!lastActivity[a.productor_id]) lastActivity[a.productor_id] = a.created_at
  }

  const ahora = Date.now()

  const stale = productores
    .filter(p => {
      const ref = lastActivity[p.id] ?? p.created_at
      return (ahora - new Date(ref).getTime()) / 86400000 >= DIAS_UMBRAL
    })
    .map(p => {
      const ref = lastActivity[p.id] ?? p.created_at
      const dias = Math.floor((ahora - new Date(ref).getTime()) / 86400000)
      return { ...p, dias }
    })
    .sort((a, b) => b.dias - a.dias)

  if (!stale.length) return NextResponse.json({ enviado: false, motivo: 'Sin deals vencidos' })

  const rows = stale.map(p =>
    `<tr style="border-bottom:1px solid #2a2a2a">
      <td style="padding:10px 14px;color:#e4e4e7;font-size:13px">${p.nombre}</td>
      <td style="padding:10px 14px;color:#71717a;font-size:13px">${p.empresa ?? '—'}</td>
      <td style="padding:10px 14px;font-size:13px">
        <span style="color:#a78bfa;background:#1e1b4b;padding:2px 8px;border-radius:6px;font-size:11px">
          ${ETAPA_LABELS[p.pipeline_etapa] ?? p.pipeline_etapa}
        </span>
      </td>
      <td style="padding:10px 14px;color:#f59e0b;font-size:13px;font-weight:600">${p.dias}d</td>
    </tr>`
  ).join('')

  const html = `
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"></head>
    <body style="margin:0;padding:0;background:#0a0a0a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif">
      <div style="max-width:560px;margin:40px auto;background:#141414;border:1px solid #2a2a2a;border-radius:16px;overflow:hidden">
        <div style="padding:24px 28px;border-bottom:1px solid #1f1f1f">
          <p style="margin:0 0 4px;font-size:11px;color:#a78bfa;text-transform:uppercase;letter-spacing:.08em;font-weight:600">Pipeline · Alerta</p>
          <h1 style="margin:0;font-size:20px;color:#fff;font-weight:600">
            ${stale.length} deal${stale.length > 1 ? 's' : ''} sin actividad
          </h1>
          <p style="margin:8px 0 0;font-size:13px;color:#71717a">
            ${stale.length > 1 ? 'Estos deals llevan' : 'Este deal lleva'} más de ${DIAS_UMBRAL} días sin contacto.
          </p>
        </div>
        <table style="width:100%;border-collapse:collapse">
          <thead>
            <tr style="background:#0f0f0f;border-bottom:1px solid #2a2a2a">
              <th style="padding:8px 14px;text-align:left;font-size:10px;color:#52525b;text-transform:uppercase;letter-spacing:.06em;font-weight:500">Productor</th>
              <th style="padding:8px 14px;text-align:left;font-size:10px;color:#52525b;text-transform:uppercase;letter-spacing:.06em;font-weight:500">Empresa</th>
              <th style="padding:8px 14px;text-align:left;font-size:10px;color:#52525b;text-transform:uppercase;letter-spacing:.06em;font-weight:500">Etapa</th>
              <th style="padding:8px 14px;text-align:left;font-size:10px;color:#52525b;text-transform:uppercase;letter-spacing:.06em;font-weight:500">Sin contacto</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
        <div style="padding:20px 28px;border-top:1px solid #1f1f1f;text-align:center">
          <a href="${process.env.NEXT_PUBLIC_APP_URL ?? ''}/pipeline"
             style="display:inline-block;padding:10px 24px;background:#7c3aed;color:#fff;text-decoration:none;border-radius:8px;font-size:13px;font-weight:500">
            Ver pipeline →
          </a>
        </div>
        <div style="padding:16px 28px;border-top:1px solid #1f1f1f">
          <p style="margin:0;font-size:11px;color:#3f3f46;text-align:center">
            CRM Productora · Alerta diaria automática
          </p>
        </div>
      </div>
    </body>
    </html>
  `

  const resend = new Resend(resendApiKey)
  const fromEmail = process.env.RESEND_FROM_EMAIL ?? 'onboarding@resend.dev'

  const { error: sendError } = await resend.emails.send({
    from: fromEmail,
    to: alertEmail,
    subject: `⚠️ ${stale.length} deal${stale.length > 1 ? 's' : ''} sin actividad en el pipeline`,
    html,
  })

  if (sendError) return NextResponse.json({ error: sendError.message }, { status: 500 })

  return NextResponse.json({ enviado: true, deals: stale.length })
}
