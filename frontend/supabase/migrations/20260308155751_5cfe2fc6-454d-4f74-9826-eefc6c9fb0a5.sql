
CREATE TABLE public.interview_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id TEXT NOT NULL,
  question TEXT NOT NULL,
  category TEXT NOT NULL,
  difficulty TEXT NOT NULL DEFAULT 'Medium',
  user_answer TEXT NOT NULL,
  clarity_score INTEGER NOT NULL DEFAULT 0,
  technical_depth_score INTEGER NOT NULL DEFAULT 0,
  communication_score INTEGER NOT NULL DEFAULT 0,
  feedback TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.interview_attempts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all for interview_attempts" ON public.interview_attempts FOR ALL USING (true) WITH CHECK (true);
