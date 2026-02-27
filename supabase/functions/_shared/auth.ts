/// <reference path="../esm-shims.d.ts" />
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';

export const corsHeaders: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
const anonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? '';
const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

if (!supabaseUrl || !anonKey || !serviceRoleKey) {
  throw new Error('Missing required Supabase environment variables for edge functions');
}

export const adminClient = createClient(supabaseUrl, serviceRoleKey);
const authClient = createClient(supabaseUrl, anonKey);

export const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });

export const getBearerToken = (request: Request) => {
  const authHeader = request.headers.get('Authorization') ?? request.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) return null;
  return authHeader.slice(7);
};

export const resolveRequester = async (request: Request) => {
  const token = getBearerToken(request);
  if (!token) {
    return { error: json(401, { error: 'Missing access token' }) };
  }

  const { data, error } = await authClient.auth.getUser(token);
  if (error || !data.user) {
    return { error: json(401, { error: 'Invalid access token' }) };
  }

  return { user: data.user };
};

export const userCanManageUsers = async (userId: string, requiredPermissions: string[] = ['users.create']) => {
  const [permissionResults, tierResult] = await Promise.all([
    Promise.all(
      requiredPermissions.map((permissionKey) =>
        adminClient.rpc('has_permission', {
          _user_id: userId,
          _permission_key: permissionKey,
        }),
      ),
    ),
    adminClient.rpc('get_user_tier', {
      _user_id: userId,
    }),
  ]);

  const tierError = tierResult.error;
  if (tierError) {
    return { allowed: false, error: tierError.message ?? 'Tier check failed' };
  }

  const firstPermissionError = permissionResults.find((result: any) => result.error)?.error;
  if (firstPermissionError) {
    return { allowed: false, error: firstPermissionError.message ?? 'Permission check failed' };
  }

  const hasRequiredPermission = permissionResults.some((result: any) => Boolean(result.data));
  const tier = String(tierResult.data ?? 'tier_0');
  const hasTierAccess = tier === 'tier_3' || tier === 'tier_4';

  return { allowed: hasRequiredPermission || hasTierAccess, tier };
};

export const enforceAdminRateLimit = async (userId: string, action: string, perMinute = 8) => {
  const since = new Date(Date.now() - 60_000).toISOString();
  const { count, error } = await adminClient
    .from('audit_log')
    .select('id', { count: 'exact', head: true })
    .eq('actor_user_id', userId)
    .eq('action', action)
    .gte('created_at', since);

  if (error) {
    return { ok: false, error: error.message };
  }

  if ((count ?? 0) >= perMinute) {
    return { ok: false, error: 'Rate limit exceeded. Try again in a minute.' };
  }

  return { ok: true };
};

export const normalizeRoleSlugs = (value: unknown) => {
  if (!Array.isArray(value)) return [] as string[];
  return value
    .map((item) => String(item ?? '').trim().toLowerCase())
    .filter(Boolean)
    .filter((item, idx, arr) => arr.indexOf(item) === idx);
};
