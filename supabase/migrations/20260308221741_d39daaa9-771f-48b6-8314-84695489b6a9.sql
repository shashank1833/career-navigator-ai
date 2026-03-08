ALTER TABLE public.resume_versions
ADD COLUMN IF NOT EXISTS raw_text text,
ADD COLUMN IF NOT EXISTS parsed_resume jsonb;