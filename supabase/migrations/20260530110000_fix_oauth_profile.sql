-- ========== Fix OAuth (Google) user profile creation ==========
-- Problem: handle_new_user trigger sometimes doesn't fire for OAuth users,
-- causing profile to be null. This leads to:
--   - create_family / join_family_by_code updating 0 rows (profile doesn't exist)
--   - Frontend retry loop failing 3x because profile stays null

-- 1. Make handle_new_user more robust with ON CONFLICT DO UPDATE
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
    COALESCE(
      NEW.raw_user_meta_data->>'full_name',
      NEW.raw_user_meta_data->>'name',
      split_part(NEW.email, '@', 1)
    )
  )
  ON CONFLICT (id) DO UPDATE SET
    email = COALESCE(profiles.email, EXCLUDED.email),
    full_name = CASE 
      WHEN profiles.full_name IS NULL OR profiles.full_name = '' THEN EXCLUDED.full_name 
      ELSE profiles.full_name 
    END;
  RETURN NEW;
END;
$$;

-- 2. ensure_profile RPC: frontend fallback for OAuth users without a profile row
CREATE OR REPLACE FUNCTION public.ensure_profile()
RETURNS public.profiles
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _uid uuid := auth.uid();
  _user record;
  _profile public.profiles;
BEGIN
  IF _uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Check if profile already exists
  SELECT * INTO _profile FROM public.profiles WHERE id = _uid;
  IF _profile.id IS NOT NULL THEN
    RETURN _profile;
  END IF;

  -- Fetch auth user data
  SELECT * INTO _user FROM auth.users WHERE id = _uid;

  -- Create profile
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    _uid,
    _user.email,
    COALESCE(
      _user.raw_user_meta_data->>'full_name',
      _user.raw_user_meta_data->>'name',
      split_part(_user.email, '@', 1)
    )
  )
  ON CONFLICT (id) DO NOTHING
  RETURNING * INTO _profile;

  RETURN COALESCE(_profile, (SELECT * FROM public.profiles WHERE id = _uid));
END;
$$;

GRANT EXECUTE ON FUNCTION public.ensure_profile() TO authenticated;

-- 3. Fix create_family: ensure profile exists before updating family_id
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

  -- Ensure profile exists (OAuth edge case)
  INSERT INTO public.profiles (id, email, full_name)
  SELECT _uid, u.email, COALESCE(u.raw_user_meta_data->>'full_name', u.raw_user_meta_data->>'name', split_part(u.email, '@', 1))
  FROM auth.users u WHERE u.id = _uid
  ON CONFLICT (id) DO NOTHING;

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

-- 4. Fix join_family_by_code: ensure profile exists before updating family_id
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

  -- Ensure profile exists (OAuth edge case)
  INSERT INTO public.profiles (id, email, full_name)
  SELECT _uid, u.email, COALESCE(u.raw_user_meta_data->>'full_name', u.raw_user_meta_data->>'name', split_part(u.email, '@', 1))
  FROM auth.users u WHERE u.id = _uid
  ON CONFLICT (id) DO NOTHING;

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