Emotional Detector — Web App (Frontend + Backend)
1) What’s this project about?

Emotional Detector is a small full-stack app that analyzes user text (and/or other inputs) to detect the underlying emotion, then returns tailored suggestions (e.g., coping tips, music links).
The backend exposes a simple REST API for inference. The frontend provides a clean UI to submit inputs and view results and recommendations.

2) Tech stack

Frontend: Angular (TypeScript), RxJS, HTML, CSS

Backend: FastAPI (Python), Uvicorn, Pydantic

ML / Utils (as applicable): scikit-learn / PyTorch / NumPy / Pandas (adjust to your model)

Cross-cutting: CORS, .env configuration

Dev Tools: Node.js (npm), Python venv

If your model uses different libraries, list them in requirements.txt (backend) and package.json (frontend).

3) How frontend & backend communicate

The Angular app calls FastAPI endpoints over HTTP:

┌──────────────┐       POST /api/v1/analyze
│  Angular UI  │ ──────────────────────────────────►  FastAPI
│  (localhost) │       JSON: { "text": "..." }         (localhost)
└─────┬────────┘                                       └──────────────┬─────┘
      │                      JSON response                           │
      └───────────────────────────────────────────────────────────────┘


The frontend reads API_BASE_URL from its environment config (e.g., http://127.0.0.1:8000).

The backend exposes routes like:

POST /api/v1/analyze → returns { emotion, confidence, suggestions, links }

GET /health → returns service status (for quick checks)

CORS: FastAPI is configured to allow the Angular origin (e.g., http://localhost:4200) so the browser accepts the responses.

4) Getting started (local setup)
A. Prerequisites

Python: 3.10+ (recommended)

Node.js: 18+ (LTS)

Angular CLI: npm i -g @angular/cli

Git installed

B. Repository structure
emotional-detector/
├─ backend/
│  ├─ app.py
│  ├─ requirements.txt
│  ├─ models/               # your model files / weights (optional)
│  ├─ services/             # inference, suggestion logic
│  ├─ .env.example
│  └─ ...
└─ frontend/
   ├─ package.json
   ├─ src/
   │  ├─ app/
   │  └─ environments/
   │     ├─ environment.ts
   │     └─ environment.development.ts
   └─ ...

Backend (FastAPI)
1) Configure environment

Create backend/.env (copy from .env.example if present). Example:

# backend/.env
ENV=dev
HOST=127.0.0.1
PORT=8000
ALLOWED_ORIGINS=http://localhost:4200,http://127.0.0.1:4200
MODEL_PATH=./models/model.pkl        # or your torch model path


ALLOWED_ORIGINS is important for CORS (Angular dev server).

2) Create virtual environment & install deps
cd backend
python -m venv .venv
# Windows:
. .venv/Scripts/activate
# macOS/Linux:
source .venv/bin/activate

pip install --upgrade pip
pip install -r requirements.txt


Typical requirements.txt (adjust to your code):

fastapi
uvicorn[standard]
pydantic
python-dotenv
numpy
pandas
scikit-learn
# torch torchvision torchaudio      # uncomment if you use PyTorch
# any other libs your model needs

3) Run the API
# from backend/
uvicorn app:app --reload --host 127.0.0.1 --port 8000


Health check: open http://127.0.0.1:8000/health

API docs: http://127.0.0.1:8000/docs (Swagger UI)

Windows tip: if you see a WatchFiles/Uvicorn reloader issue, try:

Run without --reload, or

Upgrade watchfiles: pip install --upgrade watchfiles, or

Use --reload-dir . from the backend folder.

Frontend (Angular)
1) Install dependencies
cd frontend
npm ci     # or: npm install

2) Point the app to your API

Edit src/environments/environment.development.ts (and environment.ts for prod builds):

export const environment = {
  production: false,
  API_BASE_URL: 'http://127.0.0.1:8000' // FastAPI URL
};


In your Angular services you’ll call:

this.http.post(`${environment.API_BASE_URL}/api/v1/analyze`, payload)

3) Run the UI
ng serve


Open http://localhost:4200

Full local run (quick steps)
# Terminal 1
cd backend
python -m venv .venv
# activate venv...
pip install -r requirements.txt
uvicorn app:app --reload --host 127.0.0.1 --port 8000

# Terminal 2
cd frontend
npm ci
ng serve


Visit Angular UI: http://localhost:4200

Backend Swagger docs: http://127.0.0.1:8000/docs

Example request
curl -X POST http://127.0.0.1:8000/api/v1/analyze \
  -H "Content-Type: application/json" \
  -d '{"text":"I feel overwhelmed but hopeful."}'


Sample response

{
  "emotion": "mixed/hopeful",
  "confidence": 0.91,
  "suggestions": [
    "Take a short break and breathe deeply.",
    "Write down one small step you can complete now.",
    "Share how you feel with a trusted friend."
  ],
  "links": [
    {"title":"Song 1","url":"https://youtu.be/xxxxx"},
    {"title":"Song 2","url":"https://youtu.be/yyyyy"}
  ]
}

Common issues & fixes

CORS errors in the browser:
Make sure ALLOWED_ORIGINS in backend/.env includes the exact origin shown in the browser (e.g., http://localhost:4200). Also ensure FastAPI CORS middleware is enabled.

Node version mismatch:
Use Node 18+ LTS. If errors persist, delete node_modules and run npm ci again.

Model/weights not found:
Confirm MODEL_PATH in .env and that files exist in backend/models/.

Windows Uvicorn reloader crash:
Try uvicorn app:app --host 127.0.0.1 --port 8000 (without --reload) or upgrade watchfiles.

Scripts (suggested)

Backend (optional in backend/Makefile):

run:
\tuvicorn app:app --reload --host 127.0.0.1 --port 8000
install:
\tpip install -r requirements.txt


Frontend (package.json):

{
  "scripts": {
    "start": "ng serve",
    "build": "ng build",
    "lint": "ng lint",
    "test": "ng test"
  }
}

Contributing

Create a feature branch from main.

Commit with clear messages.

Open a PR with a brief description and screenshots (if UI changes).

License

MIT (or your preferred license)

Maintainers

Team: Joud & Co.

Contact: (add your emails/usernames)

Notes for the grader / reviewer

API docs are available at /docs once the backend is running.

The app works offline with local model files (if provided). If you rely on external APIs, document the required keys in .env.