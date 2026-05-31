
-- Restrict app_content writes to admins only
DROP POLICY IF EXISTS app_content_write_all ON public.app_content;
DROP POLICY IF EXISTS app_content_update_all ON public.app_content;

CREATE POLICY app_content_insert_admin
ON public.app_content
FOR INSERT
TO authenticated
WITH CHECK (public.is_admin());

CREATE POLICY app_content_update_admin
ON public.app_content
FOR UPDATE
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

CREATE POLICY app_content_delete_admin
ON public.app_content
FOR DELETE
TO authenticated
USING (public.is_admin());

-- Harden ai_api_keys_public view: use invoker rights and revoke public access
ALTER VIEW public.ai_api_keys_public SET (security_invoker = on);
REVOKE ALL ON public.ai_api_keys_public FROM PUBLIC;
REVOKE ALL ON public.ai_api_keys_public FROM anon;
REVOKE ALL ON public.ai_api_keys_public FROM authenticated;
GRANT SELECT ON public.ai_api_keys_public TO service_role;
