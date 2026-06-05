-- Esquema base para Simplespass (ticketera de eventos)

create table if not exists clientes (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  empresa text,
  email text,
  telefono text,
  estado text not null default 'lead' check (estado in ('lead', 'activo', 'pausado')),
  created_at timestamptz not null default now()
);

create table if not exists proyectos (
  id uuid primary key default gen_random_uuid(),
  cliente_id uuid not null references clientes(id) on delete cascade,
  nombre text not null,
  servicio text not null default 'ticketera',
  estado text not null default 'pre_evento' check (estado in ('pre_evento', 'evento', 'conclusion')),
  fecha_evento timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists tareas (
  id uuid primary key default gen_random_uuid(),
  proyecto_id uuid not null references proyectos(id) on delete cascade,
  titulo text not null,
  responsable text,
  estado text not null default 'pendiente',
  prioridad text not null default 'media',
  fecha_limite date,
  created_at timestamptz not null default now()
);

create table if not exists usuarios (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  email text unique not null,
  rol text not null check (rol in ('admin', 'operaciones', 'comercial', 'soporte')),
  created_at timestamptz not null default now()
);
