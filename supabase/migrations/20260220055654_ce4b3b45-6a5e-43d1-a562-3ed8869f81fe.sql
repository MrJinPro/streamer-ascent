
-- ============================================================
-- 1. CREATE SCHEMAS + GRANTS (schemas already created by partial run)
-- ============================================================
CREATE SCHEMA IF NOT EXISTS core;
CREATE SCHEMA IF NOT EXISTS stream;
CREATE SCHEMA IF NOT EXISTS assets;
CREATE SCHEMA IF NOT EXISTS overlay;
CREATE SCHEMA IF NOT EXISTS automation;
CREATE SCHEMA IF NOT EXISTS agency;
CREATE SCHEMA IF NOT EXISTS academy;

DO $$
DECLARE
  s text;
BEGIN
  FOREACH s IN ARRAY ARRAY['core','stream','assets','overlay','automation','agency','academy']
  LOOP
    EXECUTE format('GRANT USAGE ON SCHEMA %I TO anon, authenticated, service_role', s);
    EXECUTE format('ALTER DEFAULT PRIVILEGES IN SCHEMA %I GRANT ALL ON TABLES TO anon, authenticated, service_role', s);
    EXECUTE format('ALTER DEFAULT PRIVILEGES IN SCHEMA %I GRANT ALL ON SEQUENCES TO anon, authenticated, service_role', s);
    EXECUTE format('ALTER DEFAULT PRIVILEGES IN SCHEMA %I GRANT ALL ON FUNCTIONS TO anon, authenticated, service_role', s);
  END LOOP;
END $$;

-- ============================================================
-- 2. EXTEND EXISTING public TABLES
-- ============================================================
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS email text,
  ADD COLUMN IF NOT EXISTS username text,
  ADD COLUMN IF NOT EXISTS country text,
  ADD COLUMN IF NOT EXISTS language text DEFAULT 'ru';

CREATE UNIQUE INDEX IF NOT EXISTS profiles_username_unique ON public.profiles(username) WHERE username IS NOT NULL;

ALTER TABLE public.user_roles
  ADD COLUMN IF NOT EXISTS scope text DEFAULT 'global';

ALTER TABLE public.devices
  ADD COLUMN IF NOT EXISTS device_name text,
  ADD COLUMN IF NOT EXISTS os_name text,
  ADD COLUMN IF NOT EXISTS os_version text,
  ADD COLUMN IF NOT EXISTS last_ip inet;

