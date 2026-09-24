-- Red de miembros del Colectivo y roles del Consejo.
-- Miembro = correo con solicitud de afiliación aprobada, correo autorizado a mano o integrante activo del Consejo.
-- Roles del Consejo: el revisor revisa solicitudes y maneja eventos; el administrador además
-- gestiona al Consejo, borra eventos y modera perfiles.

-- ---------------------------------------------------------------------------
-- Roles del Consejo
-- ---------------------------------------------------------------------------

create function privado.es_admin_consejo()
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
      and rol = 'admin'
  );
$$;

revoke execute on function privado.es_admin_consejo() from public, anon;
grant execute on function privado.es_admin_consejo() to authenticated;

-- Borrar eventos pasa a ser exclusivo de administradores (crear y editar sigue abierto a todo el Consejo).
drop policy "Consejo elimina eventos" on public.eventos;

create policy "Administradores eliminan eventos"
  on public.eventos for delete to authenticated
  using ((select privado.es_admin_consejo()));

-- Invitaciones al Consejo para personas que aún no tienen cuenta.
-- Al crear su cuenta con ese correo, un trigger las convierte en integrantes del Consejo.
create table privado.invitaciones_consejo (
  correo text primary key check (correo = lower(correo) and char_length(correo) between 5 and 254),
  nombre text not null check (char_length(nombre) between 2 and 120),
  rol public.rol_consejo not null default 'revisor',
  invitado_por uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now()
);

revoke all on privado.invitaciones_consejo from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- Correos autorizados además de las solicitudes aprobadas (pruebas, casos especiales)
-- ---------------------------------------------------------------------------

create table privado.correos_autorizados (
  correo text primary key check (correo = lower(correo) and char_length(correo) between 5 and 254),
  motivo text not null check (char_length(motivo) between 3 and 200),
  created_at timestamptz not null default now()
);

comment on table privado.correos_autorizados is
  'Correos que pueden crear cuenta sin solicitud aprobada. Se administra desde el SQL Editor.';

revoke all on privado.correos_autorizados from public, anon, authenticated;

-- ¿Este correo puede tener cuenta? (lo usa el filtro de registro)
create function privado.correo_autorizado(p_correo text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
      select 1 from public.solicitudes_afiliacion s
      where s.estado = 'aprobada' and lower(s.correo) = lower(btrim(p_correo))
    )
    or exists (select 1 from privado.correos_autorizados c where c.correo = lower(btrim(p_correo)))
    or exists (select 1 from privado.invitaciones_consejo i where i.correo = lower(btrim(p_correo)));
$$;

revoke execute on function privado.correo_autorizado(text) from public, anon, authenticated;

