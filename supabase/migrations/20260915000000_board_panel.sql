-- Consejo Directivo panel: who can sign in and what they can do with applications.
-- Board members are managed from the panel itself (see docs/board-panel.md); there is no public sign-up for it.

-- Schema not exposed to the Data API, for security helper functions.
create schema if not exists private;
revoke all on schema private from public, anon;
grant usage on schema private to authenticated;

create type public.board_role as enum ('admin', 'reviewer');

create table public.board_members (
  user_id uuid primary key references auth.users (id) on delete cascade,
  full_name text not null check (char_length(full_name) between 2 and 120),
  role public.board_role not null default 'reviewer',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.board_members is 'Consejo Directivo members with access to the applications panel.';

create trigger board_members_updated_at
  before update on public.board_members
  for each row execute function public.set_updated_at();

-- Is the signed-in user an active board member?
-- security definer to read board_members without depending on its own policies;
-- it only evaluates the calling user (auth.uid()) and lives in a schema that is not exposed.
create function private.is_board_member()
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

revoke execute on function private.is_board_member() from public, anon;
grant execute on function private.is_board_member() to authenticated;

-- Review consistency: a pending application has no review date and a reviewed one does.
alter table public.membership_applications
  add constraint membership_applications_review_consistency check (
    (status = 'pending' and reviewed_at is null and reviewed_by is null)
    or (status <> 'pending' and reviewed_at is not null)
  ),
  add constraint membership_applications_board_notes_length check (
    board_notes is null or char_length(board_notes) <= 1000
  );

-- RLS
alter table public.board_members enable row level security;

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

-- Explicit privileges (Supabase no longer exposes new tables to the Data API automatically).
revoke all on public.membership_applications from anon, authenticated;
grant insert on public.membership_applications to anon, authenticated;
grant select on public.membership_applications to authenticated;
grant update (status, board_notes, reviewed_by, reviewed_at) on public.membership_applications to authenticated;

revoke all on public.board_members from anon, authenticated;
grant select on public.board_members to authenticated;
