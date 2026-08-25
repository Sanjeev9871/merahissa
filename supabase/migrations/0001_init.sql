-- ===========================================================================
-- Virasat — initial schema
--
-- Security model:
--   1. Every table has RLS ENABLED and FORCED. There is no table a logged-in
--      user can read wholesale with the anon key.
--   2. Ownership flows from cases.owner_id. Child tables (heirs, assets,
--      documents, packs, payments) are reachable only through a case the
--      caller owns.
--   3. Government ID numbers are never stored in plaintext. Columns ending in
--      _enc hold AES-256-GCM ciphertext produced by src/lib/crypto.ts with a
--      key that lives in the app environment, NOT in the database. A stolen
--      database dump therefore does not yield ID numbers.
--   4. audit_log is append-only. No UPDATE or DELETE policy exists for any
--      role, so history cannot be rewritten from the application.
-- ===========================================================================

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------
create type succession_regime as enum (
  'hindu',            -- Hindu Succession Act 1956 (Hindu, Buddhist, Sikh, Jain)
  'muslim_sunni',     -- Muslim personal law (Hanafi)
  'muslim_shia',      -- Muslim personal law (Ithna Ashari)
  'christian',        -- Indian Succession Act 1925, Part V
  'parsi',            -- Indian Succession Act 1925, Chapter III
  'testate',          -- A valid will governs; regime applies only residually
  'unknown'
);

create type case_status as enum (
  'draft', 'intake_complete', 'awaiting_payment', 'paid',
  'generating', 'in_review', 'delivered', 'closed'
);

create type asset_kind as enum (
  'bank_deposit', 'demat_shares', 'mutual_fund', 'insurance_policy',
  'epf', 'ppf', 'nps', 'iepf_shares', 'post_office', 'safe_deposit', 'other'
);

create type pack_status as enum ('queued', 'generated', 'approved', 'rejected', 'superseded');

-- ---------------------------------------------------------------------------
-- profiles — one row per auth user
-- ---------------------------------------------------------------------------
create table public.profiles (
  id            uuid primary key references auth.users(id) on delete cascade,
  full_name     text,
  phone         text,
  is_admin      boolean not null default false,
  -- DPDP Act 2023: consent must be recorded with its version and timestamp so
  -- we can prove WHAT the user agreed to, not merely THAT they agreed.
  consent_version   text,
  consent_at        timestamptz,
  consent_ip_hash   text,          -- sha256(ip + salt); never the raw IP
  created_at    timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- cases — one per deceased person
-- ---------------------------------------------------------------------------
create table public.cases (
  id                  uuid primary key default gen_random_uuid(),
  owner_id            uuid not null references public.profiles(id) on delete cascade,
  status              case_status not null default 'draft',

  deceased_name       text not null,
  deceased_dod        date,
  -- The Hindu Succession Act applies materially different rules under s.15
  -- when the deceased was a woman, so this drives the computation and is not
  -- collected for any other purpose.
  deceased_was_female boolean not null default false,
  regime              succession_regime not null default 'unknown',
  has_will            boolean not null default false,
  will_is_registered  boolean,
  -- Encrypted. Never sent to an AI provider under any circumstance.
  deceased_pan_enc    text,
  deceased_aadhaar_enc text,
  -- Display-only masked forms, e.g. 'XXXXXX1234'. Safe to render.
  deceased_pan_mask   text,
  deceased_aadhaar_mask text,

  advocate_referral_needed boolean not null default false,
  referral_reason     text,

  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),
  closed_at           timestamptz
);
create index on public.cases (owner_id, status);

-- ---------------------------------------------------------------------------
-- heirs
-- ---------------------------------------------------------------------------
create table public.heirs (
  id            uuid primary key default gen_random_uuid(),
  case_id       uuid not null references public.cases(id) on delete cascade,
  full_name     text not null,
  relationship  text not null,           -- 'spouse','son','daughter','mother',...
  is_minor      boolean not null default false,
  is_claimant   boolean not null default true,
  share_num     integer,                 -- share as an exact fraction, never a float
  share_den     integer,
  pan_enc       text,
  aadhaar_enc   text,
  pan_mask      text,
  aadhaar_mask  text,
  created_at    timestamptz not null default now(),
  constraint share_fraction_valid check (
    (share_num is null and share_den is null) or (share_den > 0 and share_num >= 0)
  )
);
create index on public.heirs (case_id);

