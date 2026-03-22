ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS preferred_role text,
  ADD COLUMN IF NOT EXISTS preferred_location text,
  ADD COLUMN IF NOT EXISTS experience_level text;