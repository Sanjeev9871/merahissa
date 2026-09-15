-- ===========================================================================
-- 0005 — repair and defend the profiles invariant
--
-- `cases.owner_id` references `profiles(id)`, so a signed-in user with no
-- profile row cannot create a case: the insert fails on the foreign key and
-- the family sees "We could not save your case", with nothing on screen or in
-- the response saying why.
--
-- The invariant is meant to hold because `on_auth_user_created` inserts a
-- profile whenever a row lands in auth.users. That trigger fires exactly once,
-- at signup, and there is nothing anywhere that reconciles afterwards. So the
-- invariant breaks, permanently and silently, for any account created while
-- the trigger did not exist — which is every account that signed up before
-- 0001 was applied to that environment, and every account in a database that
-- was reset and restored without it.
--
-- Two changes here. The first repairs the accounts already broken. The second
-- removes the dependence on a one-shot trigger, so a missing profile becomes
-- self-healing at the next sign-in rather than a permanent dead end.
-- ===========================================================================

-- 1. Backfill ---------------------------------------------------------------
-- Idempotent, and safe to re-run on every deploy. Anyone who already has a
-- profile is untouched; consent columns stay null, which is what the auth
-- callback keys off to record consent on the next sign-in.
insert into public.profiles (id)
select u.id
from auth.users u
left join public.profiles p on p.id = u.id
where p.id is null
on conflict (id) do nothing;

-- 2. Let the application heal the row it depends on --------------------------
-- The auth callback writes consent through the service role, which bypasses
-- RLS, so no policy change is needed for it to upsert instead of update. This
-- grant is here for the explicit case where a profile has to be created for a
-- user who is already authenticated: without INSERT the upsert fails, and
-- `profiles_insert_own` constrains it to the caller's own id so it cannot be
-- used to create a row for anyone else.
--
-- Note what is NOT granted: is_admin and the consent_* columns remain
-- unwritable by the family, exactly as 0003 left them. A user may bring their
-- own profile row into existence; they may not decide what it says about their
-- privileges or their consent.
grant insert (id) on public.profiles to authenticated;

drop policy if exists profiles_insert_own on public.profiles;
create policy profiles_insert_own on public.profiles
  for insert with check (id = auth.uid());
