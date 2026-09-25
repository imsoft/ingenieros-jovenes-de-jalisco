-- Colectivo member network and board roles.
-- Member = email with an approved membership application, an email authorized by hand, or an active board member.
-- Board roles: the reviewer reviews applications and manages events; the admin can also
-- manage the board, delete events and moderate profiles.

-- ---------------------------------------------------------------------------
-- Board roles
-- ---------------------------------------------------------------------------

create function private.is_board_admin()
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
      and role = 'admin'
  );
$$;

revoke execute on function private.is_board_admin() from public, anon;
grant execute on function private.is_board_admin() to authenticated;

-- Deleting events becomes admin-only (creating and editing stays open to the whole board).
drop policy "Board deletes events" on public.events;

create policy "Admins delete events"
  on public.events for delete to authenticated
  using ((select private.is_board_admin()));

-- Board invitations for people who don't have an account yet.
-- When they sign up with that email, a trigger turns them into board members.
create table private.board_invitations (
  email text primary key check (email = lower(email) and char_length(email) between 5 and 254),
  full_name text not null check (char_length(full_name) between 2 and 120),
  role public.board_role not null default 'reviewer',
  invited_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now()
);

revoke all on private.board_invitations from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- Emails authorized besides approved applications (testing, special cases)
-- ---------------------------------------------------------------------------

create table private.authorized_emails (
  email text primary key check (email = lower(email) and char_length(email) between 5 and 254),
  reason text not null check (char_length(reason) between 3 and 200),
  created_at timestamptz not null default now()
);

comment on table private.authorized_emails is
  'Emails that can create an account without an approved application. Managed from the SQL Editor.';

revoke all on private.authorized_emails from public, anon, authenticated;

-- Can this email have an account? (used by the sign-up hook)
create function private.is_email_authorized(p_email text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
      select 1 from public.membership_applications a
      where a.status = 'approved' and lower(a.email) = lower(btrim(p_email))
    )
    or exists (select 1 from private.authorized_emails ae where ae.email = lower(btrim(p_email)))
    or exists (select 1 from private.board_invitations bi where bi.email = lower(btrim(p_email)));
$$;

revoke execute on function private.is_email_authorized(text) from public, anon, authenticated;

