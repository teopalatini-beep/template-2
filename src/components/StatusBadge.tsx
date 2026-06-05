interface StatusBadgeProps {
  status: string
}

const config: Record<string, { label: string; className: string }> = {
  prospecto:  { label: 'Prospecto',  className: 'bg-amber-500/10  text-amber-400  border-amber-500/15'  },
  activo:     { label: 'Activo',     className: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/15' },
  inactivo:   { label: 'Inactivo',   className: 'bg-zinc-500/10   text-zinc-400   border-zinc-500/15'   },
  borrador:   { label: 'Borrador',   className: 'bg-zinc-500/10   text-zinc-400   border-zinc-500/15'   },
  enviada:    { label: 'Enviada',    className: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/15' },
  enviado:    { label: 'Enviado',    className: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/15' },
  pendiente:  { label: 'Pendiente',  className: 'bg-amber-500/10  text-amber-400  border-amber-500/15'  },
  fallida:    { label: 'Fallida',    className: 'bg-red-500/10    text-red-400    border-red-500/15'    },
  fallido:    { label: 'Fallido',    className: 'bg-red-500/10    text-red-400    border-red-500/15'    },
  whatsapp:   { label: 'WhatsApp',   className: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/15' },
  email:      { label: 'Email',      className: 'bg-sky-500/10    text-sky-400    border-sky-500/15'    },
}

export default function StatusBadge({ status }: StatusBadgeProps) {
  const { label, className } = config[status] ?? {
    label: status,
    className: 'bg-zinc-500/10 text-zinc-400 border-zinc-500/15',
  }

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium border ${className}`}>
      {label}
    </span>
  )
}
