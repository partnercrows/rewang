-- Trigger: enforce recipe count limit based on subscription tier
-- Starter tier: max 10 recipes per family
-- Family tier: unlimited
-- None/inactive: cannot insert

CREATE OR REPLACE FUNCTION public.check_recipe_insert_limit()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_subscription_tier TEXT;
  v_is_active         BOOLEAN;
  v_recipe_count      INTEGER;
BEGIN
  -- Get the current user's subscription info
  SELECT p.subscription_tier, p.is_active
    INTO v_subscription_tier, v_is_active
    FROM profiles p
   WHERE p.id = auth.uid();

  -- If profile not found, deny
  IF v_subscription_tier IS NULL THEN
    RAISE EXCEPTION 'Profil pengguna tidak ditemukan.';
  END IF;

  -- If not active, deny
  IF v_is_active IS NOT TRUE THEN
    RAISE EXCEPTION 'Langganan Anda tidak aktif. Upgrade untuk menambah resep.';
  END IF;

  -- If none tier, deny
  IF v_subscription_tier = 'none' THEN
    RAISE EXCEPTION 'Anda belum berlangganan. Upgrade ke Starter atau Family untuk menambah resep.';
  END IF;

  -- Starter tier: enforce 10 recipe limit
  IF v_subscription_tier = 'starter' THEN
    SELECT count(*)
      INTO v_recipe_count
      FROM recipes
     WHERE family_id = NEW.family_id
       AND deleted_at IS NULL;

    IF v_recipe_count >= 10 THEN
      RAISE EXCEPTION 'Batas 10 resep tercapai. Upgrade ke Family untuk resep tak terbatas.';
    END IF;
  END IF;

  -- Family tier: unlimited, no check needed

  RETURN NEW;
END;
$$;

-- Attach trigger only on INSERT (updates don't increase count)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'trg_check_recipe_insert_limit'
  ) THEN
    CREATE TRIGGER trg_check_recipe_insert_limit
      BEFORE INSERT ON public.recipes
      FOR EACH ROW
      EXECUTE FUNCTION public.check_recipe_insert_limit();
  END IF;
END $$;

-- Allow service_role to bypass the trigger
ALTER FUNCTION public.check_recipe_insert_limit() OWNER TO postgres;
REVOKE EXECUTE ON FUNCTION public.check_recipe_insert_limit() FROM PUBLIC, anon, authenticated;