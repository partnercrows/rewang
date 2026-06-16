-- Create kolektif_kegiatan table for collective payment activities
CREATE TABLE IF NOT EXISTS public.kolektif_kegiatan (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id       UUID NOT NULL REFERENCES families(id),
  nama_kegiatan   TEXT NOT NULL,
  sifat_kegiatan  TEXT NOT NULL DEFAULT 'sekali_jalan' CHECK (sifat_kegiatan IN ('sekali_jalan', 'rutin')),
  jenis_pembayaran TEXT NOT NULL DEFAULT 'iuran_rata' CHECK (jenis_pembayaran IN ('iuran_rata', 'iuran_sukarela')),
  jumlah_bayar    NUMERIC DEFAULT NULL,
  batas_tanggal   DATE DEFAULT NULL,
  created_by        UUID REFERENCES profiles(id),
  created_by_name   TEXT,
  last_updated_by   UUID REFERENCES profiles(id),
  last_updated_by_name TEXT,
  created_at        TIMESTAMPTZ DEFAULT now(),
  updated_at        TIMESTAMPTZ DEFAULT now(),
  deleted_at        TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_kolektif_kegiatan_family ON kolektif_kegiatan(family_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_kolektif_kegiatan_created ON kolektif_kegiatan(created_at DESC) WHERE deleted_at IS NULL;

-- Create kolektif_peserta table for participants in collective activities
CREATE TABLE IF NOT EXISTS public.kolektif_peserta (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  kegiatan_id     UUID NOT NULL REFERENCES kolektif_kegiatan(id) ON DELETE CASCADE,
  nama            TEXT NOT NULL,
  alamat          TEXT DEFAULT NULL,
  no_hp           TEXT DEFAULT NULL,
  status_bayar    TEXT NOT NULL DEFAULT 'belum_bayar' CHECK (status_bayar IN ('belum_bayar', 'lunas', 'absen')),
  nominal         NUMERIC DEFAULT 0,
  tanggal_bayar   TIMESTAMPTZ DEFAULT NULL,
  is_aktif        BOOLEAN DEFAULT true,
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_kolektif_peserta_kegiatan ON kolektif_peserta(kegiatan_id);
CREATE INDEX IF NOT EXISTS idx_kolektif_peserta_status ON kolektif_peserta(status_bayar);

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON public.kolektif_kegiatan TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.kolektif_peserta TO authenticated;
GRANT ALL ON public.kolektif_kegiatan TO service_role;
GRANT ALL ON public.kolektif_peserta TO service_role;

-- Enable RLS
ALTER TABLE public.kolektif_kegiatan ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kolektif_peserta ENABLE ROW LEVEL SECURITY;

-- RLS Policies for kolektif_kegiatan
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Family members access kolektif_kegiatan' AND tablename = 'kolektif_kegiatan') THEN
    CREATE POLICY "Family members access kolektif_kegiatan" ON public.kolektif_kegiatan
      FOR ALL TO authenticated USING (family_id = current_family_id()) WITH CHECK (family_id = current_family_id());
  END IF;
END $$;

-- RLS Policies for kolektif_peserta
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Family members access kolektif_peserta' AND tablename = 'kolektif_peserta') THEN
    CREATE POLICY "Family members access kolektif_peserta" ON public.kolektif_peserta
      FOR ALL TO authenticated
      USING (kegiatan_id IN (SELECT id FROM kolektif_kegiatan WHERE family_id = current_family_id()))
      WITH CHECK (kegiatan_id IN (SELECT id FROM kolektif_kegiatan WHERE family_id = current_family_id()));
  END IF;
END $$;