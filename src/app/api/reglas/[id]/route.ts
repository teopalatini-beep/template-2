import { NextResponse } from 'next/server'
import { deleteRule, listRules, updateRule } from '@/lib/automation'
import { AutomationRule } from '@/lib/types'

export const dynamic = 'force-dynamic'

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  const body = await request.json() as Partial<AutomationRule>
  const updated = updateRule(params.id, body)

  if (!updated) return NextResponse.json({ error: 'Regla no encontrada' }, { status: 404 })
  return NextResponse.json(updated)
}

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  const ok = deleteRule(params.id)
  if (!ok) return NextResponse.json({ error: 'Regla no encontrada' }, { status: 404 })
  return NextResponse.json({ success: true })
}

export async function GET(_: Request, { params }: { params: { id: string } }) {
  const rule = listRules().find((item) => item.id === params.id)
  if (!rule) return NextResponse.json({ error: 'Regla no encontrada' }, { status: 404 })
  return NextResponse.json(rule)
}
