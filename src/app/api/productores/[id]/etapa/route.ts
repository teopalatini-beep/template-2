import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

const ETAPAS_VALIDAS = ['nuevo', 'contactado', 'propuesta', 'negociacion', 'cerrado', 'perdido']

export async function POST(request: Request, { params }: { params: { id: string } }) {
  const { pipeline_etapa } = await request.json()

  if (!ETAPAS_VALIDAS.includes(pipeline_etapa)) {
    return NextResponse.json({ error: `Etapa inválida: ${pipeline_etapa}` }, { status: 400 })
  }

  const { error } = await supabase
    .from('productores')
    .update({ pipeline_etapa })
    .eq('id', params.id)

  if (error) {
    return NextResponse.json(
      { error: error.message, code: error.code, hint: error.hint },
      { status: 500 }
    )
  }

  return NextResponse.json({ success: true })
}
