import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { CopilotSuggestion } from '@/lib/types'

export const dynamic = 'force-dynamic'

function fallbackSuggestion(nombre: string): CopilotSuggestion {
  return {
    action: 'recontactar',
    priority: 'media',
    reason: 'No hay motor IA configurado, se aplica recomendacion basada en reglas locales.',
    suggestedMessage: `Hola ${nombre}, como estas? Te escribo para retomar la propuesta de Simplepass y ver si coordinamos una llamada corta esta semana.`,
  }
}

export async function POST(request: Request) {
  const { productor_id } = await request.json()
  if (!productor_id) return NextResponse.json({ error: 'Falta productor_id' }, { status: 400 })

  const [{ data: productor, error: productorError }, { data: mensajes }] = await Promise.all([
    supabase.from('productores').select('id, nombre, empresa, estado, tipo_evento, notas').eq('id', productor_id).single(),
    supabase
      .from('mensajes')
      .select('status, canal, contenido, created_at')
      .eq('productor_id', productor_id)
      .order('created_at', { ascending: false })
      .limit(6),
  ])

  if (productorError || !productor) {
    return NextResponse.json({ error: productorError?.message ?? 'Productor no encontrado' }, { status: 404 })
  }

  const key = process.env.OPENROUTER_API_KEY
  if (!key) return NextResponse.json(fallbackSuggestion(productor.nombre))

  const prompt = `
Sos un copiloto comercial para un CRM de eventos en Argentina.
Devolve JSON valido con este esquema:
{
  "action":"recontactar|agendar|pausar|escalar",
  "priority":"alta|media|baja",
  "reason":"string",
  "suggestedMessage":"string"
}

Contexto del productor:
- Nombre: ${productor.nombre}
- Empresa: ${productor.empresa ?? 'n/a'}
- Estado: ${productor.estado}
- Tipo de evento: ${productor.tipo_evento ?? 'n/a'}
- Notas: ${productor.notas ?? 'n/a'}
- Historial ultimo: ${JSON.stringify(mensajes ?? [])}

Reglas:
- Mensaje en voseo argentino.
- Menos de 80 palabras.
- Si hubo fallidos recientes, prioriza pedir canal alternativo.
`.trim()

  try {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${key}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'anthropic/claude-3-haiku',
        response_format: { type: 'json_object' },
        messages: [{ role: 'user', content: prompt }],
      }),
    })

    if (!response.ok) {
      return NextResponse.json(fallbackSuggestion(productor.nombre))
    }

    const data = await response.json()
    const content = data.choices?.[0]?.message?.content
    const parsed = JSON.parse(content) as CopilotSuggestion
    return NextResponse.json(parsed)
  } catch {
    return NextResponse.json(fallbackSuggestion(productor.nombre))
  }
}
