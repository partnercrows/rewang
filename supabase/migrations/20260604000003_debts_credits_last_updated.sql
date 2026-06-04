-- Add last_updated_by columns to debts_credits
ALTER TABLE public.debts_credits
  ADD COLUMN IF NOT EXISTS last_updated_by uuid,
  ADD COLUMN IF NOT EXISTS last_updated_by_name varchar;