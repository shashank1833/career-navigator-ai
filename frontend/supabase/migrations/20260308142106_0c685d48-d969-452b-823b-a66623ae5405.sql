CREATE TABLE public.roadmap_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id text NOT NULL,
  target_role text NOT NULL,
  step_index integer NOT NULL,
  completed boolean NOT NULL DEFAULT false,
  completed_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  UNIQUE (session_id, target_role, step_index)
);

ALTER TABLE public.roadmap_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all for roadmap_progress" ON public.roadmap_progress FOR ALL USING (true) WITH CHECK (true);