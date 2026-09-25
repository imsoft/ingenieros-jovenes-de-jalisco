-- Permission scenarios: public, members, former members, reviewer and board admin.
-- Run with `pnpm test:db` (see supabase/tests/run.sh).
\set ON_ERROR_STOP 1
set client_min_messages = notice;

create schema tests;
create function tests.ok(condition boolean, description text) returns void language plpgsql as $$
begin
  if condition is not true then raise exception 'FAILED: %', description; end if;
  raise notice 'ok  %', description;
end $$;
grant usage on schema tests to authenticated, anon;
grant execute on function tests.ok(boolean, text) to authenticated;

-- Switches the simulated session to a user (or to anonymous when p_id is null).
create function tests.act_as(p_id uuid) returns void language plpgsql security definer as $$
declare v_email text;
begin
  select email into v_email from auth.users where id = p_id;
  perform set_config('request.jwt.claim.sub', coalesce(p_id::text, ''), false);
  perform set_config('request.jwt.claims', json_build_object('sub', p_id, 'email', v_email)::text, false);
end $$;

-- Expects a statement to fail with a given text.
create function tests.fails(p_sql text, p_text text, p_description text) returns void language plpgsql as $$
begin
  execute p_sql;
  raise exception 'FAILED (no error raised): %', p_description;
exception when others then
  if position(p_text in sqlerrm) = 0 then
    raise exception 'FAILED: % (unexpected error: %)', p_description, sqlerrm;
  end if;
  raise notice 'ok  %', p_description;
end $$;
grant execute on function tests.fails(text, text, text) to authenticated;

-- ---------------------------------------------------------------- data
insert into auth.users (id, email) values
  ('00000000-0000-0000-0000-00000000000a', 'admin@cijj.mx'),
  ('00000000-0000-0000-0000-00000000000b', 'reviewer@cijj.mx'),
  ('00000000-0000-0000-0000-000000000001', 'm1@correo.mx'),
  ('00000000-0000-0000-0000-000000000002', 'm2@correo.mx'),
  ('00000000-0000-0000-0000-000000000003', 'former@correo.mx'),
  ('00000000-0000-0000-0000-000000000009', 'intruder@correo.mx');

insert into public.board_members (user_id, full_name, role) values
  ('00000000-0000-0000-0000-00000000000a', 'Admin', 'admin'),
  ('00000000-0000-0000-0000-00000000000b', 'Reviewer', 'reviewer');

insert into public.membership_applications (full_name, email, phone, municipality, confirms_legal_age, accepts_privacy_notice, status, reviewed_at)
select n, e, '3312345678', 'Zapopan', true, true, 'approved', now()
from (values ('Member One', 'M1@correo.mx'), ('Member Two', 'm2@correo.mx'), ('Former Member', 'former@correo.mx')) v(n, e);

insert into public.profiles (user_id, full_name, is_visible) values
  ('00000000-0000-0000-0000-000000000001', 'Member One', true),
  ('00000000-0000-0000-0000-000000000002', 'Member Two', false),
  ('00000000-0000-0000-0000-000000000003', 'Former Member', true);

insert into public.events (slug, title, summary, starts_at, venue) values
  ('event-one', 'Event one', 'Summary of event one', now() + interval '10 days', 'Guadalajara'),
  ('event-two', 'Event two', 'Summary of event two', now() + interval '10 days', 'Guadalajara');

-- ---------------------------------------------------------------- sign-up filter
select tests.ok(public.hook_only_authorized_emails('{"user":{"email":"M1@Correo.mx"}}') = '{}', 'hook: accepts an approved email regardless of case');
select tests.ok(public.hook_only_authorized_emails('{"user":{"email":"intruder@correo.mx"}}') ? 'error', 'hook: rejects an email without an approved application');
select tests.ok(public.hook_only_authorized_emails('{"user":{}}') ? 'error', 'hook: rejects an event without email');

set role authenticated;

-- ---------------------------------------------------------------- members
select tests.act_as('00000000-0000-0000-0000-000000000001');
select tests.ok(public.am_i_member(), 'M1 is a member');
select tests.ok((select count(*) from public.profiles) = 2, 'M1 sees their profile and the visible one of Former; not the hidden one of M2');
select tests.ok(not exists (select 1 from public.profiles where user_id = '00000000-0000-0000-0000-000000000002'), 'M1 cannot see the hidden profile of M2');

