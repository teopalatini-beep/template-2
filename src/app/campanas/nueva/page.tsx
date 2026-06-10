'use client'

import { useEffect, useState, useRef, useCallback, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Sparkles, Send, Search, CheckSquare, Square, ChevronLeft, FileText, Save, Eye, EyeOff, Layers } from 'lucide-react'
import Link from 'next/link'
import { Productor, Canal } from '@/lib/types'
import StatusBadge from '@/components/StatusBadge'
import { toast } from 'sonner'
import { loadSegments, applySegment } from '@/lib/segments'

const TEMPLATES_KEY = 'crm_msg_templates'
type MsgTemplate = { id: string; nombre: string; canal: Canal; contenido: string }

function loadTemplates(): MsgTemplate[] {
  try { return JSON.parse(localStorage.getItem(TEMPLATES_KEY) ?? '[]') } catch { return [] }
}
function saveTemplates(tpls: MsgTemplate[]) {
  localStorage.setItem(TEMPLATES_KEY, JSON.stringify(tpls))
}

const VARIABLES = ['{nombre}', '{empresa}', '{tipo_evento}', '{pais}'] as const

function applyVars(text: string, p?: Productor | null) {
  if (!p) return text
  return text
    .replace(/\{nombre\}/g, p.nombre)
    .replace(/\{empresa\}/g, p.empresa ?? '')
    .replace(/\{tipo_evento\}/g, p.tipo_evento ?? '')
    .replace(/\{pais\}/g, (p as Productor & { pais?: string }).pais ?? '')
}

