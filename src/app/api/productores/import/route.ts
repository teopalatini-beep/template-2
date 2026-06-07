import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  const { rows } = await request.json()
  if (!Array.isArray(rows) || rows.length === 0) {
    return NextResponse.json({ error: 'Sin datos para importar' }, { status: 400 })
  }

  const records = rows.map((r: Record<string, string>) => ({
    nombre: r.nombre?.trim() || 'Sin nombre',
    empresa: r.empresa?.trim() || null,
    email: r.email?.trim() || null,
    telefono: r.telefono?.trim() || null,
    tipo_evento: r.tipo_evento?.trim() || null,
    pais: r.pais?.trim() || null,
    estado: ['prospecto', 'activo', 'inactivo'].includes(r.estado) ? r.estado : 'prospecto',
    notas: r.notas?.trim() || null,
    tags: r.tags ? r.tags.split(';').map((t: string) => t.trim()).filter(Boolean) : [],
  }))

  const { data, error } = await supabase.from('productores').insert(records).select()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ insertados: data?.length ?? 0 })
}