with u as (update public.profiles set full_name = 'Hacked' where user_id = '00000000-0000-0000-0000-000000000002' returning 1)
select tests.ok((select count(*) from u) = 0, 'M1 cannot edit the profile of M2');
with u as (update public.profiles set full_name = 'Member One Edited' where user_id = '00000000-0000-0000-0000-000000000001' returning 1)
select tests.ok((select count(*) from u) = 1, 'M1 edits their own profile');
select tests.fails($$update public.profiles set is_suspended = false where user_id = auth.uid()$$, 'permission denied', 'M1 cannot touch the is_suspended column');
select tests.fails($$insert into public.profiles (user_id, full_name) values ('00000000-0000-0000-0000-000000000009', 'Fake')$$, 'row-level security', 'M1 cannot create someone else''s profile');
select tests.fails($$select public.moderate_profile('00000000-0000-0000-0000-000000000002', true)$$, 'ADMINS_ONLY', 'M1 cannot moderate');
select tests.fails($$select public.list_board()$$, 'ADMINS_ONLY', 'M1 cannot see the board');
select tests.ok((select count(*) from public.membership_applications) = 0, 'M1 cannot see applications');
select tests.ok((select count(*) from public.event_registrations) = 0, 'M1 cannot see event registrations');

-- Storage
insert into storage.objects (bucket_id, name) values ('profiles', '00000000-0000-0000-0000-000000000001/photo.jpg');
select tests.ok(true, 'M1 uploads a photo to their folder');
select tests.fails($$insert into storage.objects (bucket_id, name) values ('profiles', '00000000-0000-0000-0000-000000000002/photo.jpg')$$, 'row-level security', 'M1 cannot upload to the folder of M2');

-- ---------------------------------------------------------------- former members
reset role;
update public.membership_applications set status = 'rejected' where email = 'former@correo.mx';
set role authenticated;
select tests.act_as('00000000-0000-0000-0000-000000000001');
select tests.ok(not exists (select 1 from public.profiles where user_id = '00000000-0000-0000-0000-000000000003'), 'the profile of someone who stopped being a member leaves the directory');
select tests.act_as('00000000-0000-0000-0000-000000000003');
select tests.ok(not public.am_i_member(), 'the former member loses access');
select tests.ok((select count(*) from public.profiles) = 0, 'the former member sees no profiles');

-- ---------------------------------------------------------------- no membership
select tests.act_as('00000000-0000-0000-0000-000000000009');
select tests.ok(not public.am_i_member(), 'an account without approval is not a member');
select tests.ok((select count(*) from public.profiles) = 0, 'an account without approval sees no profiles');
select tests.fails($$insert into public.profiles (user_id, full_name) values (auth.uid(), 'Intruder')$$, 'row-level security', 'an account without approval cannot create a profile');
select tests.fails($$insert into storage.objects (bucket_id, name) values ('profiles', '00000000-0000-0000-0000-000000000009/photo.jpg')$$, 'row-level security', 'an account without approval cannot upload photos');

-- ---------------------------------------------------------------- reviewer
select tests.act_as('00000000-0000-0000-0000-00000000000b');
select tests.ok(public.am_i_member(), 'the reviewer counts as a member');
select tests.ok((select count(*) from public.membership_applications) = 3, 'the reviewer sees applications');
with u as (update public.events set title = 'Event one edited' where slug = 'event-one' returning 1)
select tests.ok((select count(*) from u) = 1, 'the reviewer edits events');
with d as (delete from public.events where slug = 'event-one' returning 1)
select tests.ok((select count(*) from d) = 0, 'the reviewer CANNOT delete events');
select tests.fails($$select public.add_board_member('x@correo.mx', 'Equis', 'reviewer')$$, 'ADMINS_ONLY', 'the reviewer cannot manage the board');
select tests.fails($$select public.moderate_profile('00000000-0000-0000-0000-000000000001', true)$$, 'ADMINS_ONLY', 'the reviewer cannot moderate profiles');
select tests.fails($$select public.delete_my_account()$$, 'IS_BOARD_MEMBER', 'a board member cannot delete their account without being deactivated');

