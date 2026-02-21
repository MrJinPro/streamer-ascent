
-- ============================================================
-- 1) ENUMS
-- ============================================================
CREATE TYPE public.role_visibility AS ENUM ('public', 'internal');
CREATE TYPE public.access_tier AS ENUM ('tier_0', 'tier_1', 'tier_2', 'tier_3', 'tier_4');
CREATE TYPE public.tiktok_sync_status AS ENUM ('pending', 'running', 'success', 'failed');

-- ============================================================
-- 2) ROLES TABLE (replaces simple enum-based roles)
-- ============================================================
CREATE TABLE public.roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  visibility role_visibility NOT NULL DEFAULT 'public',
  description_ru text,
  description_en text,
  is_system_role boolean NOT NULL DEFAULT false,
  tier access_tier NOT NULL DEFAULT 'tier_0',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "roles_select_authenticated" ON public.roles
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "roles_admin_insert" ON public.roles
  FOR INSERT TO authenticated WITH CHECK (public.is_admin());
CREATE POLICY "roles_admin_update" ON public.roles
  FOR UPDATE TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "roles_admin_delete" ON public.roles
  FOR DELETE TO authenticated USING (public.is_admin() AND NOT is_system_role);

-- ============================================================
-- 3) PERMISSIONS TABLE
-- ============================================================
CREATE TABLE public.permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text NOT NULL UNIQUE,
  description_ru text,
  description_en text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.permissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "permissions_select_authenticated" ON public.permissions
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "permissions_admin_manage" ON public.permissions
  FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- ============================================================
-- 4) ROLE_PERMISSIONS (junction)
-- ============================================================
CREATE TABLE public.role_permissions (
  role_id uuid NOT NULL REFERENCES public.roles(id) ON DELETE CASCADE,
  permission_id uuid NOT NULL REFERENCES public.permissions(id) ON DELETE CASCADE,
  PRIMARY KEY (role_id, permission_id)
);

ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "role_permissions_select_authenticated" ON public.role_permissions
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "role_permissions_admin_manage" ON public.role_permissions
  FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- ============================================================
-- 5) UPDATE user_roles to reference roles table
-- Add role_id column alongside existing role column for migration
-- ============================================================
ALTER TABLE public.user_roles ADD COLUMN IF NOT EXISTS role_id uuid REFERENCES public.roles(id) ON DELETE CASCADE;

-- ============================================================
-- 6) PROFILES: add TikTok sync fields
-- ============================================================
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS tiktok_avatar_url text,
  ADD COLUMN IF NOT EXISTS tiktok_bio text,
  ADD COLUMN IF NOT EXISTS tiktok_nickname text,
  ADD COLUMN IF NOT EXISTS tiktok_followers bigint DEFAULT 0,
  ADD COLUMN IF NOT EXISTS tiktok_last_sync_at timestamptz;

-- ============================================================
-- 7) TIKTOK SYNC LOGS
-- ============================================================
CREATE TABLE public.tiktok_sync_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  status tiktok_sync_status NOT NULL DEFAULT 'pending',
  error text,
  started_at timestamptz NOT NULL DEFAULT now(),
  finished_at timestamptz
);

ALTER TABLE public.tiktok_sync_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tiktok_sync_logs_select_own_or_admin" ON public.tiktok_sync_logs
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.is_admin());
CREATE POLICY "tiktok_sync_logs_insert_system" ON public.tiktok_sync_logs
  FOR INSERT TO authenticated WITH CHECK (true);

-- ============================================================
-- 8) AUDIT LOG
-- ============================================================
CREATE TABLE public.audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_user_id uuid,
  action text NOT NULL,
  entity text,
  entity_id text,
  before_data jsonb,
  after_data jsonb,
  ip_address text,
  user_agent text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "audit_log_select_admin" ON public.audit_log
  FOR SELECT TO authenticated USING (public.is_admin());
CREATE POLICY "audit_log_insert_authenticated" ON public.audit_log
  FOR INSERT TO authenticated WITH CHECK (true);

-- ============================================================
-- 9) SECURITY DEFINER: check user permission
-- ============================================================
CREATE OR REPLACE FUNCTION public.has_permission(_user_id uuid, _permission_key text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles ur
    JOIN public.role_permissions rp ON rp.role_id = ur.role_id
    JOIN public.permissions p ON p.id = rp.permission_id
    WHERE ur.user_id = _user_id
      AND p.key = _permission_key
  );
$$;

-- ============================================================
-- 10) SECURITY DEFINER: check if user has any public role
-- ============================================================
CREATE OR REPLACE FUNCTION public.has_public_role(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles ur
    JOIN public.roles r ON r.id = ur.role_id
    WHERE ur.user_id = _user_id
      AND r.visibility = 'public'
  );
