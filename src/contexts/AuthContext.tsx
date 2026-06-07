import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { supabasePublic } from '@/integrations/supabase/publicClient';
import { canAccessProduct as canAccessProductByRole, isSuperAdminEmail } from '@/lib/roles';

interface AuthContextValue {
  user: User | null;
  session: Session | null;
  role: string | null;
  canAccessProduct: boolean;
  referralCode: string | null;
  onboardingCompleted: boolean | null;
  loading: boolean;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [referralCode, setReferralCode] = useState<string | null>(null);
  const [onboardingCompleted, setOnboardingCompleted] = useState<boolean | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [profileLoading, setProfileLoading] = useState(false);

  const refreshProfile = useCallback(async () => {
    if (!session?.user) {
      setRole(null);
      setReferralCode(null);
      setOnboardingCompleted(null);
      setProfileLoading(false);
      return;
    }

    setProfileLoading(true);

    const superAdmin = isSuperAdminEmail(session.user.email);

    const { data, error } = await (supabasePublic as any).rpc('ensure_profile_access_data');

    if (error) {
      console.error('Failed to load profile access data:', error.message);
      setRole(superAdmin ? 'owner' : null);
      setReferralCode(null);
    } else {
      const row = Array.isArray(data) ? data[0] : data;
      setRole(row?.role ?? (superAdmin ? 'owner' : null));
      setReferralCode(row?.referral_code ?? null);
    }

    const { data: profileData, error: profileError } = await (supabasePublic as any)
      .from('profiles')
      .select('onboarding_completed')
      .eq('user_id', session.user.id)
      .maybeSingle();

    if (profileError) {
      console.error('Failed to load onboarding status:', profileError.message);
      // Never trap super-admins on /onboarding because of a transient query error
      setOnboardingCompleted(superAdmin ? true : false);
      setProfileLoading(false);
      return;
    }

    const completed = Boolean(profileData?.onboarding_completed);
    setOnboardingCompleted(superAdmin ? true : completed);
    setProfileLoading(false);
  }, [session?.user]);

  useEffect(() => {
    let mounted = true;

    const initialize = async () => {
      const { data } = await supabasePublic.auth.getSession();
      if (mounted) {
        setSession(data.session ?? null);
        setAuthLoading(false);
      }
    };

    void initialize();

    const {
      data: { subscription },
    } = supabasePublic.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession ?? null);
      setAuthLoading(false);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    void refreshProfile();
  }, [refreshProfile, session?.user?.id]);

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      user: session?.user ?? null,
      role,
      canAccessProduct: canAccessProductByRole(role, session?.user?.email ?? null),
      referralCode,
      onboardingCompleted,
      loading: authLoading || profileLoading,
      signOut: async () => {
        await supabasePublic.auth.signOut();
      },
      refreshProfile,
    }),
    [authLoading, onboardingCompleted, profileLoading, referralCode, role, session, refreshProfile],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used inside AuthProvider');
  }
  return ctx;
};
