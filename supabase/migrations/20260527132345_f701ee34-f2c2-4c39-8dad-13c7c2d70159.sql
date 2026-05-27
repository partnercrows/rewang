
-- Helper trigger function for updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- FAMILIES
CREATE TABLE public.families (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_name VARCHAR(100) NOT NULL,
  invite_code VARCHAR(10) UNIQUE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ DEFAULT NULL
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.families TO authenticated;
GRANT ALL ON public.families TO service_role;
ALTER TABLE public.families ENABLE ROW LEVEL SECURITY;

-- PROFILES
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  avatar_url TEXT,
  phone_number VARCHAR(20),
  family_id UUID REFERENCES public.families(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ DEFAULT NULL
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Security definer to fetch current user's family_id without recursion
CREATE OR REPLACE FUNCTION public.current_family_id()
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT family_id FROM public.profiles WHERE id = auth.uid() AND deleted_at IS NULL;
$$;

-- PROFILES policies
CREATE POLICY "Users view own profile" ON public.profiles FOR SELECT TO authenticated
  USING (auth.uid() = id OR family_id = public.current_family_id());
CREATE POLICY "Users insert own profile" ON public.profiles FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = id);
CREATE POLICY "Users update own profile" ON public.profiles FOR UPDATE TO authenticated
  USING (auth.uid() = id);
CREATE POLICY "Users delete own profile" ON public.profiles FOR DELETE TO authenticated
  USING (auth.uid() = id);

-- FAMILIES policies
CREATE POLICY "Members view their family" ON public.families FOR SELECT TO authenticated
  USING (id = public.current_family_id());
CREATE POLICY "Authenticated can create family" ON public.families FOR INSERT TO authenticated
  WITH CHECK (true);
CREATE POLICY "Members update their family" ON public.families FOR UPDATE TO authenticated
  USING (id = public.current_family_id());
CREATE POLICY "Members delete their family" ON public.families FOR DELETE TO authenticated
  USING (id = public.current_family_id());

-- SHOPPING ITEMS
CREATE TABLE public.shopping_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id UUID NOT NULL REFERENCES public.families(id) ON DELETE CASCADE,
  item_name VARCHAR(255) NOT NULL,
  category VARCHAR(50) NOT NULL,
  current_stock INT NOT NULL DEFAULT 0,
  min_stock INT NOT NULL DEFAULT 1,
  status VARCHAR(20) GENERATED ALWAYS AS (
    CASE
      WHEN current_stock = 0 THEN 'Habis'
      WHEN current_stock <= min_stock THEN 'Menipis'
      ELSE 'Aman'
    END
  ) STORED,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ DEFAULT NULL
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.shopping_items TO authenticated;
GRANT ALL ON public.shopping_items TO service_role;
ALTER TABLE public.shopping_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Family members access shopping" ON public.shopping_items FOR ALL TO authenticated
  USING (family_id = public.current_family_id())
  WITH CHECK (family_id = public.current_family_id());

-- BILLS
CREATE TABLE public.bills (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id UUID NOT NULL REFERENCES public.families(id) ON DELETE CASCADE,
  bill_name VARCHAR(255) NOT NULL,
  nominal DECIMAL(12,2) NOT NULL,
  due_date DATE NOT NULL,
  is_recurring BOOLEAN NOT NULL DEFAULT FALSE,
  recurrence_interval VARCHAR(20),
  google_calendar_event_id TEXT,
  is_paid BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ DEFAULT NULL
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.bills TO authenticated;
GRANT ALL ON public.bills TO service_role;
ALTER TABLE public.bills ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Family members access bills" ON public.bills FOR ALL TO authenticated
  USING (family_id = public.current_family_id())
  WITH CHECK (family_id = public.current_family_id());

-- DEBTS / CREDITS
CREATE TABLE public.debts_credits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id UUID NOT NULL REFERENCES public.families(id) ON DELETE CASCADE,
  type VARCHAR(10) NOT NULL CHECK (type IN ('hutang','piutang')),
  person_name VARCHAR(255) NOT NULL,
  phone_number VARCHAR(20),
  address TEXT,
  total_amount DECIMAL(12,2) NOT NULL,
  monthly_installment DECIMAL(12,2) NOT NULL DEFAULT 0,
  start_date DATE NOT NULL,
  proof_image_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ DEFAULT NULL
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.debts_credits TO authenticated;
GRANT ALL ON public.debts_credits TO service_role;
ALTER TABLE public.debts_credits ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Family members access debts" ON public.debts_credits FOR ALL TO authenticated
  USING (family_id = public.current_family_id())
  WITH CHECK (family_id = public.current_family_id());

-- INSTALLMENT LOGS
CREATE TABLE public.installment_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  debt_credit_id UUID NOT NULL REFERENCES public.debts_credits(id) ON DELETE CASCADE,
  installment_number INT NOT NULL,
  amount_paid DECIMAL(12,2) NOT NULL,
  payment_date DATE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ DEFAULT NULL
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.installment_logs TO authenticated;
GRANT ALL ON public.installment_logs TO service_role;
ALTER TABLE public.installment_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Family members access installments" ON public.installment_logs FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.debts_credits d WHERE d.id = debt_credit_id AND d.family_id = public.current_family_id()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.debts_credits d WHERE d.id = debt_credit_id AND d.family_id = public.current_family_id()));

-- KANBAN BOARDS
CREATE TABLE public.kanban_boards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id UUID NOT NULL REFERENCES public.families(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  status VARCHAR(20) NOT NULL DEFAULT 'To Do' CHECK (status IN ('To Do','In Progress','On Hold','Done')),
  category VARCHAR(50),
  assigned_pic_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  target_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ DEFAULT NULL
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.kanban_boards TO authenticated;
GRANT ALL ON public.kanban_boards TO service_role;
ALTER TABLE public.kanban_boards ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Family members access kanban" ON public.kanban_boards FOR ALL TO authenticated
  USING (family_id = public.current_family_id())
  WITH CHECK (family_id = public.current_family_id());

-- ACTIVITY FEED
CREATE TABLE public.activity_feed (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id UUID NOT NULL REFERENCES public.families(id) ON DELETE CASCADE,
  actor_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  actor_name VARCHAR(255),
  action_type VARCHAR(50) NOT NULL,
  entity_type VARCHAR(50) NOT NULL,
  description TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ DEFAULT NULL
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.activity_feed TO authenticated;
GRANT ALL ON public.activity_feed TO service_role;
ALTER TABLE public.activity_feed ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Family members access feed" ON public.activity_feed FOR ALL TO authenticated
  USING (family_id = public.current_family_id())
  WITH CHECK (family_id = public.current_family_id());

ALTER PUBLICATION supabase_realtime ADD TABLE public.activity_feed;
ALTER TABLE public.activity_feed REPLICA IDENTITY FULL;

-- updated_at triggers
CREATE TRIGGER trg_profiles_updated BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_families_updated BEFORE UPDATE ON public.families FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_shopping_updated BEFORE UPDATE ON public.shopping_items FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_bills_updated BEFORE UPDATE ON public.bills FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_debts_updated BEFORE UPDATE ON public.debts_credits FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_install_updated BEFORE UPDATE ON public.installment_logs FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_kanban_updated BEFORE UPDATE ON public.kanban_boards FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_feed_updated BEFORE UPDATE ON public.activity_feed FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Auto create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1))
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
