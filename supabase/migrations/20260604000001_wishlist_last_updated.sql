-- Add last_updated_by columns to wishlist_items
ALTER TABLE public.wishlist_items
  ADD COLUMN IF NOT EXISTS last_updated_by uuid,
  ADD COLUMN IF NOT EXISTS last_updated_by_name varchar;