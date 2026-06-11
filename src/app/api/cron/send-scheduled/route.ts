import { NextResponse } from 'next/server'
import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses'
import { supabase } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const accessKeyId = process.env.AWS_ACCESS_KEY_ID
  const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY
  if (!accessKeyId || !secretAccessKey) {
    return NextResponse.json({ error: 'Faltan credenciales AWS SES' }, { status: 500 })
  }

  const ses = new SESClient({
    region: process.env.AWS_SES_REGION ?? 'sa-east-1',
    credentials: { accessKeyId, secretAccessKey },
  })
  const fromEmail = process.env.AWS_SES_FROM_EMAIL ?? 'simplepass@simplepass.com.ar'

  const now = new Date().toISOString()
  const { data: jobs, error } = await supabase
    .from('email_jobs')
    .select('*, pasos_secuencia(titulo, mensaje), productores(nombre, email)')
    .eq('estado', 'pendiente')
    .lte('fecha_programada', now)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  let enviados = 0
  let fallidos = 0

  for (const job of jobs ?? []) {
    const email = job.productores?.email
    const titulo = job.pasos_secuencia?.titulo
    const mensaje = job.pasos_secuencia?.mensaje

    if (!email || !titulo || !mensaje) {
      await supabase.from('email_jobs').update({ estado: 'cancelado' }).eq('id', job.id)
      continue
    }

    try {
      await ses.send(new SendEmailCommand({
        Source: fromEmail,
        Destination: { ToAddresses: [email] },
        Message: {
          Subject: { Data: titulo, Charset: 'UTF-8' },
          Body: { Text: { Data: mensaje, Charset: 'UTF-8' } },
        },
      }))

      await supabase.from('email_jobs').update({
        estado: 'enviado',
        enviado_at: new Date().toISOString(),
      }).eq('id', job.id)
      enviados++
    } catch (e: unknown) {
      console.error('send-scheduled error:', e instanceof Error ? e.message : e)
      await supabase.from('email_jobs').update({ estado: 'fallido' }).eq('id', job.id)
      fallidos++
    }
  }

  return NextResponse.json({ enviados, fallidos, total: (jobs ?? []).length })
}