-- ¿Una cuenta dada sigue siendo miembro? Se usa para ocultar perfiles de quien dejó de serlo.
create function privado.usuario_es_miembro(p_usuario_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(
    (select privado.correo_autorizado(u.email) from auth.users u where u.id = p_usuario_id),
    false
  )
  or exists (
    select 1 from public.miembros_consejo m where m.usuario_id = p_usuario_id and m.activo
  );
$$;

revoke execute on function privado.usuario_es_miembro(uuid) from public, anon;
grant execute on function privado.usuario_es_miembro(uuid) to authenticated;

-- ¿La persona con sesión es miembro? Usa el correo del JWT (no los metadatos, que el usuario puede editar).
create function privado.es_miembro()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(privado.correo_autorizado((select auth.jwt() ->> 'email')), false)
    or privado.es_miembro_consejo();
$$;

revoke execute on function privado.es_miembro() from public, anon;
grant execute on function privado.es_miembro() to authenticated;

-- Versión expuesta para que la app sepa si la sesión actual es de un miembro.
create function public.soy_miembro()
returns boolean
language sql
stable
set search_path = ''
as $$
  select privado.es_miembro();
$$;

revoke execute on function public.soy_miembro() from public, anon;
grant execute on function public.soy_miembro() to authenticated;

-- ---------------------------------------------------------------------------
-- Filtro de registro (Auth Hook "Before User Created")
-- ---------------------------------------------------------------------------
-- Aplica a registro con correo y con Google. NO aplica a usuarios creados con la API de administración
-- (dashboard de Supabase): esas cuentas existen, pero RLS les niega todo si su correo no está autorizado.
-- Se activa en Authentication → Hooks (ver docs/red-de-miembros.md).

create function public.hook_solo_correos_autorizados(event jsonb)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_correo text := lower(btrim(coalesce(event -> 'user' ->> 'email', '')));
begin
  if v_correo <> '' and privado.correo_autorizado(v_correo) then
    return '{}'::jsonb;
  end if;

  return jsonb_build_object(
    'error', jsonb_build_object('http_code', 403, 'message', 'CORREO_NO_AUTORIZADO')
  );
end;
$$;

grant execute on function public.hook_solo_correos_autorizados(jsonb) to supabase_auth_admin;
revoke execute on function public.hook_solo_correos_autorizados(jsonb) from public, anon, authenticated;

-- Al crearse una cuenta con un correo invitado al Consejo, se da de alta automáticamente.
create function privado.aceptar_invitacion_consejo()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_invitacion privado.invitaciones_consejo%rowtype;
begin
  delete from privado.invitaciones_consejo
  where correo = lower(btrim(coalesce(new.email, '')))
  returning * into v_invitacion;

  if found then
    insert into public.miembros_consejo (usuario_id, nombre, rol)
    values (new.id, v_invitacion.nombre, v_invitacion.rol)
    on conflict (usuario_id) do update set rol = excluded.rol, activo = true;
  end if;

  return new;
end;
$$;

revoke execute on function privado.aceptar_invitacion_consejo() from public, anon, authenticated;

create trigger al_crear_usuario_aceptar_invitacion_consejo
  after insert on auth.users
  for each row execute function privado.aceptar_invitacion_consejo();

-- ---------------------------------------------------------------------------
-- Gestión del Consejo (solo administradores)
-- ---------------------------------------------------------------------------

create function privado.exigir_admin_consejo()
returns void
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not privado.es_admin_consejo() then
    raise exception 'SOLO_ADMINISTRADORES' using errcode = 'P0001';
  end if;
end;
$$;

revoke execute on function privado.exigir_admin_consejo() from public, anon;
grant execute on function privado.exigir_admin_consejo() to authenticated;

-- Integrantes, bajas e invitaciones pendientes, con correo (que miembros_consejo no guarda).
create function public.listar_consejo()
returns table (
  usuario_id uuid,
  nombre text,
  correo text,
  rol public.rol_consejo,
  estado text,
  desde timestamptz
)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  perform privado.exigir_admin_consejo();

  return query
    select m.usuario_id, m.nombre, u.email::text, m.rol,
           case when m.activo then 'activo' else 'baja' end, m.created_at
    from public.miembros_consejo m
    join auth.users u on u.id = m.usuario_id
    union all
    select null::uuid, i.nombre, i.correo, i.rol, 'invitado', i.created_at
    from privado.invitaciones_consejo i
    order by 5, 2;
end;
$$;

revoke execute on function public.listar_consejo() from public, anon;
grant execute on function public.listar_consejo() to authenticated;

-- Agrega a alguien al Consejo: si ya tiene cuenta queda activo; si no, queda invitado.
create function public.agregar_consejo(p_correo text, p_nombre text, p_rol public.rol_consejo)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_correo text := lower(btrim(p_correo));
  v_usuario_id uuid;
begin
  perform privado.exigir_admin_consejo();

  select id into v_usuario_id from auth.users where lower(email) = v_correo limit 1;

  if v_usuario_id is not null then
    insert into public.miembros_consejo (usuario_id, nombre, rol)
    values (v_usuario_id, btrim(p_nombre), p_rol)
    on conflict (usuario_id) do update
      set nombre = excluded.nombre, rol = excluded.rol, activo = true;
    return 'activo';
  end if;

  insert into privado.invitaciones_consejo (correo, nombre, rol, invitado_por)
  values (v_correo, btrim(p_nombre), p_rol, (select auth.uid()))
  on conflict (correo) do update set nombre = excluded.nombre, rol = excluded.rol;
  return 'invitado';
end;
$$;

revoke execute on function public.agregar_consejo(text, text, public.rol_consejo) from public, anon;
grant execute on function public.agregar_consejo(text, text, public.rol_consejo) to authenticated;

-- Cambia rol o da de baja/reactiva. Nunca deja al Consejo sin administradores activos.
create function public.actualizar_consejo(p_usuario_id uuid, p_rol public.rol_consejo, p_activo boolean)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform privado.exigir_admin_consejo();

  -- Bloquea las filas de administradores para que dos cambios simultáneos no dejen cero.
  perform 1 from public.miembros_consejo where rol = 'admin' and activo for update;

  update public.miembros_consejo
  set rol = p_rol, activo = p_activo
  where usuario_id = p_usuario_id;

  if not found then
    raise exception 'NO_ENCONTRADO' using errcode = 'P0001';
  end if;

  if not exists (select 1 from public.miembros_consejo where rol = 'admin' and activo) then
    raise exception 'ULTIMO_ADMINISTRADOR' using errcode = 'P0001';
  end if;
end;
$$;

revoke execute on function public.actualizar_consejo(uuid, public.rol_consejo, boolean) from public, anon;
grant execute on function public.actualizar_consejo(uuid, public.rol_consejo, boolean) to authenticated;

create function public.cancelar_invitacion_consejo(p_correo text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform privado.exigir_admin_consejo();
  delete from privado.invitaciones_consejo where correo = lower(btrim(p_correo));
end;
$$;

revoke execute on function public.cancelar_invitacion_consejo(text) from public, anon;
grant execute on function public.cancelar_invitacion_consejo(text) to authenticated;

-- ---------------------------------------------------------------------------
-- Perfiles
-- ---------------------------------------------------------------------------

create table public.perfiles (
  usuario_id uuid primary key references auth.users (id) on delete cascade,
  nombre text not null check (char_length(nombre) between 2 and 120),
  ocupacion text check (ocupacion is null or char_length(ocupacion) <= 160),
  especialidad text check (especialidad is null or char_length(especialidad) <= 120),
  empresa text check (empresa is null or char_length(empresa) <= 120),
  puesto text check (puesto is null or char_length(puesto) <= 120),
  municipio text check (municipio is null or char_length(municipio) <= 80),
  biografia text check (biografia is null or char_length(biografia) <= 1000),
  linkedin_url text check (
    linkedin_url is null
    or (linkedin_url ~ '^https://([a-z]{2,3}\.)?linkedin\.com/' and char_length(linkedin_url) <= 300)
  ),
  instagram text check (instagram is null or instagram ~ '^[A-Za-z0-9._]{1,30}$'),
  sitio_web text check (sitio_web is null or (sitio_web ~ '^https?://' and char_length(sitio_web) <= 300)),
  foto_ruta text check (foto_ruta is null or char_length(foto_ruta) <= 300),
  -- visible lo decide cada miembro; suspendido solo lo cambia un administrador (moderar_perfil).
  visible boolean not null default true,
  suspendido boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.perfiles is 'Perfil de cada miembro en la red del Colectivo. Solo lo ven otros miembros.';

create index perfiles_directorio_idx on public.perfiles (visible, suspendido, nombre);

create trigger perfiles_updated_at
  before update on public.perfiles
  for each row execute function public.set_updated_at();

alter table public.perfiles enable row level security;

-- Un perfil ajeno se ve si es visible, no está suspendido y su dueño sigue siendo miembro.
-- Los administradores además ven los suspendidos, para poder restaurarlos.
create policy "Miembros ven perfiles del directorio y el propio"
  on public.perfiles for select to authenticated
  using (
    (select privado.es_miembro())
    and (
      usuario_id = (select auth.uid())
      or (
        privado.usuario_es_miembro(usuario_id)
        and ((visible and not suspendido) or (suspendido and (select privado.es_admin_consejo())))
      )
    )
  );

create policy "Miembros crean su propio perfil"
  on public.perfiles for insert to authenticated
  with check (usuario_id = (select auth.uid()) and (select privado.es_miembro()));

create policy "Miembros editan su propio perfil"
  on public.perfiles for update to authenticated
  using (usuario_id = (select auth.uid()))
  with check (usuario_id = (select auth.uid()) and (select privado.es_miembro()));

revoke all on public.perfiles from anon, authenticated;

grant select on public.perfiles to authenticated;

grant insert (
  usuario_id, nombre, ocupacion, especialidad, empresa, puesto, municipio, biografia,
  linkedin_url, instagram, sitio_web, foto_ruta, visible
) on public.perfiles to authenticated;

grant update (
  nombre, ocupacion, especialidad, empresa, puesto, municipio, biografia,
  linkedin_url, instagram, sitio_web, foto_ruta, visible
) on public.perfiles to authenticated;

-- Moderación: un administrador oculta o restaura un perfil ajeno del directorio.
create function public.moderar_perfil(p_usuario_id uuid, p_suspendido boolean)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform privado.exigir_admin_consejo();

  update public.perfiles set suspendido = p_suspendido where usuario_id = p_usuario_id;
  if not found then
    raise exception 'NO_ENCONTRADO' using errcode = 'P0001';
  end if;
end;
$$;

revoke execute on function public.moderar_perfil(uuid, boolean) from public, anon;
grant execute on function public.moderar_perfil(uuid, boolean) to authenticated;

-- ---------------------------------------------------------------------------
-- Eliminar la propia cuenta (derechos ARCO)
-- ---------------------------------------------------------------------------
-- Borra la cuenta y, en cascada, el perfil. Las fotos se borran antes desde la app con la API de Storage.
-- Los integrantes del Consejo deben ser dados de baja primero, para no dejarlo sin administradores.

create function public.eliminar_mi_cuenta()
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_usuario_id uuid := (select auth.uid());
begin
  if v_usuario_id is null then
    raise exception 'SIN_SESION' using errcode = 'P0001';
  end if;

  if exists (select 1 from public.miembros_consejo where usuario_id = v_usuario_id and activo) then
    raise exception 'ES_CONSEJO' using errcode = 'P0001';
  end if;

  delete from auth.users where id = v_usuario_id;
end;
$$;

revoke execute on function public.eliminar_mi_cuenta() from public, anon;
grant execute on function public.eliminar_mi_cuenta() to authenticated;

-- ---------------------------------------------------------------------------
-- Storage: fotos de perfil
-- ---------------------------------------------------------------------------
-- Bucket público con rutas no adivinables ({usuario_id}/{uuid}.ext); cada quien solo escribe en su carpeta.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('perfiles', 'perfiles', true, 2097152, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

create policy "Miembros suben su foto"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'perfiles'
    and (storage.foldername(name))[1] = (select auth.uid())::text
    and (select privado.es_miembro())
  );

create policy "Miembros consultan su carpeta de fotos"
  on storage.objects for select to authenticated
  using (bucket_id = 'perfiles' and (storage.foldername(name))[1] = (select auth.uid())::text);

create policy "Miembros reemplazan su foto"
  on storage.objects for update to authenticated
  using (bucket_id = 'perfiles' and (storage.foldername(name))[1] = (select auth.uid())::text)
  with check (bucket_id = 'perfiles' and (storage.foldername(name))[1] = (select auth.uid())::text);

create policy "Miembros borran su foto"
  on storage.objects for delete to authenticated
  using (bucket_id = 'perfiles' and (storage.foldername(name))[1] = (select auth.uid())::text);
