-- ========== ADD SUBSCRIPTION COLUMNS TO profiles ==========
-- is_active: apakah akun berhak masuk dasbor (default false untuk keamanan)
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS is_active boolean NOT NULL DEFAULT false;

-- subscription_tier: paket langganan (none / starter / family)
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS subscription_tier text NOT NULL DEFAULT 'none';

-- subscription_expires_at: batas waktu presisi masa aktif langganan
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS subscription_expires_at timestamptz DEFAULT NULL;

-- ========== UBAH DEFAULT ROLE ==========
-- Keamanan: user baru tidak boleh otomatis jadi admin
-- Migration sebelumnya set default 'admin', ini kita ubah ke 'user'
ALTER TABLE public.profiles
  ALTER COLUMN role SET DEFAULT 'user';

-- Update existing users yang masih pakai default 'admin' (jika ada yg belum di-set manual)
-- Tapi jangan overwrite yang sudah sengaja di-set admin oleh super admin
-- Kita hanya update yang rolenya 'admin' DAN dibuat sebelum migration ini (created_at < now())
-- Ini opsional — jika Bos sudah punya admin, skip dengan WHERE clause yang aman
-- UPDATE public.profiles SET role = 'user' WHERE role = 'admin' AND id NOT IN (SELECT id FROM public.profiles WHERE role = 'admin' LIMIT 1);

-- ========== UPDATE ensure_profile() RPC ==========
-- Pastikan user baru via OAuth mendapat default value subscription columns
CREATE OR REPLACE FUNCTION public.ensure_profile()
RETURNS public.profiles
LANGUAGE plpgsql
SET search_path = public
SECURITY DEFINER
AS $$
DECLARE
  _uid uuid;
  _user record;
  _profile public.profiles;
BEGIN
  _uid := auth.uid();
  IF _uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Get auth user info
  SELECT * INTO _user FROM auth.users WHERE id = _uid;

  -- Check if profile already exists
  SELECT * INTO _profile FROM public.profiles WHERE id = _uid;

  IF _profile.id IS NOT NULL THEN
    -- Update email & name if changed, but preserve existing subscription data
    UPDATE public.profiles
    SET
      email = COALESCE(_user.email, profiles.email),
      full_name = CASE
        WHEN profiles.full_name IS NULL OR profiles.full_name = '' THEN
          COALESCE(_user.raw_user_meta_data->>'full_name', _user.raw_user_meta_data->>'name', split_part(_user.email, '@', 1))
        ELSE profiles.full_name
      END,
      updated_at = now()
    WHERE id = _uid;

    SELECT * INTO _profile FROM public.profiles WHERE id = _uid;
    RETURN _profile;
  END IF;

  -- Create new profile with secure defaults
  INSERT INTO public.profiles (id, email, full_name, role, is_active, subscription_tier, subscription_expires_at)
  VALUES (
    _uid,
    _user.email,
    COALESCE(_user.raw_user_meta_data->>'full_name', _user.raw_user_meta_data->>'name', split_part(_user.email, '@', 1)),
    'user',           -- role default: user (bukan admin)
    false,            -- is_active default: false (harus diaktivasi admin)
    'none',           -- subscription_tier default: none
    NULL              -- subscription_expires_at default: NULL
  )
  ON CONFLICT (id) DO UPDATE SET
    email = COALESCE(profiles.email, EXCLUDED.email),
    full_name = CASE
      WHEN profiles.full_name IS NULL OR profiles.full_name = '' THEN EXCLUDED.full_name
      ELSE profiles.full_name
    END;

  SELECT * INTO _profile FROM public.profiles WHERE id = _uid;
  RETURN _profile;
END;
$$;