# Career Navigation Platform - PRD

## Overview
A modern, dynamic Career Navigation website that guides users through career paths, skills, and learning resources. Features AI-powered recommendations, interactive roadmaps, and a glassmorphism UI design.

## Architecture
- **Frontend**: React + Vite + TypeScript + Tailwind CSS + shadcn/ui + framer-motion
- **Backend**: FastAPI + MongoDB
- **Auth**: Emergent OAuth + Supabase
- **AI**: Claude LLM (via Emergent Integrations) for resume optimization + career recommendations

## Pages & Routes

### Public Pages (no auth required)
- `/` - Homepage (hero, trending careers, features, CTA)
- `/explore` - Career Exploration (search, domain filters, expandable career cards)
- `/skills` - Skills Library (categorized skills with popularity metrics)
- `/roadmaps` - Career Roadmaps (list + detail view with visual timeline)
- `/resources` - Learning Resources (curated platforms, tools, certifications)
- `/auth` - Sign In / Sign Up

### Protected Pages (auth required)
- `/dashboard` - Personalized dashboard with stats, AI recommendations, charts
- `/analyze` - Resume analysis (upload + AI analysis)
- `/optimizer` - Resume auto-optimizer (LLM-powered)
- `/resumes` - Resume version management
- `/settings` - User settings

## Backend API Endpoints

### Career Navigation
- `GET /api/careers` - List careers (filters: domain, trending, search)
- `GET /api/careers/{id}` - Single career details
- `GET /api/roadmaps` - List roadmaps (filter: domain)
- `GET /api/roadmaps/{id}` - Single roadmap with steps
- `GET /api/skills-categories` - All skill categories
- `POST /api/user-progress` - Save/update progress
- `GET /api/user-progress/{user_id}` - Get user progress
- `POST /api/ai-recommend` - AI career recommendations

### Resume
- `POST /api/optimize-resume` - LLM resume optimization
- `POST /api/extract-keywords` - Keyword extraction
- `CRUD /api/resume-versions` - Version management

### Auth
- `POST /api/auth/session` - OAuth session exchange
- `GET /api/auth/me` - Current user
- `POST /api/auth/logout` - Logout

## Key Components
- **TopNavbar** - Responsive sticky navbar with dark/light toggle, mobile hamburger
- **AIRecommendations** - AI-powered career suggestions component
- **HomePage** - Public landing with hero, trending careers, features
- **ExploreCareers** - Filterable career grid with expandable details
- **RoadmapView** - Visual timeline with progress tracking
- **SkillsPage** - Categorized skills with demand indicators
- **ResourcesPage** - Curated learning resources

## Database Collections
- `careers` - Career data (12 seeded)
- `roadmaps` - Roadmap data (5 seeded)
- `skills_categories` - Skill categories (5 seeded)
- `user_progress` - User roadmap progress
- `resume_versions` - Saved resume versions
- `users` - User profiles
- `user_sessions` - Auth sessions
