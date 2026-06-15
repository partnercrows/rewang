import { useAuth } from "./useAuth";

export type SubscriptionTier = "none" | "starter" | "family";

export interface SubscriptionLimits {
  tier: SubscriptionTier;
  isActive: boolean;
  // Starter limits
  maxTasksPerDay: number;       // Starter: 5, Family: unlimited (gunakan Infinity)
  maxFavoriteRecipes: number;   // Starter: 10, Family: unlimited
  maxFamilyMembers: number;     // Starter: 2 (1+1), Family: 6
  canAccessFeed: boolean;       // Starter: false, Family: true
  canAccessFinance: boolean;    // Starter: false, Family: true
  canAccessWishlist: boolean;   // Starter: false, Family: true
  // NONE: all false / 0
}

const STARTER_LIMITS: Omit<SubscriptionLimits, "tier" | "isActive"> = {
  maxTasksPerDay: 5,
  maxFavoriteRecipes: 10,
  maxFamilyMembers: 2, // akun utama + 1 undangan
  canAccessFeed: false,
  canAccessFinance: false,
  canAccessWishlist: false,
};

const FAMILY_LIMITS: Omit<SubscriptionLimits, "tier" | "isActive"> = {
  maxTasksPerDay: Infinity,
  maxFavoriteRecipes: Infinity,
  maxFamilyMembers: 6,
  canAccessFeed: true,
  canAccessFinance: true,
  canAccessWishlist: true,
};

const NONE_LIMITS: Omit<SubscriptionLimits, "tier" | "isActive"> = {
  maxTasksPerDay: 0,
  maxFavoriteRecipes: 0,
  maxFamilyMembers: 0,
  canAccessFeed: false,
  canAccessFinance: false,
  canAccessWishlist: false,
};

/**
 * Hook untuk mengecek batasan fitur berdasarkan subscription tier user.
 * Menggunakan logika mandiri (frontend-only) — tidak perlu cron job.
 */
export function useSubscriptionGate(): SubscriptionLimits {
  const { profile } = useAuth();

  // Default: NONE (paling aman)
  if (!profile) {
    return { tier: "none", isActive: false, ...NONE_LIMITS };
  }

  const sekarang = new Date();
  const tanggalExpired = profile.subscription_expires_at
    ? new Date(profile.subscription_expires_at)
    : null;

  // Cek aktif & belum expired (expired at end of day, 23:59:59)
  const isActive =
    profile.is_active === true &&
    (!tanggalExpired || sekarang < new Date(tanggalExpired.getFullYear(), tanggalExpired.getMonth(), tanggalExpired.getDate() + 1));

  const tier = (profile.subscription_tier as SubscriptionTier) || "none";

  // Jika tidak aktif atau tier none, langsung kunci
  if (!isActive || tier === "none") {
    return { tier: "none", isActive: false, ...NONE_LIMITS };
  }

  if (tier === "starter") {
    return { tier: "starter", isActive: true, ...STARTER_LIMITS };
  }

  if (tier === "family") {
    return { tier: "family", isActive: true, ...FAMILY_LIMITS };
  }

  // Fallback
  return { tier: "none", isActive: false, ...NONE_LIMITS };
}