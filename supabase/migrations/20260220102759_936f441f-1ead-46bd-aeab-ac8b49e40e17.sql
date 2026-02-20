
-- Fix pre-existing security issues

-- 1. Enable RLS on license_checks and license_devices
ALTER TABLE public.license_checks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.license_devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.live_sessions ENABLE ROW LEVEL SECURITY;

-- RLS policies for license tables
CREATE POLICY "license_checks_admin_only" ON public.license_checks FOR SELECT TO authenticated USING (public.is_admin());
CREATE POLICY "license_devices_admin_only" ON public.license_devices FOR SELECT TO authenticated USING (public.is_admin());
CREATE POLICY "live_sessions_select_access" ON public.live_sessions FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.streamer_accounts sa WHERE sa.id = streamer_account_id AND public.can_access_streamer(sa.streamer_id)));

-- 2. Fix function search_path for existing functions
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $function$
begin
  new.updated_at = now();
  return new;
end $function$;

CREATE OR REPLACE FUNCTION public.can_access_streamer(_streamer_id uuid)
RETURNS boolean
LANGUAGE sql STABLE
SET search_path = public
AS $function$
  select exists (
    select 1
    from public.streamer_members sm
    where sm.streamer_id = _streamer_id
      and sm.user_id = auth.uid()
      and sm.status = 'active'
  )
  or exists (
    select 1
    from public.streamers s
    join public.organization_members om on om.org_id = s.org_id
    where s.id = _streamer_id
      and om.user_id = auth.uid()
      and om.status = 'active'
  );
$function$;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql STABLE
SET search_path = public
AS $function$
  select exists (
    select 1 from public.user_roles ur
    where ur.user_id = auth.uid()
      and ur.role = 'admin'
  );
$function$;
