
-- Enable RLS on all public tables that currently lack it
DO $$
DECLARE
  t text;
  tables text[] := ARRAY[
    'donor_stats','donor_stats_tt','events','gift_events_tt',
    'license_keys','notification_reads','notification_targets','notifications',
    'password_reset_tokens','push_device_tokens','sound_files','store_purchases',
    'stream_sessions','streamer_stats','streamer_stats_tt','tiktok_profile_cache',
    'triggers','user_sessions','user_settings','user_tiktok_accounts','users','web_purchases'
  ];
BEGIN
  FOREACH t IN ARRAY tables LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
    
    IF NOT EXISTS (
      SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = t
    ) THEN
      EXECUTE format(
        'CREATE POLICY "service_role_only" ON public.%I FOR ALL USING (auth.role() = ''service_role'')',
        t
      );
    END IF;
  END LOOP;
END $$;

-- Fix v_users_unified security definer issue
ALTER VIEW public.v_users_unified SET (security_invoker = on);
