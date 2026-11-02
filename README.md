# Stardrift 🌙

> **Understand the stories your mind tells at night.**
> 
> A beautiful, peaceful dream journal app with voice logging, AI-powered pattern insights, and a calming Midnight Aurora design.

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | Next.js 16 · TypeScript · Tailwind CSS v4 · Recharts · Lucide Icons |
| **Backend** | Django 6 · Django REST Framework · Python |
| **Database** | PostgreSQL (Supabase hosted) |
| **Auth** | Supabase Auth (email/password + magic link) |
| **AI** | OpenAI GPT-4o-mini (AI insights) · Web Speech API (voice input) |

---

## Project Structure

```
Stardrift/
├── frontend/           Next.js app
│   ├── src/
│   │   ├── app/
│   │   │   ├── (app)/          Authenticated pages (sidebar layout)
│   │   │   │   ├── dashboard/  Highlights snapshot
│   │   │   │   ├── journal/    Dream list + new + [id] detail/edit
│   │   │   │   ├── patterns/   Full analytics + AI insights
│   │   │   │   └── settings/   Profile & preferences
│   │   │   ├── sign-in/        Auth pages
│   │   │   ├── sign-up/
│   │   │   └── page.tsx        Landing page
│   │   ├── components/         Shared UI (DreamCard, DreamForm, Navigation, VoiceRecorder)
│   │   ├── lib/                API client, Supabase client, utils
│   │   └── types/              TypeScript types
│   └── .env.local              ← Add your Supabase keys here
│
├── backend/            Django REST API
│   ├── stardrift/      Django project settings + urls
│   ├── dreams/         App: models, views, serializers, auth, urls
│   ├── requirements.txt
│   └── .env            ← Add DB URL, Supabase + OpenAI keys here
│
└── venv/               Python virtual environment
```

---

## Quick Start

### 1. Backend (Django)

```bash
# Activate venv
source venv/bin/activate

# (First time) Install dependencies
pip install -r backend/requirements.txt

# Configure .env
cp backend/.env backend/.env.local
# Edit backend/.env with your Postgres URL and Supabase keys

# Run migrations (requires Postgres to be running)
cd backend && python manage.py migrate

# Start Django dev server
python manage.py runserver 8000
```

### 2. Frontend (Next.js)

```bash
cd frontend

# Install deps (already done if you're reading this)
npm install

# Configure .env.local
cp .env.local .env.local.bak
# Edit .env.local with your Supabase URL + anon key

# Start dev server
npm run dev
# → http://localhost:3000
```

---

## Environment Variables

### Frontend (`frontend/.env.local`)
```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000
```

### Backend (`backend/.env`)
```env
DATABASE_URL=postgresql://postgres:password@host:5432/obsidiandreams
SUPABASE_URL=https://xxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
SUPABASE_JWT_SECRET=your-jwt-secret
OPENAI_API_KEY=sk-...
DJANGO_SECRET_KEY=your-django-secret
DJANGO_ALLOWED_HOSTS=localhost,127.0.0.1
CORS_ALLOWED_ORIGINS=http://localhost:3000
DEBUG=True
```

---

## API Endpoints

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/health/` | Health check |
| `POST` | `/api/auth/sync/` | Sync Supabase user → local DB |
| `GET/POST` | `/api/dreams/` | List / create dreams |
| `GET/PATCH/DELETE` | `/api/dreams/:id/` | Dream detail / update / delete |
| `GET` | `/api/dashboard/summary/` | Dashboard highlight numbers |
| `GET` | `/api/patterns/overview/` | Full chart data for Patterns page |
| `POST` | `/api/patterns/insight/` | (Re)generate AI narrative insight |
| `GET/PATCH/DELETE` | `/api/settings/profile/` | User profile |

---

## Features (MVP — Part 1)

- ✅ Email/password + magic link auth via Supabase Auth
- ✅ Create / edit / delete dream entries (title, body, type, mood, sleep quality, lucidity, recurring, tags)
- ✅ **Voice logging** — browser Web Speech API, dictate directly into the text area
- ✅ **Auto-tag suggestions** — keyword-based classifier suggests tags as you type
- ✅ Dashboard — streak, total dreams, type breakdown, mood sparkline, AI snippet
- ✅ Journal list with search, type/mood filters, pagination
- ✅ **Patterns page** — donut chart (type), line chart (mood over time), bar chart (sleep vs mood), tag cloud, lucidity rate, AI narrative summary
- ✅ Settings — display name, timezone, dark/light theme, data export (JSON), sign out, delete account
- ✅ Responsive — sidebar on desktop, bottom tab bar on mobile
- ✅ "Midnight Aurora" design system — glassmorphism, gradients, animations, Quicksand + Inter fonts

## Part 2 (coming soon)
- Upload images / PDFs / text files of handwritten dream logs
- OCR + embedding pipeline (pgvector + RAG)
- Theme/symbol clustering (k-means over embeddings)
- Monthly PDF dream report export
