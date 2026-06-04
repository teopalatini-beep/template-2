interface StatusBadgeProps {
  status: string
  type?: 'productor' | 'campana' | 'mensaje'
}

const colorMap: Record<string, string> = {
  prospecto: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
  activo: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  inactivo: 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20',
  borrador: 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20',
  enviada: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  enviado: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  pendiente: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
  fallida: 'bg-red-500/10 text-red-400 border-red-500/20',
  fallido: 'bg-red-500/10 text-red-400 border-red-500/20',
  whatsapp: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  email: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
}

const labelMap: Record<string, string> = {
  prospecto: 'Prospecto',
  activo: 'Activo',
  inactivo: 'Inactivo',
  borrador: 'Borrador',
  enviada: 'Enviada',
  enviado: 'Enviado',
  pendiente: 'Pendiente',
  fallida: 'Fallida',
  fallido: 'Fallido',
  whatsapp: 'WhatsApp',
  email: 'Email',
}

export default function StatusBadge({ status }: StatusBadgeProps) {
  const color = colorMap[status] ?? 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20'
  const label = labelMap[status] ?? status

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium border ${color}`}>
      {label}
    </span>
  )
}
