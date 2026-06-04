-- Create recipes table for family recipe sharing
CREATE TABLE IF NOT EXISTS public.recipes (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id       UUID NOT NULL REFERENCES families(id),
  title           TEXT NOT NULL,
  description     TEXT,
  image_url       TEXT,
  category        TEXT NOT NULL DEFAULT 'Lainnya',
  created_by      UUID REFERENCES profiles(id),
  created_by_name TEXT,
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now(),
  deleted_at      TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_recipes_family_id ON recipes(family_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_recipes_category ON recipes(category) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_recipes_created_at ON recipes(created_at DESC) WHERE deleted_at IS NULL;

-- Permissions & RLS
GRANT SELECT, INSERT, UPDATE, DELETE ON public.recipes TO authenticated;
GRANT ALL ON public.recipes TO service_role;
ALTER TABLE public.recipes ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Family members access recipes' AND tablename = 'recipes') THEN
    CREATE POLICY "Family members access recipes" ON public.recipes
      FOR ALL TO authenticated USING (family_id = current_family_id()) WITH CHECK (family_id = current_family_id());
  END IF;
END $$;
