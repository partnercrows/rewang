-- ========== ADMIN RLS POLICY ==========
-- Allow admin (role='admin') to update subscription fields on any profile
-- This is used by the /admin-rewang-control dashboard
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE policyname = 'Admin update subscription fields' 
    AND tablename = 'profiles'
  ) THEN
    CREATE POLICY "Admin update subscription fields" ON public.profiles
      FOR UPDATE TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM public.profiles AS p
          WHERE p.id = auth.uid() AND p.role = 'admin' AND p.deleted_at IS NULL
        )
      )
      WITH CHECK (
        EXISTS (
          SELECT 1 FROM public.profiles AS p
          WHERE p.id = auth.uid() AND p.role = 'admin' AND p.deleted_at IS NULL
        )
      );
  END IF;

  -- Allow admin to SELECT all profiles (for admin dashboard)
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE policyname = 'Admin view all profiles' 
    AND tablename = 'profiles'
  ) THEN
    CREATE POLICY "Admin view all profiles" ON public.profiles
      FOR SELECT TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM public.profiles AS p
          WHERE p.id = auth.uid() AND p.role = 'admin' AND p.deleted_at IS NULL
        )
      );
  END IF;
END
$$;