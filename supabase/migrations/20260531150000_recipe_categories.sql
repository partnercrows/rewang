-- Recipe categories table
CREATE TABLE IF NOT EXISTS public.recipe_categories (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id  UUID NOT NULL REFERENCES families(id),
  name       TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  deleted_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_recipe_categories_family ON recipe_categories(family_id) WHERE deleted_at IS NULL;

-- Permissions & RLS
GRANT SELECT, INSERT, UPDATE, DELETE ON public.recipe_categories TO authenticated;
GRANT ALL ON public.recipe_categories TO service_role;
ALTER TABLE public.recipe_categories ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Family members access recipe categories' AND tablename = 'recipe_categories') THEN
    CREATE POLICY "Family members access recipe categories" ON public.recipe_categories
      FOR ALL TO authenticated USING (family_id = current_family_id()) WITH CHECK (family_id = current_family_id());
  END IF;
END $$;
