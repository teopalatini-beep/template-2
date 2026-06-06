import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

export async function GET() {
  const { data, error } = await supabase
    .from('productores')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(request: Request) {
  const body = await request.json()

  const { data, error } = await supabase
    .from('productores')
    .insert([{
      nombre: body.nombre,
      empresa: body.empresa || null,
      telefono: body.telefono || null,
      email: body.email || null,
      tipo_evento: body.tipo_evento || null,
      estado: body.estado || 'prospecto',
      notas: body.notas || null,
    }])
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Schedule automated email sequences for new producer
  if (data.email) {
    const { data: secuencias } = await supabase
      .from('secuencias')
      .select('*, pasos_secuencia(*)')
      .eq('activo', true)

    const jobs = []
    for (const sec of secuencias ?? []) {
      for (const paso of sec.pasos_secuencia ?? []) {
        const fechaProgramada = new Date()
        fechaProgramada.setDate(fechaProgramada.getDate() + paso.delay_dias)
        jobs.push({
          productor_id: data.id,
          paso_id: paso.id,
          fecha_programada: fechaProgramada.toISOString(),
          estado: 'pendiente',
        })
      }
    }
    if (jobs.length > 0) await supabase.from('email_jobs').insert(jobs)
  }

  return NextResponse.json(data, { status: 201 })
}
