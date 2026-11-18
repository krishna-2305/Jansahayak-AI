# JanSahayak AI

JanSahayak AI is a public grievance intelligence and incident coordination system designed for a fast, reliable hackathon build. It combines a React frontend with a FastAPI backend and optional future AI services.

## Technology Stack

- Frontend: React, Vite, JavaScript, Tailwind CSS, Lucide React, Recharts, Axios, React Router DOM
- Backend: Python, FastAPI, Uvicorn, SQLAlchemy, SQLite, Pydantic, python-dotenv
- AI: Scikit-learn, NumPy, Pandas; Sentence Transformers and Ollama are optional
- Development: Git, GitHub, Postman

## Project Structure

```text
jansahayak-ai/
├── frontend/
│   ├── src/
│   │   ├── components/  # Developer 3: reusable UI
│   │   ├── pages/        # Developer 3: routed screens
│   │   ├── layouts/      # Developer 3: shared layouts
│   │   ├── services/     # Developer 3: centralized API client
│   │   ├── hooks/
│   │   └── assets/
│   └── package.json
├── backend/
│   ├── app/
│   │   ├── routers/      # Developer 2: API routes
│   │   ├── models/       # Developer 2: SQLAlchemy models
│   │   ├── schemas/      # Developer 2: Pydantic schemas
│   │   ├── services/     # Developer 1: AI and domain services
│   │   ├── database.py
│   │   └── main.py
│   ├── tests/
│   └── requirements.txt
├── .gitignore
└── README.md
```

## Prerequisites

- Node.js 20 or newer
- npm 10 or newer
- Python 3.11 or newer

## Installation

### 1. Backend

```bash
cd jansahayak-ai/backend
python3 -m venv .venv
source .venv/bin/activate
python -m pip install --upgrade pip
python -m pip install -r requirements.txt
cp .env.example .env
```

### 2. Frontend

```bash
cd jansahayak-ai/frontend
npm install
cp .env.example .env
```

## Environment Variables

Backend defaults are suitable for local development. Optionally copy `backend/.env.example` to `backend/.env`:

```env
APP_NAME=JanSahayak AI
ENVIRONMENT=development
DATABASE_URL=sqlite:///./jansahayak.db
CORS_ORIGINS=http://localhost:5173,http://127.0.0.1:5173
```

Frontend uses `frontend/.env`:

```env
VITE_API_URL=http://localhost:8000
```

Never commit `.env` or real API keys.

## Start the Backend

```bash
cd jansahayak-ai/backend
source .venv/bin/activate
python run.py
```

Health check:

```bash
curl http://localhost:8000/api/health
```

Expected response:

```json
{
  "status": "success",
  "message": "JanSahayak AI Backend Running"
}
```

Interactive API documentation is available at `http://localhost:8000/docs`.

## Start the Frontend

```bash
cd jansahayak-ai/frontend
npm run dev
```

Open `http://localhost:5173`. The initial page checks backend connectivity.

## Run Tests

```bash
cd jansahayak-ai/backend
source .venv/bin/activate
pytest -q
```

## Team Ownership

- Developer 1 — AI/ML: `backend/app/services/`
- Developer 2 — Backend: `backend/app/routers/`, `models/`, `schemas/`, `database.py`, `main.py`
- Developer 3 — Frontend: `frontend/src/components/`, `pages/`, `layouts/`, `services/`

The service folders are intentionally independent to reduce merge conflicts. AI models are not downloaded during setup and optional integrations remain disabled until explicitly configured.
