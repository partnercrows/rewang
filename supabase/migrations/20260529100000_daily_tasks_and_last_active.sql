-- ========== ADD last_active_at to profiles ==========
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS last_active_at timestamptz DEFAULT now();

-- ========== CREATE daily_tasks table ==========
CREATE TABLE IF NOT EXISTS public.daily_tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id uuid NOT NULL REFERENCES public.families(id) ON DELETE CASCADE,
  title text NOT NULL,
  is_recurring boolean NOT NULL DEFAULT false,
  is_done boolean NOT NULL DEFAULT false,
  done_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  done_at timestamptz,
  assigned_to uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  priority text DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high')),
  notes text,
  created_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_daily_tasks_family ON public.daily_tasks(family_id);
CREATE INDEX IF NOT EXISTS idx_daily_tasks_done ON public.daily_tasks(family_id, is_done, deleted_at);

-- RLS
ALTER TABLE public.daily_tasks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Family members can view daily tasks" ON public.daily_tasks;
CREATE POLICY "Family members can view daily tasks" ON public.daily_tasks
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = (SELECT auth.uid())
        AND p.family_id = daily_tasks.family_id
        AND p.deleted_at IS NULL
    )
  );

DROP POLICY IF EXISTS "Family members can insert daily tasks" ON public.daily_tasks;
CREATE POLICY "Family members can insert daily tasks" ON public.daily_tasks
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = (SELECT auth.uid())
        AND p.family_id = daily_tasks.family_id
        AND p.deleted_at IS NULL
    )
  );

DROP POLICY IF EXISTS "Family members can update daily tasks" ON public.daily_tasks;
CREATE POLICY "Family members can update daily tasks" ON public.daily_tasks
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = (SELECT auth.uid())
        AND p.family_id = daily_tasks.family_id
        AND p.deleted_at IS NULL
    )
  );

-- Enable realtime for activity_feed updates
ALTER PUBLICATION supabase_realtime ADD TABLE public.daily_tasks;

-- ========== Add created_by columns to kanban_boards ==========
ALTER TABLE public.kanban_boards ADD COLUMN IF NOT EXISTS created_by_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL;
ALTER TABLE public.kanban_boards ADD COLUMN IF NOT EXISTS created_by_label text;
