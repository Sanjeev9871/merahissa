-- ===========================================================================
-- Leads.
--
-- People who asked us to contact them, usually after seeing their free-check
-- answer. This is the one table written by anonymous visitors, so it is the
-- one place an attacker can put data into the database without an account.
-- It is therefore deliberately narrow: insert-only for the public, readable
-- only by admins, with no update path at all.
-- ===========================================================================

create type lead_source as enum ('triage_result', 'contact_form', 'callback_request', 'guide');
create type lead_status as enum ('new', 'contacted', 'converted', 'closed');

create table public.leads (
  id              uuid primary key default gen_random_uuid(),
  name            text,
  email           text,
  -- Stored as 91XXXXXXXXXX. One shape, always.
  phone           text,
  message         text,
  source          lead_source not null,

  -- Shape of their case only: regime, heir count, asset kinds. No names, no
  -- institutions, no amounts. Enough for whoever calls back to be useful.
  case_summary    jsonb,

  -- DPDP: consent recorded per purpose, never bundled.
  consent_to_contact  boolean not null default false,
  consent_to_updates  boolean not null default false,
  consent_at          timestamptz not null default now(),

  status          lead_status not null default 'new',
  handled_by      uuid references public.profiles(id),
  handled_at      timestamptz,
  notes           text,

  created_at      timestamptz not null default now(),

  -- At least one way to reach them, enforced by the database and not only by
  -- the application, since this table accepts anonymous writes.
  constraint lead_has_contact check (email is not null or phone is not null),
  constraint lead_has_consent check (consent_to_contact = true)
);

create index on public.leads (status, created_at desc);
create index on public.leads (email) where email is not null;
create index on public.leads (phone) where phone is not null;

alter table public.leads enable row level security;
alter table public.leads force row level security;

-- Anonymous visitors may INSERT and nothing else. They cannot read the table,
-- so a lead form can never be turned into a way to enumerate other people's
-- contact details.
create policy leads_public_insert on public.leads
  for insert to anon, authenticated
  with check (consent_to_contact = true);

create policy leads_admin_read on public.leads
  for select using (public.is_admin());

create policy leads_admin_update on public.leads
  for update using (public.is_admin()) with check (public.is_admin());

-- Retention: a lead nobody acted on is deleted after a year. Holding a
-- grieving family's phone number indefinitely because they once looked at a
-- website is not a defensible purpose.
create or replace function public.purge_stale_leads()
returns integer
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare removed integer;
begin
  with gone as (
    delete from public.leads
    where status = 'new' and created_at < now() - interval '365 days'
    returning 1
  )
  select count(*) into removed from gone;
  return removed;
end;
$$;
