-- Membership applications to the Colectivo de Ingenieros Jóvenes de Jalisco A.C.
-- Flow: the public site inserts with status 'pending'; the Consejo reviews them from the panel.

create type public.application_status as enum ('pending', 'approved', 'rejected');

create table public.membership_applications (
  id uuid primary key default gen_random_uuid(),
  full_name text not null check (char_length(full_name) between 3 and 120),
  email text not null check (char_length(email) between 5 and 254),
  phone text not null check (char_length(phone) between 10 and 20),
  municipality text not null check (char_length(municipality) between 2 and 80),
  confirms_legal_age boolean not null check (confirms_legal_age),
  accepts_privacy_notice boolean not null check (accepts_privacy_notice),
  status public.application_status not null default 'pending',
  board_notes text,
  reviewed_by uuid references auth.users (id) on delete set null,
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.membership_applications is 'Applications to join the Colectivo, reviewed by the Consejo Directivo.';

-- Prevents duplicate applications while one is still pending.
create unique index membership_applications_pending_email_idx
  on public.membership_applications (lower(email))
  where status = 'pending';

create index membership_applications_status_idx
  on public.membership_applications (status, created_at desc);

create function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger membership_applications_updated_at
  before update on public.membership_applications
  for each row execute function public.set_updated_at();

-- Security: the public can only create pending applications; it cannot read or modify them.
alter table public.membership_applications enable row level security;

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
