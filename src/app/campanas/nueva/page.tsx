'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import {
  Sparkles, Send, Search, CheckSquare, Square, ChevronLeft,
  Bold, Italic, Underline, Link2, Image, List, Minus, Heading2, Eye, PenLine,
} from 'lucide-react'
import Link from 'next/link'
import { Productor, Canal } from '@/lib/types'
import { toast } from 'sonner'

// ─── Rich email editor ────────────────────────────────────────────────

function ToolbarBtn({ onClick, title, children, active }: {
  onClick: () => void
  title: string
  children: React.ReactNode
  active?: boolean
}) {
  return (
    <button
      type="button"
      onMouseDown={e => { e.preventDefault(); onClick() }}
      title={title}
      className={`p-1.5 rounded-md transition-all ${active ? 'bg-violet-500/20 text-violet-300' : 'text-zinc-500 hover:text-zinc-200 hover:bg-white/[0.06]'}`}
    >
      {children}
    </button>
  )
}

function RichEmailEditor({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const editorRef = useRef<HTMLDivElement>(null)
  const [mode, setMode] = useState<'edit' | 'preview'>('edit')

  const exec = useCallback((cmd: string, val?: string) => {
    document.execCommand(cmd, false, val)
    editorRef.current?.focus()
    onChange(editorRef.current?.innerHTML ?? '')
  }, [onChange])

  const insertLink = () => {
    const url = prompt('URL del enlace:')
    if (url) exec('createLink', url)
  }

  const insertImage = () => {
    const url = prompt('URL de la imagen:')
    if (url) exec('insertImage', url)
  }

  const insertHR = () => {
    exec('insertHTML', '<hr style="border:none;border-top:1px solid #e5e7eb;margin:20px 0"/>')
  }

  const formatBlock = (tag: string) => exec('formatBlock', tag)

  useEffect(() => {
    if (editorRef.current && document.activeElement !== editorRef.current) {
      editorRef.current.innerHTML = value
    }
  }, [value])

  return (
    <div className="bg-[#0f0f0f] border border-[#1f1f1f] rounded-xl overflow-hidden flex flex-col">
      <div className="flex items-center gap-1 px-3 py-2 border-b border-[#1f1f1f] bg-[#141414]">
        <button
          type="button"
          onClick={() => setMode('edit')}
          className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-medium transition-all ${mode === 'edit' ? 'bg-[#1f1f1f] text-zinc-200' : 'text-zinc-600 hover:text-zinc-400'}`}
        >
          <PenLine size={11} /> Editar
        </button>
        <button
          type="button"
          onClick={() => setMode('preview')}
          className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-medium transition-all ${mode === 'preview' ? 'bg-[#1f1f1f] text-zinc-200' : 'text-zinc-600 hover:text-zinc-400'}`}
        >
          <Eye size={11} /> Preview
        </button>

        <div className="h-4 w-px bg-[#2a2a2a] mx-1" />

        {mode === 'edit' && <>
          <ToolbarBtn onClick={() => exec('bold')} title="Negrita (⌘B)"><Bold size={12} /></ToolbarBtn>
          <ToolbarBtn onClick={() => exec('italic')} title="Cursiva (⌘I)"><Italic size={12} /></ToolbarBtn>
          <ToolbarBtn onClick={() => exec('underline')} title="Subrayado (⌘U)"><Underline size={12} /></ToolbarBtn>
          <div className="h-4 w-px bg-[#2a2a2a] mx-0.5" />
          <ToolbarBtn onClick={() => formatBlock('h2')} title="Título"><Heading2 size={12} /></ToolbarBtn>
          <ToolbarBtn onClick={() => exec('insertUnorderedList')} title="Lista"><List size={12} /></ToolbarBtn>
          <ToolbarBtn onClick={insertHR} title="Separador"><Minus size={12} /></ToolbarBtn>
          <div className="h-4 w-px bg-[#2a2a2a] mx-0.5" />
          <ToolbarBtn onClick={insertLink} title="Enlace"><Link2 size={12} /></ToolbarBtn>
          <ToolbarBtn onClick={insertImage} title="Imagen por URL"><Image size={12} /></ToolbarBtn>
        </>}
      </div>

      {mode === 'edit' ? (
        <div
          ref={editorRef}
          contentEditable
          suppressContentEditableWarning
          onInput={() => onChange(editorRef.current?.innerHTML ?? '')}
          className="flex-1 min-h-[220px] p-4 text-[13px] text-zinc-200 focus:outline-none leading-relaxed
            [&_h2]:text-[18px] [&_h2]:font-bold [&_h2]:text-white [&_h2]:mb-2
            [&_a]:text-violet-400 [&_a]:underline
            [&_ul]:list-disc [&_ul]:ml-5 [&_ul]:space-y-1
            [&_img]:max-w-full [&_img]:rounded-lg [&_img]:my-2
            [&_b]:text-white [&_strong]:text-white"
          style={{}}
        />
      ) : (
        <div className="flex-1 overflow-y-auto p-4 bg-[#0a0a0a]">
          <EmailPreviewCard content={value} />
        </div>
      )}

      <div className="px-4 py-1.5 border-t border-[#1a1a1a] flex items-center justify-between">
        <span className="text-[10px] text-zinc-700">HTML · se enviará con template SimplePass</span>
        <span className="text-[10px] text-zinc-700 tabular-nums">
          {value.replace(/<[^>]+>/g, '').length} chars
        </span>
      </div>
    </div>
  )
}

