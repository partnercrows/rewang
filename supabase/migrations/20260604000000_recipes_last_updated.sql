-- Add last_updated_by columns to recipes
ALTER TABLE public.recipes
  ADD COLUMN IF NOT EXISTS last_updated_by uuid,
  ADD COLUMN IF NOT EXISTS last_updated_by_name varchar;