import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const metrica = searchParams.get('metrica')

  if (metrica === 'productores_por_estado') {
    const { data } = await supabase.from('productores').select('estado')
    const counts: Record<string, number> = {}
    for (const r of data ?? []) counts[r.estado] = (counts[r.estado] ?? 0) + 1
    const colores: Record<string, string> = { prospecto: '#f59e0b', activo: '#10b981', inactivo: '#71717a' }
    return NextResponse.json(Object.entries(counts).map(([label, value]) => ({ label, value, color: colores[label] ?? '#8b5cf6' })))
  }

  if (metrica === 'productores_por_tipo') {
    const { data } = await supabase.from('productores').select('tipo_evento')
    const counts: Record<string, number> = {}
    for (const r of data ?? []) {
      const k = r.tipo_evento ?? 'Sin tipo'
      counts[k] = (counts[k] ?? 0) + 1
    }
    return NextResponse.json(Object.entries(counts).sort((a, b) => b[1] - a[1]).map(([label, value]) => ({ label, value, color: '#8b5cf6' })))
  }

  if (metrica === 'productores_por_pais') {
    const { data } = await supabase.from('productores').select('pais')
    const counts: Record<string, number> = {}
    for (const r of data ?? []) {
      const k = r.pais ?? 'Sin país'
      counts[k] = (counts[k] ?? 0) + 1
    }
    return NextResponse.json(Object.entries(counts).sort((a, b) => b[1] - a[1]).map(([label, value]) => ({ label, value, color: '#06b6d4' })))
  }

  if (metrica === 'campanas_por_mes') {
    const { data } = await supabase.from('campanas').select('created_at').order('created_at')
    const counts: Record<string, number> = {}
    const meses = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']
    for (const r of data ?? []) {
      const d = new Date(r.created_at)
      const key = `${meses[d.getMonth()]} ${d.getFullYear()}`
      counts[key] = (counts[key] ?? 0) + 1
    }
    const entries = Object.entries(counts).slice(-6)
    return NextResponse.json(entries.map(([label, value]) => ({ label, value, color: '#10b981' })))
  }

  if (metrica === 'mensajes_por_canal') {
    const { data } = await supabase.from('mensajes').select('canal')
    const counts: Record<string, number> = {}
    for (const r of data ?? []) counts[r.canal] = (counts[r.canal] ?? 0) + 1
    const colores: Record<string, string> = { email: '#06b6d4', whatsapp: '#10b981' }
    return NextResponse.json(Object.entries(counts).map(([label, value]) => ({ label, value, color: colores[label] ?? '#8b5cf6' })))
  }

  if (metrica === 'tasa_exito') {
    const { data } = await supabase.from('mensajes').select('status')
    const total = data?.length ?? 0
    const enviados = data?.filter(m => m.status === 'enviado').length ?? 0
    const tasa = total > 0 ? Math.round((enviados / total) * 100) : 0
    return NextResponse.json([{ label: 'Enviados', value: enviados, color: '#10b981' }, { label: 'Fallidos', value: total - enviados, color: '#ef4444' }])
  }

  return NextResponse.json({ error: 'Métrica no encontrada' }, { status: 400 })
}