function NuevaCampanaInner() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [titulo, setTitulo] = useState('')
  const [mensaje, setMensaje] = useState('')
  const [emailHtmlTemplate, setEmailHtmlTemplate] = useState('')
  const [abTest, setAbTest] = useState(false)
  const [mensajeA, setMensajeA] = useState('')
  const [mensajeB, setMensajeB] = useState('')
  const [canal, setCanal] = useState<Canal>('whatsapp')
  const [productores, setProductores] = useState<Productor[]>([])
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [search, setSearch] = useState('')
  const [loadingIA, setLoadingIA] = useState(false)
  const [loadingEnvio, setLoadingEnvio] = useState(false)
  const [showPreview, setShowPreview] = useState(false)
  const [templates, setTemplates] = useState<MsgTemplate[]>([])
  const [showTemplates, setShowTemplates] = useState(false)
  const [showSegmentos, setShowSegmentos] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => { setTemplates(loadTemplates()) }, [])

  useEffect(() => {
    fetch('/api/productores').then(r => r.json()).then((data: Productor[]) => {
      setProductores(data)
      const segId = searchParams.get('segmento')
      if (segId) {
        const segs = loadSegments()
        const seg = segs.find(s => s.id === segId)
        if (seg) {
          const matches = applySegment(data, seg)
          setSelected(new Set(matches.map(p => p.id)))
          if (seg.canal) setCanal(seg.canal)
          toast.success(`Segmento "${seg.nombre}" cargado: ${matches.length} productores`)
        }
      }
    })
  }, [searchParams])

  const insertVar = useCallback((variable: string) => {
    const el = textareaRef.current
    if (!el) return
    const start = el.selectionStart ?? mensaje.length
    const end = el.selectionEnd ?? mensaje.length
    const next = mensaje.slice(0, start) + variable + mensaje.slice(end)
    setMensaje(next)
    setTimeout(() => {
      el.focus()
      el.setSelectionRange(start + variable.length, start + variable.length)
    }, 0)
  }, [mensaje])

  const saveTemplate = useCallback(() => {
    const contenido = abTest ? mensajeA : mensaje
    if (!contenido.trim()) { toast.error('El mensaje está vacío'); return }
    const nombre = window.prompt('Nombre del template:')?.trim()
    if (!nombre) return
    const newTpl: MsgTemplate = { id: Date.now().toString(), nombre, canal, contenido }
    const updated = [...templates, newTpl]
    saveTemplates(updated)
    setTemplates(updated)
    toast.success(`Template "${nombre}" guardado`)
  }, [abTest, mensaje, mensajeA, canal, templates])

  const loadTemplate = useCallback((tpl: MsgTemplate) => {
    if (abTest) { setMensajeA(tpl.contenido) } else { setMensaje(tpl.contenido) }
    setShowTemplates(false)
    toast.success(`Template "${tpl.nombre}" cargado`)
  }, [abTest])

  const deleteTemplate = useCallback((id: string) => {
    const updated = templates.filter(t => t.id !== id)
    saveTemplates(updated)
    setTemplates(updated)
  }, [templates])

  const generarConIA = async () => {
    setLoadingIA(true)
    const toastId = toast.loading('Generando mensaje con IA...')
    try {
      const res = await fetch('/api/generate-message', { method: 'POST' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      if (abTest) {
        setMensajeA(data.message)
      } else {
        setMensaje(data.message)
      }
      toast.success('Mensaje generado', { id: toastId })
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Error al generar', { id: toastId })
    } finally {
      setLoadingIA(false)
    }
  }

  const previewProductor = productores.find(p => selected.has(p.id)) ?? productores[0] ?? null

  const filteredProductores = productores.filter(p => {
    const hasContact = canal === 'whatsapp' ? !!p.telefono : !!p.email
    const matchSearch = !search ||
      p.nombre.toLowerCase().includes(search.toLowerCase()) ||
      (p.empresa ?? '').toLowerCase().includes(search.toLowerCase())
    return hasContact && matchSearch
  })

  const allSelected = filteredProductores.length > 0 && selected.size === filteredProductores.length

  const toggleSelectAll = () => {
    setSelected(allSelected ? new Set() : new Set(filteredProductores.map(p => p.id)))
  }

  const toggleSelect = (id: string) => {
    setSelected(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const handleEnviar = async () => {
    if (!titulo.trim()) { toast.error('El título es obligatorio'); return }
    if (!abTest && !mensaje.trim()) { toast.error('El mensaje no puede estar vacío'); return }
    if (abTest && (!mensajeA.trim() || !mensajeB.trim())) { toast.error('Completá ambas variantes A/B'); return }
    if (selected.size === 0) { toast.error('Seleccioná al menos un destinatario'); return }

    setLoadingEnvio(true)
    const toastId = toast.loading(`Enviando a ${selected.size} destinatario${selected.size > 1 ? 's' : ''}...`)

    try {
      const endpoint = canal === 'whatsapp' ? '/api/send-whatsapp' : '/api/send-email'
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          titulo,
          mensaje,
          productor_ids: Array.from(selected),
          ab_test: abTest,
          mensaje_a: mensajeA,
          mensaje_b: mensajeB,
          email_html_template: canal === 'email' ? emailHtmlTemplate : undefined,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      toast.success('Campaña enviada exitosamente', { id: toastId })
      router.push(`/campanas/${data.campana_id}`)
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Error al enviar', { id: toastId })
    } finally {
      setLoadingEnvio(false)
    }
  }

  return (
    <div className="p-8 max-w-5xl mx-auto">
      {/* Header */}
      <Link href="/campanas" className="inline-flex items-center gap-1.5 text-[12px] text-zinc-600 hover:text-zinc-300 transition-colors mb-5">
        <ChevronLeft size={13} />
        Campañas
      </Link>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-white">Nueva campaña</h1>
          <p className="text-[12px] text-zinc-600 mt-0.5">Redactá y enviá un mensaje a tus productores</p>
        </div>
        <button
          onClick={handleEnviar}
          disabled={loadingEnvio || selected.size === 0}
          className="flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-500 disabled:opacity-40 text-white text-[13px] font-medium rounded-lg transition-all shadow-lg shadow-violet-900/20"
        >
          <Send size={13} />
          {loadingEnvio ? 'Enviando...' : `Enviar${selected.size > 0 ? ` (${selected.size})` : ''}`}
        </button>
      </div>

      <div className="grid grid-cols-5 gap-5">
        {/* Formulario — 3 cols */}
        <div className="col-span-3 space-y-4">
          {/* Título */}
          <div className="bg-[#141414] border border-[#1f1f1f] rounded-xl p-5">
            <label className="block text-[10px] font-medium text-zinc-600 uppercase tracking-widest mb-2">
              Título
            </label>
            <input
              type="text"
              value={titulo}
              onChange={e => setTitulo(e.target.value)}
              placeholder="Ej: Promo Enero 2025"
              className="w-full bg-[#0f0f0f] border border-[#1f1f1f] rounded-lg px-3 py-2.5 text-[14px] text-white placeholder-zinc-700 focus:outline-none focus:border-violet-500/40 transition-all"
            />
          </div>

          {/* Canal */}
          <div className="bg-[#141414] border border-[#1f1f1f] rounded-xl p-5">
            <p className="text-[10px] font-medium text-zinc-600 uppercase tracking-widest mb-3">Canal</p>
            <div className="flex gap-3">
              {(['whatsapp', 'email'] as Canal[]).map(c => (
                <button
                  key={c}
                  type="button"
                  onClick={() => { setCanal(c); setSelected(new Set()) }}
                  className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl border text-[13px] transition-all ${
                    canal === c
                      ? 'border-violet-500/40 bg-violet-500/8 text-violet-300'
                      : 'border-[#1f1f1f] text-zinc-500 hover:border-[#2a2a2a] hover:text-zinc-300'
                  }`}
                >
                  <div className={`w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center transition-colors ${canal === c ? 'border-violet-500' : 'border-zinc-600'}`}>
                    {canal === c && <div className="w-1.5 h-1.5 rounded-full bg-violet-500" />}
                  </div>
                  <StatusBadge status={c} />
                </button>
              ))}
            </div>
          </div>

          {/* Mensaje */}
          <div className="bg-[#141414] border border-[#1f1f1f] rounded-xl p-5">
            <div className="flex items-center gap-2 flex-wrap mb-3">
              <label className="text-[10px] font-medium text-zinc-600 uppercase tracking-widest mr-auto">Mensaje</label>
              <button
                type="button"
                onClick={() => setAbTest((prev) => !prev)}
                className={`px-2.5 py-1 text-[10px] rounded-md border transition-colors ${
                  abTest ? 'border-violet-500/40 text-violet-300 bg-violet-500/10' : 'border-[#2a2a2a] text-zinc-500'
                }`}
              >
                A/B test
              </button>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowTemplates(p => !p)}
                  className="flex items-center gap-1 px-2.5 py-1 text-[10px] border border-[#2a2a2a] text-zinc-500 hover:text-zinc-300 rounded-md transition-colors"
                >
                  <FileText size={10} />
                  Templates
                </button>
                {showTemplates && (
                  <div className="absolute top-full left-0 mt-1 w-56 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg shadow-xl z-20 overflow-hidden">
                    {templates.filter(t => t.canal === canal).length === 0 ? (
                      <p className="px-3 py-2.5 text-[11px] text-zinc-600">Sin templates para {canal}</p>
                    ) : templates.filter(t => t.canal === canal).map(tpl => (
                      <div key={tpl.id} className="flex items-center gap-1 px-3 py-2 hover:bg-white/5 group">
                        <button onClick={() => loadTemplate(tpl)} className="flex-1 text-left text-[12px] text-zinc-300 truncate">
                          {tpl.nombre}
                        </button>
                        <button onClick={() => deleteTemplate(tpl.id)} className="text-zinc-700 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all">
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <button
                type="button"
                onClick={saveTemplate}
                className="flex items-center gap-1 px-2.5 py-1 text-[10px] border border-[#2a2a2a] text-zinc-500 hover:text-zinc-300 rounded-md transition-colors"
              >
                <Save size={10} />
                Guardar
              </button>
              <button
                type="button"
                onClick={() => setShowPreview(p => !p)}
                className={`flex items-center gap-1 px-2.5 py-1 text-[10px] border rounded-md transition-colors ${
                  showPreview ? 'border-violet-500/40 text-violet-300' : 'border-[#2a2a2a] text-zinc-500'
                }`}
              >
                {showPreview ? <EyeOff size={10} /> : <Eye size={10} />}
                Preview
              </button>
              <button
                type="button"
                onClick={generarConIA}
                disabled={loadingIA}
                className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-medium text-violet-400 bg-violet-500/8 hover:bg-violet-500/15 border border-violet-500/20 rounded-lg transition-all disabled:opacity-50"
              >
                <Sparkles size={11} />
                {loadingIA ? 'Generando...' : 'Generar con IA'}
              </button>
            </div>

            {/* Variable insertion chips */}
            {!abTest && (
              <div className="flex items-center gap-1.5 mb-2 flex-wrap">
                <span className="text-[10px] text-zinc-700">Insertar:</span>
                {VARIABLES.map(v => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => insertVar(v)}
                    className="px-2 py-0.5 text-[10px] font-mono bg-[#1a1a1a] border border-[#2a2a2a] text-zinc-400 hover:text-violet-300 hover:border-violet-500/40 rounded transition-all"
                  >
                    {v}
                  </button>
                ))}
              </div>
            )}

            {!abTest ? (
              <>
                {showPreview ? (
                  <div className="w-full bg-[#0f0f0f] border border-[#1f1f1f] rounded-lg px-3 py-2.5 text-[13px] text-zinc-300 min-h-[200px] whitespace-pre-wrap leading-relaxed">
                    {applyVars(mensaje, previewProductor) || <span className="text-zinc-700">Vista previa del mensaje...</span>}
                    {previewProductor && (
                      <p className="mt-3 pt-3 border-t border-[#1f1f1f] text-[10px] text-zinc-600">
                        Previsualizado con: <span className="text-zinc-400">{previewProductor.nombre}</span>
                      </p>
                    )}
                  </div>
                ) : (
                  <textarea
                    ref={textareaRef}
                    value={mensaje}
                    onChange={e => setMensaje(e.target.value)}
                    rows={11}
                    placeholder="Escribí el mensaje acá o usá la IA para generar uno..."
                    className="w-full bg-[#0f0f0f] border border-[#1f1f1f] rounded-lg px-3 py-2.5 text-[13px] text-zinc-200 placeholder-zinc-700 focus:outline-none focus:border-violet-500/40 transition-all resize-none leading-relaxed"
                  />
                )}
                <p className="text-[10px] text-zinc-700 mt-1.5">{mensaje.length} caracteres</p>
              </>
            ) : (
              <div className="space-y-3">
                <div>
                  <p className="text-[10px] text-zinc-600 mb-1">Variante A</p>
                  <textarea
                    value={mensajeA}
                    onChange={e => setMensajeA(e.target.value)}
                    rows={5}
                    placeholder="Mensaje A..."
                    className="w-full bg-[#0f0f0f] border border-[#1f1f1f] rounded-lg px-3 py-2 text-[12px] text-zinc-200 resize-none"
                  />
                </div>
                <div>
                  <p className="text-[10px] text-zinc-600 mb-1">Variante B</p>
                  <textarea
                    value={mensajeB}
                    onChange={e => setMensajeB(e.target.value)}
                    rows={5}
                    placeholder="Mensaje B..."
                    className="w-full bg-[#0f0f0f] border border-[#1f1f1f] rounded-lg px-3 py-2 text-[12px] text-zinc-200 resize-none"
                  />
                </div>
                <p className="text-[10px] text-zinc-700">
                  Se alterna por destinatario para comparar rendimiento por variante.
                </p>
              </div>
            )}
          </div>

          {canal === 'email' && (
            <div className="bg-[#141414] border border-[#1f1f1f] rounded-xl p-5">
              <div className="flex items-center justify-between mb-2">
                <label className="text-[10px] font-medium text-zinc-600 uppercase tracking-widest">Template HTML (opcional)</label>
                <span className="text-[10px] text-zinc-700">Se usa en el envío real</span>
              </div>
              <textarea
                value={emailHtmlTemplate}
                onChange={(e) => setEmailHtmlTemplate(e.target.value)}
                rows={10}
                placeholder="<html>...tu template...</html>"
                className="w-full bg-[#0f0f0f] border border-[#1f1f1f] rounded-lg px-3 py-2 text-[12px] text-zinc-200 font-mono resize-y"
              />
              <p className="text-[10px] text-zinc-700 mt-1.5">
                Variables disponibles: {'{{titulo}}'}, {'{{mensaje}}'}, {'{{nombre}}'}, {'{{empresa}}'}, {'{{email}}'}.
              </p>
            </div>
          )}
        </div>

        {/* Destinatarios — 2 cols */}
        <div className="col-span-2 bg-[#141414] border border-[#1f1f1f] rounded-xl flex flex-col overflow-hidden">
          <div className="px-4 py-3.5 border-b border-[#1a1a1a]">
            <div className="flex items-center justify-between mb-3">
              <p className="text-[13px] font-medium text-white">Destinatarios</p>
              <div className="flex items-center gap-2">
                {selected.size > 0 && (
                  <span className="text-[11px] text-violet-400 bg-violet-500/8 border border-violet-500/15 rounded-md px-2 py-0.5">
                    {selected.size} sel.
                  </span>
                )}
                <div className="relative">
                  <button
                    onClick={() => setShowSegmentos(p => !p)}
                    className="flex items-center gap-1 px-2 py-1 text-[10px] border border-[#2a2a2a] text-zinc-500 hover:text-violet-300 hover:border-violet-500/30 rounded-md transition-all"
                  >
                    <Layers size={10} />
                    Segmento
                  </button>
                  {showSegmentos && (
                    <div className="absolute top-full right-0 mt-1 w-56 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg shadow-xl z-20 overflow-hidden">
                      {loadSegments().length === 0 ? (
                        <p className="px-3 py-2.5 text-[11px] text-zinc-600">
                          Sin segmentos. <Link href="/segmentos" className="text-violet-400 underline">Crear uno →</Link>
                        </p>
                      ) : loadSegments().map(seg => {
                        const matches = applySegment(productores, seg)
                        return (
                          <button
                            key={seg.id}
                            onClick={() => {
                              setSelected(new Set(matches.map(p => p.id)))
                              if (seg.canal) setCanal(seg.canal)
                              setShowSegmentos(false)
                              toast.success(`"${seg.nombre}": ${matches.length} productores seleccionados`)
                            }}
                            className="w-full flex items-center justify-between px-3 py-2.5 hover:bg-white/5 text-left group"
                          >
                            <span className="text-[12px] text-zinc-300 truncate">{seg.nombre}</span>
                            <span className="text-[10px] text-zinc-600">{matches.length}</span>
                          </button>
                        )
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div className="relative">
              <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-600" />
              <input
                type="text"
                placeholder="Filtrar..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full bg-[#0f0f0f] border border-[#1f1f1f] rounded-lg pl-8 pr-3 py-2 text-[12px] text-zinc-300 placeholder-zinc-700 focus:outline-none focus:border-violet-500/40 transition-all"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {filteredProductores.length === 0 ? (
              <div className="py-10 text-center">
                <p className="text-[12px] text-zinc-700">
                  {canal === 'whatsapp' ? 'Sin productores con teléfono' : 'Sin productores con email'}
                </p>
              </div>
            ) : (
              <>
                <button
                  onClick={toggleSelectAll}
                  className="w-full flex items-center gap-2.5 px-4 py-2.5 hover:bg-white/[0.02] border-b border-[#111] text-[12px] text-zinc-500 transition-colors"
                >
                  {allSelected
                    ? <CheckSquare size={13} className="text-violet-400 shrink-0" />
                    : <Square size={13} className="text-zinc-700 shrink-0" />}
                  Todos ({filteredProductores.length})
                </button>
                {filteredProductores.map(p => (
                  <button
                    key={p.id}
                    onClick={() => toggleSelect(p.id)}
                    className="w-full flex items-center gap-2.5 px-4 py-3 hover:bg-white/[0.015] border-b border-[#0f0f0f] last:border-0 transition-colors text-left"
                  >
                    {selected.has(p.id)
                      ? <CheckSquare size={13} className="text-violet-400 shrink-0" />
                      : <Square size={13} className="text-zinc-700 shrink-0" />}
                    <div className="min-w-0 flex-1">
                      <p className="text-[12px] font-medium text-zinc-300 truncate">{p.nombre}</p>
                      <p className="text-[10px] text-zinc-700 truncate font-mono">
                        {canal === 'whatsapp' ? p.telefono : p.email}
                      </p>
                    </div>
                    <StatusBadge status={p.estado} />
                  </button>
                ))}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default function NuevaCampanaPage() {
  return (
    <Suspense fallback={<div className="p-8 text-zinc-600 text-sm">Cargando...</div>}>
      <NuevaCampanaInner />
    </Suspense>
  )
}
