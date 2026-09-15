-- Eventos del Colectivo: publicación desde el panel, registro con cupo y galería de fotos.
-- El pago no es en línea: cada registro recibe un folio, el monto que le corresponde y las instrucciones de pago.

-- ---------------------------------------------------------------------------
-- Tablas
-- ---------------------------------------------------------------------------

create table public.eventos (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and char_length(slug) <= 80),
  titulo text not null check (char_length(titulo) between 3 and 120),
  resumen text not null check (char_length(resumen) between 10 and 300),
  descripcion text not null default '' check (char_length(descripcion) <= 5000),
  inicia_en timestamptz not null,
  termina_en timestamptz,
  lugar text not null check (char_length(lugar) between 2 and 160),
  direccion text check (direccion is null or char_length(direccion) <= 300),
  mapa_url text check (mapa_url is null or (mapa_url ~ '^https://' and char_length(mapa_url) <= 500)),
  precio_publico numeric(10, 2) check (precio_publico is null or precio_publico >= 0),
  precio_miembro numeric(10, 2) check (precio_miembro is null or precio_miembro >= 0),
  cupo integer check (cupo is null or cupo > 0),
  lugares_ocupados integer not null default 0 check (lugares_ocupados >= 0),
  instrucciones_pago text check (instrucciones_pago is null or char_length(instrucciones_pago) <= 2000),
  portada_ruta text check (portada_ruta is null or char_length(portada_ruta) <= 300),
  registro_abierto boolean not null default true,
  publicado boolean not null default false,
  creado_por uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint eventos_fechas_coherentes check (termina_en is null or termina_en >= inicia_en)
);

comment on table public.eventos is 'Eventos del Colectivo publicados desde el panel del Consejo.';
comment on column public.eventos.lugares_ocupados is 'Registros no cancelados; lo mantiene un trigger, no se edita a mano.';

create index eventos_publicados_idx on public.eventos (publicado, inicia_en desc);

create trigger eventos_updated_at
  before update on public.eventos
  for each row execute function public.set_updated_at();

create table public.eventos_fotos (
  id uuid primary key default gen_random_uuid(),
  evento_id uuid not null references public.eventos (id) on delete cascade,
  ruta text not null check (char_length(ruta) <= 300),
  orden integer not null default 0,
  created_at timestamptz not null default now()
);

comment on table public.eventos_fotos is 'Galería de fotos de cada evento (archivos en el bucket eventos).';

create index eventos_fotos_evento_idx on public.eventos_fotos (evento_id, orden);

create type public.estado_registro as enum ('pendiente_pago', 'pagado', 'cancelado');

