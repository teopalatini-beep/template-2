import { NextResponse } from 'next/server'
import { createRule, listRules } from '@/lib/automation'
import { AutomationRule } from '@/lib/types'

export const dynamic = 'force-dynamic'

export async function GET() {
  return NextResponse.json(listRules())
}

export async function POST(request: Request) {
  const body = await request.json() as Partial<AutomationRule>

  if (!body.nombre || !body.trigger || !body.action) {
    return NextResponse.json({ error: 'Datos de regla incompletos' }, { status: 400 })
  }

  const rule = createRule({
    nombre: body.nombre,
    activa: body.activa ?? true,
    trigger: body.trigger,
    conditions: body.conditions ?? {},
    action: body.action,
    actionConfig: body.actionConfig ?? {},
  })

  return NextResponse.json(rule, { status: 201 })
}