-- ---------------------------------------------------------------- admin
select tests.act_as('00000000-0000-0000-0000-00000000000a');
with d as (delete from public.events where slug = 'event-two' returning 1)
select tests.ok((select count(*) from d) = 1, 'the admin deletes events');

select public.moderate_profile('00000000-0000-0000-0000-000000000001', true);
select tests.ok(exists (select 1 from public.profiles where user_id = '00000000-0000-0000-0000-000000000001' and is_suspended), 'the admin suspends a profile and still sees it to restore it');
select tests.ok(not exists (select 1 from public.profiles where user_id = '00000000-0000-0000-0000-000000000002'), 'the admin cannot see profiles hidden by their owner either');

select tests.act_as('00000000-0000-0000-0000-00000000000b');
select tests.ok(not exists (select 1 from public.profiles where user_id = '00000000-0000-0000-0000-000000000001'), 'the reviewer no longer sees the suspended profile');
select tests.act_as('00000000-0000-0000-0000-000000000001');
select tests.ok(exists (select 1 from public.profiles where user_id = auth.uid() and is_suspended), 'the owner sees their suspended profile');
with u as (update public.profiles set is_visible = true where user_id = auth.uid() returning is_suspended)
select tests.ok((select bool_and(is_suspended) from u), 'the owner cannot lift the suspension');

select tests.act_as('00000000-0000-0000-0000-00000000000a');
select public.moderate_profile('00000000-0000-0000-0000-000000000001', false);

-- Board management
select tests.ok(public.add_board_member('M1@correo.mx', 'Member One', 'reviewer') = 'active', 'adding someone with an account activates them right away');
select tests.ok(public.add_board_member('New@Correo.mx', 'New Person', 'admin') = 'invited', 'adding someone without an account creates an invitation');
select tests.ok((select count(*) from public.list_board()) = 4, 'the admin sees members and invitations');
select tests.ok((select email from public.list_board() where status = 'invited') = 'new@correo.mx', 'the invitation stores the normalized email');
select tests.fails($$select public.update_board_member('00000000-0000-0000-0000-00000000000a', 'reviewer', true)$$, 'LAST_ADMIN', 'the only admin cannot drop their role');
select tests.fails($$select public.update_board_member('00000000-0000-0000-0000-00000000000a', 'admin', false)$$, 'LAST_ADMIN', 'the only admin cannot deactivate themselves');
select public.update_board_member('00000000-0000-0000-0000-00000000000b', 'reviewer', false);
select tests.ok((select status from public.list_board() where user_id = '00000000-0000-0000-0000-00000000000b') = 'inactive', 'the admin deactivates a reviewer');

reset role;
select tests.ok(public.hook_only_authorized_emails('{"user":{"email":"new@correo.mx"}}') = '{}', 'hook: accepts a person invited to the board');
insert into auth.users (id, email) values ('00000000-0000-0000-0000-00000000000c', 'new@correo.mx');
select tests.ok(exists (select 1 from public.board_members where user_id = '00000000-0000-0000-0000-00000000000c' and role = 'admin' and is_active), 'on sign-up, the invited person joins the board with their role');
select tests.ok(not exists (select 1 from private.board_invitations), 'the invitation is consumed');

set role authenticated;
select tests.act_as('00000000-0000-0000-0000-00000000000b');
select tests.ok(not public.am_i_member(), 'a deactivated reviewer without an application loses network access');
select tests.ok((select count(*) from public.membership_applications) = 0, 'a deactivated reviewer no longer sees applications');

select tests.act_as('00000000-0000-0000-0000-00000000000a');
select public.update_board_member('00000000-0000-0000-0000-00000000000a', 'reviewer', true);
select tests.ok(true, 'with another active admin, the admin can change their own role');

-- ---------------------------------------------------------------- delete account
select tests.act_as('00000000-0000-0000-0000-000000000002');
select public.delete_my_account();
reset role;
select tests.ok(not exists (select 1 from auth.users where id = '00000000-0000-0000-0000-000000000002'), 'a member deletes their account');
select tests.ok(not exists (select 1 from public.profiles where user_id = '00000000-0000-0000-0000-000000000002'), 'their profile is deleted by cascade');