-- ============================================================
-- 3. CORE
-- ============================================================
CREATE TABLE IF NOT EXISTS core.plans (
  id bigserial PRIMARY KEY,
  code text UNIQUE NOT NULL,
  name text NOT NULL,
  price_usd numeric(10,2) DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE core.plans ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS core.plan_limits (
  id bigserial PRIMARY KEY,
  plan_id bigint REFERENCES core.plans(id) ON DELETE CASCADE NOT NULL,
  key text NOT NULL,
  value_int bigint,
  value_text text
);
ALTER TABLE core.plan_limits ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS core.subscriptions (
  id bigserial PRIMARY KEY,
  user_id uuid REFERENCES public.profiles(user_id) ON DELETE CASCADE NOT NULL,
  plan_id bigint REFERENCES core.plans(id) NOT NULL,
  status text DEFAULT 'active' CHECK (status IN ('active','trial','past_due','canceled')),
  current_period_start timestamptz,
  current_period_end timestamptz,
  cancel_at_period_end boolean DEFAULT false,
  provider text DEFAULT 'manual',
  provider_customer_id text,
  provider_subscription_id text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE core.subscriptions ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS core.entitlements (
  id bigserial PRIMARY KEY,
  user_id uuid REFERENCES public.profiles(user_id) ON DELETE CASCADE NOT NULL,
  key text NOT NULL,
  value_int bigint DEFAULT 0,
  expires_at timestamptz,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE core.entitlements ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS core.audit_log (
  id bigserial PRIMARY KEY,
  user_id uuid,
  action text NOT NULL,
  entity text,
  entity_id text,
  meta jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);
ALTER TABLE core.audit_log ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- 4. STREAM
-- ============================================================
CREATE TABLE IF NOT EXISTS stream.connections (
  id bigserial PRIMARY KEY,
  user_id uuid REFERENCES public.profiles(user_id) ON DELETE CASCADE NOT NULL,
  account_id uuid REFERENCES public.streamer_accounts(id) ON DELETE CASCADE NOT NULL,
  status text DEFAULT 'disconnected' CHECK (status IN ('connected','disconnected','error')),
  last_error text,
  connected_at timestamptz,
  disconnected_at timestamptz,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE stream.connections ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS stream.metrics_minute (
  id bigserial PRIMARY KEY,
  user_id uuid REFERENCES public.profiles(user_id) ON DELETE CASCADE NOT NULL,
  session_id uuid REFERENCES public.live_sessions(id) ON DELETE CASCADE NOT NULL,
  bucket_minute timestamptz NOT NULL,
  viewers_max int DEFAULT 0,
  comments_count int DEFAULT 0,
  likes_count int DEFAULT 0,
  gifts_count int DEFAULT 0,
  gift_coins_total int DEFAULT 0,
  follows_count int DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  UNIQUE(session_id, bucket_minute)
);
ALTER TABLE stream.metrics_minute ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS stream.event_archive_files (
  id bigserial PRIMARY KEY,
  user_id uuid REFERENCES public.profiles(user_id) ON DELETE CASCADE NOT NULL,
  date date NOT NULL,
  storage_path text NOT NULL,
  events_count bigint DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, date)
);
ALTER TABLE stream.event_archive_files ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- 5. ASSETS
-- ============================================================
CREATE TABLE IF NOT EXISTS assets.asset_items (
  id bigserial PRIMARY KEY,
  user_id uuid REFERENCES public.profiles(user_id) ON DELETE CASCADE NOT NULL,
  asset_type text NOT NULL CHECK (asset_type IN ('sound','video','image')),
  title text NOT NULL,
  tags text[],
  storage_bucket text,
  storage_path text,
  mime_type text,
  size_bytes bigint,
  duration_ms int,
  hash_sha256 text,
  is_enabled boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE assets.asset_items ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS assets.asset_versions (
  id bigserial PRIMARY KEY,
  asset_id bigint REFERENCES assets.asset_items(id) ON DELETE CASCADE NOT NULL,
  version int NOT NULL DEFAULT 1,
  storage_path text NOT NULL,
  size_bytes bigint,
  hash_sha256 text,
  created_at timestamptz DEFAULT now(),
  UNIQUE(asset_id, version)
);
ALTER TABLE assets.asset_versions ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS assets.asset_packs (
  id bigserial PRIMARY KEY,
  user_id uuid REFERENCES public.profiles(user_id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  description text,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE assets.asset_packs ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS assets.asset_pack_items (
  id bigserial PRIMARY KEY,
  pack_id bigint REFERENCES assets.asset_packs(id) ON DELETE CASCADE NOT NULL,
  asset_id bigint REFERENCES assets.asset_items(id) ON DELETE CASCADE NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(pack_id, asset_id)
);
ALTER TABLE assets.asset_pack_items ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS assets.client_cache_state (
  id bigserial PRIMARY KEY,
  user_id uuid REFERENCES public.profiles(user_id) ON DELETE CASCADE NOT NULL,
  device_id text NOT NULL,
  asset_id bigint REFERENCES assets.asset_items(id) ON DELETE CASCADE NOT NULL,
  cached_hash text,
  cached_at timestamptz DEFAULT now(),
  last_used_at timestamptz,
  UNIQUE(user_id, device_id, asset_id)
);
ALTER TABLE assets.client_cache_state ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- 6. OVERLAY
-- ============================================================
CREATE TABLE IF NOT EXISTS overlay.overlays (
  id bigserial PRIMARY KEY,
  user_id uuid REFERENCES public.profiles(user_id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  public_token text UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(16), 'hex'),
  is_enabled boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE overlay.overlays ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS overlay.templates (
  id bigserial PRIMARY KEY,
  code text UNIQUE,
  name text NOT NULL,
  is_system boolean DEFAULT false,
  preview_url text,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE overlay.templates ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS overlay.overlay_layouts (
  id bigserial PRIMARY KEY,
  overlay_id bigint REFERENCES overlay.overlays(id) ON DELETE CASCADE NOT NULL,
  template_id bigint REFERENCES overlay.templates(id),
  name text NOT NULL,
  canvas_width int DEFAULT 1920,
  canvas_height int DEFAULT 1080,
  config jsonb DEFAULT '{}',
  is_active boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE overlay.overlay_layouts ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS overlay.layers (
  id bigserial PRIMARY KEY,
  layout_id bigint REFERENCES overlay.overlay_layouts(id) ON DELETE CASCADE NOT NULL,
  layer_type text NOT NULL CHECK (layer_type IN ('alerts','video','top_gifts','combo','goals','chat','tts','custom')),
  z_index int DEFAULT 0,
  is_enabled boolean DEFAULT true,
  config jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);
ALTER TABLE overlay.layers ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS overlay.overlay_sessions (
  id bigserial PRIMARY KEY,
  overlay_id bigint REFERENCES overlay.overlays(id) ON DELETE CASCADE NOT NULL,
  connected_at timestamptz DEFAULT now(),
  last_ping_at timestamptz DEFAULT now(),
  client_info jsonb DEFAULT '{}',
  is_active boolean DEFAULT true
);
ALTER TABLE overlay.overlay_sessions ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- 7. AUTOMATION
-- ============================================================
CREATE TABLE IF NOT EXISTS automation.rulesets (
  id bigserial PRIMARY KEY,
  user_id uuid REFERENCES public.profiles(user_id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE automation.rulesets ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS automation.rules (
  id bigserial PRIMARY KEY,
  ruleset_id bigint REFERENCES automation.rulesets(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  is_enabled boolean DEFAULT true,
  priority int DEFAULT 100,
  cooldown_ms int DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE automation.rules ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS automation.triggers (
  id bigserial PRIMARY KEY,
  rule_id bigint REFERENCES automation.rules(id) ON DELETE CASCADE NOT NULL,
  trigger_type text NOT NULL CHECK (trigger_type IN ('gift','follow','join','like','sub','comment','share')),
  gift_id text,
  gift_min_coins int,
  min_combo int,
  actor_filter text,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE automation.triggers ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS automation.conditions (
  id bigserial PRIMARY KEY,
  rule_id bigint REFERENCES automation.rules(id) ON DELETE CASCADE NOT NULL,
  condition_type text NOT NULL CHECK (condition_type IN ('time_window','rate_limit','min_fan_level','keyword','regex')),
  params jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);
ALTER TABLE automation.conditions ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS automation.actions (
  id bigserial PRIMARY KEY,
  rule_id bigint REFERENCES automation.rules(id) ON DELETE CASCADE NOT NULL,
  action_type text NOT NULL CHECK (action_type IN ('play_sound','play_video','tts','show_alert','set_overlay_state')),
  asset_id bigint REFERENCES assets.asset_items(id) ON DELETE SET NULL,
  overlay_id bigint REFERENCES overlay.overlays(id) ON DELETE SET NULL,
  params jsonb DEFAULT '{}',
  order_index int DEFAULT 0,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE automation.actions ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS automation.hotkeys (
  id bigserial PRIMARY KEY,
  user_id uuid REFERENCES public.profiles(user_id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  key_combo text NOT NULL,
  action_type text NOT NULL CHECK (action_type IN ('play_sound','play_video','pause_tts','skip_tts','mute_all')),
  asset_id bigint REFERENCES assets.asset_items(id) ON DELETE SET NULL,
  params jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, key_combo)
);
ALTER TABLE automation.hotkeys ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- 8. AGENCY — tables first, then function, then policies
-- ============================================================
CREATE TABLE IF NOT EXISTS agency.agencies (
  id bigserial PRIMARY KEY,
  name text NOT NULL,
  country text,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE agency.agencies ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS agency.agency_members (
  id bigserial PRIMARY KEY,
  agency_id bigint REFERENCES agency.agencies(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES public.profiles(user_id) ON DELETE CASCADE NOT NULL,
  role text NOT NULL DEFAULT 'streamer' CHECK (role IN ('owner','manager','streamer')),
  created_at timestamptz DEFAULT now(),
  UNIQUE(agency_id, user_id)
);
ALTER TABLE agency.agency_members ENABLE ROW LEVEL SECURITY;

-- Security definer function (after both tables exist)
CREATE OR REPLACE FUNCTION agency.is_agency_member(_user_id uuid, _agency_id bigint)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = agency
AS $$
  SELECT EXISTS (SELECT 1 FROM agency.agency_members WHERE user_id = _user_id AND agency_id = _agency_id);
$$;

CREATE TABLE IF NOT EXISTS agency.streamer_profiles (
  id bigserial PRIMARY KEY,
  agency_id bigint REFERENCES agency.agencies(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES public.profiles(user_id) ON DELETE CASCADE NOT NULL,
  level int DEFAULT 0,
  xp int DEFAULT 0,
  notes text,
  created_at timestamptz DEFAULT now(),
  UNIQUE(agency_id, user_id)
);
ALTER TABLE agency.streamer_profiles ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS agency.tasks (
  id bigserial PRIMARY KEY,
  agency_id bigint REFERENCES agency.agencies(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  description text,
  reward_xp int DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE agency.tasks ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS agency.task_progress (
  id bigserial PRIMARY KEY,
  task_id bigint REFERENCES agency.tasks(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES public.profiles(user_id) ON DELETE CASCADE NOT NULL,
  status text DEFAULT 'assigned' CHECK (status IN ('assigned','done','approved')),
  progress jsonb DEFAULT '{}',
  updated_at timestamptz DEFAULT now(),
  UNIQUE(task_id, user_id)
);
ALTER TABLE agency.task_progress ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- 9. ACADEMY
-- ============================================================
CREATE TABLE IF NOT EXISTS academy.courses (
  id bigserial PRIMARY KEY,
  title text NOT NULL,
  description text,
  is_published boolean DEFAULT false,
  cover_url text,
  order_index int DEFAULT 0,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE academy.courses ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS academy.lessons (
  id bigserial PRIMARY KEY,
  course_id bigint REFERENCES academy.courses(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  content_type text DEFAULT 'text' CHECK (content_type IN ('video','text','quiz')),
  content jsonb DEFAULT '{}',
  order_index int DEFAULT 0,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE academy.lessons ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS academy.enrollments (
  id bigserial PRIMARY KEY,
  user_id uuid REFERENCES public.profiles(user_id) ON DELETE CASCADE NOT NULL,
  course_id bigint REFERENCES academy.courses(id) ON DELETE CASCADE NOT NULL,
  status text DEFAULT 'active' CHECK (status IN ('active','completed')),
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, course_id)
);
ALTER TABLE academy.enrollments ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS academy.lesson_progress (
  id bigserial PRIMARY KEY,
  user_id uuid REFERENCES public.profiles(user_id) ON DELETE CASCADE NOT NULL,
  lesson_id bigint REFERENCES academy.lessons(id) ON DELETE CASCADE NOT NULL,
  status text DEFAULT 'started' CHECK (status IN ('started','completed')),
  progress jsonb DEFAULT '{}',
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, lesson_id)
);
ALTER TABLE academy.lesson_progress ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- 10. ALL RLS POLICIES (after all tables exist)
-- ============================================================

-- CORE policies
CREATE POLICY "plans_select_all" ON core.plans FOR SELECT TO authenticated USING (true);
CREATE POLICY "plans_admin_write" ON core.plans FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "plan_limits_select_all" ON core.plan_limits FOR SELECT TO authenticated USING (true);
CREATE POLICY "plan_limits_admin_write" ON core.plan_limits FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "subs_select_own" ON core.subscriptions FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "subs_admin_all" ON core.subscriptions FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "entitlements_select_own" ON core.entitlements FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "entitlements_admin_all" ON core.entitlements FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "audit_admin_select" ON core.audit_log FOR SELECT TO authenticated USING (public.is_admin());
CREATE POLICY "audit_insert_any" ON core.audit_log FOR INSERT TO authenticated WITH CHECK (true);

-- STREAM policies
CREATE POLICY "connections_select_own" ON stream.connections FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "connections_write_own" ON stream.connections FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "metrics_select_own" ON stream.metrics_minute FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "archives_select_own" ON stream.event_archive_files FOR SELECT TO authenticated USING (user_id = auth.uid());

-- ASSETS policies
CREATE POLICY "assets_select_own" ON assets.asset_items FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "assets_write_own" ON assets.asset_items FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "asset_ver_select" ON assets.asset_versions FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM assets.asset_items ai WHERE ai.id = asset_id AND ai.user_id = auth.uid()));
CREATE POLICY "packs_select_own" ON assets.asset_packs FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "packs_write_own" ON assets.asset_packs FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "pack_items_select" ON assets.asset_pack_items FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM assets.asset_packs ap WHERE ap.id = pack_id AND ap.user_id = auth.uid()));
CREATE POLICY "cache_select_own" ON assets.client_cache_state FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "cache_write_own" ON assets.client_cache_state FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- OVERLAY policies
CREATE POLICY "overlays_select_own" ON overlay.overlays FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "overlays_write_own" ON overlay.overlays FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "overlays_public_token" ON overlay.overlays FOR SELECT TO anon USING (is_enabled = true);
CREATE POLICY "templates_select_all" ON overlay.templates FOR SELECT TO authenticated USING (true);
CREATE POLICY "templates_public" ON overlay.templates FOR SELECT TO anon USING (true);
CREATE POLICY "templates_admin_write" ON overlay.templates FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "layouts_select_own" ON overlay.overlay_layouts FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM overlay.overlays o WHERE o.id = overlay_id AND o.user_id = auth.uid()));
CREATE POLICY "layouts_write_own" ON overlay.overlay_layouts FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM overlay.overlays o WHERE o.id = overlay_id AND o.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM overlay.overlays o WHERE o.id = overlay_id AND o.user_id = auth.uid()));
CREATE POLICY "layouts_public" ON overlay.overlay_layouts FOR SELECT TO anon
  USING (EXISTS (SELECT 1 FROM overlay.overlays o WHERE o.id = overlay_id AND o.is_enabled = true) AND is_active = true);
CREATE POLICY "layers_select_own" ON overlay.layers FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM overlay.overlay_layouts ol JOIN overlay.overlays o ON o.id = ol.overlay_id WHERE ol.id = layout_id AND o.user_id = auth.uid()));
CREATE POLICY "layers_write_own" ON overlay.layers FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM overlay.overlay_layouts ol JOIN overlay.overlays o ON o.id = ol.overlay_id WHERE ol.id = layout_id AND o.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM overlay.overlay_layouts ol JOIN overlay.overlays o ON o.id = ol.overlay_id WHERE ol.id = layout_id AND o.user_id = auth.uid()));
CREATE POLICY "layers_public" ON overlay.layers FOR SELECT TO anon
  USING (EXISTS (SELECT 1 FROM overlay.overlay_layouts ol JOIN overlay.overlays o ON o.id = ol.overlay_id WHERE ol.id = layout_id AND o.is_enabled = true AND ol.is_active = true));
CREATE POLICY "osess_select_own" ON overlay.overlay_sessions FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM overlay.overlays o WHERE o.id = overlay_id AND o.user_id = auth.uid()));

-- AUTOMATION policies
CREATE POLICY "rulesets_select_own" ON automation.rulesets FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "rulesets_write_own" ON automation.rulesets FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "rules_select_own" ON automation.rules FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM automation.rulesets rs WHERE rs.id = ruleset_id AND rs.user_id = auth.uid()));
CREATE POLICY "rules_write_own" ON automation.rules FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM automation.rulesets rs WHERE rs.id = ruleset_id AND rs.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM automation.rulesets rs WHERE rs.id = ruleset_id AND rs.user_id = auth.uid()));
CREATE POLICY "triggers_select_own" ON automation.triggers FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM automation.rules r JOIN automation.rulesets rs ON rs.id = r.ruleset_id WHERE r.id = rule_id AND rs.user_id = auth.uid()));
CREATE POLICY "triggers_write_own" ON automation.triggers FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM automation.rules r JOIN automation.rulesets rs ON rs.id = r.ruleset_id WHERE r.id = rule_id AND rs.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM automation.rules r JOIN automation.rulesets rs ON rs.id = r.ruleset_id WHERE r.id = rule_id AND rs.user_id = auth.uid()));
CREATE POLICY "conditions_select_own" ON automation.conditions FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM automation.rules r JOIN automation.rulesets rs ON rs.id = r.ruleset_id WHERE r.id = rule_id AND rs.user_id = auth.uid()));
CREATE POLICY "conditions_write_own" ON automation.conditions FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM automation.rules r JOIN automation.rulesets rs ON rs.id = r.ruleset_id WHERE r.id = rule_id AND rs.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM automation.rules r JOIN automation.rulesets rs ON rs.id = r.ruleset_id WHERE r.id = rule_id AND rs.user_id = auth.uid()));
CREATE POLICY "actions_select_own" ON automation.actions FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM automation.rules r JOIN automation.rulesets rs ON rs.id = r.ruleset_id WHERE r.id = rule_id AND rs.user_id = auth.uid()));
CREATE POLICY "actions_write_own" ON automation.actions FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM automation.rules r JOIN automation.rulesets rs ON rs.id = r.ruleset_id WHERE r.id = rule_id AND rs.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM automation.rules r JOIN automation.rulesets rs ON rs.id = r.ruleset_id WHERE r.id = rule_id AND rs.user_id = auth.uid()));
CREATE POLICY "hotkeys_select_own" ON automation.hotkeys FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "hotkeys_write_own" ON automation.hotkeys FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- AGENCY policies (agency_members exists now)
CREATE POLICY "agencies_select_members" ON agency.agencies FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM agency.agency_members am WHERE am.agency_id = id AND am.user_id = auth.uid()) OR public.is_admin());
CREATE POLICY "agencies_admin_write" ON agency.agencies FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "am_select_same_agency" ON agency.agency_members FOR SELECT TO authenticated
  USING (agency.is_agency_member(auth.uid(), agency_id) OR public.is_admin());