-- Is a given account still a member? Used to hide profiles of people who no longer are.
create function private.is_user_member(p_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(
    (select private.is_email_authorized(u.email) from auth.users u where u.id = p_user_id),
    false
  )
  or exists (
    select 1 from public.board_members bm where bm.user_id = p_user_id and bm.is_active
  );
$$;

revoke execute on function private.is_user_member(uuid) from public, anon;
grant execute on function private.is_user_member(uuid) to authenticated;

-- Is the signed-in user a member? Uses the JWT email (not user metadata, which the user can edit).
create function private.is_member()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(private.is_email_authorized((select auth.jwt() ->> 'email')), false)
    or private.is_board_member();
$$;

revoke execute on function private.is_member() from public, anon;
grant execute on function private.is_member() to authenticated;

-- Exposed version so the app can tell whether the current session belongs to a member.
create function public.am_i_member()
returns boolean
language sql
stable
set search_path = ''
as $$
  select private.is_member();
$$;

revoke execute on function public.am_i_member() from public, anon;
grant execute on function public.am_i_member() to authenticated;

-- ---------------------------------------------------------------------------
-- Sign-up filter (Auth Hook "Before User Created")
-- ---------------------------------------------------------------------------
-- Applies to email and Google sign-ups. It does NOT apply to users created with the admin API
-- (Supabase dashboard): those accounts exist, but RLS denies them everything if their email is not authorized.
-- Enabled in Authentication → Hooks (see docs/member-network.md).

create function public.hook_only_authorized_emails(event jsonb)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_email text := lower(btrim(coalesce(event -> 'user' ->> 'email', '')));
begin
  if v_email <> '' and private.is_email_authorized(v_email) then
    return '{}'::jsonb;
  end if;

  return jsonb_build_object(
    'error', jsonb_build_object('http_code', 403, 'message', 'EMAIL_NOT_AUTHORIZED')
  );
end;
$$;

grant execute on function public.hook_only_authorized_emails(jsonb) to supabase_auth_admin;
revoke execute on function public.hook_only_authorized_emails(jsonb) from public, anon, authenticated;

-- When an account is created with an email invited to the board, it joins the board automatically.
create function private.accept_board_invitation()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_invitation private.board_invitations%rowtype;
begin
  delete from private.board_invitations
  where email = lower(btrim(coalesce(new.email, '')))
  returning * into v_invitation;

  if found then
    insert into public.board_members (user_id, full_name, role)
    values (new.id, v_invitation.full_name, v_invitation.role)
    on conflict (user_id) do update set role = excluded.role, is_active = true;
  end if;

  return new;
end;
$$;

revoke execute on function private.accept_board_invitation() from public, anon, authenticated;

create trigger on_user_created_accept_board_invitation
  after insert on auth.users
  for each row execute function private.accept_board_invitation();

-- ---------------------------------------------------------------------------
-- Board management (admins only)
-- ---------------------------------------------------------------------------

create function private.require_board_admin()
returns void
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not private.is_board_admin() then
    raise exception 'ADMINS_ONLY' using errcode = 'P0001';
  end if;
end;
$$;

revoke execute on function private.require_board_admin() from public, anon;
grant execute on function private.require_board_admin() to authenticated;

-- Members, inactive members and pending invitations, with email (board_members doesn't store it).
create function public.list_board()
returns table (
  user_id uuid,
  full_name text,
  email text,
  role public.board_role,
  status text,
  since timestamptz
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
           case when bm.is_active then 'active' else 'inactive' end, bm.created_at
    from public.board_members bm
    join auth.users u on u.id = bm.user_id
    union all
    select null::uuid, bi.full_name, bi.email, bi.role, 'invited', bi.created_at
    from private.board_invitations bi
    order by 5, 2;
end;
$$;

revoke execute on function public.list_board() from public, anon;
grant execute on function public.list_board() to authenticated;

-- Adds someone to the board: active right away if they have an account; invited otherwise.
create function public.add_board_member(p_email text, p_full_name text, p_role public.board_role)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_email text := lower(btrim(p_email));
  v_user_id uuid;
begin
  perform private.require_board_admin();

  select id into v_user_id from auth.users where lower(email) = v_email limit 1;

  if v_user_id is not null then
    insert into public.board_members (user_id, full_name, role)
    values (v_user_id, btrim(p_full_name), p_role)
    on conflict (user_id) do update
      set full_name = excluded.full_name, role = excluded.role, is_active = true;
    return 'active';
  end if;

  insert into private.board_invitations (email, full_name, role, invited_by)
  values (v_email, btrim(p_full_name), p_role, (select auth.uid()))
  on conflict (email) do update set full_name = excluded.full_name, role = excluded.role;
  return 'invited';
end;
$$;

revoke execute on function public.add_board_member(text, text, public.board_role) from public, anon;
grant execute on function public.add_board_member(text, text, public.board_role) to authenticated;

-- Changes the role or deactivates/reactivates. Never leaves the board without active admins.
create function public.update_board_member(p_user_id uuid, p_role public.board_role, p_is_active boolean)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform private.require_board_admin();

  -- Locks the admin rows so two simultaneous changes cannot leave zero admins.
  perform 1 from public.board_members where role = 'admin' and is_active for update;

  update public.board_members
  set role = p_role, is_active = p_is_active
  where user_id = p_user_id;

  if not found then
    raise exception 'NOT_FOUND' using errcode = 'P0001';
  end if;

  if not exists (select 1 from public.board_members where role = 'admin' and is_active) then
    raise exception 'LAST_ADMIN' using errcode = 'P0001';
  end if;
end;
$$;

revoke execute on function public.update_board_member(uuid, public.board_role, boolean) from public, anon;
grant execute on function public.update_board_member(uuid, public.board_role, boolean) to authenticated;

create function public.cancel_board_invitation(p_email text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform private.require_board_admin();
  delete from private.board_invitations where email = lower(btrim(p_email));
end;
$$;

revoke execute on function public.cancel_board_invitation(text) from public, anon;
grant execute on function public.cancel_board_invitation(text) to authenticated;

-- ---------------------------------------------------------------------------
-- Profiles
-- ---------------------------------------------------------------------------

create table public.profiles (
  user_id uuid primary key references auth.users (id) on delete cascade,
  full_name text not null check (char_length(full_name) between 2 and 120),
  headline text check (headline is null or char_length(headline) <= 160),
  specialty text check (specialty is null or char_length(specialty) <= 120),
  company text check (company is null or char_length(company) <= 120),
  job_title text check (job_title is null or char_length(job_title) <= 120),
  municipality text check (municipality is null or char_length(municipality) <= 80),
  bio text check (bio is null or char_length(bio) <= 1000),
  linkedin_url text check (
    linkedin_url is null
    or (linkedin_url ~ '^https://([a-z]{2,3}\.)?linkedin\.com/' and char_length(linkedin_url) <= 300)
  ),
  instagram_handle text check (instagram_handle is null or instagram_handle ~ '^[A-Za-z0-9._]{1,30}$'),
  website_url text check (website_url is null or (website_url ~ '^https?://' and char_length(website_url) <= 300)),
  photo_path text check (photo_path is null or char_length(photo_path) <= 300),
  -- is_visible is chosen by each member; is_suspended is only changed by an admin (moderate_profile).
  is_visible boolean not null default true,
  is_suspended boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.profiles is 'Profile of each member in the Colectivo network. Only other members can see it.';

create index profiles_directory_idx on public.profiles (is_visible, is_suspended, full_name);

create trigger profiles_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

alter table public.profiles enable row level security;

-- Someone else's profile is visible when it is visible, not suspended and its owner is still a member.
-- Admins can also see suspended ones, so they can restore them.
create policy "Members read directory profiles and their own"
  on public.profiles for select to authenticated
  using (
    (select private.is_member())
    and (
      user_id = (select auth.uid())
      or (
        private.is_user_member(user_id)
        and ((is_visible and not is_suspended) or (is_suspended and (select private.is_board_admin())))
      )
    )
  );

create policy "Members create their own profile"
  on public.profiles for insert to authenticated
  with check (user_id = (select auth.uid()) and (select private.is_member()));

create policy "Members update their own profile"
  on public.profiles for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()) and (select private.is_member()));

revoke all on public.profiles from anon, authenticated;

grant select on public.profiles to authenticated;

grant insert (
  user_id, full_name, headline, specialty, company, job_title, municipality, bio,
  linkedin_url, instagram_handle, website_url, photo_path, is_visible
) on public.profiles to authenticated;

grant update (
  full_name, headline, specialty, company, job_title, municipality, bio,
  linkedin_url, instagram_handle, website_url, photo_path, is_visible
) on public.profiles to authenticated;

-- Moderation: an admin hides or restores someone else's profile from the directory.
create function public.moderate_profile(p_user_id uuid, p_is_suspended boolean)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform private.require_board_admin();

  update public.profiles set is_suspended = p_is_suspended where user_id = p_user_id;
  if not found then
    raise exception 'NOT_FOUND' using errcode = 'P0001';
  end if;
end;
$$;

revoke execute on function public.moderate_profile(uuid, boolean) from public, anon;
grant execute on function public.moderate_profile(uuid, boolean) to authenticated;

-- ---------------------------------------------------------------------------
-- Delete your own account (privacy rights)
-- ---------------------------------------------------------------------------
-- Deletes the account and, by cascade, the profile. Photos are deleted beforehand by the app via the Storage API.
-- Board members must be deactivated first, so the board is never left without admins.

create function public.delete_my_account()
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := (select auth.uid());
begin
  if v_user_id is null then
    raise exception 'NO_SESSION' using errcode = 'P0001';
  end if;

  if exists (select 1 from public.board_members where user_id = v_user_id and is_active) then
    raise exception 'IS_BOARD_MEMBER' using errcode = 'P0001';
  end if;

  delete from auth.users where id = v_user_id;
end;
$$;

revoke execute on function public.delete_my_account() from public, anon;
grant execute on function public.delete_my_account() to authenticated;

-- ---------------------------------------------------------------------------
-- Storage: profile photos
-- ---------------------------------------------------------------------------
-- Public bucket with unguessable paths ({user_id}/{uuid}.ext); each member only writes to their own folder.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('profiles', 'profiles', true, 2097152, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

create policy "Members upload their photo"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'profiles'
    and (storage.foldername(name))[1] = (select auth.uid())::text
    and (select private.is_member())
  );

create policy "Members read their photo folder"
  on storage.objects for select to authenticated
  using (bucket_id = 'profiles' and (storage.foldername(name))[1] = (select auth.uid())::text);

create policy "Members replace their photo"
  on storage.objects for update to authenticated
  using (bucket_id = 'profiles' and (storage.foldername(name))[1] = (select auth.uid())::text)
  with check (bucket_id = 'profiles' and (storage.foldername(name))[1] = (select auth.uid())::text);

create policy "Members delete their photo"
  on storage.objects for delete to authenticated
  using (bucket_id = 'profiles' and (storage.foldername(name))[1] = (select auth.uid())::text);