set role anon;
select tests.fails($$select public.delete_my_account()$$, 'permission denied', 'anonymous cannot call delete_my_account');
select tests.fails($$select * from public.profiles$$, 'permission denied', 'anonymous cannot read profiles');
reset role;

-- ---------------------------------------------------------------- companies and contact
set role authenticated;
select tests.act_as('00000000-0000-0000-0000-000000000001');
insert into public.member_companies (user_id, name, role, sector) values (auth.uid(), 'Constructora Uno', 'owner', 'Construcción');
select tests.ok(true, 'M1 adds a company to their profile');
select tests.fails($$insert into public.member_companies (user_id, name) values ('00000000-0000-0000-0000-000000000003', 'Fake')$$, 'row-level security', 'M1 cannot add a company to someone else''s profile');
select tests.fails($$update public.member_companies set user_id = '00000000-0000-0000-0000-000000000003' where user_id = auth.uid()$$, 'permission denied', 'a company cannot be moved to another member')
;
insert into public.profile_contacts (user_id, whatsapp, email, is_visible) values (auth.uid(), '3312345678', 'm1@correo.mx', false);
select tests.ok(exists (select 1 from public.profile_contacts where user_id = auth.uid()), 'M1 sees their own contact');

reset role;
insert into public.member_companies (user_id, name) values ('00000000-0000-0000-0000-000000000003', 'Empresa del ex miembro');
set role authenticated;

select tests.act_as('00000000-0000-0000-0000-00000000000a');
select tests.ok(exists (select 1 from public.member_companies where name = 'Constructora Uno'), 'another member sees the companies of a visible profile');
select tests.ok(not exists (select 1 from public.member_companies where name = 'Empresa del ex miembro'), 'companies of former members are hidden');
with u as (update public.member_companies set name = 'Hacked' where name = 'Constructora Uno' returning 1)
select tests.ok((select count(*) from u) = 0, 'nobody else can edit a member''s company');
with d as (delete from public.member_companies where name = 'Constructora Uno' returning 1)
select tests.ok((select count(*) from d) = 0, 'nobody else can delete a member''s company');
select tests.ok(not exists (select 1 from public.profile_contacts where user_id = '00000000-0000-0000-0000-000000000001'), 'a contact that is not shared stays private');

select tests.act_as('00000000-0000-0000-0000-000000000001');
update public.profile_contacts set is_visible = true where user_id = auth.uid();
select tests.act_as('00000000-0000-0000-0000-00000000000a');
select tests.ok((select whatsapp from public.profile_contacts where user_id = '00000000-0000-0000-0000-000000000001') = '3312345678', 'a shared contact is visible to other members');
select tests.act_as('00000000-0000-0000-0000-000000000009');
select tests.ok(not exists (select 1 from public.profile_contacts), 'accounts without membership never see contacts');
select tests.ok(not exists (select 1 from public.member_companies), 'accounts without membership never see companies');

reset role;
update public.profiles set is_visible = false where user_id = '00000000-0000-0000-0000-000000000001';
set role authenticated;
select tests.act_as('00000000-0000-0000-0000-00000000000a');
select tests.ok(not exists (select 1 from public.member_companies where name = 'Constructora Uno'), 'hiding the profile also hides its companies');
select tests.ok(not exists (select 1 from public.profile_contacts where user_id = '00000000-0000-0000-0000-000000000001'), 'and its shared contact');
reset role;
update public.profiles set is_visible = true where user_id = '00000000-0000-0000-0000-000000000001';

set role authenticated;
select tests.act_as('00000000-0000-0000-0000-000000000001');
insert into public.member_companies (user_id, name) select auth.uid(), 'Empresa ' || n from generate_series(2, 5) n;
select tests.fails($$insert into public.member_companies (user_id, name) values (auth.uid(), 'Sexta')$$, 'TOO_MANY_COMPANIES', 'a member can have at most 5 companies');
with d as (delete from public.member_companies where user_id = auth.uid() and name = 'Empresa 5' returning 1)
select tests.ok((select count(*) from d) = 1, 'a member deletes their own company');
reset role;

set role anon;
select tests.fails($$select * from public.member_companies$$, 'permission denied', 'anonymous cannot read companies');
select tests.fails($$select * from public.profile_contacts$$, 'permission denied', 'anonymous cannot read contacts');
reset role;

\echo ALL TESTS PASSED
