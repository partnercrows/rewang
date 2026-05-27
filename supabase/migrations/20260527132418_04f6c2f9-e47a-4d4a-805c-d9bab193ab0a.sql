
-- Tighten families INSERT policy
DROP POLICY IF EXISTS "Authenticated can create family" ON public.families;
CREATE POLICY "Authenticated can create family" ON public.families FOR INSERT TO authenticated
  WITH CHECK (public.current_family_id() IS NULL);

-- Revoke direct execute on internal SECURITY DEFINER helpers
REVOKE EXECUTE ON FUNCTION public.current_family_id() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_updated_at_column() FROM PUBLIC, anon, authenticated;
