
CREATE OR REPLACE FUNCTION public.create_family(_family_name text, _invite_code text)
RETURNS public.families
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _uid uuid := auth.uid();
  _existing uuid;
  _fam public.families;
BEGIN
  IF _uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT family_id INTO _existing FROM public.profiles WHERE id = _uid AND deleted_at IS NULL;
  IF _existing IS NOT NULL THEN
    RAISE EXCEPTION 'User already belongs to a family';
  END IF;

  INSERT INTO public.families (family_name, invite_code)
  VALUES (_family_name, _invite_code)
  RETURNING * INTO _fam;

  UPDATE public.profiles SET family_id = _fam.id WHERE id = _uid;

  RETURN _fam;
END;
$$;

CREATE OR REPLACE FUNCTION public.join_family_by_code(_invite_code text)
RETURNS public.families
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _uid uuid := auth.uid();
  _existing uuid;
  _fam public.families;
BEGIN
  IF _uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT family_id INTO _existing FROM public.profiles WHERE id = _uid AND deleted_at IS NULL;
  IF _existing IS NOT NULL THEN
    RAISE EXCEPTION 'User already belongs to a family';
  END IF;

  SELECT * INTO _fam FROM public.families
  WHERE invite_code = upper(_invite_code) AND deleted_at IS NULL
  LIMIT 1;

  IF _fam.id IS NULL THEN
    RAISE EXCEPTION 'Invite code not found';
  END IF;

  UPDATE public.profiles SET family_id = _fam.id WHERE id = _uid;

  RETURN _fam;
END;
$$;

GRANT EXECUTE ON FUNCTION public.create_family(text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.join_family_by_code(text) TO authenticated;
