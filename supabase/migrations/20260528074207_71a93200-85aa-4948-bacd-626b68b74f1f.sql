
-- ========== ALTER existing tables ==========
ALTER TABLE public.shopping_items
  ADD COLUMN IF NOT EXISTS unit varchar DEFAULT 'pcs',
  ADD COLUMN IF NOT EXISTS quantity_decimal numeric,
  ADD COLUMN IF NOT EXISTS last_updated_by uuid,
  ADD COLUMN IF NOT EXISTS last_updated_by_name varchar;

UPDATE public.shopping_items SET quantity_decimal = current_stock WHERE quantity_decimal IS NULL;

ALTER TABLE public.bills
  ADD COLUMN IF NOT EXISTS bill_type varchar DEFAULT 'lainnya',
  ADD COLUMN IF NOT EXISTS notes text,
  ADD COLUMN IF NOT EXISTS reminder_days int DEFAULT 3,
  ADD COLUMN IF NOT EXISTS paid_at timestamptz;

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS role varchar NOT NULL DEFAULT 'admin';

-- ========== Auto-update shopping status ==========
CREATE OR REPLACE FUNCTION public.update_shopping_status()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF COALESCE(NEW.quantity_decimal, NEW.current_stock, 0) <= 0 THEN
    NEW.status := 'Habis';
  ELSIF COALESCE(NEW.quantity_decimal, NEW.current_stock, 0) <= NEW.min_stock THEN
    NEW.status := 'Menipis';
  ELSE
    NEW.status := 'Aman';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_shopping_status ON public.shopping_items;
CREATE TRIGGER trg_shopping_status BEFORE INSERT OR UPDATE ON public.shopping_items
FOR EACH ROW EXECUTE FUNCTION public.update_shopping_status();

-- Recompute existing rows
UPDATE public.shopping_items SET quantity_decimal = COALESCE(quantity_decimal, current_stock);

-- ========== wishlist_items ==========
CREATE TABLE IF NOT EXISTS public.wishlist_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id uuid NOT NULL,
  item_name varchar NOT NULL,
  estimated_price numeric DEFAULT 0,
  priority varchar NOT NULL DEFAULT 'medium',
  notes text,
  purchased_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.wishlist_items TO authenticated;
GRANT ALL ON public.wishlist_items TO service_role;
ALTER TABLE public.wishlist_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Family members access wishlist" ON public.wishlist_items
  FOR ALL TO authenticated USING (family_id = current_family_id()) WITH CHECK (family_id = current_family_id());

-- ========== agenda_events ==========
CREATE TABLE IF NOT EXISTS public.agenda_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id uuid NOT NULL,
  title varchar NOT NULL,
  event_date date NOT NULL,
  event_type varchar NOT NULL DEFAULT 'pengingat',
  notes text,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.agenda_events TO authenticated;
GRANT ALL ON public.agenda_events TO service_role;
ALTER TABLE public.agenda_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Family members access agenda" ON public.agenda_events
  FOR ALL TO authenticated USING (family_id = current_family_id()) WITH CHECK (family_id = current_family_id());

-- ========== quick_notes ==========
CREATE TABLE IF NOT EXISTS public.quick_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id uuid NOT NULL,
  content text NOT NULL,
  is_pinned boolean NOT NULL DEFAULT false,
  created_by uuid,
  created_by_name varchar,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.quick_notes TO authenticated;
GRANT ALL ON public.quick_notes TO service_role;
ALTER TABLE public.quick_notes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Family members access notes" ON public.quick_notes
  FOR ALL TO authenticated USING (family_id = current_family_id()) WITH CHECK (family_id = current_family_id());

-- ========== emergency_contacts ==========
CREATE TABLE IF NOT EXISTS public.emergency_contacts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id uuid NOT NULL,
  name varchar NOT NULL,
  phone varchar NOT NULL,
  category varchar NOT NULL DEFAULT 'lainnya',
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.emergency_contacts TO authenticated;
GRANT ALL ON public.emergency_contacts TO service_role;
ALTER TABLE public.emergency_contacts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Family members access contacts" ON public.emergency_contacts
  FOR ALL TO authenticated USING (family_id = current_family_id()) WITH CHECK (family_id = current_family_id());

-- ========== household_documents ==========
CREATE TABLE IF NOT EXISTS public.household_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id uuid NOT NULL,
  title varchar NOT NULL,
  category varchar NOT NULL DEFAULT 'lainnya',
  drive_url text,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.household_documents TO authenticated;
GRANT ALL ON public.household_documents TO service_role;
ALTER TABLE public.household_documents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Family members access documents" ON public.household_documents
  FOR ALL TO authenticated USING (family_id = current_family_id()) WITH CHECK (family_id = current_family_id());

-- ========== bill_payments ==========
CREATE TABLE IF NOT EXISTS public.bill_payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id uuid NOT NULL,
  bill_id uuid NOT NULL,
  amount numeric NOT NULL,
  paid_at timestamptz NOT NULL DEFAULT now(),
  paid_by uuid,
  paid_by_name varchar,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.bill_payments TO authenticated;
GRANT ALL ON public.bill_payments TO service_role;
ALTER TABLE public.bill_payments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Family members access bill payments" ON public.bill_payments
  FOR ALL TO authenticated USING (family_id = current_family_id()) WITH CHECK (family_id = current_family_id());

-- ========== shopping_categories ==========
CREATE TABLE IF NOT EXISTS public.shopping_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id uuid NOT NULL,
  name varchar NOT NULL,
  color varchar DEFAULT '#7d9b76',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.shopping_categories TO authenticated;
GRANT ALL ON public.shopping_categories TO service_role;
ALTER TABLE public.shopping_categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Family members access shopping categories" ON public.shopping_categories
  FOR ALL TO authenticated USING (family_id = current_family_id()) WITH CHECK (family_id = current_family_id());

-- ========== Storage bucket for avatars ==========
INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Avatars publicly readable" ON storage.objects FOR SELECT USING (bucket_id = 'avatars');
CREATE POLICY "Users upload own avatar" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users update own avatar" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users delete own avatar" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);
