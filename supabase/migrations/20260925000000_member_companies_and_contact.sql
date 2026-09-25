-- Member companies (several per member, each with its own card) and optional direct contact.
-- Visibility piggybacks on public.profiles RLS: whoever can see a profile can see its companies,
-- and its contact only when the owner chose to share it.

-- ---------------------------------------------------------------------------
-- Companies
-- ---------------------------------------------------------------------------

create type public.company_role as enum ('owner', 'partner', 'employee', 'freelance');

create table public.member_companies (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (user_id) on delete cascade,
  name text not null check (char_length(name) between 2 and 120),
  role public.company_role not null default 'employee',
  job_title text check (job_title is null or char_length(job_title) <= 120),
  sector text check (sector is null or char_length(sector) <= 80),
  description text check (description is null or char_length(description) <= 600),
  services text[] not null default '{}' check (cardinality(services) <= 8),
  municipality text check (municipality is null or char_length(municipality) <= 80),
  website_url text check (website_url is null or (website_url ~ '^https?://' and char_length(website_url) <= 300)),
  logo_path text check (logo_path is null or char_length(logo_path) <= 300),
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.member_companies is 'Companies and ventures of each member (owner, partner, employee or freelance).';

create index member_companies_user_idx on public.member_companies (user_id, sort_order, created_at);

create trigger member_companies_updated_at
  before update on public.member_companies
  for each row execute function public.set_updated_at();

-- At most 5 companies per member.
create function private.limit_member_companies()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if (select count(*) from public.member_companies where user_id = new.user_id) >= 5 then
    raise exception 'TOO_MANY_COMPANIES' using errcode = 'P0001';
  end if;
  return new;
end;
$$;

revoke execute on function private.limit_member_companies() from public, anon, authenticated;

create trigger member_companies_limit
  before insert on public.member_companies
  for each row execute function private.limit_member_companies();

alter table public.member_companies enable row level security;

-- The subquery on profiles runs with the viewer's RLS, so companies follow profile visibility
-- (hidden, suspended and former members included).
create policy "Members read companies of visible profiles"
  on public.member_companies for select to authenticated
  using (
    (select private.is_member())
    and exists (select 1 from public.profiles p where p.user_id = member_companies.user_id)
  );

create policy "Members add their own companies"
  on public.member_companies for insert to authenticated
  with check (user_id = (select auth.uid()) and (select private.is_member()));

create policy "Members update their own companies"
  on public.member_companies for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()) and (select private.is_member()));

create policy "Members delete their own companies"
  on public.member_companies for delete to authenticated
  using (user_id = (select auth.uid()));

revoke all on public.member_companies from anon, authenticated;
grant select, delete on public.member_companies to authenticated;
grant insert (
  user_id, name, role, job_title, sector, description, services, municipality, website_url, logo_path, sort_order
) on public.member_companies to authenticated;
grant update (
  name, role, job_title, sector, description, services, municipality, website_url, logo_path, sort_order
) on public.member_companies to authenticated;

-- The old single company of each profile becomes its first company card.
insert into public.member_companies (user_id, name, role, job_title)
select user_id, company, 'employee', job_title
from public.profiles
where company is not null;

alter table public.profiles drop column company, drop column job_title;

-- ---------------------------------------------------------------------------
-- Direct contact (WhatsApp and email), shared only with members and only when the owner opts in
-- ---------------------------------------------------------------------------

create table public.profile_contacts (
  user_id uuid primary key references public.profiles (user_id) on delete cascade,
  whatsapp text check (whatsapp is null or whatsapp ~ '^\+?[0-9]{10,15}$'),
  email text check (email is null or (email ~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' and char_length(email) <= 254)),
  is_visible boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.profile_contacts is 'Optional direct contact of a member; other members only see it when is_visible is true.';

create trigger profile_contacts_updated_at
  before update on public.profile_contacts
  for each row execute function public.set_updated_at();

alter table public.profile_contacts enable row level security;

create policy "Members read shared contacts and their own"
  on public.profile_contacts for select to authenticated
  using (
    (select private.is_member())
    and (
      user_id = (select auth.uid())
      or (is_visible and exists (select 1 from public.profiles p where p.user_id = profile_contacts.user_id))
    )
  );

create policy "Members create their own contact"
  on public.profile_contacts for insert to authenticated
  with check (user_id = (select auth.uid()) and (select private.is_member()));

create policy "Members update their own contact"
  on public.profile_contacts for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()) and (select private.is_member()));

revoke all on public.profile_contacts from anon, authenticated;
grant select on public.profile_contacts to authenticated;
grant insert (user_id, whatsapp, email, is_visible) on public.profile_contacts to authenticated;
grant update (whatsapp, email, is_visible) on public.profile_contacts to authenticated;