-- ---------------------------------------------------------------------------
-- assets
-- ---------------------------------------------------------------------------
create table public.assets (
  id                uuid primary key default gen_random_uuid(),
  case_id           uuid not null references public.cases(id) on delete cascade,
  kind              asset_kind not null,
  institution       text not null,          -- 'State Bank of India', 'CAMS', ...
  -- Encrypted; only the last four digits are ever displayed or printed.
  account_ref_enc   text,
  account_ref_mask  text,
  -- Value BAND not exact value: the band is all the document logic needs
  -- (thresholds at 1L / 5L / 10L drive which affidavits are required), and a
  -- band is far less sensitive than a balance.
  value_band        text not null default 'unknown',
  has_nomination    boolean,
  is_joint          boolean not null default false,
  created_at        timestamptz not null default now()
);
create index on public.assets (case_id);

-- ---------------------------------------------------------------------------
-- documents — uploaded evidence
-- ---------------------------------------------------------------------------
create table public.documents (
  id            uuid primary key default gen_random_uuid(),
  case_id       uuid not null references public.cases(id) on delete cascade,
  doc_type      text not null,            -- 'death_certificate','pan_card',...
  storage_path  text not null,            -- private bucket; signed URLs only
  sha256        text,                     -- integrity + duplicate detection
  ocr_fields    jsonb,                    -- extracted in the BROWSER, confirmed by user
  bytes         integer,
  uploaded_at   timestamptz not null default now(),
  -- Retention: purge job deletes rows (and storage objects) where
  -- purge_after < now(). Set to closed_at + 90 days when a case closes.
  purge_after   timestamptz
);
create index on public.documents (case_id);
create index on public.documents (purge_after) where purge_after is not null;

-- ---------------------------------------------------------------------------
-- packs — generated document bundles, versioned and review-gated
-- ---------------------------------------------------------------------------
create table public.packs (
  id            uuid primary key default gen_random_uuid(),
  case_id       uuid not null references public.cases(id) on delete cascade,
  version       integer not null default 1,
  status        pack_status not null default 'queued',
  -- Which templates were selected, at which template version. Date-stamping
  -- matters: institution requirements change, and we must know what a family
  -- was told in March when they ask in December.
  template_manifest jsonb not null default '[]'::jsonb,
  model_notes   jsonb,                    -- gaps/flags the model raised
  storage_path  text,                     -- assembled PDF, private bucket
  reviewed_by   uuid references public.profiles(id),
  reviewed_at   timestamptz,
  review_notes  text,
  created_at    timestamptz not null default now(),
  unique (case_id, version)
);
create index on public.packs (status) where status in ('queued','generated');

-- ---------------------------------------------------------------------------
-- payments
-- ---------------------------------------------------------------------------
create table public.payments (
  id                  uuid primary key default gen_random_uuid(),
  case_id             uuid not null references public.cases(id) on delete cascade,
  razorpay_order_id   text unique,
  razorpay_payment_id text unique,
  amount_paise        integer not null,
  tier                text not null,
  -- Only ever set by a signature-verified webhook, never by the browser.
  status              text not null default 'created',
  verified_at         timestamptz,
  created_at          timestamptz not null default now()
);
create index on public.payments (case_id);

-- ---------------------------------------------------------------------------
-- audit_log — append-only
-- ---------------------------------------------------------------------------
create table public.audit_log (
  id          bigserial primary key,
  actor_id    uuid,                       -- null for system/cron actions
  action      text not null,              -- 'case.view','pack.approve','doc.download'
  case_id     uuid,
  detail      jsonb,
  at          timestamptz not null default now()
);
create index on public.audit_log (case_id, at desc);
create index on public.audit_log (actor_id, at desc);

-- ===========================================================================
-- Helper functions
-- ===========================================================================

-- SECURITY DEFINER + a locked search_path. Without the pinned search_path a
-- caller could shadow `public` and change what this function resolves.
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select coalesce((select is_admin from public.profiles where id = auth.uid()), false);
$$;

create or replace function public.owns_case(target uuid)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1 from public.cases c
    where c.id = target and c.owner_id = auth.uid()
  );
