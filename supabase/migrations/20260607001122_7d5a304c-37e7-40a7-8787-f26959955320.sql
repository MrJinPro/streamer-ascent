
CREATE OR REPLACE FUNCTION public.ensure_profile_access_data()
RETURNS TABLE(role text, referral_code text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user uuid := auth.uid();
  v_email text;
  v_slug text;
  v_code text;
BEGIN
  IF v_user IS NULL THEN
    RETURN;
  END IF;

  SELECT email INTO v_email FROM auth.users WHERE id = v_user LIMIT 1;

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

  -- Super-admin override: never block the configured email
  IF v_slug IS NULL AND lower(coalesce(v_email, '')) = 'dev@mrjin.pro' THEN
    v_slug := 'system_owner';
  END IF;

  SELECT p.onboarding_referral_code INTO v_code
  FROM public.profiles p
  WHERE p.user_id = v_user
  LIMIT 1;

  role := v_slug;
  referral_code := v_code;
  RETURN NEXT;
END;
$$;

GRANT EXECUTE ON FUNCTION public.ensure_profile_access_data() TO authenticated, service_role;
