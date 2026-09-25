-- Colectivo events: published from the panel, registration with capacity, and photo gallery.
-- Payment is not online: each registration gets a confirmation code, the amount due and the payment instructions.

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

create table public.events (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and char_length(slug) <= 80),
  title text not null check (char_length(title) between 3 and 120),
  summary text not null check (char_length(summary) between 10 and 300),
  description text not null default '' check (char_length(description) <= 5000),
  starts_at timestamptz not null,
  ends_at timestamptz,
  venue text not null check (char_length(venue) between 2 and 160),
  address text check (address is null or char_length(address) <= 300),
  map_url text check (map_url is null or (map_url ~ '^https://' and char_length(map_url) <= 500)),
  public_price numeric(10, 2) check (public_price is null or public_price >= 0),
  member_price numeric(10, 2) check (member_price is null or member_price >= 0),
  capacity integer check (capacity is null or capacity > 0),
  spots_taken integer not null default 0 check (spots_taken >= 0),
  payment_instructions text check (payment_instructions is null or char_length(payment_instructions) <= 2000),
  cover_path text check (cover_path is null or char_length(cover_path) <= 300),
  registration_open boolean not null default true,
  is_published boolean not null default false,
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint events_dates_consistency check (ends_at is null or ends_at >= starts_at)
);

comment on table public.events is 'Colectivo events published from the Consejo panel.';
comment on column public.events.spots_taken is 'Non-cancelled registrations; maintained by a trigger, never edited by hand.';

create index events_published_idx on public.events (is_published, starts_at desc);

create trigger events_updated_at
  before update on public.events
  for each row execute function public.set_updated_at();

create table public.event_photos (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events (id) on delete cascade,
  path text not null check (char_length(path) <= 300),
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

comment on table public.event_photos is 'Photo gallery of each event (files in the events bucket).';

create index event_photos_event_idx on public.event_photos (event_id, sort_order);

create type public.registration_status as enum ('pending_payment', 'paid', 'cancelled');

create table public.event_registrations (
  id uuid primary key default gen_random_uuid(),
  -- restrict: an event with registrations cannot be deleted by accident.
  event_id uuid not null references public.events (id) on delete restrict,
  confirmation_code text not null unique,
  full_name text not null check (char_length(full_name) between 3 and 120),
  email text not null check (char_length(email) between 5 and 254),
  phone text not null check (char_length(phone) between 10 and 20),
  organization text check (organization is null or char_length(organization) <= 120),
  is_member boolean not null default false,
  amount_due numeric(10, 2) not null default 0 check (amount_due >= 0),
  status public.registration_status not null default 'pending_payment',
  board_notes text check (board_notes is null or char_length(board_notes) <= 1000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.event_registrations is 'Event registrations; created only through public.register_for_event().';

-- An email can have only one active registration per event.
create unique index event_registrations_active_email_idx
  on public.event_registrations (event_id, lower(email))
  where status <> 'cancelled';

create index event_registrations_event_idx on public.event_registrations (event_id, created_at desc);

create trigger event_registrations_updated_at
  before update on public.event_registrations
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Spots-taken counter
-- ---------------------------------------------------------------------------

create function private.update_spots_taken()
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

revoke execute on function private.update_spots_taken() from public, anon, authenticated;

create trigger event_registrations_spots_taken
  after insert or update of status on public.event_registrations
  for each row execute function private.update_spots_taken();

-- ---------------------------------------------------------------------------
-- Public registration (the only way to create registrations)
-- ---------------------------------------------------------------------------
-- security definer on purpose: the public cannot read registrations or applications, but this
-- function needs to lock the event (capacity), know whether the email belongs to an approved member
-- and return the confirmation code. It validates everything inside and exposes only what is needed.

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
-- RLS
-- ---------------------------------------------------------------------------

alter table public.events enable row level security;
alter table public.event_photos enable row level security;
alter table public.event_registrations enable row level security;

-- Policies split by role: anon has no permission on the private schema.
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
-- Explicit privileges (Data API)
-- ---------------------------------------------------------------------------

revoke all on public.events, public.event_photos, public.event_registrations from anon, authenticated;

grant select on public.events, public.event_photos to anon, authenticated;

grant insert (
  slug, title, summary, description, starts_at, ends_at, venue, address, map_url,
  public_price, member_price, capacity, payment_instructions, cover_path, registration_open, is_published, created_by
) on public.events to authenticated;

grant update (
  slug, title, summary, description, starts_at, ends_at, venue, address, map_url,
  public_price, member_price, capacity, payment_instructions, cover_path, registration_open, is_published
) on public.events to authenticated;

grant delete on public.events to authenticated;

grant insert (event_id, path, sort_order), delete, update (sort_order) on public.event_photos to authenticated;

grant select on public.event_registrations to authenticated;
grant update (status, board_notes) on public.event_registrations to authenticated;

-- ---------------------------------------------------------------------------
-- Storage: event images
-- ---------------------------------------------------------------------------
-- Public bucket (covers and galleries are shown on the site); only the board uploads or deletes.

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