$$;

-- ============================================================
-- 11) SECURITY DEFINER: get user's highest tier
-- ============================================================
CREATE OR REPLACE FUNCTION public.get_user_tier(_user_id uuid)
RETURNS access_tier
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT MAX(r.tier) FROM public.user_roles ur JOIN public.roles r ON r.id = ur.role_id WHERE ur.user_id = _user_id),
    'tier_0'::access_tier
  );
$$;

-- ============================================================
-- 12) SECURITY DEFINER: get all permissions for a user
-- ============================================================
CREATE OR REPLACE FUNCTION public.get_user_permissions(_user_id uuid)
RETURNS SETOF text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT DISTINCT p.key
  FROM public.user_roles ur
  JOIN public.role_permissions rp ON rp.role_id = ur.role_id
  JOIN public.permissions p ON p.id = rp.permission_id
  WHERE ur.user_id = _user_id;
$$;

-- ============================================================
-- 13) INVESTOR VIEWS (aggregated, no PII)
-- ============================================================
CREATE OR REPLACE VIEW public.v_investor_kpi_monthly AS
SELECT
  date_trunc('month', ge.event_ts)::date AS month,
  COUNT(DISTINCT sa.streamer_id) AS active_streamers,
  COUNT(ge.id) AS total_gifts,
  COALESCE(SUM(ge.diamonds_total), 0) AS total_diamonds
FROM public.gift_events ge
JOIN public.streamer_accounts sa ON sa.id = ge.streamer_account_id
GROUP BY date_trunc('month', ge.event_ts);

CREATE OR REPLACE VIEW public.v_investor_growth AS
SELECT
  date_trunc('month', p.created_at)::date AS month,
  COUNT(*) AS new_users
FROM public.profiles p
GROUP BY date_trunc('month', p.created_at);

-- ============================================================
-- 14) SEED ROLES
-- ============================================================
INSERT INTO public.roles (name, slug, visibility, tier, is_system_role, description_ru, description_en) VALUES
  -- Public roles
  ('Streamer', 'streamer', 'public', 'tier_0', true, 'Основной пользователь — рейтинги, XP, достижения', 'Main user — rankings, XP, achievements'),
  ('Rising Star', 'rising_star', 'public', 'tier_0', false, 'Перспективный новичок', 'Promising newcomer'),
  ('Nova Creator', 'nova_creator', 'public', 'tier_0', false, 'Топ/партнёр агентства', 'Top partner / creator'),
  ('Verified', 'verified', 'public', 'tier_0', false, 'Проверенный агентством стример', 'Agency-verified streamer'),
  -- Internal roles
  ('Architect', 'architect', 'internal', 'tier_3', true, 'Полный доступ к админке и настройкам', 'Full admin access'),
  ('Engineer', 'engineer', 'internal', 'tier_2', true, 'Доступ к настройкам и логам, без выплат', 'Settings/logs access, no payouts'),
  ('Head Mentor', 'head_mentor', 'internal', 'tier_2', true, 'Управляет менторами, модерация обучения', 'Manages mentors, academy moderation'),
  ('Mentor', 'mentor', 'internal', 'tier_1', true, 'Сопровождение стримеров, задачи, обучение', 'Streamer guidance, tasks, academy'),
  ('Support', 'support', 'internal', 'tier_1', true, 'Тикеты и чаты, без управления XP', 'Tickets and chats, no XP management'),
  ('Agency Manager', 'agency_manager', 'internal', 'tier_2', true, 'Агентство, выплаты, контракты', 'Agency, payouts, contracts'),
  ('Analyst', 'analyst', 'internal', 'tier_1', true, 'Только чтение метрик и экспорт', 'Metrics read-only and export'),
  ('Moderator', 'moderator', 'internal', 'tier_1', true, 'Модерация контента, чатов, статей', 'Content, chat, article moderation'),
  -- Investor roles
  ('Investor Viewer', 'investor_viewer', 'internal', 'tier_1', true, 'Только чтение фин.дашбордов без PII', 'Financial dashboards read-only, no PII'),
  ('Investor Pro', 'investor_pro', 'internal', 'tier_2', true, 'Чтение + monthly reports + KPI', 'Read + monthly reports + KPI'),
  ('Board', 'board', 'internal', 'tier_2', true, 'Чтение + комментарии + roadmap', 'Read + comments + roadmap'),
  -- System roles
  ('System Owner', 'system_owner', 'internal', 'tier_4', true, 'Суперадмин — максимальный доступ', 'Superadmin — maximum access');

