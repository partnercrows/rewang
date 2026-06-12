-- ========== FIX: Infinite Recursion in Admin RLS Policies ==========
-- Policy "Admin view all profiles" dan "Admin update subscription fields"
-- menggunakan subquery SELECT FROM profiles, yang memicu evaluasi RLS lagi
-- saat user biasa SELECT profiles (misal saat login/loadProfile).
-- Solusi: gunakan fungsi SECURITY DEFINER untuk bypass RLS.

-- 1. Drop policies yang bermasalah
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies
    WHERE policyname = 'Admin update subscription fields'
    AND tablename = 'profiles'
  ) THEN
    DROP POLICY "Admin update subscription fields" ON public.profiles;
  END IF;

  IF EXISTS (
    SELECT 1 FROM pg_policies
    WHERE policyname = 'Admin view all profiles'
    AND tablename = 'profiles'
  ) THEN
    DROP POLICY "Admin view all profiles" ON public.profiles;
  END IF;
END
$$;

-- 2. Buat fungsi is_admin() dengan SECURITY DEFINER (bypass RLS)
-- Fungsi ini membaca tabel profiles dengan hak akses owner,
-- sehingga tidak memicu evaluasi RLS policy dan menghindari infinite recursion
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
      AND role = 'admin'
      AND deleted_at IS NULL
  );
$$;

GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;

-- 3. Buat ulang admin policies menggunakan fungsi is_admin()
CREATE POLICY "Admin update subscription fields" ON public.profiles
  FOR UPDATE TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "Admin view all profiles" ON public.profiles
  FOR SELECT TO authenticated
  USING (public.is_admin());