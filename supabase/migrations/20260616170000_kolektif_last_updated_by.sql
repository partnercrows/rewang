-- Add last_updated_by and last_updated_by_name columns to kolektif_kegiatan
ALTER TABLE public.kolektif_kegiatan ADD COLUMN IF NOT EXISTS last_updated_by UUID REFERENCES profiles(id);
ALTER TABLE public.kolektif_kegiatan ADD COLUMN IF NOT EXISTS last_updated_by_name TEXT;