-- ============================================================
-- 15) SEED PERMISSIONS
-- ============================================================
INSERT INTO public.permissions (key, description_ru, description_en) VALUES
  -- Users & Roles
  ('users.read', 'Просмотр пользователей', 'View users'),
  ('users.create', 'Создание пользователей', 'Create users'),
  ('users.update', 'Редактирование пользователей', 'Edit users'),
  ('users.delete', 'Удаление пользователей', 'Delete users'),
  ('roles.read', 'Просмотр ролей', 'View roles'),
  ('roles.manage', 'Управление ролями', 'Manage roles'),
  ('permissions.manage', 'Управление правами (только архитектор)', 'Manage permissions (architect only)'),
  -- Profiles / TikTok
  ('profiles.read', 'Просмотр профилей', 'View profiles'),
  ('profiles.update_self', 'Редактирование своего профиля', 'Edit own profile'),
  ('profiles.update_any', 'Редактирование любого профиля', 'Edit any profile'),
  ('tiktok.sync.run', 'Запуск синхронизации TikTok', 'Run TikTok sync'),
  ('tiktok.sync.view_logs', 'Просмотр логов синхронизации', 'View sync logs'),
  -- Streams & Metrics
  ('streams.read', 'Просмотр стримов', 'View streams'),
  ('streams.manage', 'Управление стримами', 'Manage streams'),
  ('metrics.read', 'Просмотр метрик', 'View metrics'),
  ('metrics.export', 'Экспорт метрик', 'Export metrics'),
  -- Achievements / XP / Progress
  ('achievements.read', 'Просмотр достижений', 'View achievements'),
  ('achievements.manage', 'Управление достижениями', 'Manage achievements'),
  ('xp.adjust', 'Ручная корректировка XP', 'Manual XP adjustment'),
  ('progress.manage', 'Управление деревом прогресса', 'Manage progress tree'),
  -- Tasks
  ('tasks.read', 'Просмотр задач', 'View tasks'),
  ('tasks.manage', 'Управление задачами', 'Manage tasks'),
  ('tasks.assign', 'Назначение задач', 'Assign tasks'),
  ('tasks.verify', 'Подтверждение выполнения задач', 'Verify task completion'),
  ('tasks.ai_rules.manage', 'Настройка авто-подбора задач', 'AI task rules config'),
  -- Academy
  ('academy.read', 'Просмотр обучения', 'View academy'),
  ('academy.manage', 'Управление обучением', 'Manage academy'),
  ('academy.publish', 'Публикация обучения', 'Publish academy content'),
  ('academy.review', 'Модерация контента обучения', 'Review academy content'),
  ('academy.progress.reset', 'Сброс прогресса пользователя', 'Reset user progress'),
  -- Articles
  ('articles.read', 'Просмотр статей', 'View articles'),
  ('articles.manage', 'Управление статьями', 'Manage articles'),
  ('articles.publish', 'Публикация статей', 'Publish articles'),
  -- Chat / Support / Tickets
  ('chat.read', 'Просмотр чатов', 'View chats'),
  ('chat.moderate', 'Модерация чатов', 'Moderate chats'),
  ('tickets.read', 'Просмотр тикетов', 'View tickets'),
  ('tickets.manage', 'Управление тикетами', 'Manage tickets'),
  ('tickets.assign', 'Назначение тикетов', 'Assign tickets'),
  -- Agency / Payments
  ('agency.read', 'Просмотр агентства', 'View agency'),
  ('agency.manage', 'Управление агентством', 'Manage agency'),
  ('payouts.read', 'Просмотр выплат', 'View payouts'),
  ('payouts.manage', 'Управление выплатами', 'Manage payouts'),
  ('contracts.read', 'Просмотр контрактов', 'View contracts'),
  ('contracts.manage', 'Управление контрактами', 'Manage contracts'),
  -- Analytics / Admin
  ('analytics.read', 'Просмотр аналитики', 'View analytics'),
  ('audit.read', 'Просмотр аудит-логов', 'View audit logs'),
  ('audit.manage', 'Управление аудит-логами', 'Manage audit logs'),
  ('settings.read', 'Просмотр настроек', 'View settings'),
  ('settings.manage', 'Управление настройками', 'Manage settings'),
  -- System
  ('system.superadmin', 'Полный доступ ко всему', 'Full system access'),
  ('system.impersonate', 'Вход как другой пользователь', 'Impersonate user');

-- ============================================================
-- 16) SEED ROLE_PERMISSIONS (Architect gets everything except system.*)
-- ============================================================
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM public.roles r
CROSS JOIN public.permissions p
WHERE r.slug = 'system_owner';

INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM public.roles r
CROSS JOIN public.permissions p
WHERE r.slug = 'architect'
  AND p.key NOT IN ('system.superadmin', 'system.impersonate', 'permissions.manage');

INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM public.roles r
CROSS JOIN public.permissions p
WHERE r.slug = 'engineer'
  AND p.key IN ('users.read', 'roles.read', 'profiles.read', 'profiles.update_self',
    'tiktok.sync.run', 'tiktok.sync.view_logs', 'streams.read', 'streams.manage',
    'metrics.read', 'metrics.export', 'analytics.read', 'audit.read', 'settings.read', 'settings.manage');

INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM public.roles r
CROSS JOIN public.permissions p
WHERE r.slug = 'head_mentor'
  AND p.key IN ('users.read', 'profiles.read', 'profiles.update_any', 'achievements.read',
    'achievements.manage', 'xp.adjust', 'progress.manage', 'tasks.read', 'tasks.manage',
    'tasks.assign', 'tasks.verify', 'tasks.ai_rules.manage', 'academy.read', 'academy.manage',
    'academy.publish', 'academy.review', 'academy.progress.reset', 'articles.read',
    'chat.read', 'chat.moderate', 'analytics.read');

INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM public.roles r
CROSS JOIN public.permissions p
WHERE r.slug = 'mentor'
  AND p.key IN ('users.read', 'profiles.read', 'profiles.update_self', 'achievements.read',
    'tasks.read', 'tasks.assign', 'tasks.verify', 'academy.read', 'academy.review',
    'articles.read', 'chat.read', 'chat.moderate');

INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM public.roles r
CROSS JOIN public.permissions p
WHERE r.slug = 'support'
  AND p.key IN ('users.read', 'profiles.read', 'profiles.update_self', 'chat.read',
    'chat.moderate', 'tickets.read', 'tickets.manage', 'tickets.assign');

INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM public.roles r
CROSS JOIN public.permissions p
WHERE r.slug = 'agency_manager'
  AND p.key IN ('users.read', 'profiles.read', 'agency.read', 'agency.manage',
    'payouts.read', 'payouts.manage', 'contracts.read', 'contracts.manage',
    'streams.read', 'metrics.read', 'analytics.read');

INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM public.roles r
CROSS JOIN public.permissions p
WHERE r.slug = 'analyst'
  AND p.key IN ('users.read', 'profiles.read', 'streams.read', 'metrics.read',
    'metrics.export', 'analytics.read', 'achievements.read', 'tasks.read');

INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM public.roles r
CROSS JOIN public.permissions p
WHERE r.slug = 'moderator'
  AND p.key IN ('users.read', 'profiles.read', 'chat.read', 'chat.moderate',
    'articles.read', 'articles.manage', 'articles.publish', 'academy.read',
    'academy.review', 'achievements.read');

INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM public.roles r
CROSS JOIN public.permissions p
WHERE r.slug = 'streamer'
  AND p.key IN ('profiles.read', 'profiles.update_self', 'achievements.read',
    'tasks.read', 'academy.read', 'articles.read', 'chat.read', 'streams.read');

-- Investor roles
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM public.roles r
CROSS JOIN public.permissions p
WHERE r.slug = 'investor_viewer'
  AND p.key IN ('analytics.read', 'metrics.read');

INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM public.roles r
CROSS JOIN public.permissions p
WHERE r.slug = 'investor_pro'
  AND p.key IN ('analytics.read', 'metrics.read', 'metrics.export');

INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM public.roles r
CROSS JOIN public.permissions p
WHERE r.slug = 'board'
  AND p.key IN ('analytics.read', 'metrics.read');

-- ============================================================
-- 17) UPDATE ensure_profile_access_data to include role_id info
-- ============================================================
CREATE OR REPLACE FUNCTION public.ensure_profile_access_data()
RETURNS TABLE(role text, referral_code text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _uid uuid := auth.uid();
  _role text;
BEGIN
  -- Ensure profile exists
  INSERT INTO public.profiles (user_id, email)
  VALUES (_uid, (SELECT email FROM auth.users WHERE id = _uid))
  ON CONFLICT (user_id) DO NOTHING;

  -- Get highest-priority role slug
  SELECT r.slug INTO _role
  FROM public.user_roles ur
  JOIN public.roles r ON r.id = ur.role_id
  WHERE ur.user_id = _uid
  ORDER BY r.tier DESC, ur.assigned_at ASC
  LIMIT 1;

  -- Fallback to legacy role column
  IF _role IS NULL THEN
    SELECT ur.role::text INTO _role
    FROM public.user_roles ur
    WHERE ur.user_id = _uid
    ORDER BY ur.assigned_at ASC
    LIMIT 1;
  END IF;

  RETURN QUERY SELECT _role, NULL::text;
END;
$$;
