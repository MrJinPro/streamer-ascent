
-- Insert new role into roles table
INSERT INTO public.roles (slug, name, tier, visibility, description_ru)
VALUES ('agency_streamer', 'Agency Streamer', 'tier_0', 'public',
        'Стример NovaBoost Agency — присоединился через одобренную заявку')
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  tier = EXCLUDED.tier,
  visibility = EXCLUDED.visibility,
  description_ru = COALESCE(EXCLUDED.description_ru, public.roles.description_ru);

-- Extend agency_join_applications with decision/audit columns
ALTER TABLE public.agency_join_applications
  ADD COLUMN IF NOT EXISTS decided_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS decided_at timestamptz,
  ADD COLUMN IF NOT EXISTS decision_note text,
  ADD COLUMN IF NOT EXISTS created_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS assigned_referral_code text,
  ADD COLUMN IF NOT EXISTS email_sent_at timestamptz,
  ADD COLUMN IF NOT EXISTS email_error text;

CREATE INDEX IF NOT EXISTS agency_join_applications_status_idx
  ON public.agency_join_applications (status, created_at DESC);

-- Slug -> legacy app_role mapping
CREATE OR REPLACE FUNCTION public.app_role_from_slug(_slug text)
RETURNS public.app_role
LANGUAGE sql
IMMUTABLE
SET search_path = public
AS $$
  SELECT CASE lower(coalesce(_slug, ''))
    WHEN 'system_owner'    THEN 'admin'::public.app_role
    WHEN 'architect'       THEN 'admin'::public.app_role
    WHEN 'admin'           THEN 'admin'::public.app_role
    WHEN 'owner'           THEN 'admin'::public.app_role
    WHEN 'board'           THEN 'admin'::public.app_role
    WHEN 'engineer'        THEN 'admin'::public.app_role
    WHEN 'developer'       THEN 'admin'::public.app_role
    WHEN 'agency_manager'  THEN 'manager'::public.app_role
    WHEN 'manager'         THEN 'manager'::public.app_role
    WHEN 'head_mentor'     THEN 'curator'::public.app_role
    WHEN 'senior_curator'  THEN 'curator'::public.app_role
    WHEN 'mentor'          THEN 'curator'::public.app_role
    WHEN 'curator'         THEN 'curator'::public.app_role
    WHEN 'moderator'       THEN 'moderator'::public.app_role
    WHEN 'support'         THEN 'support'::public.app_role
    WHEN 'analyst'         THEN 'support'::public.app_role
    WHEN 'investor_pro'    THEN 'investor'::public.app_role
    WHEN 'investor_viewer' THEN 'investor'::public.app_role
    WHEN 'investor'        THEN 'investor'::public.app_role
    WHEN 'agency_streamer' THEN 'agency_streamer'::public.app_role
    WHEN 'nova_creator'    THEN 'streamer'::public.app_role
    WHEN 'rising_star'     THEN 'streamer'::public.app_role
    WHEN 'verified'        THEN 'streamer'::public.app_role
    WHEN 'streamer'        THEN 'streamer'::public.app_role
    ELSE 'streamer'::public.app_role
  END;
$$;

GRANT EXECUTE ON FUNCTION public.app_role_from_slug(text) TO anon, authenticated, service_role;

-- Fix ensure_profile_access_data: return real referral code, pick highest-tier slug
CREATE OR REPLACE FUNCTION public.ensure_profile_access_data()
RETURNS TABLE(role text, referral_code text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user uuid := auth.uid();
  v_slug text;
  v_code text;
BEGIN
  IF v_user IS NULL THEN
    RETURN;
  END IF;

  SELECT r.slug
    INTO v_slug
  FROM public.user_roles ur
  JOIN public.roles r ON r.id = ur.role_id
  WHERE ur.user_id = v_user
  ORDER BY
    CASE r.tier
      WHEN 'tier_4' THEN 4
      WHEN 'tier_3' THEN 3
      WHEN 'tier_2' THEN 2
      WHEN 'tier_1' THEN 1
      ELSE 0
    END DESC,
    r.created_at ASC NULLS LAST
  LIMIT 1;

  IF v_slug IS NULL THEN
    SELECT ur.role::text
      INTO v_slug
    FROM public.user_roles ur
    WHERE ur.user_id = v_user
    ORDER BY ur.created_at ASC
    LIMIT 1;
  END IF;

  SELECT p.referral_code INTO v_code
  FROM public.profiles p
  WHERE p.user_id = v_user
  LIMIT 1;

  IF v_slug IS NOT NULL THEN
    UPDATE public.profiles
       SET role = public.app_role_from_slug(v_slug)
     WHERE user_id = v_user
       AND (role IS DISTINCT FROM public.app_role_from_slug(v_slug));
  END IF;

  role := v_slug;
  referral_code := v_code;
  RETURN NEXT;
END;
$$;

GRANT EXECUTE ON FUNCTION public.ensure_profile_access_data() TO authenticated, service_role;

-- Deprecate old approval RPC
CREATE OR REPLACE FUNCTION public.approve_agency_application(
  p_application_id uuid,
  p_max_uses integer DEFAULT 5
)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RAISE EXCEPTION 'approve_agency_application is deprecated. Use agency-application-decide edge function.'
    USING HINT = 'Call /functions/v1/agency-application-decide instead.';
END;
$$;