CREATE POLICY "am_admin_write" ON agency.agency_members FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "sp_select" ON agency.streamer_profiles FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR agency.is_agency_member(auth.uid(), agency_id) OR public.is_admin());
CREATE POLICY "sp_admin_write" ON agency.streamer_profiles FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "tasks_select" ON agency.tasks FOR SELECT TO authenticated
  USING (agency.is_agency_member(auth.uid(), agency_id) OR public.is_admin());
CREATE POLICY "tasks_admin_write" ON agency.tasks FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "tp_select_own" ON agency.task_progress FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.is_admin());
CREATE POLICY "tp_update_own" ON agency.task_progress FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "tp_admin_write" ON agency.task_progress FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- ACADEMY policies
CREATE POLICY "courses_select_published" ON academy.courses FOR SELECT TO authenticated USING (is_published = true OR public.is_admin());
CREATE POLICY "courses_admin_write" ON academy.courses FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "lessons_select" ON academy.lessons FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM academy.courses c WHERE c.id = course_id AND (c.is_published = true OR public.is_admin())));
CREATE POLICY "lessons_admin_write" ON academy.lessons FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "enrollments_select_own" ON academy.enrollments FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "enrollments_insert_own" ON academy.enrollments FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "enrollments_update_own" ON academy.enrollments FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "lp_select_own" ON academy.lesson_progress FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "lp_write_own" ON academy.lesson_progress FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- ============================================================
-- 11. INDEXES
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_subscriptions_user ON core.subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_entitlements_user ON core.entitlements(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_created ON core.audit_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_connections_user ON stream.connections(user_id);
CREATE INDEX IF NOT EXISTS idx_metrics_session ON stream.metrics_minute(session_id, bucket_minute);
CREATE INDEX IF NOT EXISTS idx_assets_user_type ON assets.asset_items(user_id, asset_type);
CREATE INDEX IF NOT EXISTS idx_overlays_user ON overlay.overlays(user_id);
CREATE INDEX IF NOT EXISTS idx_overlays_token ON overlay.overlays(public_token);
CREATE INDEX IF NOT EXISTS idx_rulesets_user ON automation.rulesets(user_id);
CREATE INDEX IF NOT EXISTS idx_hotkeys_user ON automation.hotkeys(user_id);
CREATE INDEX IF NOT EXISTS idx_am_user ON agency.agency_members(user_id);
CREATE INDEX IF NOT EXISTS idx_sp_user ON agency.streamer_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_user ON academy.enrollments(user_id);
CREATE INDEX IF NOT EXISTS idx_lp_user ON academy.lesson_progress(user_id);

-- ============================================================
-- 12. GRANTS for existing tables
-- ============================================================
GRANT ALL ON ALL TABLES IN SCHEMA core TO anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA stream TO anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA assets TO anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA overlay TO anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA automation TO anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA agency TO anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA academy TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA core TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA stream TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA assets TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA overlay TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA automation TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA agency TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA academy TO anon, authenticated, service_role;
