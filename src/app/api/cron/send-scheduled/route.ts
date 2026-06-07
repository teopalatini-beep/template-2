import { NextResponse } from 'next/server'
import { Resend } from 'resend'
import { supabase } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const resendApiKey = process.env.RESEND_API_KEY
  if (!resendApiKey) return NextResponse.json({ error: 'Falta RESEND_API_KEY' }, { status: 500 })
  const resend = new Resend(resendApiKey)

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
      const fromEmail = process.env.RESEND_FROM_EMAIL ?? 'onboarding@resend.dev'
      const { error: sendError } = await resend.emails.send({
        from: fromEmail,
        to: email,
        subject: titulo,
        text: mensaje,
      })

      if (sendError) throw new Error(sendError.message)

      await supabase.from('email_jobs').update({
        estado: 'enviado',
        enviado_at: new Date().toISOString(),
      }).eq('id', job.id)
      enviados++
    } catch {
      await supabase.from('email_jobs').update({ estado: 'fallido' }).eq('id', job.id)
      fallidos++
    }
  }

  return NextResponse.json({ enviados, fallidos, total: (jobs ?? []).length })
}
