# xQuesty "Link" — Recruitment Platform

AI-powered recruitment platform with candidate matching, AI interviews, and smart ranking.

## Structure

```
matching project/
  frontend/       — Next.js 15 (React) application
  backend/        — Python FastAPI server
  PROJECT_MAP.md  — Full system documentation
```

## Getting Started (Frontend)

```bash
cd frontend
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Getting Started (Backend)

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate    # Windows
pip install -r requirements.txt
uvicorn app.main:app --reload
```

See `PROJECT_MAP.md` for the full system architecture, data flow, and database schema.
