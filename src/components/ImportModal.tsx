'use client'

import { useState, useRef } from 'react'
import { X, Upload, FileText, AlertCircle, CheckCircle } from 'lucide-react'
import { toast } from 'sonner'

interface ImportModalProps {
  open: boolean
  onClose: () => void
  onImported: () => void
}

function parseCSV(text: string): Record<string, string>[] {
  const lines = text.trim().split('\n').filter(l => l.trim())
  if (lines.length < 2) return []
  const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, '').toLowerCase())
  return lines.slice(1).map(line => {
    const values = line.split(',').map(v => v.trim().replace(/^"|"$/g, ''))
    const row: Record<string, string> = {}
    headers.forEach((h, i) => { row[h] = values[i] ?? '' })
    return row
  })
}

const CAMPOS = ['nombre*', 'empresa', 'email', 'telefono', 'tipo_evento', 'pais', 'estado', 'tags', 'notas']

export default function ImportModal({ open, onClose, onImported }: ImportModalProps) {
  const [rows, setRows] = useState<Record<string, string>[]>([])
  const [fileName, setFileName] = useState('')
  const [importing, setImporting] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  if (!open) return null

  const handleFile = (file: File) => {
    setFileName(file.name)
    const reader = new FileReader()
    reader.onload = e => {
      const text = e.target?.result as string
      const parsed = parseCSV(text)
      setRows(parsed)
    }
    reader.readAsText(file)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    if (file?.name.endsWith('.csv')) handleFile(file)
    else toast.error('Solo se aceptan archivos .csv')
  }

  const handleImport = async () => {
    if (!rows.length) return
    setImporting(true)
    try {
      const res = await fetch('/api/productores/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rows }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      toast.success(`${data.insertados} productores importados`)
      onImported()
      handleClose()
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Error al importar')
    } finally {
      setImporting(false)
    }
  }

  const handleClose = () => {
    setRows([]); setFileName(''); onClose()
  }

  const downloadTemplate = () => {
    const header = 'nombre,empresa,email,telefono,tipo_evento,pais,estado,tags,notas'
    const example = 'Juan García,Eventos SA,juan@eventos.com,5491112345678,Recital,Argentina,activo,rock;vip,Cliente desde 2024'
    const blob = new Blob([header + '\n' + example], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a'); a.href = url; a.download = 'plantilla_productores.csv'; a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={handleClose} />
      <div className="relative z-10 w-full max-w-2xl bg-[#141414] border border-[#2a2a2a] rounded-2xl shadow-2xl shadow-black/50">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#1f1f1f]">
          <h2 className="text-[15px] font-semibold text-white">Importar productores desde CSV</h2>
          <button onClick={handleClose} className="w-7 h-7 flex items-center justify-center rounded-lg text-zinc-600 hover:text-zinc-300 hover:bg-white/5 transition-all">
            <X size={15} />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Campos esperados */}
          <div className="bg-[#0f0f0f] border border-[#1f1f1f] rounded-xl p-4">
            <p className="text-[11px] font-medium text-zinc-500 uppercase tracking-widest mb-2">Columnas del CSV</p>
            <div className="flex flex-wrap gap-1.5">
              {CAMPOS.map(c => (
                <span key={c} className={`text-[11px] px-2 py-0.5 rounded-md font-mono border ${c.includes('*') ? 'bg-violet-500/10 text-violet-300 border-violet-500/20' : 'bg-[#1a1a1a] text-zinc-500 border-[#2a2a2a]'}`}>
                  {c}
                </span>
              ))}
            </div>
            <p className="text-[10px] text-zinc-700 mt-2">Tags separados por punto y coma (ej: rock;vip). Estado: prospecto | activo | inactivo</p>
            <button onClick={downloadTemplate} className="mt-2 text-[11px] text-violet-400 hover:text-violet-300 transition-colors flex items-center gap-1">
              <FileText size={11} /> Descargar plantilla
            </button>
          </div>

          {/* Drop zone */}
          {!rows.length ? (
            <div
              onDrop={handleDrop}
              onDragOver={e => e.preventDefault()}
              onClick={() => inputRef.current?.click()}
              className="border-2 border-dashed border-[#2a2a2a] hover:border-violet-500/40 rounded-xl py-10 text-center cursor-pointer transition-all group"
            >
              <Upload size={20} className="text-zinc-700 group-hover:text-violet-400 mx-auto mb-3 transition-colors" />
              <p className="text-[13px] text-zinc-500">Arrastrá el CSV acá o <span className="text-violet-400">hacé click</span></p>
              <p className="text-[11px] text-zinc-700 mt-1">Solo archivos .csv</p>
              <input ref={inputRef} type="file" accept=".csv" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f) }} />
            </div>
          ) : (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <CheckCircle size={14} className="text-emerald-400" />
                <p className="text-[13px] text-zinc-300"><span className="font-medium text-white">{rows.length}</span> registros en <span className="text-zinc-500">{fileName}</span></p>
                <button onClick={() => { setRows([]); setFileName('') }} className="ml-auto text-[11px] text-zinc-600 hover:text-zinc-400 transition-colors">Cambiar</button>
              </div>
              <div className="bg-[#0f0f0f] border border-[#1f1f1f] rounded-xl overflow-hidden max-h-48 overflow-y-auto">
                <table className="w-full text-[11px]">
                  <thead className="sticky top-0 bg-[#141414]">
                    <tr className="border-b border-[#1f1f1f]">
                      {Object.keys(rows[0]).slice(0, 5).map(h => (
                        <th key={h} className="px-3 py-2 text-left text-zinc-600 font-medium uppercase tracking-wider">{h}</th>
                      ))}
                      {Object.keys(rows[0]).length > 5 && <th className="px-3 py-2 text-zinc-700">...</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {rows.slice(0, 5).map((row, i) => (
                      <tr key={i} className="border-b border-[#111] last:border-0">
                        {Object.values(row).slice(0, 5).map((v, j) => (
                          <td key={j} className="px-3 py-2 text-zinc-400 truncate max-w-[120px]">{v || '—'}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
                {rows.length > 5 && <p className="px-3 py-2 text-[10px] text-zinc-700">... y {rows.length - 5} más</p>}
              </div>
            </div>
          )}

          {!rows.length && (
            <div className="flex items-start gap-2 bg-amber-500/5 border border-amber-500/15 rounded-xl px-4 py-3">
              <AlertCircle size={13} className="text-amber-400 shrink-0 mt-0.5" />
              <p className="text-[11px] text-amber-400/80">Los emails duplicados se van a insertar igual. Revisá la base antes de importar.</p>
            </div>
          )}
        </div>

        <div className="px-6 py-4 border-t border-[#1f1f1f] flex justify-end gap-3">
          <button onClick={handleClose} className="px-4 py-2 text-[13px] text-zinc-400 hover:text-zinc-200 transition-colors">Cancelar</button>
          <button
            onClick={handleImport}
            disabled={!rows.length || importing}
            className="px-4 py-2 bg-violet-600 hover:bg-violet-500 disabled:opacity-40 text-white text-[13px] font-medium rounded-lg transition-all flex items-center gap-2"
          >
            <Upload size={13} />
            {importing ? 'Importando...' : `Importar ${rows.length > 0 ? rows.length : ''} productores`}
          </button>
        </div>
      </div>
    </div>
  )
}
