-- Create enum for application status
CREATE TYPE public.application_status AS ENUM ('saved', 'applied', 'interview', 'offer', 'rejected');

-- Job Applications table
CREATE TABLE public.job_applications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id TEXT NOT NULL,
    job_id TEXT NOT NULL,
    job_title TEXT NOT NULL,
    company TEXT NOT NULL,
    location TEXT NOT NULL,
    job_type TEXT,
    salary TEXT,
    match_score INTEGER NOT NULL DEFAULT 0,
    matching_skills TEXT[] DEFAULT '{}',
    missing_skills TEXT[] DEFAULT '{}',
    apply_url TEXT,
    resume_version_id UUID,
    status application_status NOT NULL DEFAULT 'saved',
    applied_date DATE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Resume Versions table
CREATE TABLE public.resume_versions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id TEXT NOT NULL,
    name TEXT NOT NULL,
    target_job_title TEXT,
    target_company TEXT,
    profile_data JSONB NOT NULL,
    optimized_summary TEXT,
    optimized_skills TEXT[] DEFAULT '{}',
    optimized_bullet_points JSONB DEFAULT '[]',
    application_strength INTEGER,
    is_original BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Saved Jobs table
CREATE TABLE public.saved_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id TEXT NOT NULL,
    job_data JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for fast session queries
CREATE INDEX idx_job_applications_session ON public.job_applications(session_id);
CREATE INDEX idx_resume_versions_session ON public.resume_versions(session_id);
CREATE INDEX idx_saved_jobs_session ON public.saved_jobs(session_id);

-- Enable RLS
ALTER TABLE public.job_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resume_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saved_jobs ENABLE ROW LEVEL SECURITY;

-- Public RLS policies (session-based, no auth required)
CREATE POLICY "Allow all for job_applications" ON public.job_applications FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for resume_versions" ON public.resume_versions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for saved_jobs" ON public.saved_jobs FOR ALL USING (true) WITH CHECK (true);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for job_applications
CREATE TRIGGER update_job_applications_updated_at
    BEFORE UPDATE ON public.job_applications
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();