import {
  adminClient,
  corsHeaders,
  enforceAdminRateLimit,
  json,
  resolveRequester,
  userCanManageUsers,
} from '../_shared/auth.ts';

type ActionType = 'get_details' | 'update_profile' | 'reset_password' | 'delete_user' | 'send_recovery_invite';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/i;

const normalizeText = (value: unknown, maxLength = 255) => {
  const text = String(value ?? '').trim();
  if (!text) return null;
  return text.slice(0, maxLength);
};

Deno.serve(async (request: Request) => {
  if (request.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (request.method !== 'POST') {
    return json(405, { error: 'Method not allowed' });
  }

  const requesterResult = await resolveRequester(request);
  if (requesterResult.error) return requesterResult.error;
  const requester = requesterResult.user;

  const payload = await request.json().catch(() => null);
  const action = String(payload?.action ?? '').trim() as ActionType;
  const userId = String(payload?.userId ?? '').trim();

  if (!action || !userId) {
    return json(400, { error: 'Invalid payload' });
  }

  const requiredPermissionsByAction: Record<ActionType, string[]> = {
    get_details: ['users.read'],
    update_profile: ['users.update'],
    reset_password: ['users.update'],
    delete_user: ['users.delete'],
    send_recovery_invite: ['users.create', 'users.update'],
  };

  if (!(action in requiredPermissionsByAction)) {
    return json(400, { error: 'Unknown action' });
  }

  const authz = await userCanManageUsers(requester.id, requiredPermissionsByAction[action]);
  if (!authz.allowed) {
    return json(403, { error: 'Insufficient permissions' });
  }

  const rateLimit = await enforceAdminRateLimit(requester.id, `admin.user.${action}`, 40);
  if (!rateLimit.ok) {
    return json(429, { error: rateLimit.error });
  }

  if (action === 'get_details') {
    const [{ data: authUserData, error: authUserError }, { data: profileData }, { data: roleRows }] = await Promise.all([
      adminClient.auth.admin.getUserById(userId),
      adminClient
        .from('profiles')
        .select('user_id,email,display_name,username,tiktok_username,country,language,telegram_username,created_at,updated_at,is_online,onboarding_completed,onboarding_completed_at,onboarding_referral_code,onboarding_source')
        .eq('user_id', userId)
        .maybeSingle(),
      adminClient
        .from('user_roles')
        .select('role,role_id,roles:role_id(id,name,slug,visibility,tier)')
        .eq('user_id', userId),
    ]);

    const authUser = authUserData?.user ?? null;
    const authMissing = Boolean(authUserError || !authUser);

    // Fallback: check legacy public.users table if neither auth nor profile found
    let legacyUser: any = null;
    if (authMissing && !profileData) {
      const { data: legacyRows } = await adminClient
        .from('users')
        .select('id,supabase_uid,email,username,tiktok_username,created_at,last_ws_at')
        .or(`id.eq.${userId},supabase_uid.eq.${userId}`)
        .limit(1);

      legacyUser = legacyRows?.[0] ?? null;
      if (!legacyUser) {
        return json(404, { error: 'User not found' });
      }
    }

    return json(200, {
      ok: true,
      user: {
        id: authUser?.id ?? profileData?.user_id ?? legacyUser?.supabase_uid ?? legacyUser?.id ?? userId,
        email: authUser?.email ?? profileData?.email ?? legacyUser?.email ?? null,
        phone: authUser?.phone ?? null,
        createdAt: authUser?.created_at ?? profileData?.created_at ?? legacyUser?.created_at ?? null,
        updatedAt: authUser?.updated_at ?? profileData?.updated_at ?? null,
        lastSignInAt: authUser?.last_sign_in_at ?? legacyUser?.last_ws_at ?? null,
        emailConfirmedAt: authUser?.email_confirmed_at ?? null,
        phoneConfirmedAt: authUser?.phone_confirmed_at ?? null,
        bannedUntil: authUser?.banned_until ?? null,
        appMetadata: authUser?.app_metadata ?? {},
        userMetadata: authUser?.user_metadata ?? {},
        authMissing,
        legacyOnly: Boolean(legacyUser && !profileData),
      },
      profile: profileData ?? (legacyUser ? {
        user_id: legacyUser.supabase_uid ?? legacyUser.id,
        email: legacyUser.email,
        display_name: legacyUser.username ?? legacyUser.tiktok_username ?? null,
        username: legacyUser.username ?? null,
        tiktok_username: legacyUser.tiktok_username ?? null,
      } : null),
      roles: roleRows ?? [],
    });
  }

  if (action === 'update_profile') {
    const displayName = normalizeText(payload?.displayName, 120);
    const username = normalizeText(payload?.username, 64)?.toLowerCase() ?? null;
    const country = normalizeText(payload?.country, 120);
    const language = normalizeText(payload?.language, 16);
    const telegramUsername = normalizeText(payload?.telegramUsername, 120);
    const email = normalizeText(payload?.email, 255)?.toLowerCase() ?? null;

    if (email && !EMAIL_REGEX.test(email)) {
      return json(400, { error: 'Invalid email format' });
    }

    const profileFields = {
      email,
      display_name: displayName,
      username,
      country,
      language,
      telegram_username: telegramUsername,
      updated_at: new Date().toISOString(),
    };

    // Try update first; if no row matched, attempt insert only when auth user exists
    const { data: updatedRows, error: updateError } = await adminClient
      .from('profiles')
      .update(profileFields)
      .eq('user_id', userId)
      .select('user_id');

    if (updateError) {
      return json(500, { error: updateError.message });
    }

    if (!updatedRows?.length) {
      // Profile doesn't exist yet — only safe to insert if user_id exists in auth.users
      const { data: authCheck } = await adminClient.auth.admin.getUserById(userId);
      if (authCheck?.user) {
        const { error: insertError } = await adminClient
          .from('profiles')
          .insert({ user_id: userId, ...profileFields });

        if (insertError) {
          return json(500, { error: insertError.message });
        }
      } else {
        // Legacy-only user: update the legacy users table instead
        const legacyFields: Record<string, unknown> = {};
        if (email) legacyFields.email = email;
        if (username) legacyFields.username = username;
        if (displayName) legacyFields.tiktok_username = displayName;

        if (Object.keys(legacyFields).length) {
          await adminClient
            .from('users')
            .update(legacyFields)
            .or(`id.eq.${userId},supabase_uid.eq.${userId}`);
        }
      }
    }

    if (email) {
      // Only update auth if user exists there
      const { data: authForEmail } = await adminClient.auth.admin.getUserById(userId);
      if (authForEmail?.user) {
        const { error: authUpdateError } = await adminClient.auth.admin.updateUserById(userId, {
          email,
          user_metadata: { display_name: displayName },
        });

        if (authUpdateError) {
          return json(500, { error: authUpdateError.message });
        }
      }
    }

    await adminClient.from('audit_log').insert({
      actor_user_id: requester.id,
      action: 'admin.user.update_profile',
      entity: 'profiles',
      entity_id: userId,
      after_data: {
        displayName,
        username,
        country,
        language,
        telegramUsername,
        email,
      },
    });

    return json(200, { ok: true });
  }

  if (action === 'reset_password') {
    const newPassword = String(payload?.newPassword ?? '');

    const { data: authUserData, error: authLookupError } = await adminClient.auth.admin.getUserById(userId);
    if (authLookupError || !authUserData.user) {
      return json(404, { error: 'auth_user_missing' });
    }

    if (newPassword.length < 8) {
      return json(400, { error: 'Password must be at least 8 characters long' });
    }

    const { error: resetError } = await adminClient.auth.admin.updateUserById(userId, {
      password: newPassword,
    });

    if (resetError) {
      return json(500, { error: resetError.message });
    }

    await adminClient.from('audit_log').insert({
      actor_user_id: requester.id,
      action: 'admin.user.reset_password',
      entity: 'auth.users',
      entity_id: userId,
      after_data: {
        changed: true,
      },
    });

    return json(200, { ok: true });
  }

  if (action === 'send_recovery_invite') {
    const [{ data: authUserData }, { data: profileData }] = await Promise.all([
      adminClient.auth.admin.getUserById(userId),
      adminClient
        .from('profiles')
        .select('email,display_name')
        .eq('user_id', userId)
        .maybeSingle(),
    ]);

    let email = authUserData?.user?.email?.toLowerCase() ?? profileData?.email?.toLowerCase() ?? null;

    // Fallback: check legacy users table
    if (!email) {
      const { data: legacyRows } = await adminClient
        .from('users')
        .select('email')
        .or(`id.eq.${userId},supabase_uid.eq.${userId}`)
        .limit(1);
      email = legacyRows?.[0]?.email?.toLowerCase() ?? null;
    }

    if (!email || !EMAIL_REGEX.test(email)) {
      return json(400, { error: 'valid_email_required' });
    }

    const appUrl = Deno.env.get('APP_URL') ?? Deno.env.get('SITE_URL') ?? 'http://localhost:5173';
    const redirectTo = new URL('/auth', appUrl).toString();

    // First try recovery flow by email (works for existing auth users even when selected userId is legacy)
    const { error: recoveryError } = await adminClient.auth.admin.generateLink({
      type: 'recovery',
      email,
      options: { redirectTo },
    });

    if (recoveryError) {
      const recoveryMessage = String(recoveryError.message ?? '').toLowerCase();
      const shouldFallbackToInvite =
        recoveryMessage.includes('user not found')
        || recoveryMessage.includes('email not found')
        || (recoveryError as any)?.status === 404;

      if (!shouldFallbackToInvite) {
        return json(500, { error: recoveryError.message });
      }

      // Fallback only when email is not registered in auth
      const { error: inviteError } = await adminClient.auth.admin.inviteUserByEmail(email, {
        redirectTo,
        data: {
          source: 'admin-recovery-invite',
          target_user_id: userId,
        },
      });

      if (inviteError) {
        return json(500, { error: inviteError.message });
      }
    }

    await adminClient.from('audit_log').insert({
      actor_user_id: requester.id,
      action: 'admin.user.send_recovery_invite',
      entity: 'auth.users',
      entity_id: userId,
      after_data: {
        email,
      },
    });

    return json(200, { ok: true, email });
  }

  if (action === 'delete_user') {
    const hardDelete = Boolean(payload?.hardDelete);

    if (requester.id === userId) {
      return json(400, { error: 'You cannot delete yourself' });
    }

    const { data: authUserData } = await adminClient.auth.admin.getUserById(userId);
    const authUser = authUserData?.user ?? null;

    // Resolve email for invite cleanup
    let emailForInvites = authUser?.email ?? null;
    if (!emailForInvites) {
      const { data: profileRow } = await adminClient.from('profiles').select('email').eq('user_id', userId).maybeSingle();
      emailForInvites = profileRow?.email ?? null;
      if (!emailForInvites) {
        const { data: legacyRows } = await adminClient.from('users').select('email').or(`id.eq.${userId},supabase_uid.eq.${userId}`).limit(1);
        emailForInvites = legacyRows?.[0]?.email ?? null;
      }
    }

    // If user doesn't exist in auth, profiles, or legacy users, return 404
    if (!authUser && !emailForInvites) {
      const [{ data: profileCheck }, { data: legacyCheck }] = await Promise.all([
        adminClient.from('profiles').select('user_id').eq('user_id', userId).maybeSingle(),
        adminClient.from('users').select('id').or(`id.eq.${userId},supabase_uid.eq.${userId}`).limit(1),
      ]);

      if (!profileCheck && !(legacyCheck?.length)) {
        return json(404, { error: 'User not found' });
      }
    }

    const [
      removeRoles,
      removeProfile,
      removeInvites,
      removeLegacyUsers,
    ] = await Promise.all([
      adminClient.from('user_roles').delete().eq('user_id', userId),
      adminClient.from('profiles').delete().eq('user_id', userId),
      emailForInvites ? adminClient.from('admin_invites').delete().eq('email', emailForInvites) : Promise.resolve({ error: null }),
      adminClient.from('users').delete().or(`id.eq.${userId},supabase_uid.eq.${userId}`),
    ]);

    if (removeRoles.error || removeProfile.error || (removeInvites as any).error || removeLegacyUsers.error) {
      return json(500, {
        error:
          removeRoles.error?.message
          ?? removeProfile.error?.message
          ?? (removeInvites as any).error?.message
          ?? removeLegacyUsers.error?.message
          ?? 'Failed to delete linked rows',
      });
    }

    // Only delete from auth if user exists there
    if (authUser) {
      const { error: deleteError } = await adminClient.auth.admin.deleteUser(userId, hardDelete);
      if (deleteError) {
        return json(500, { error: deleteError.message });
      }
    }

    await adminClient.from('audit_log').insert({
      actor_user_id: requester.id,
      action: 'admin.user.delete',
      entity: 'auth.users',
      entity_id: userId,
      after_data: {
        hardDelete,
      },
    });

    return json(200, { ok: true });
  }

  return json(400, { error: 'Unknown action' });
});
