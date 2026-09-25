-- Companies: address and social networks, and no cap on the number of services.

alter table public.member_companies drop constraint if exists member_companies_services_check;

alter table public.member_companies
  add column address text check (address is null or char_length(address) <= 200),
  add column linkedin_url text check (linkedin_url is null or (linkedin_url ~* '^https://([a-z]{2,3}\.)?linkedin\.com/' and char_length(linkedin_url) <= 300)),
  add column instagram_handle text check (instagram_handle is null or instagram_handle ~ '^[A-Za-z0-9._]{1,30}$'),
  add column facebook_url text check (facebook_url is null or (facebook_url ~* '^https://([a-z0-9-]+\.)?(facebook|fb)\.com/' and char_length(facebook_url) <= 300));

grant insert (address, linkedin_url, instagram_handle, facebook_url) on public.member_companies to authenticated;
grant update (address, linkedin_url, instagram_handle, facebook_url) on public.member_companies to authenticated;