create table public.registros_evento (
  id uuid primary key default gen_random_uuid(),
  -- restrict: un evento con registros no se puede borrar por accidente.
  evento_id uuid not null references public.eventos (id) on delete restrict,
  folio text not null unique,
  nombre text not null check (char_length(nombre) between 3 and 120),
  correo text not null check (char_length(correo) between 5 and 254),
  telefono text not null check (char_length(telefono) between 10 and 20),
  organizacion text check (organizacion is null or char_length(organizacion) <= 120),
  es_miembro boolean not null default false,
  monto numeric(10, 2) not null default 0 check (monto >= 0),
  estado public.estado_registro not null default 'pendiente_pago',
  notas_consejo text check (notas_consejo is null or char_length(notas_consejo) <= 1000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.registros_evento is 'Registros a eventos; se crean solo con public.registrar_en_evento().';

-- Un correo solo puede tener un registro activo por evento.
create unique index registros_evento_correo_activo_idx
  on public.registros_evento (evento_id, lower(correo))
  where estado <> 'cancelado';

create index registros_evento_evento_idx on public.registros_evento (evento_id, created_at desc);

create trigger registros_evento_updated_at
  before update on public.registros_evento
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Contador de lugares ocupados
-- ---------------------------------------------------------------------------

create function privado.actualizar_lugares_ocupados()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  delta integer := 0;
begin
  if tg_op = 'INSERT' then
    if new.estado <> 'cancelado' then
      delta := 1;
    end if;
  elsif tg_op = 'UPDATE' then
    if old.estado <> 'cancelado' and new.estado = 'cancelado' then
      delta := -1;
    elsif old.estado = 'cancelado' and new.estado <> 'cancelado' then
      delta := 1;
    end if;
  end if;

  if delta <> 0 then
    update public.eventos
    set lugares_ocupados = greatest(lugares_ocupados + delta, 0)
    where id = new.evento_id;
  end if;

  return new;
end;
$$;

revoke execute on function privado.actualizar_lugares_ocupados() from public, anon, authenticated;

create trigger registros_evento_lugares
  after insert or update of estado on public.registros_evento
  for each row execute function privado.actualizar_lugares_ocupados();

-- ---------------------------------------------------------------------------
-- Registro público (única vía para crear registros)
-- ---------------------------------------------------------------------------
-- security definer a propósito: el público no puede leer registros ni solicitudes, pero esta
-- función necesita bloquear el evento (cupo), saber si el correo es de un miembro aprobado
-- y devolver el folio. Valida todo por dentro y solo expone lo necesario.

create function public.registrar_en_evento(
  p_evento_id uuid,
  p_nombre text,
  p_correo text,
  p_telefono text,
  p_organizacion text default null
)
returns table (folio text, monto numeric, es_miembro boolean, instrucciones_pago text)
language plpgsql
security definer
set search_path = ''
as $$
#variable_conflict use_column
declare
  v_evento public.eventos%rowtype;
  v_correo text := lower(btrim(p_correo));
  v_es_miembro boolean;
  v_monto numeric(10, 2);
  v_folio text;
begin
  -- Bloquea el evento para que dos registros simultáneos no rebasen el cupo.
  select * into v_evento from public.eventos e where e.id = p_evento_id for update;

  if not found or not v_evento.publicado then
    raise exception 'EVENTO_NO_DISPONIBLE' using errcode = 'P0001';
  end if;

  if not v_evento.registro_abierto or v_evento.inicia_en <= now() then
    raise exception 'REGISTRO_CERRADO' using errcode = 'P0001';
  end if;

  if v_evento.cupo is not null and v_evento.lugares_ocupados >= v_evento.cupo then
    raise exception 'CUPO_LLENO' using errcode = 'P0001';
  end if;

  select exists (
    select 1
    from public.solicitudes_afiliacion s
    where lower(s.correo) = v_correo
      and s.estado = 'aprobada'
  ) into v_es_miembro;

  v_monto := coalesce(
    case when v_es_miembro then coalesce(v_evento.precio_miembro, v_evento.precio_publico)
         else v_evento.precio_publico
    end,
    0
  );

  v_folio := 'CIJJ-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 6));

  insert into public.registros_evento (evento_id, folio, nombre, correo, telefono, organizacion, es_miembro, monto)
  values (
    v_evento.id,
    v_folio,
    btrim(p_nombre),
    v_correo,
    btrim(p_telefono),
    nullif(btrim(coalesce(p_organizacion, '')), ''),
    v_es_miembro,
    v_monto
  );

  return query select v_folio, v_monto, v_es_miembro, v_evento.instrucciones_pago;
end;
$$;

revoke execute on function public.registrar_en_evento(uuid, text, text, text, text) from public;
grant execute on function public.registrar_en_evento(uuid, text, text, text, text) to anon, authenticated;

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------

alter table public.eventos enable row level security;
alter table public.eventos_fotos enable row level security;
alter table public.registros_evento enable row level security;

-- Políticas separadas por rol: anon no tiene permiso sobre el esquema privado.
create policy "Público ve eventos publicados"
  on public.eventos for select to anon
  using (publicado);

create policy "Sesiones ven publicados y el Consejo todos"
  on public.eventos for select to authenticated
  using (publicado or (select privado.es_miembro_consejo()));

create policy "Consejo crea eventos"
  on public.eventos for insert to authenticated
  with check ((select privado.es_miembro_consejo()) and (creado_por is null or creado_por = (select auth.uid())));

create policy "Consejo edita eventos"
  on public.eventos for update to authenticated
  using ((select privado.es_miembro_consejo()))
  with check ((select privado.es_miembro_consejo()));

create policy "Consejo elimina eventos"
  on public.eventos for delete to authenticated
  using ((select privado.es_miembro_consejo()));

create policy "Público ve fotos de eventos publicados"
  on public.eventos_fotos for select to anon
  using (exists (select 1 from public.eventos e where e.id = evento_id and e.publicado));

create policy "Sesiones ven fotos publicadas y el Consejo todas"
  on public.eventos_fotos for select to authenticated
  using (
    (select privado.es_miembro_consejo())
    or exists (select 1 from public.eventos e where e.id = evento_id and e.publicado)
  );

create policy "Consejo agrega fotos"
  on public.eventos_fotos for insert to authenticated
  with check ((select privado.es_miembro_consejo()));

create policy "Consejo ordena fotos"
  on public.eventos_fotos for update to authenticated
  using ((select privado.es_miembro_consejo()))
  with check ((select privado.es_miembro_consejo()));

create policy "Consejo elimina fotos"
  on public.eventos_fotos for delete to authenticated
  using ((select privado.es_miembro_consejo()));

create policy "Consejo ve registros"
  on public.registros_evento for select to authenticated
  using ((select privado.es_miembro_consejo()));

create policy "Consejo actualiza registros"
  on public.registros_evento for update to authenticated
  using ((select privado.es_miembro_consejo()))
  with check ((select privado.es_miembro_consejo()));

-- ---------------------------------------------------------------------------
-- Privilegios explícitos (Data API)
-- ---------------------------------------------------------------------------

revoke all on public.eventos, public.eventos_fotos, public.registros_evento from anon, authenticated;

grant select on public.eventos, public.eventos_fotos to anon, authenticated;

grant insert (
  slug, titulo, resumen, descripcion, inicia_en, termina_en, lugar, direccion, mapa_url,
  precio_publico, precio_miembro, cupo, instrucciones_pago, portada_ruta, registro_abierto, publicado, creado_por
) on public.eventos to authenticated;

grant update (
  slug, titulo, resumen, descripcion, inicia_en, termina_en, lugar, direccion, mapa_url,
  precio_publico, precio_miembro, cupo, instrucciones_pago, portada_ruta, registro_abierto, publicado
) on public.eventos to authenticated;

grant delete on public.eventos to authenticated;

grant insert (evento_id, ruta, orden), delete, update (orden) on public.eventos_fotos to authenticated;

grant select on public.registros_evento to authenticated;
grant update (estado, notas_consejo) on public.registros_evento to authenticated;

-- ---------------------------------------------------------------------------
-- Storage: imágenes de eventos
-- ---------------------------------------------------------------------------
-- Bucket público (las portadas y galerías se ven en el sitio); solo el Consejo sube o borra.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('eventos', 'eventos', true, 5242880, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

create policy "Consejo sube imágenes de eventos"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'eventos' and (select privado.es_miembro_consejo()));

create policy "Consejo consulta imágenes de eventos"
  on storage.objects for select to authenticated
  using (bucket_id = 'eventos' and (select privado.es_miembro_consejo()));

create policy "Consejo reemplaza imágenes de eventos"
  on storage.objects for update to authenticated
  using (bucket_id = 'eventos' and (select privado.es_miembro_consejo()))
  with check (bucket_id = 'eventos' and (select privado.es_miembro_consejo()));

create policy "Consejo borra imágenes de eventos"
  on storage.objects for delete to authenticated
  using (bucket_id = 'eventos' and (select privado.es_miembro_consejo()));
