import { NextResponse } from 'next/server'
import { createConnection } from 'mysql2/promise'
import { supabase } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

// Field name candidates per CRM field
const FIELD_MAP = {
  nombre:      ['nombre', 'name', 'full_name', 'nombre_completo', 'display_name', 'username'],
  email:       ['email', 'correo', 'mail', 'email_address'],
  telefono:    ['telefono', 'phone', 'celular', 'mobile', 'tel', 'telefono_celular', 'phone_number'],
  empresa:     ['empresa', 'company', 'negocio', 'razon_social', 'organization'],
  tipo_evento: ['tipo_evento', 'event_type', 'tipo', 'categoria'],
}

function pick(row: Record<string, unknown>, candidates: string[]): string | null {
  for (const key of candidates) {
    const val = row[key] ?? row[key.toUpperCase()] ?? row[key.toLowerCase()]
    if (val && String(val).trim()) return String(val).trim()
  }
  // Try first_name + last_name combination
  if (candidates === FIELD_MAP.nombre) {
    const first = row['first_name'] ?? row['FIRST_NAME'] ?? row['nombre'] ?? ''
    const last  = row['last_name']  ?? row['LAST_NAME']  ?? row['apellido'] ?? ''
    const full  = `${first} ${last}`.trim()
    if (full) return full
  }
  return null
}

export async function POST(request: Request) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}` && authHeader !== `Bearer ${process.env.SYNC_SECRET}`) {
    // Allow from internal calls without auth in dev
    const origin = request.headers.get('origin') ?? ''
    if (!origin.includes('localhost') && !origin.includes('127.0.0.1')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
  }

  const host     = process.env.SIMPLEPASS_MYSQL_HOST
  const user     = process.env.SIMPLEPASS_MYSQL_USER
  const password = process.env.SIMPLEPASS_MYSQL_PASSWORD
  const database = process.env.SIMPLEPASS_MYSQL_DATABASE

  if (!host || !user || !password || !database) {
    return NextResponse.json({ error: 'Faltan variables de entorno SIMPLEPASS_MYSQL_*' }, { status: 500 })
  }

  let conn
  try {
    conn = await createConnection({ host, user, password, database, port: 3306, connectTimeout: 10000 })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e)
    return NextResponse.json({ error: `No se pudo conectar a MySQL: ${msg}` }, { status: 500 })
  }

  let rows: Record<string, unknown>[]
  try {
    const [result] = await conn.query(
      'SELECT * FROM simple_user WHERE app_user_role = ?',
      ['PRODUCTOR']
    )
    rows = result as Record<string, unknown>[]
  } catch (e: unknown) {
    await conn.end()
    const msg = e instanceof Error ? e.message : String(e)
    return NextResponse.json({ error: `Error al consultar simple_user: ${msg}` }, { status: 500 })
  }

  await conn.end()

  if (!rows.length) {
    return NextResponse.json({ importados: 0, mensaje: 'Sin productores en simple_user' })
  }

  // Show discovered fields from first row for debugging
  const camposDisponibles = Object.keys(rows[0])

  const productores = rows.map(row => {
    const nombre = pick(row, FIELD_MAP.nombre) ?? `Productor ${row['id'] ?? ''}`
    return {
      nombre,
      email:       pick(row, FIELD_MAP.email),
      telefono:    pick(row, FIELD_MAP.telefono),
      empresa:     pick(row, FIELD_MAP.empresa),
      tipo_evento: pick(row, FIELD_MAP.tipo_evento),
      estado:      'activo' as const,
      pipeline_etapa: 'nuevo' as const,
      notas:       null,
      pais:        row['pais'] ? String(row['pais']) : (row['country'] ? String(row['country']) : null),
      tags:        [],
    }
  })

  // Upsert into Supabase matching on email (skip duplicates)
  const { data: existing } = await supabase.from('productores').select('email')
  const existingEmails = new Set((existing ?? []).map(p => p.email).filter(Boolean))

  const nuevos    = productores.filter(p => p.email && !existingEmails.has(p.email))
  const sinEmail  = productores.filter(p => !p.email)

  let importados = 0
  let errores = 0

  if (nuevos.length > 0) {
    const { error } = await supabase.from('productores').insert(nuevos)
    if (error) {
      return NextResponse.json({ error: `Error al insertar en Supabase: ${error.message}`, camposDisponibles }, { status: 500 })
    }
    importados = nuevos.length
  }

  // Insert sin-email ones without dedup check
  if (sinEmail.length > 0) {
    const { error } = await supabase.from('productores').insert(sinEmail)
    if (!error) importados += sinEmail.length
    else errores += sinEmail.length
  }

  return NextResponse.json({
    total_mysql:     rows.length,
    importados,
    ya_existian:     productores.length - nuevos.length - sinEmail.length,
    sin_email:       sinEmail.length,
    errores,
    campos_mysql:    camposDisponibles,
  })
}
