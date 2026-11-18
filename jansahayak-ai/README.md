# JanSahayak AI

JanSahayak AI is a public grievance intelligence and incident coordination system. This repository contains a React/Vite frontend and a FastAPI/SQLite backend.

## Technology Stack

- Frontend: React, Vite, JavaScript, Tailwind CSS v4, React Router, Axios
- Backend: Python, FastAPI, Uvicorn, SQLAlchemy, SQLite, Pydantic, python-dotenv
- Testing: pytest and FastAPI TestClient

## Project Structure

```text
jansahayak-ai/
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── layouts/
│   │   ├── pages/
│   │   └── services/
│   ├── .env.example
│   └── package.json
├── backend/
│   ├── app/
│   │   ├── models/
│   │   ├── routers/
│   │   ├── schemas/
│   │   ├── services/
│   │   ├── database.py
│   │   └── main.py
│   ├── tests/
│   ├── .env.example
│   └── requirements.txt
├── .gitignore
└── README.md
```

## Prerequisites

- Python 3.11 or newer
- Node.js 20 or newer
- npm 10 or newer

Run the following commands from the `jansahayak-ai` project directory.

## Backend Setup

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
python -m pip install --upgrade pip
python -m pip install -r requirements.txt
cp .env.example .env
```

The backend `.env` supports:

```env
APP_NAME=JanSahayak AI
ENVIRONMENT=development
DATABASE_URL=sqlite:///./jansahayak.db
CORS_ORIGINS=http://localhost:5173,http://127.0.0.1:5173
```

SQLite and SQLAlchemy initialize automatically. The default database file is `backend/jansahayak.db` when commands are run from the backend directory. No application data models are required for the initial setup.

## Frontend Setup

Open a second terminal in `jansahayak-ai`:

```bash
cd frontend
npm install
cp .env.example .env
```

The frontend `.env` supports:

```env
VITE_API_URL=http://localhost:8000
```

Vite exposes this variable through `import.meta.env.VITE_API_URL`. Restart the Vite development server after changing `.env`.

## Run the Backend

```bash
cd backend
source .venv/bin/activate
python run.py
```

The backend runs at `http://localhost:8000`. Interactive documentation is available at `http://localhost:8000/docs`.

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

## Run the Frontend

```bash
cd frontend
npm run dev
```

Open `http://localhost:5173`. The initial page performs a request to `/api/health` using the configured `VITE_API_URL`.

## Run Backend Tests

```bash
cd backend
source .venv/bin/activate
python -m pytest -q
```

## Build the Frontend

```bash
cd frontend
npm run build
```

## Security

Never commit `.env` files or secrets. Only the `.env.example` templates should be committed. `.venv`, `node_modules`, SQLite database files, build output, and test/cache directories are excluded by `.gitignore`.

## Team Ownership

- Developer 1 — AI/ML: `backend/app/services/`
- Developer 2 — Backend: `backend/app/routers/`, `backend/app/models/`, `backend/app/schemas/`, `backend/app/database.py`, `backend/app/main.py`
- Developer 3 — Frontend: `frontend/src/components/`, `frontend/src/pages/`, `frontend/src/layouts/`, `frontend/src/services/`

The optional AI integrations remain disabled; no models are downloaded during setup.
