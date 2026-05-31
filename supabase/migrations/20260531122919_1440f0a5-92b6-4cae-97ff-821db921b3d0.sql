
-- 1. Add new block types to academy enum
ALTER TYPE public.academy_block_type_t ADD VALUE IF NOT EXISTS 'html';
ALTER TYPE public.academy_block_type_t ADD VALUE IF NOT EXISTS 'heading';
ALTER TYPE public.academy_block_type_t ADD VALUE IF NOT EXISTS 'quote';
ALTER TYPE public.academy_block_type_t ADD VALUE IF NOT EXISTS 'file';
ALTER TYPE public.academy_block_type_t ADD VALUE IF NOT EXISTS 'divider';

-- 2. Cascade delete RPC for courses and lessons (admin only)
CREATE OR REPLACE FUNCTION public.academy_delete_lesson(p_lesson_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'forbidden';
  END IF;
  DELETE FROM public.academy_blocks WHERE lesson_id = p_lesson_id;
  DELETE FROM public.academy_rewards WHERE lesson_id = p_lesson_id;
  DELETE FROM public.academy_quizzes WHERE lesson_id = p_lesson_id;
  DELETE FROM public.academy_progress WHERE lesson_id = p_lesson_id;
  DELETE FROM public.academy_generated_tasks WHERE lesson_id = p_lesson_id;
  DELETE FROM public.academy_lessons WHERE id = p_lesson_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.academy_delete_course(p_course_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  r record;
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'forbidden';
  END IF;
  FOR r IN SELECT id FROM public.academy_lessons WHERE course_id = p_course_id LOOP
    PERFORM public.academy_delete_lesson(r.id);
  END LOOP;
  DELETE FROM public.academy_courses WHERE id = p_course_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.academy_delete_lesson(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.academy_delete_course(uuid) TO authenticated;

-- 3. Support categories
CREATE TABLE IF NOT EXISTS public.support_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,
  title text NOT NULL,
  description text,
  sort_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.support_categories TO authenticated, anon;
GRANT ALL ON public.support_categories TO service_role;

ALTER TABLE public.support_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY support_categories_read ON public.support_categories
  FOR SELECT TO authenticated USING (true);
CREATE POLICY support_categories_admin_write ON public.support_categories
  FOR ALL TO authenticated USING (is_admin()) WITH CHECK (is_admin());

-- 4. Support tickets
CREATE TABLE IF NOT EXISTS public.support_tickets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  category_id uuid REFERENCES public.support_categories(id) ON DELETE SET NULL,
  subject text,
  status text NOT NULL DEFAULT 'ai_chat',
  -- ai_chat | open | in_progress | resolved | closed
  priority text NOT NULL DEFAULT 'normal',
  source text NOT NULL DEFAULT 'ai_chat',
  -- ai_chat | escalated | direct
  assigned_to uuid,
  last_message_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS support_tickets_user_idx ON public.support_tickets(user_id, updated_at DESC);
CREATE INDEX IF NOT EXISTS support_tickets_status_idx ON public.support_tickets(status, updated_at DESC);

GRANT SELECT, INSERT, UPDATE ON public.support_tickets TO authenticated;
GRANT ALL ON public.support_tickets TO service_role;

ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;

CREATE POLICY support_tickets_self_read ON public.support_tickets
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR is_admin());

CREATE POLICY support_tickets_self_insert ON public.support_tickets
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY support_tickets_admin_update ON public.support_tickets
  FOR UPDATE TO authenticated
  USING (is_admin() OR user_id = auth.uid())
  WITH CHECK (is_admin() OR user_id = auth.uid());

-- 5. Support messages
CREATE TABLE IF NOT EXISTS public.support_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id uuid NOT NULL REFERENCES public.support_tickets(id) ON DELETE CASCADE,
  sender_user_id uuid,
  sender_kind text NOT NULL DEFAULT 'user',
  -- user | ai | staff | system
  body text NOT NULL,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS support_messages_ticket_idx ON public.support_messages(ticket_id, created_at);

GRANT SELECT, INSERT ON public.support_messages TO authenticated;
GRANT ALL ON public.support_messages TO service_role;

ALTER TABLE public.support_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY support_messages_read ON public.support_messages
  FOR SELECT TO authenticated
  USING (
    is_admin() OR EXISTS (
      SELECT 1 FROM public.support_tickets t
      WHERE t.id = support_messages.ticket_id AND t.user_id = auth.uid()
    )
  );

CREATE POLICY support_messages_insert ON public.support_messages
  FOR INSERT TO authenticated
  WITH CHECK (
    is_admin() OR (
      sender_kind = 'user' AND EXISTS (
        SELECT 1 FROM public.support_tickets t
        WHERE t.id = support_messages.ticket_id AND t.user_id = auth.uid()
      )
    )
  );

-- 6. Seed support categories
INSERT INTO public.support_categories (slug, title, sort_order) VALUES
  ('appeal', 'Апелляция', 1),
  ('stream_access', 'Доступ к трансляциям', 2),
  ('author_other', 'Другие проблемы авторов', 3),
  ('author_management', 'Управление деятельностью авторов', 4),
  ('agency_settlement', 'Расчёты с агентством', 5),
  ('agency_other', 'Другие проблемы агентства', 6)
ON CONFLICT (slug) DO NOTHING;

-- 7. updated_at trigger for tickets
CREATE OR REPLACE FUNCTION public.support_tickets_touch_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS support_tickets_touch ON public.support_tickets;
CREATE TRIGGER support_tickets_touch
  BEFORE UPDATE ON public.support_tickets
  FOR EACH ROW EXECUTE FUNCTION public.support_tickets_touch_updated_at();

-- bump last_message_at on insert
CREATE OR REPLACE FUNCTION public.support_messages_touch_ticket()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  UPDATE public.support_tickets
  SET last_message_at = NEW.created_at,
      updated_at = NEW.created_at
  WHERE id = NEW.ticket_id;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS support_messages_after_insert ON public.support_messages;
CREATE TRIGGER support_messages_after_insert
  AFTER INSERT ON public.support_messages
  FOR EACH ROW EXECUTE FUNCTION public.support_messages_touch_ticket();