function EmailPreviewCard({ content }: { content: string }) {
  return (
    <div className="max-w-[480px] mx-auto rounded-xl overflow-hidden shadow-xl border border-[#2a2a2a]" style={{ fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif' }}>
      <div style={{ background: 'linear-gradient(135deg,#8b5cf6,#6d28d9)', padding: '20px 24px', display: 'flex', alignItems: 'center', gap: '10px' }}>
        <div style={{ background: 'rgba(255,255,255,0.15)', borderRadius: '8px', padding: '6px 10px' }}>
          <span style={{ color: 'white', fontWeight: 800, fontSize: '15px', letterSpacing: '-0.3px' }}>S</span>
        </div>
        <span style={{ color: 'white', fontWeight: 700, fontSize: '15px' }}>SimplePass</span>
      </div>
      <div
        style={{ background: 'white', padding: '28px 28px 24px', color: '#111', fontSize: '14px', lineHeight: '1.65' }}
        dangerouslySetInnerHTML={{ __html: content || '<p style="color:#aaa">El contenido del email aparecerá acá...</p>' }}
      />
      <div style={{ background: '#f9fafb', padding: '16px 24px', borderTop: '1px solid #e5e7eb', textAlign: 'center' }}>
        <p style={{ margin: 0, fontSize: '11px', color: '#9ca3af' }}>SimplePass · Sistema CRM</p>
      </div>
    </div>
  )
}

// ─── Page ───────────────────────────────────────────────────────────────────

export default function NuevaCampanaPage() {
  const router = useRouter()
  const [titulo, setTitulo] = useState('')
  const [mensaje, setMensaje] = useState('')
  const [canal, setCanal] = useState<Canal>('whatsapp')
  const [productores, setProductores] = useState<Productor[]>([])
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [search, setSearch] = useState('')
  const [loadingIA, setLoadingIA] = useState(false)
  const [loadingEnvio, setLoadingEnvio] = useState(false)

  useEffect(() => {
    fetch('/api/productores').then(r => r.json()).then(setProductores)
  }, [])

  const generarConIA = async () => {
    setLoadingIA(true)
    const toastId = toast.loading('Generando mensaje con IA...')
    try {
      const res = await fetch('/api/generate-message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ titulo, canal }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Error al generar')
      const html = data.message
        .split('\n\n')
        .map((p: string) => `<p>${p.replace(/\n/g, '<br/>')}</p>`)
        .join('')
      setMensaje(html)
      toast.success('Mensaje generado', { id: toastId })
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Error al generar', { id: toastId })
    } finally {
      setLoadingIA(false)
    }
  }

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
    if (!mensaje.replace(/<[^>]+>/g, '').trim()) { toast.error('El mensaje no puede estar vacío'); return }
    if (selected.size === 0) { toast.error('Selecioná al menos un destinatario'); return }

    setLoadingEnvio(true)
    const toastId = toast.loading(`Enviando a ${selected.size} destinatario${selected.size > 1 ? 's' : ''}...`)

    try {
      const endpoint = canal === 'whatsapp' ? '/api/send-whatsapp' : '/api/send-email'
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ titulo, mensaje, productor_ids: Array.from(selected) }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Error al enviar')
      const enviados = (data.results ?? []).filter((r: { status: string }) => r.status === 'enviado').length
      toast.success(`Campaña enviada a ${enviados} destinatario${enviados !== 1 ? 's' : ''}`, { id: toastId })
      if (data.warnings?.length) {
        setTimeout(() => toast.warning(data.warnings[0]), 800)
      }
      router.push('/campanas')
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Error al enviar', { id: toastId })
    } finally {
      setLoadingEnvio(false)
    }
  }

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <Link href="/campanas" className="inline-flex items-center gap-1.5 text-[12px] text-zinc-600 hover:text-zinc-300 transition-colors mb-5">
        <ChevronLeft size={13} />
        Campañas
      </Link>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-white">Nueva campaña</h1>
          <p className="text-[12px] text-zinc-600 mt-0.5">Redatá y enviá un mensaje a tus productores</p>
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
          {/* Canal */}
          <div className="bg-[#141414] border border-[#1f1f1f] rounded-xl p-5">
            <label className="block text-[10px] font-medium text-zinc-600 uppercase tracking-widest mb-3">Canal</label>
            <div className="flex gap-2">
              {(['whatsapp', 'email'] as Canal[]).map(c => (
                <button
                  key={c}
                  type="button"
                  onClick={() => { setCanal(c); setMensaje('') }}
                  className={`flex-1 py-2 rounded-lg text-[12px] font-medium transition-all ${
                    canal === c
                      ? 'bg-violet-600 text-white'
                      : 'bg-[#1a1a1a] text-zinc-500 hover:text-zinc-300'
                  }`}
                >
                  {c === 'whatsapp' ? 'WhatsApp' : 'Email'}
                </button>
              ))}
            </div>
          </div>

          {/* Título */}
          <div className="bg-[#141414] border border-[#1f1f1f] rounded-xl p-5">
            <label className="block text-[10px] font-medium text-zinc-600 uppercase tracking-widest mb-2">Título / Asunto</label>
            <input
              value={titulo}
              onChange={e => setTitulo(e.target.value)}
              placeholder="Ej: Propuesta de ticketera para tu próximo evento"
              className="w-full bg-transparent text-[13px] text-zinc-200 placeholder:text-zinc-700 focus:outline-none"
            />
          </div>

          {/* Mensaje */}
          <div className="bg-[#141414] border border-[#1f1f1f] rounded-xl p-5">
            <div className="flex items-center justify-between mb-3">
              <label className="text-[10px] font-medium text-zinc-600 uppercase tracking-widest">Mensaje</label>
              <button
                type="button"
                onClick={generarConIA}
                disabled={loadingIA}
                className="flex items-center gap-1.5 px-2.5 py-1.5 bg-violet-500/10 hover:bg-violet-500/20 text-violet-400 text-[11px] font-medium rounded-lg transition-all border border-violet-500/20"
              >
                <Sparkles size={11} />
                {loadingIA ? 'Generando...' : 'Generar con IA'}
              </button>
            </div>

            {canal === 'email' ? (
              <RichEmailEditor value={mensaje} onChange={setMensaje} />
            ) : (
              <textarea
                value={mensaje}
                onChange={e => setMensaje(e.target.value)}
                rows={8}
                placeholder="Escribí el mensaje acá o usá la IA para generar uno..."
                className="w-full bg-[#0f0f0f] border border-[#1f1f1f] rounded-xl p-4 text-[13px] text-zinc-200 placeholder:text-zinc-700 focus:outline-none resize-none leading-relaxed"
              />
            )}
          </div>
        </div>

        {/* Destinatarios — 2 cols */}
        <div className="col-span-2">
          <div className="bg-[#141414] border border-[#1f1f1f] rounded-xl overflow-hidden h-full flex flex-col">
            <div className="p-4 border-b border-[#1a1a1a]">
              <div className="flex items-center justify-between mb-3">
                <label className="text-[10px] font-medium text-zinc-600 uppercase tracking-widest">Destinatarios</label>
                <button
                  type="button"
                  onClick={toggleSelectAll}
                  className="flex items-center gap-1 text-[11px] text-zinc-600 hover:text-zinc-300 transition-colors"
                >
                  {allSelected ? <CheckSquare size={12} /> : <Square size={12} />}
                  {allSelected ? 'Deseleccionar' : 'Todos'}
                </button>
              </div>
              <div className="relative">
                <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-600" />
                <input
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Buscar..."
                  className="w-full bg-[#1a1a1a] border border-[#252525] rounded-lg pl-8 pr-3 py-2 text-[12px] text-zinc-300 placeholder:text-zinc-700 focus:outline-none"
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto">
              {filteredProductores.length === 0 ? (
                <div className="py-8 text-center text-[12px] text-zinc-700">
                  {canal === 'whatsapp' ? 'Sin productores con teléfono' : 'Sin productores con email'}
                </div>
              ) : (
                filteredProductores.map(p => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => toggleSelect(p.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 border-b border-[#111] last:border-0 transition-colors text-left ${
                      selected.has(p.id) ? 'bg-violet-500/[0.07]' : 'hover:bg-white/[0.02]'
                    }`}
                  >
                    {selected.has(p.id)
                      ? <CheckSquare size={13} className="text-violet-400 flex-shrink-0" />
                      : <Square size={13} className="text-zinc-700 flex-shrink-0" />}
                    <div className="min-w-0">
                      <p className="text-[12px] font-medium text-zinc-200 truncate">{p.nombre}</p>
                      <p className="text-[11px] text-zinc-600 truncate">
                        {canal === 'whatsapp' ? p.telefono : p.email}
                      </p>
                    </div>
                  </button>
                ))
              )}
            </div>

            {selected.size > 0 && (
              <div className="p-3 border-t border-[#1a1a1a] bg-[#111]">
                <p className="text-[11px] text-zinc-500 text-center">
                  {selected.size} seleccionado{selected.size > 1 ? 's' : ''}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
