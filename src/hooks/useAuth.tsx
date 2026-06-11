import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { useRouter } from "@tanstack/react-router";

export type Profile = {
  id: string;
  email: string;
  full_name: string;
  avatar_url: string | null;
  phone_number: string | null;
  family_id: string | null;
  role: string | null;
  is_active: boolean;
  subscription_tier: string;
  subscription_expires_at: string | null;
};

export type Family = {
  id: string;
  family_name: string;
  invite_code: string;
};

type AuthContextValue = {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  family: Family | null;
  loading: boolean;
  refresh: () => Promise<Profile | null>;
  setFamilyDirect: (family: Family) => void;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [family, setFamily] = useState<Family | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const loadProfile = async (userId: string): Promise<Profile | null> => {
    let { data: prof } = await supabase
      .from("profiles")
      .select("id,email,full_name,avatar_url,phone_number,family_id,role,is_active,subscription_tier,subscription_expires_at")
      .eq("id", userId)
      .maybeSingle();

    // OAuth fallback: profile may not exist yet for Google sign-in users.
    // Call ensure_profile RPC to create the profile row if missing.
    if (!prof) {
      await supabase.rpc("ensure_profile");
      await new Promise((r) => setTimeout(r, 200));
      const { data: refetched } = await supabase
        .from("profiles")
        .select("id,email,full_name,avatar_url,phone_number,family_id,role,is_active,subscription_tier,subscription_expires_at")
        .eq("id", userId)
        .maybeSingle();
      prof = refetched;
    }

    const p = prof as Profile | null;
    setProfile(p);

    if (p?.family_id) {
      const { data: fam } = await supabase
        .from("families")
        .select("id,family_name,invite_code")
        .eq("id", p.family_id)
        .is("deleted_at", null)
        .maybeSingle();
      setFamily(fam as Family | null);
    } else {
      setFamily(null);
    }

    return p;
  };

  const refresh = async (): Promise<Profile | null> => {
    if (!session?.user) return null;
    // Retry once with a small delay in case of replication lag after DB writes
    let prof = await loadProfile(session.user.id);
    if (!prof?.family_id) {
      await new Promise((r) => setTimeout(r, 300));
      prof = await loadProfile(session.user.id);
    }
    return prof;
  };

  useEffect(() => {
    let initialEventFired = false;

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
      if (newSession?.user) {
        loadProfile(newSession.user.id).finally(() => {
          if (!initialEventFired) {
            initialEventFired = true;
            setLoading(false);
          }
        });
      } else {
        setProfile(null);
        setFamily(null);
        if (!initialEventFired) {
          initialEventFired = true;
          setLoading(false);
        }
      }
      router.invalidate();
    });

    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      if (data.session?.user) {
        if (!initialEventFired) {
          loadProfile(data.session.user.id).finally(() => {
            if (!initialEventFired) {
              initialEventFired = true;
              setLoading(false);
            }
          });
        }
      } else if (!initialEventFired) {
        // Wait for onAuthStateChange to fire before giving up.
        // This handles OAuth hash processing race condition.
        setTimeout(() => {
          if (!initialEventFired) {
            initialEventFired = true;
            setLoading(false);
          }
        }, 1500);
      }
    });

    return () => subscription.unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const setFamilyDirect = (fam: Family) => {
    // Update profile's family_id in state so we don't rely on DB refresh
    setProfile((prev) => prev ? { ...prev, family_id: fam.id } : null);
    setFamily(fam);
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setProfile(null);
    setFamily(null);
  };

  return (
    <AuthContext.Provider
      value={{ session, user: session?.user ?? null, profile, family, loading, refresh, setFamilyDirect, signOut }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
