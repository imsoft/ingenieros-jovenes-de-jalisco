-- Panel del Consejo Directivo: quién puede entrar y qué puede hacer con las solicitudes.
-- Los miembros se dan de alta manualmente (ver docs/panel-consejo.md); no hay registro público.

-- Esquema no expuesto a la Data API para funciones auxiliares de seguridad.
create schema if not exists privado;
revoke all on schema privado from public, anon;
grant usage on schema privado to authenticated;

create type public.rol_consejo as enum ('admin', 'revisor');

create table public.miembros_consejo (
  usuario_id uuid primary key references auth.users (id) on delete cascade,
  nombre text not null check (char_length(nombre) between 2 and 120),
  rol public.rol_consejo not null default 'revisor',
  activo boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.miembros_consejo is 'Integrantes del Consejo Directivo con acceso al panel de solicitudes.';

create trigger miembros_consejo_updated_at
  before update on public.miembros_consejo
  for each row execute function public.set_updated_at();

-- ¿La persona con sesión es miembro activo del Consejo?
-- security definer para consultar miembros_consejo sin depender de sus propias políticas;
-- solo evalúa al usuario que llama (auth.uid()) y vive en un esquema no expuesto.
create function privado.es_miembro_consejo()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.miembros_consejo
    where usuario_id = (select auth.uid())
      and activo
  );
$$;

revoke execute on function privado.es_miembro_consejo() from public, anon;
grant execute on function privado.es_miembro_consejo() to authenticated;

-- Coherencia de la revisión: una solicitud pendiente no tiene fecha de revisión y una revisada sí.
alter table public.solicitudes_afiliacion
  add constraint solicitudes_afiliacion_revision_coherente check (
    (estado = 'pendiente' and revisado_en is null and revisado_por is null)
    or (estado <> 'pendiente' and revisado_en is not null)
  ),
  add constraint solicitudes_afiliacion_notas_longitud check (
    notas_consejo is null or char_length(notas_consejo) <= 1000
  );

-- RLS
alter table public.miembros_consejo enable row level security;

create policy "Consejo puede ver a sus miembros"
  on public.miembros_consejo
  for select
  to authenticated
  using ((select privado.es_miembro_consejo()));

create policy "Consejo puede ver solicitudes"
  on public.solicitudes_afiliacion
  for select
  to authenticated
  using ((select privado.es_miembro_consejo()));

create policy "Consejo puede revisar solicitudes"
  on public.solicitudes_afiliacion
  for update
  to authenticated
  using ((select privado.es_miembro_consejo()))
  with check (
    (select privado.es_miembro_consejo())
    and (revisado_por is null or revisado_por = (select auth.uid()))
  );

-- Privilegios explícitos (Supabase deja de exponer tablas automáticamente a la Data API).
revoke all on public.solicitudes_afiliacion from anon, authenticated;
grant insert on public.solicitudes_afiliacion to anon, authenticated;
grant select on public.solicitudes_afiliacion to authenticated;
grant update (estado, notas_consejo, revisado_por, revisado_en) on public.solicitudes_afiliacion to authenticated;

revoke all on public.miembros_consejo from anon, authenticated;
grant select on public.miembros_consejo to authenticated;
