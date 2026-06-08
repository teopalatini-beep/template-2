import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    return NextResponse.json({ error: 'Falta configurar ANTHROPIC_API_KEY' }, { status: 500 })
  }

  let titulo = ''
  let canal = 'email'
  try {
    const body = await request.json()
    titulo = body.titulo ?? ''
    canal = body.canal ?? 'email'
  } catch {
    // body optional
  }

  const contexto = titulo.trim()
    ? `El asunto de la campaña es: "${titulo}".`
    : 'No se especificó un asunto.'

  const formatoExtra = canal === 'whatsapp'
    ? 'El mensaje es para WhatsApp: debe ser corto (máximo 2 párrafos), directo y sin HTML.'
    : 'El mensaje es para email: puede tener 3 párrafos, tono más elaborado.'

  const prompt = `Sos un experto en comunicación para la empresa SimplePass, una ticketera de eventos en Argentina.
${contexto}
${formatoExtra}
Generá un mensaje en voseo argentino para contactar a un productor de eventos. Tono profesional pero cercano.
Devolvé solo el texto del mensaje, sin saludos de apertura genéricos ni firma.`

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 512,
        messages: [{ role: 'user', content: prompt }],
      }),
    })

    if (!response.ok) {
      const err = await response.json()
      return NextResponse.json(
        { error: err.error?.message ?? `Error Anthropic: ${response.status}` },
        { status: 500 }
      )
    }

    const data = await response.json()
    const content = data.content?.[0]?.text ?? ''
    return NextResponse.json({ message: content })
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Error desconocido' },
      { status: 500 }
    )
  }
}
