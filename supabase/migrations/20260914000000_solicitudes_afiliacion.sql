-- Solicitudes de afiliación al Colectivo de Ingenieros Jóvenes de Jalisco A.C.
-- Flujo: el sitio público inserta con estado 'pendiente'; el Consejo revisa desde el panel (fase 2).

create type public.estado_solicitud as enum ('pendiente', 'aprobada', 'rechazada');

create table public.solicitudes_afiliacion (
  id uuid primary key default gen_random_uuid(),
  nombre text not null check (char_length(nombre) between 3 and 120),
  correo text not null check (char_length(correo) between 5 and 254),
  telefono text not null check (char_length(telefono) between 10 and 20),
  municipio text not null check (char_length(municipio) between 2 and 80),
  confirma_mayoria_edad boolean not null check (confirma_mayoria_edad),
  acepta_aviso_privacidad boolean not null check (acepta_aviso_privacidad),
  estado public.estado_solicitud not null default 'pendiente',
  notas_consejo text,
  revisado_por uuid references auth.users (id) on delete set null,
  revisado_en timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.solicitudes_afiliacion is 'Solicitudes para ser miembro del Colectivo, revisadas por el Consejo Directivo.';

-- Evita solicitudes duplicadas mientras una siga pendiente.
create unique index solicitudes_afiliacion_correo_pendiente_idx
  on public.solicitudes_afiliacion (lower(correo))
  where estado = 'pendiente';

create index solicitudes_afiliacion_estado_idx
  on public.solicitudes_afiliacion (estado, created_at desc);

create function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger solicitudes_afiliacion_updated_at
  before update on public.solicitudes_afiliacion
  for each row execute function public.set_updated_at();

-- Seguridad: el público solo puede crear solicitudes pendientes; no puede leerlas ni modificarlas.
alter table public.solicitudes_afiliacion enable row level security;

create policy "Público puede enviar solicitudes pendientes"
  on public.solicitudes_afiliacion
  for insert
  to anon, authenticated
  with check (
    estado = 'pendiente'
    and notas_consejo is null
    and revisado_por is null
    and revisado_en is null
  );
