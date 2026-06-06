import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

const COSTO_EMAIL_USD = 0.001
const COSTO_WHATSAPP_USD = 0.03

function mesActual() {
  const now = new Date()
  const inicio = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
  const fin = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59).toISOString()
  return { inicio, fin }
}

function mesAnterior() {
  const now = new Date()
  const inicio = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString()
  const fin = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59).toISOString()
  return { inicio, fin }
}

function tendencia(actual: number, anterior: number) {
  if (anterior === 0) return actual > 0 ? 100 : 0
  return Math.round(((actual - anterior) / anterior) * 100)
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const metrica = searchParams.get('metrica')

  // ─── KPIs principales ───────────────────────────────────────────
  if (metrica === 'kpis') {
    const { inicio: im, fin: fm } = mesActual()
    const { inicio: ia, fin: fa } = mesAnterior()

    const [msgMes, msgAnt, allMsg, allProd] = await Promise.all([
      supabase.from('mensajes').select('status, canal').gte('created_at', im).lte('created_at', fm),
      supabase.from('mensajes').select('status').gte('created_at', ia).lte('created_at', fa),
      supabase.from('mensajes').select('status, canal'),
      supabase.from('productores').select('email, telefono'),
    ])

    const mesData = msgMes.data ?? []
    const antData = msgAnt.data ?? []
    const allData = allMsg.data ?? []
    const prods = allProd.data ?? []

    const totalMes = mesData.length
    const totalAnt = antData.length
    const enviadosMes = mesData.filter(m => m.status === 'enviado').length
    const enviadosAnt = antData.filter(m => m.status === 'enviado').length

    const tasaMes = totalMes > 0 ? Math.round((enviadosMes / totalMes) * 100) : 0
    const tasaAnt = totalAnt > 0 ? Math.round((enviadosAnt / totalAnt) * 100) : 0

    const alcanzables = prods.filter(p => p.email || p.telefono).length
    const pctAlcanzables = prods.length > 0 ? Math.round((alcanzables / prods.length) * 100) : 0

    const emailsMes = mesData.filter(m => m.canal === 'email').length
    const waMes = mesData.filter(m => m.canal === 'whatsapp').length
    const costoMes = (emailsMes * COSTO_EMAIL_USD) + (waMes * COSTO_WHATSAPP_USD)

    const fallidos = allData.filter(m => m.status === 'fallido')
    const costoFallidos = fallidos.filter(m => m.canal === 'email').length * COSTO_EMAIL_USD
      + fallidos.filter(m => m.canal === 'whatsapp').length * COSTO_WHATSAPP_USD

    return NextResponse.json({
      mensajesMes: totalMes,
      mensajesAnt: totalAnt,
      tendenciaMensajes: tendencia(totalMes, totalAnt),
      tasaEntrega: tasaMes,
      tasaEntregaAnt: tasaAnt,
      tendenciaTasa: tasaMes - tasaAnt,
      productoresAlcanzables: pctAlcanzables,
      totalProductores: prods.length,
      costoEstimadoMes: parseFloat(costoMes.toFixed(3)),
      costoFallidosTotal: parseFloat(costoFallidos.toFixed(3)),
    })
  }

  // ─── Entrega por canal con breakdown ────────────────────────────
  if (metrica === 'entrega_por_canal') {
    const { data } = await supabase.from('mensajes').select('canal, status')
    const canales: Record<string, { enviados: number; fallidos: number }> = {}
    for (const m of data ?? []) {
      if (!canales[m.canal]) canales[m.canal] = { enviados: 0, fallidos: 0 }
      if (m.status === 'enviado') canales[m.canal].enviados++
      else if (m.status === 'fallido') canales[m.canal].fallidos++
    }
    const colores: Record<string, string> = { email: '#06b6d4', whatsapp: '#10b981' }
    return NextResponse.json(
      Object.entries(canales).map(([canal, v]) => {
        const total = v.enviados + v.fallidos
        return {
          label: canal === 'email' ? 'Email' : 'WhatsApp',
          value: v.enviados,
          fallidos: v.fallidos,
          total,
          tasa: total > 0 ? Math.round((v.enviados / total) * 100) : 0,
          color: colores[canal] ?? '#8b5cf6',
        }
      })
    )
  }

  // ─── Volumen últimos 7 días ──────────────────────────────────────
  if (metrica === 'volumen_7dias') {
    const hace7 = new Date(); hace7.setDate(hace7.getDate() - 6); hace7.setHours(0, 0, 0, 0)
    const { data } = await supabase.from('mensajes').select('created_at, status').gte('created_at', hace7.toISOString())
    const dias = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']
    const counts: Record<string, { enviados: number; fallidos: number }> = {}
    for (let i = 0; i < 7; i++) {
      const d = new Date(); d.setDate(d.getDate() - (6 - i))
      const key = `${dias[d.getDay()]} ${d.getDate()}`
      counts[key] = { enviados: 0, fallidos: 0 }
    }
    for (const m of data ?? []) {
      const d = new Date(m.created_at)
      const key = `${dias[d.getDay()]} ${d.getDate()}`
      if (counts[key]) {
        if (m.status === 'enviado') counts[key].enviados++
        else if (m.status === 'fallido') counts[key].fallidos++
      }
    }
    return NextResponse.json(
      Object.entries(counts).map(([label, v]) => ({
        label, value: v.enviados + v.fallidos, enviados: v.enviados, fallidos: v.fallidos, color: '#8b5cf6',
      }))
    )
  }

  // ─── Gaps de contactabilidad (oportunidades perdidas) ──────────
  if (metrica === 'gaps_contactabilidad') {
    const { data } = await supabase.from('productores').select('email, telefono, estado')
    const prods = data ?? []
    const ambos = prods.filter(p => p.email && p.telefono).length
    const soloEmail = prods.filter(p => p.email && !p.telefono).length
    const soloWA = prods.filter(p => !p.email && p.telefono).length
    const ninguno = prods.filter(p => !p.email && !p.telefono).length
    return NextResponse.json([
      { label: 'Email + WhatsApp', value: ambos, color: '#10b981', descripcion: 'Máxima cobertura' },
      { label: 'Solo email', value: soloEmail, color: '#06b6d4', descripcion: 'Sin WhatsApp' },
      { label: 'Solo WhatsApp', value: soloWA, color: '#8b5cf6', descripcion: 'Sin email' },
      { label: 'Sin contacto', value: ninguno, color: '#ef4444', descripcion: 'No alcanzables' },
    ].filter(item => item.value > 0))
  }

  // ─── Rendimiento por tipo de evento ────────────────────────────
  if (metrica === 'rendimiento_tipo_evento') {
    const { data: prods } = await supabase.from('productores').select('id, tipo_evento')
    const { data: msgs } = await supabase.from('mensajes').select('productor_id, status')
    const prodMap: Record<string, string> = {}
    for (const p of prods ?? []) prodMap[p.id] = p.tipo_evento ?? 'Sin tipo'
    const tipos: Record<string, { total: number; enviados: number }> = {}
    for (const m of msgs ?? []) {
      const tipo = prodMap[m.productor_id] ?? 'Sin tipo'
      if (!tipos[tipo]) tipos[tipo] = { total: 0, enviados: 0 }
      tipos[tipo].total++
      if (m.status === 'enviado') tipos[tipo].enviados++
    }
    const colores = ['#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#ec4899']
    return NextResponse.json(
      Object.entries(tipos)
        .sort((a, b) => b[1].total - a[1].total)
        .map(([label, v], i) => ({
          label, value: v.total, enviados: v.enviados,
          tasa: v.total > 0 ? Math.round((v.enviados / v.total) * 100) : 0,
          color: colores[i % colores.length],
        }))
    )
  }

  // ─── Costo por campaña ──────────────────────────────────────────
  if (metrica === 'costo_campanas') {
    const { data: campanas } = await supabase.from('campanas').select('id, titulo, canal, estado').order('created_at', { ascending: false }).limit(10)
    const { data: msgs } = await supabase.from('mensajes').select('campana_id, canal, status')
    const costoMap: Record<string, { enviados: number; fallidos: number; canal: string }> = {}
    for (const c of campanas ?? []) costoMap[c.id] = { enviados: 0, fallidos: 0, canal: c.canal }
    for (const m of msgs ?? []) {
      if (!m.campana_id || !costoMap[m.campana_id]) continue
      if (m.status === 'enviado') costoMap[m.campana_id].enviados++
      else if (m.status === 'fallido') costoMap[m.campana_id].fallidos++
    }
    return NextResponse.json(
      (campanas ?? []).map(c => {
        const stats = costoMap[c.id] ?? { enviados: 0, fallidos: 0, canal: c.canal }
        const tarifa = c.canal === 'whatsapp' ? COSTO_WHATSAPP_USD : COSTO_EMAIL_USD
        const costo = stats.enviados * tarifa
        return {
          label: c.titulo.length > 25 ? c.titulo.slice(0, 25) + '…' : c.titulo,
          value: stats.enviados + stats.fallidos,
          enviados: stats.enviados,
          fallidos: stats.fallidos,
          costo: parseFloat(costo.toFixed(4)),
          color: c.canal === 'whatsapp' ? '#10b981' : '#06b6d4',
        }
      }).filter(c => c.value > 0)
    )
  }

  // ─── Métricas básicas ────────────────────────────────────────────
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
    for (const r of data ?? []) { const k = r.tipo_evento ?? 'Sin tipo'; counts[k] = (counts[k] ?? 0) + 1 }
    return NextResponse.json(Object.entries(counts).sort((a, b) => b[1] - a[1]).map(([label, value]) => ({ label, value, color: '#8b5cf6' })))
  }

  if (metrica === 'productores_por_pais') {
    const { data } = await supabase.from('productores').select('pais')
    const counts: Record<string, number> = {}
    for (const r of data ?? []) { const k = r.pais ?? 'Sin país'; counts[k] = (counts[k] ?? 0) + 1 }
    return NextResponse.json(Object.entries(counts).sort((a, b) => b[1] - a[1]).map(([label, value]) => ({ label, value, color: '#06b6d4' })))
  }

  if (metrica === 'campanas_por_mes') {
    const { data } = await supabase.from('campanas').select('created_at').order('created_at')
    const counts: Record<string, number> = {}
    const meses = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']
    for (const r of data ?? []) {
      const d = new Date(r.created_at)
      const key = `${meses[d.getMonth()]} ${d.getFullYear().toString().slice(2)}`
      counts[key] = (counts[key] ?? 0) + 1
    }
    return NextResponse.json(Object.entries(counts).slice(-6).map(([label, value]) => ({ label, value, color: '#10b981' })))
  }

  if (metrica === 'tasa_exito') {
    const { data } = await supabase.from('mensajes').select('status')
    const total = data?.length ?? 0
    const enviados = data?.filter(m => m.status === 'enviado').length ?? 0
    return NextResponse.json([
      { label: 'Enviados', value: enviados, color: '#10b981' },
      { label: 'Fallidos', value: total - enviados, color: '#ef4444' },
    ])
  }

  return NextResponse.json({ error: 'Métrica no encontrada' }, { status: 400 })
}
