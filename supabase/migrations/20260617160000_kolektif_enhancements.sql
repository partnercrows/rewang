-- Add penanggung_jawab, catatan, and status_kegiatan columns to kolektif_kegiatan
ALTER TABLE public.kolektif_kegiatan
  ADD COLUMN IF NOT EXISTS penanggung_jawab TEXT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS catatan TEXT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS status_kegiatan TEXT DEFAULT 'berlangsung' CHECK (status_kegiatan IN ('berlangsung', 'selesai'));

-- Create index for filtering by status
CREATE INDEX IF NOT EXISTS idx_kolektif_kegiatan_status ON kolektif_kegiatan(status_kegiatan) WHERE deleted_at IS NULL;