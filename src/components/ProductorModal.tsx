'use client'

import { useState, useEffect } from 'react'
import { X } from 'lucide-react'
import { Productor, EstadoProductor } from '@/lib/types'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'

const schema = z.object({
  nombre: z.string().min(1, 'El nombre es requerido'),
  empresa: z.string().optional(),
  telefono: z.string().optional(),
  email: z.string().email('Email inválido').optional().or(z.literal('')),
  tipo_evento: z.string().optional(),
  estado: z.enum(['prospecto', 'activo', 'inactivo']),
  notas: z.string().optional(),
})

type FormData = z.infer<typeof schema>

const tiposEvento = ['Recital', 'Fiesta', 'Teatro', 'Corporativo', 'Deportivo', 'Otro']

interface ProductorModalProps {
  open: boolean
  onClose: () => void
  onSave: () => void
  productor?: Productor | null
}

function Field({ label, error, required, children }: {
  label: string
  error?: string
  required?: boolean
  children: React.ReactNode
}) {
  return (
    <div>
      <label className="block text-[11px] font-medium text-zinc-500 mb-1.5 uppercase tracking-wide">
        {label} {required && <span className="text-red-400 normal-case">*</span>}
      </label>
      {children}
      {error && <p className="text-[11px] text-red-400 mt-1">{error}</p>}
    </div>
  )
}

const inputClass = 'w-full bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg px-3 py-2 text-sm text-white placeholder-zinc-700 focus:outline-none focus:border-violet-500/60 focus:ring-1 focus:ring-violet-500/20 transition-all'

export default function ProductorModal({ open, onClose, onSave, productor }: ProductorModalProps) {
  const [serverError, setServerError] = useState('')

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { estado: 'prospecto' },
  })

  useEffect(() => {
    if (open) {
      reset(productor ? {
        nombre: productor.nombre,
        empresa: productor.empresa ?? '',
        telefono: productor.telefono ?? '',
        email: productor.email ?? '',
        tipo_evento: productor.tipo_evento ?? '',
        estado: productor.estado,
        notas: productor.notas ?? '',
      } : {
        nombre: '', empresa: '', telefono: '', email: '',
        tipo_evento: '', estado: 'prospecto', notas: '',
      })
      setServerError('')
    }
  }, [open, productor, reset])

  if (!open) return null

  const onSubmit = async (data: FormData) => {
    setServerError('')
    try {
      const url = productor ? `/api/productores/${productor.id}` : '/api/productores'
      const method = productor ? 'PUT' : 'POST'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error ?? 'Error al guardar')
      }
      onSave()
      onClose()
    } catch (err: unknown) {
      setServerError(err instanceof Error ? err.message : 'Error desconocido')
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-lg bg-[#141414] border border-[#2a2a2a] rounded-2xl shadow-2xl shadow-black/50">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#1f1f1f]">
          <h2 className="text-[15px] font-semibold text-white">
            {productor ? 'Editar productor' : 'Agregar productor'}
          </h2>
          <button
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded-lg text-zinc-600 hover:text-zinc-300 hover:bg-white/5 transition-all"
          >
            <X size={15} />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <Field label="Nombre" required error={errors.nombre?.message}>
                <input {...register('nombre')} placeholder="Juan García" className={inputClass} />
              </Field>
            </div>
            <Field label="Empresa" error={errors.empresa?.message}>
              <input {...register('empresa')} placeholder="Eventos SA" className={inputClass} />
            </Field>
            <Field label="Estado" error={errors.estado?.message}>
              <select {...register('estado')} className={inputClass}>
                <option value="prospecto">Prospecto</option>
                <option value="activo">Activo</option>
                <option value="inactivo">Inactivo</option>
              </select>
            </Field>
            <Field label="Teléfono WhatsApp" error={errors.telefono?.message}>
              <input {...register('telefono')} placeholder="5491112345678" className={inputClass} />
            </Field>
            <Field label="Email" error={errors.email?.message}>
              <input {...register('email')} type="email" placeholder="juan@eventos.com" className={inputClass} />
            </Field>
            <div className="col-span-2">
              <Field label="Tipo de evento" error={errors.tipo_evento?.message}>
                <select {...register('tipo_evento')} className={inputClass}>
                  <option value="">Seleccionar...</option>
                  {tiposEvento.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </Field>
            </div>
            <div className="col-span-2">
              <Field label="Notas internas" error={errors.notas?.message}>
                <textarea
                  {...register('notas')}
                  rows={3}
                  placeholder="Notas sobre el productor..."
                  className={`${inputClass} resize-none`}
                />
              </Field>
            </div>
          </div>

          {serverError && (
            <div className="mt-4 text-[12px] text-red-400 bg-red-500/8 border border-red-500/15 rounded-lg px-3 py-2">
              {serverError}
            </div>
          )}

          <div className="flex gap-2 justify-end mt-5 pt-4 border-t border-[#1f1f1f]">
            <button type="button" onClick={onClose} className="px-4 py-2 text-[13px] text-zinc-500 hover:text-white border border-[#2a2a2a] hover:border-[#3a3a3a] rounded-lg transition-all">
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 text-[13px] font-medium bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white rounded-lg transition-all"
            >
              {isSubmitting ? 'Guardando...' : productor ? 'Guardar cambios' : 'Agregar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
