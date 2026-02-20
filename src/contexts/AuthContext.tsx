import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { supabasePublic } from '@/integrations/supabase/publicClient';
import { isSuperAdminEmail } from '@/lib/roles';

interface AuthContextValue {
  user: User | null;
  session: Session | null;
  role: string | null;
  referralCode: string | null;
  loading: boolean;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [referralCode, setReferralCode] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshProfile = useCallback(async () => {
    if (!session?.user) {
      setRole(null);
      setReferralCode(null);
      return;
    }

    const { data, error } = await (supabasePublic as any).rpc('ensure_profile_access_data');

    if (error) {
      console.error('Failed to load profile access data:', error.message);
      if (isSuperAdminEmail(session.user.email)) {
        setRole('owner');
      }
      return;
    }

    const row = Array.isArray(data) ? data[0] : data;
    setRole(row?.role ?? (isSuperAdminEmail(session.user.email) ? 'owner' : null));
    setReferralCode(row?.referral_code ?? null);
  }, [session?.user]);

  useEffect(() => {
    let mounted = true;

    const initialize = async () => {
      const { data } = await supabasePublic.auth.getSession();
      if (mounted) {
        setSession(data.session ?? null);
        setLoading(false);
      }
    };

    void initialize();

    const {
      data: { subscription },
    } = supabasePublic.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession ?? null);
      setLoading(false);
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
      referralCode,
      loading,
      signOut: async () => {
        await supabasePublic.auth.signOut();
      },
      refreshProfile,
    }),
    [loading, referralCode, role, session],
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
