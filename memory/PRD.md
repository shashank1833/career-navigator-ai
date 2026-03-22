# Career Intelligence Platform - PRD

## Overview
AI-powered career intelligence platform that analyzes resumes, provides job matching, and automatically optimizes resumes for specific job descriptions.

## Key Features

### 1. Resume Upload & Analysis
- Upload PDF/DOCX resumes
- AI-powered extraction of skills, experience, education
- Skill gap analysis, job match scoring, interview prep

### 2. Job Matching
- Real job search via Adzuna API (Supabase Edge Function)
- AI-generated job matches
- Job saving and application tracking

### 3. Auto Resume Modification (NEW - v2)
- **Primary**: FastAPI backend with Claude (Anthropic) LLM via Emergent Integrations
- **Fallback**: Supabase Edge Functions
- Flow: Structured Parsing → Keyword Extraction → Skill Matching → LLM Optimization → Version Storage → PDF Download
- Modification rules: Summary rewrite, skill reordering, experience bullet improvement, keyword injection
- Fixed template: Name & Contact → Summary → Skills → Experience → Projects → Education

### 4. Version Management
- Original resume + multiple job-specific optimized versions
- Stored in Supabase (existing) and MongoDB (new backend versions)
- View, compare, edit, re-optimize, download

### 5. PDF Export
- Consistent professional template across all exports
- Fixed section order, clean formatting
- Match score display

## Architecture
- **Frontend**: React + TypeScript + Vite + Tailwind + shadcn/ui
- **Backend**: FastAPI (Python)
- **Database**: Supabase (primary), MongoDB (backend versions)
- **Auth**: Supabase Auth
- **LLM**: Claude 4 Sonnet via Emergent Integrations

## API Endpoints (Backend)
- `POST /api/optimize-resume` - LLM-powered resume optimization
- `POST /api/extract-keywords` - Job keyword extraction
- `POST /api/resume-versions` - Save version
- `GET /api/resume-versions/{session_id}` - List versions
- `PUT /api/resume-versions/{version_id}` - Update version
- `DELETE /api/resume-versions/{version_id}` - Delete version
