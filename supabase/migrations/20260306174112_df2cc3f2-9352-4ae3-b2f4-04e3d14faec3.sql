
-- Drop and recreate v_users_unified (old view has different columns)
DROP VIEW IF EXISTS public.v_users_unified CASCADE;

CREATE VIEW public.v_users_unified AS
SELECT
  p.user_id AS id,
  p.email,
  p.display_name,
  p.username,
  p.avatar_url,
  p.timezone,
  p.locale,
  p.onboarding_completed,
  p.created_at,
  p.updated_at
FROM public.profiles p;

-- Grant access
GRANT SELECT ON public.v_users_unified TO authenticated;
GRANT SELECT ON public.v_users_unified TO anon;
