-- ONE-TIME script for the existing production database (created with the original Spanish migrations).
-- Renames every schema object to the English names used by the current migrations, keeping all data.
-- New projects do NOT need this: they run supabase/migrations/* directly.
--
-- Run it in the SQL Editor BEFORE supabase/migrations/20260924000000_member_network.sql, and deploy the
-- English version of the app right after (the old app stops working once this runs).
-- Afterwards, move the event images with `node scripts/move-event-images.mjs` (see docs/go-live.md).
-- It runs in a single transaction: if anything fails, nothing changes.

begin;

-- ---------------------------------------------------------------------------
-- Schema and enums
-- ---------------------------------------------------------------------------

alter schema privado rename to private;

alter type public.estado_solicitud rename to application_status;
alter type public.application_status rename value 'pendiente' to 'pending';
alter type public.application_status rename value 'aprobada' to 'approved';
alter type public.application_status rename value 'rechazada' to 'rejected';

alter type public.rol_consejo rename to board_role;
alter type public.board_role rename value 'revisor' to 'reviewer';

alter type public.estado_registro rename to registration_status;
alter type public.registration_status rename value 'pendiente_pago' to 'pending_payment';
alter type public.registration_status rename value 'pagado' to 'paid';
alter type public.registration_status rename value 'cancelado' to 'cancelled';

-- ---------------------------------------------------------------------------
-- Tables and columns
-- ---------------------------------------------------------------------------

alter table public.solicitudes_afiliacion rename to membership_applications;
alter table public.membership_applications rename column nombre to full_name;
alter table public.membership_applications rename column correo to email;
alter table public.membership_applications rename column telefono to phone;
alter table public.membership_applications rename column municipio to municipality;
alter table public.membership_applications rename column confirma_mayoria_edad to confirms_legal_age;
alter table public.membership_applications rename column acepta_aviso_privacidad to accepts_privacy_notice;
alter table public.membership_applications rename column estado to status;
alter table public.membership_applications rename column notas_consejo to board_notes;
alter table public.membership_applications rename column revisado_por to reviewed_by;
alter table public.membership_applications rename column revisado_en to reviewed_at;

alter table public.miembros_consejo rename to board_members;
alter table public.board_members rename column usuario_id to user_id;
alter table public.board_members rename column nombre to full_name;
alter table public.board_members rename column rol to role;
alter table public.board_members rename column activo to is_active;

alter table public.eventos rename to events;
alter table public.events rename column titulo to title;
alter table public.events rename column resumen to summary;
alter table public.events rename column descripcion to description;
alter table public.events rename column inicia_en to starts_at;
alter table public.events rename column termina_en to ends_at;
alter table public.events rename column lugar to venue;
alter table public.events rename column direccion to address;
alter table public.events rename column mapa_url to map_url;
alter table public.events rename column precio_publico to public_price;
alter table public.events rename column precio_miembro to member_price;
alter table public.events rename column cupo to capacity;
alter table public.events rename column lugares_ocupados to spots_taken;
alter table public.events rename column instrucciones_pago to payment_instructions;
alter table public.events rename column portada_ruta to cover_path;
alter table public.events rename column registro_abierto to registration_open;
alter table public.events rename column publicado to is_published;
alter table public.events rename column creado_por to created_by;

alter table public.eventos_fotos rename to event_photos;
alter table public.event_photos rename column evento_id to event_id;
alter table public.event_photos rename column ruta to path;
alter table public.event_photos rename column orden to sort_order;

alter table public.registros_evento rename to event_registrations;
alter table public.event_registrations rename column evento_id to event_id;
alter table public.event_registrations rename column folio to confirmation_code;
alter table public.event_registrations rename column nombre to full_name;
alter table public.event_registrations rename column correo to email;
alter table public.event_registrations rename column telefono to phone;
alter table public.event_registrations rename column organizacion to organization;
alter table public.event_registrations rename column es_miembro to is_member;
alter table public.event_registrations rename column monto to amount_due;
alter table public.event_registrations rename column estado to status;
alter table public.event_registrations rename column notas_consejo to board_notes;

-- ---------------------------------------------------------------------------
-- Constraint and index names
-- ---------------------------------------------------------------------------

alter table public.membership_applications rename constraint solicitudes_afiliacion_revision_coherente to membership_applications_review_consistency;
alter table public.membership_applications rename constraint solicitudes_afiliacion_notas_longitud to membership_applications_board_notes_length;
alter table public.events rename constraint eventos_fechas_coherentes to events_dates_consistency;

alter index public.solicitudes_afiliacion_correo_pendiente_idx rename to membership_applications_pending_email_idx;
alter index public.solicitudes_afiliacion_estado_idx rename to membership_applications_status_idx;
alter index public.eventos_publicados_idx rename to events_published_idx;
alter index public.eventos_fotos_evento_idx rename to event_photos_event_idx;
alter index public.registros_evento_correo_activo_idx rename to event_registrations_active_email_idx;
alter index public.registros_evento_evento_idx rename to event_registrations_event_idx;

-- Auto-generated names (<table>_<column>_check/_key/_fkey/_pkey) follow the table and column renames.
do $$
declare
  v_tables constant text[][] := array[
    ['solicitudes_afiliacion', 'membership_applications'],
    ['miembros_consejo', 'board_members'],
    ['registros_evento', 'event_registrations'],
    ['eventos_fotos', 'event_photos'],
    ['eventos', 'events']
  ];
  -- Longest first so that shorter names never match inside longer ones.
  v_columns constant text[][] := array[
    ['acepta_aviso_privacidad', 'accepts_privacy_notice'],
    ['confirma_mayoria_edad', 'confirms_legal_age'],
    ['instrucciones_pago', 'payment_instructions'],
    ['lugares_ocupados', 'spots_taken'],
    ['registro_abierto', 'registration_open'],
    ['precio_publico', 'public_price'],
    ['precio_miembro', 'member_price'],
    ['notas_consejo', 'board_notes'],
    ['revisado_por', 'reviewed_by'],
    ['revisado_en', 'reviewed_at'],
    ['portada_ruta', 'cover_path'],
    ['organizacion', 'organization'],
    ['descripcion', 'description'],
    ['creado_por', 'created_by'],
    ['usuario_id', 'user_id'],
    ['evento_id', 'event_id'],
    ['termina_en', 'ends_at'],
    ['inicia_en', 'starts_at'],
    ['es_miembro', 'is_member'],
    ['direccion', 'address'],
    ['municipio', 'municipality'],
    ['publicado', 'is_published'],
    ['telefono', 'phone'],
    ['mapa_url', 'map_url'],
    ['resumen', 'summary'],
    ['titulo', 'title'],
    ['nombre', 'full_name'],
    ['correo', 'email'],
    ['estado', 'status'],
    ['activo', 'is_active'],
    ['lugar', 'venue'],
    ['monto', 'amount_due'],
    ['folio', 'confirmation_code'],
    ['orden', 'sort_order'],
    ['ruta', 'path'],
    ['cupo', 'capacity'],
    ['rol', 'role']
  ];
  v_constraint record;
  v_new_name text;
  i int;
begin
  for v_constraint in
    select c.conname, c.conrelid::regclass::text as table_name, t.relname
    from pg_constraint c
    join pg_class t on t.oid = c.conrelid
    join pg_namespace n on n.oid = t.relnamespace
    where n.nspname = 'public'
      and t.relname in ('membership_applications', 'board_members', 'events', 'event_photos', 'event_registrations')
  loop
    v_new_name := v_constraint.conname;
    for i in 1 .. array_length(v_tables, 1) loop
      if v_new_name like v_tables[i][1] || '\_%' then
        v_new_name := v_tables[i][2] || substr(v_new_name, length(v_tables[i][1]) + 1);
        exit;
      end if;
    end loop;
    v_new_name := '_' || substr(v_new_name, length(v_constraint.relname) + 2) || '_';
    for i in 1 .. array_length(v_columns, 1) loop
      v_new_name := replace(v_new_name, '_' || v_columns[i][1] || '_', '_' || v_columns[i][2] || '_');
    end loop;
    v_new_name := v_constraint.relname || v_new_name;
    v_new_name := left(v_new_name, length(v_new_name) - 1);
    if v_new_name <> v_constraint.conname then
      execute format('alter table %s rename constraint %I to %I', v_constraint.table_name, v_constraint.conname, v_new_name);
    end if;
  end loop;
end;
$$;

-- ---------------------------------------------------------------------------
-- Triggers
-- ---------------------------------------------------------------------------

alter trigger solicitudes_afiliacion_updated_at on public.membership_applications rename to membership_applications_updated_at;
alter trigger miembros_consejo_updated_at on public.board_members rename to board_members_updated_at;
alter trigger eventos_updated_at on public.events rename to events_updated_at;
alter trigger registros_evento_updated_at on public.event_registrations rename to event_registrations_updated_at;
alter trigger registros_evento_lugares on public.event_registrations rename to event_registrations_spots_taken;

-- ---------------------------------------------------------------------------
-- Functions (bodies are stored as text, so they are rewritten with the new names)
-- ---------------------------------------------------------------------------

alter function private.es_miembro_consejo() rename to is_board_member;
create or replace function private.is_board_member()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.board_members
    where user_id = (select auth.uid())
      and is_active
  );
$$;

alter function private.actualizar_lugares_ocupados() rename to update_spots_taken;
create or replace function private.update_spots_taken()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  delta integer := 0;
begin
  if tg_op = 'INSERT' then
    if new.status <> 'cancelled' then
      delta := 1;
    end if;
  elsif tg_op = 'UPDATE' then
    if old.status <> 'cancelled' and new.status = 'cancelled' then
      delta := -1;
    elsif old.status = 'cancelled' and new.status <> 'cancelled' then
      delta := 1;
    end if;
  end if;

  if delta <> 0 then
    update public.events
    set spots_taken = greatest(spots_taken + delta, 0)
    where id = new.event_id;
  end if;

  return new;
end;
$$;

-- Parameter and result names change, so this one is replaced (nothing depends on it).
drop function public.registrar_en_evento(uuid, text, text, text, text);

create function public.register_for_event(
  p_event_id uuid,
  p_full_name text,
  p_email text,
  p_phone text,
  p_organization text default null
)
returns table (confirmation_code text, amount_due numeric, is_member boolean, payment_instructions text)
language plpgsql
security definer
set search_path = ''
as $$
#variable_conflict use_column
declare
  v_event public.events%rowtype;
  v_email text := lower(btrim(p_email));
  v_is_member boolean;
  v_amount_due numeric(10, 2);
  v_confirmation_code text;
begin
  -- Locks the event so two simultaneous registrations cannot exceed capacity.
  select * into v_event from public.events e where e.id = p_event_id for update;

  if not found or not v_event.is_published then
    raise exception 'EVENT_UNAVAILABLE' using errcode = 'P0001';
  end if;

  if not v_event.registration_open or v_event.starts_at <= now() then
    raise exception 'REGISTRATION_CLOSED' using errcode = 'P0001';
  end if;

  if v_event.capacity is not null and v_event.spots_taken >= v_event.capacity then
    raise exception 'EVENT_FULL' using errcode = 'P0001';
  end if;

  select exists (
    select 1
    from public.membership_applications a
    where lower(a.email) = v_email
      and a.status = 'approved'
  ) into v_is_member;

  v_amount_due := coalesce(
    case when v_is_member then coalesce(v_event.member_price, v_event.public_price)
         else v_event.public_price
    end,
    0
  );

  v_confirmation_code := 'CIJJ-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 6));

  insert into public.event_registrations (event_id, confirmation_code, full_name, email, phone, organization, is_member, amount_due)
  values (
    v_event.id,
    v_confirmation_code,
    btrim(p_full_name),
    v_email,
    btrim(p_phone),
    nullif(btrim(coalesce(p_organization, '')), ''),
    v_is_member,
    v_amount_due
  );

  return query select v_confirmation_code, v_amount_due, v_is_member, v_event.payment_instructions;
end;
$$;

revoke execute on function public.register_for_event(uuid, text, text, text, text) from public;
grant execute on function public.register_for_event(uuid, text, text, text, text) to anon, authenticated;

-- ---------------------------------------------------------------------------
-- Comments
-- ---------------------------------------------------------------------------

comment on table public.membership_applications is 'Applications to join the Colectivo, reviewed by the Consejo Directivo.';
comment on table public.board_members is 'Consejo Directivo members with access to the applications panel.';
comment on table public.events is 'Colectivo events published from the Consejo panel.';
comment on column public.events.spots_taken is 'Non-cancelled registrations; maintained by a trigger, never edited by hand.';
comment on table public.event_photos is 'Photo gallery of each event (files in the events bucket).';
comment on table public.event_registrations is 'Event registrations; created only through public.register_for_event().';

-- ---------------------------------------------------------------------------
-- Policies: recreated with the exact definitions of the current migrations (renaming alone would keep
-- the old function name as an internal alias inside each policy expression).
-- ---------------------------------------------------------------------------

drop policy "Público puede enviar solicitudes pendientes" on public.membership_applications;
drop policy "Consejo puede ver a sus miembros" on public.board_members;
drop policy "Consejo puede ver solicitudes" on public.membership_applications;
drop policy "Consejo puede revisar solicitudes" on public.membership_applications;
drop policy "Público ve eventos publicados" on public.events;
drop policy "Sesiones ven publicados y el Consejo todos" on public.events;
drop policy "Consejo crea eventos" on public.events;
drop policy "Consejo edita eventos" on public.events;
drop policy "Consejo elimina eventos" on public.events;
drop policy "Público ve fotos de eventos publicados" on public.event_photos;
drop policy "Sesiones ven fotos publicadas y el Consejo todas" on public.event_photos;
drop policy "Consejo agrega fotos" on public.event_photos;
drop policy "Consejo ordena fotos" on public.event_photos;
drop policy "Consejo elimina fotos" on public.event_photos;
drop policy "Consejo ve registros" on public.event_registrations;
drop policy "Consejo actualiza registros" on public.event_registrations;

create policy "Public can submit pending applications"
  on public.membership_applications
  for insert
  to anon, authenticated
  with check (
    status = 'pending'
    and board_notes is null
    and reviewed_by is null
    and reviewed_at is null
  );

create policy "Board can read its members"
  on public.board_members
  for select
  to authenticated
  using ((select private.is_board_member()));

create policy "Board can read applications"
  on public.membership_applications
  for select
  to authenticated
  using ((select private.is_board_member()));

create policy "Board can review applications"
  on public.membership_applications
  for update
  to authenticated
  using ((select private.is_board_member()))
  with check (
    (select private.is_board_member())
    and (reviewed_by is null or reviewed_by = (select auth.uid()))
  );

create policy "Public reads published events"
  on public.events for select to anon
  using (is_published);

create policy "Sessions read published events and the board reads all"
  on public.events for select to authenticated
  using (is_published or (select private.is_board_member()));

create policy "Board creates events"
  on public.events for insert to authenticated
  with check ((select private.is_board_member()) and (created_by is null or created_by = (select auth.uid())));

create policy "Board updates events"
  on public.events for update to authenticated
  using ((select private.is_board_member()))
  with check ((select private.is_board_member()));

create policy "Board deletes events"
  on public.events for delete to authenticated
  using ((select private.is_board_member()));

create policy "Public reads photos of published events"
  on public.event_photos for select to anon
  using (exists (select 1 from public.events e where e.id = event_id and e.is_published));

create policy "Sessions read published photos and the board reads all"
  on public.event_photos for select to authenticated
  using (
    (select private.is_board_member())
    or exists (select 1 from public.events e where e.id = event_id and e.is_published)
  );

create policy "Board adds photos"
  on public.event_photos for insert to authenticated
  with check ((select private.is_board_member()));

create policy "Board reorders photos"
  on public.event_photos for update to authenticated
  using ((select private.is_board_member()))
  with check ((select private.is_board_member()));

create policy "Board deletes photos"
  on public.event_photos for delete to authenticated
  using ((select private.is_board_member()));

create policy "Board reads registrations"
  on public.event_registrations for select to authenticated
  using ((select private.is_board_member()));

create policy "Board updates registrations"
  on public.event_registrations for update to authenticated
  using ((select private.is_board_member()))
  with check ((select private.is_board_member()));

-- ---------------------------------------------------------------------------
-- Storage: new "events" bucket. The old "eventos" bucket stays (without policies) until
-- scripts/move-event-images.mjs copies its files and deletes it.
-- ---------------------------------------------------------------------------

drop policy "Consejo sube imágenes de eventos" on storage.objects;
drop policy "Consejo consulta imágenes de eventos" on storage.objects;
drop policy "Consejo reemplaza imágenes de eventos" on storage.objects;
drop policy "Consejo borra imágenes de eventos" on storage.objects;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('events', 'events', true, 5242880, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

create policy "Board uploads event images"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'events' and (select private.is_board_member()));

create policy "Board reads event images"
  on storage.objects for select to authenticated
  using (bucket_id = 'events' and (select private.is_board_member()));

create policy "Board replaces event images"
  on storage.objects for update to authenticated
  using (bucket_id = 'events' and (select private.is_board_member()))
  with check (bucket_id = 'events' and (select private.is_board_member()));

create policy "Board deletes event images"
  on storage.objects for delete to authenticated
  using (bucket_id = 'events' and (select private.is_board_member()));

commit;
