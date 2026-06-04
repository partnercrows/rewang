-- Add last_updated_by columns to bills
ALTER TABLE public.bills
  ADD COLUMN IF NOT EXISTS last_updated_by uuid,
  ADD COLUMN IF NOT EXISTS last_updated_by_name varchar;