
-- 3.2 fix: Backfill tiktok_username with explicit cast
UPDATE public.profiles p
SET tiktok_username = u.tiktok_username
FROM public.users u
WHERE u.supabase_uid::uuid = p.user_id
  AND u.tiktok_username IS NOT NULL
  AND p.tiktok_username IS NULL;

-- 3.3  Recreate v_users_unified with tiktok_username
DROP VIEW IF EXISTS public.v_users_unified CASCADE;

CREATE VIEW public.v_users_unified
WITH (security_invoker = on)
AS
SELECT
  p.user_id AS id,
  p.email,
  p.display_name,
  p.username,
  p.tiktok_username,
  p.avatar_url,
  p.timezone,
  p.locale,
  p.onboarding_completed,
  p.created_at,
  p.updated_at
FROM public.profiles p;

GRANT SELECT ON public.v_users_unified TO authenticated;
GRANT SELECT ON public.v_users_unified TO anon;

-- 3.4  Update handle_new_user trigger to include tiktok_username
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, email, display_name, username, tiktok_username)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)),
    NULL,
    NEW.raw_user_meta_data->>'tiktok_username'
  )
  ON CONFLICT (user_id) DO UPDATE SET
    email = COALESCE(EXCLUDED.email, profiles.email),
    tiktok_username = COALESCE(EXCLUDED.tiktok_username, profiles.tiktok_username),
    updated_at = now();
  RETURN NEW;
END;
$$;

-- 3.5  Helper to resolve legacy user ID → profiles.user_id
CREATE OR REPLACE FUNCTION public.resolve_legacy_user_id(p_legacy_id text)
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT COALESCE(
    (SELECT user_id FROM public.profiles WHERE user_id::text = p_legacy_id LIMIT 1),
    (SELECT supabase_uid::uuid FROM public.users WHERE id = p_legacy_id AND supabase_uid IS NOT NULL LIMIT 1),
    (SELECT supabase_uid::uuid FROM public.users WHERE supabase_uid = p_legacy_id LIMIT 1)
  );
$$;

-- 3.6  Mark public.users as deprecated
COMMENT ON TABLE public.users IS 'DEPRECATED — Phase 4: migrate all references to public.profiles. Do not add new FK references to this table.';
