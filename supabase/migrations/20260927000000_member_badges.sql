-- Badges on member profiles: the title of each Consejo member (set by admins in the panel)
-- and special recognitions (e.g. who built the platform), granted only from the SQL Editor.

-- ---------------------------------------------------------------------------
-- Consejo positions
-- ---------------------------------------------------------------------------

alter table public.board_members
  add column title text check (title is null or char_length(title) between 2 and 60);

comment on column public.board_members.title is 'Public title inside the Consejo (Presidente, Secretaria…), shown as a badge on the profile.';

create function public.set_board_title(p_user_id uuid, p_title text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform private.require_board_admin();

  update public.board_members
  set title = nullif(btrim(p_title), '')
  where user_id = p_user_id;

  if not found then
    raise exception 'NOT_FOUND' using errcode = 'P0001';
  end if;
end;
$$;

revoke execute on function public.set_board_title(uuid, text) from public, anon;
grant execute on function public.set_board_title(uuid, text) to authenticated;

-- The panel's board list now includes the title (return type changes, so it is recreated).
drop function public.list_board();

create function public.list_board()
returns table (
  user_id uuid,
  full_name text,
  email text,
  role public.board_role,
  status text,
  since timestamptz,
  title text
)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  perform private.require_board_admin();

  return query
    select bm.user_id, bm.full_name, u.email::text, bm.role,
           case when bm.is_active then 'active' else 'inactive' end, bm.created_at, bm.title
    from public.board_members bm
    join auth.users u on u.id = bm.user_id
    union all
    select null::uuid, bi.full_name, bi.email, bi.role, 'invited', bi.created_at, null::text
    from private.board_invitations bi
    order by 5, 2;
end;
$$;

revoke execute on function public.list_board() from public, anon;
grant execute on function public.list_board() to authenticated;

-- Members only learn who is on the Consejo and their title, never the panel role.
create function public.list_board_badges()
returns table (user_id uuid, title text)
language sql
stable
security definer
set search_path = ''
as $$
  select bm.user_id, bm.title
  from public.board_members bm
  where bm.is_active and private.is_member();
$$;

revoke execute on function public.list_board_badges() from public, anon;
grant execute on function public.list_board_badges() to authenticated;

-- ---------------------------------------------------------------------------
-- Special badges
-- ---------------------------------------------------------------------------

create table public.member_badges (
  user_id uuid not null references public.profiles (user_id) on delete cascade,
  kind text not null check (kind in ('platform_creator')),
  created_at timestamptz not null default now(),
  primary key (user_id, kind)
);

comment on table public.member_badges is 'Special recognitions shown on member profiles. Granted from the SQL Editor, never from the app.';

alter table public.member_badges enable row level security;

-- Same visibility as companies: follows the profile's RLS.
create policy "Members read badges of visible profiles"
  on public.member_badges for select to authenticated
  using (
    (select private.is_member())
    and exists (select 1 from public.profiles p where p.user_id = member_badges.user_id)
  );

revoke all on public.member_badges from anon, authenticated;
grant select on public.member_badges to authenticated;
