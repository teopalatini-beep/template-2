import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const productorId = searchParams.get('productor_id')

  let query = supabase
    .from('mensajes')
    .select('*, campanas(titulo)')
    .order('created_at', { ascending: false })

  if (productorId) {
    query = query.eq('productor_id', productorId)
  }

  const { data, error } = await query

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