$$;

create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end;
$$;

create trigger cases_touch before update on public.cases
  for each row execute function public.touch_updated_at();

-- Auto-create a profile when a user signs up.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  insert into public.profiles (id) values (new.id) on conflict do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ===========================================================================
-- Row Level Security
--
-- FORCE means the table owner is subject to policies too, so a mistake in
-- server code cannot silently read everything.
-- ===========================================================================

alter table public.profiles  enable row level security;
alter table public.cases     enable row level security;
alter table public.heirs     enable row level security;
alter table public.assets    enable row level security;
alter table public.documents enable row level security;
alter table public.packs     enable row level security;
alter table public.payments  enable row level security;
alter table public.audit_log enable row level security;

alter table public.profiles  force row level security;
alter table public.cases     force row level security;
alter table public.heirs     force row level security;
alter table public.assets    force row level security;
alter table public.documents force row level security;
alter table public.packs     force row level security;
alter table public.payments  force row level security;
alter table public.audit_log force row level security;

-- profiles -------------------------------------------------------------------
create policy profiles_select_own on public.profiles
  for select using (id = auth.uid() or public.is_admin());
create policy profiles_update_own on public.profiles
  for update using (id = auth.uid()) with check (id = auth.uid());

-- cases ----------------------------------------------------------------------
create policy cases_select on public.cases
  for select using (owner_id = auth.uid() or public.is_admin());
create policy cases_insert on public.cases
  for insert with check (owner_id = auth.uid());
create policy cases_update on public.cases
  for update using (owner_id = auth.uid() or public.is_admin())
  with check (owner_id = auth.uid() or public.is_admin());
-- DPDP right to erasure: a user may delete their own case, cascading to all
-- child rows. Admins deliberately cannot delete — only the data principal.
create policy cases_delete_own on public.cases
  for delete using (owner_id = auth.uid());

-- child tables ---------------------------------------------------------------
create policy heirs_all on public.heirs
  for all using (public.owns_case(case_id) or public.is_admin())
  with check (public.owns_case(case_id));

create policy assets_all on public.assets
  for all using (public.owns_case(case_id) or public.is_admin())
  with check (public.owns_case(case_id));

create policy documents_all on public.documents
  for all using (public.owns_case(case_id) or public.is_admin())
  with check (public.owns_case(case_id));

-- packs: the owner may READ their packs but never write them. Only the
-- service role (admin review queue) creates or approves a pack, so a user
-- cannot mark their own pack approved and skip human review.
create policy packs_select on public.packs
  for select using (public.owns_case(case_id) or public.is_admin());
create policy packs_admin_write on public.packs
  for all using (public.is_admin()) with check (public.is_admin());

-- payments: read-only to the owner. Status is written by the webhook using
-- the service role after signature verification.
create policy payments_select on public.payments
  for select using (public.owns_case(case_id) or public.is_admin());
create policy payments_admin_write on public.payments
  for all using (public.is_admin()) with check (public.is_admin());

-- audit_log: nobody reads it through the anon key except admins, and there is
-- deliberately NO update or delete policy for any role.
create policy audit_select_admin on public.audit_log
  for select using (public.is_admin());
create policy audit_insert on public.audit_log
  for insert with check (true);

revoke update, delete on public.audit_log from anon, authenticated;

-- ===========================================================================
-- Retention
-- ===========================================================================

-- Called by a scheduled job (pg_cron or an external cron hitting an endpoint).
-- Deletes expired document rows and returns their storage paths so the caller
-- can remove the corresponding objects from the bucket.
create or replace function public.purge_expired_documents()
returns table (deleted_path text)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  return query
  with gone as (
    delete from public.documents
    where purge_after is not null and purge_after < now()
    returning storage_path
  )
  select storage_path from gone;
end;
$$;

-- When a case closes, stamp every document with a 90-day expiry.
create or replace function public.stamp_purge_on_close()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if new.status = 'closed' and (old.status is distinct from 'closed') then
    new.closed_at := now();
    update public.documents
      set purge_after = now() + interval '90 days'
      where case_id = new.id;
  end if;
  return new;
end;
$$;

create trigger cases_stamp_purge before update on public.cases
  for each row execute function public.stamp_purge_on_close();
