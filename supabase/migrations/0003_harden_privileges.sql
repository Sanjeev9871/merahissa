-- ===========================================================================
-- 0003 — privilege hardening
--
-- Row-level security decides WHICH rows a role may touch. It does not, on its
-- own, decide which COLUMNS, and it sits on top of table/column GRANTs rather
-- than replacing them. The policies in 0001 grant the owner UPDATE on their
-- own `profiles` and `cases` rows with no column restriction, which means a
-- signed-in user can PATCH their own row over the public REST API — with the
-- anon key that ships in the browser and their own session — and set a column
-- they should never control.
--
-- Two such columns are dangerous:
--   profiles.is_admin  — self-promotion to the admin review queue, which every
--                        other policy trusts via public.is_admin().
--   cases.status       — self-marking a case 'paid' to unlock generation, and
--                        cases.advocate_referral_needed, which the price tier
--                        is derived from.
--
-- Column privileges sit beneath RLS and cannot be overridden by a policy, so
-- taking the columns away at the GRANT level is the actual control. Every
-- legitimate write to these columns already runs, or is moved to run, through
-- the service role, which is unaffected by these revokes.
-- ===========================================================================

-- profiles -------------------------------------------------------------------
-- A user may edit only their own display fields. is_admin and the consent_*
-- columns are never user-writable; consent is recorded by the auth callback
-- through the service role.
revoke update on public.profiles from anon, authenticated;
grant  update (full_name, phone) on public.profiles to authenticated;

-- cases ----------------------------------------------------------------------
-- Created via POST /api/cases, then only ever transitioned server-side by the
-- order, generate, webhook and admin-review routes — all through the service
-- role. The family has no legitimate direct UPDATE, and allowing one is what
-- lets a user set status='paid' or clear the advocate flag to drop their price.
-- INSERT (cases_insert) and DELETE (cases_delete_own, the DPDP erasure right)
-- are deliberately left in place.
revoke update on public.cases from anon, authenticated;

-- heirs and assets -----------------------------------------------------------
-- Inserted once at case creation and thereafter immutable to the family. The
-- price tier is computed from the asset count, so a mutable asset list is a
-- pricing hole (delete assets, pay the cheap tier, re-add them). Deletion of a
-- case cascades to these rows through the foreign key and needs no direct
-- DELETE privilege here, so INSERT is the only capability the family keeps.
revoke update, delete on public.heirs  from anon, authenticated;
revoke update, delete on public.assets from anon, authenticated;

-- purge function -------------------------------------------------------------
-- SECURITY DEFINER and in the public schema, so without this PostgREST exposes
-- it at /rest/v1/rpc/purge_expired_documents and Postgres grants EXECUTE to
-- PUBLIC by default — anyone with the anon key could delete expired document
-- rows (orphaning their storage objects). Only the cron route, on the service
-- role, may run it.
revoke execute on function public.purge_expired_documents() from public, anon, authenticated;

-- storage bucket -------------------------------------------------------------
-- Recorded here so a fresh environment provisions the private bucket the app
-- depends on, and so its privacy is reviewable in a diff rather than set by
-- hand in the dashboard and remembered. All object access is through the
-- service role (upload, signed-URL download, purge), so no per-user
-- storage.objects policy is required — and none is added, to keep the bucket
-- unreachable with the anon key.
insert into storage.buckets (id, name, public)
values ('case-documents', 'case-documents', false)
on conflict (id) do nothing;
