# Emotional Detector — Full-Stack Web App (Angular + FastAPI)

---

## Overview / Business Problem

People often struggle to recognize and regulate emotions in real time. **Emotional Detector** analyzes short user text, predicts the **dominant emotion** with a confidence score, and returns **three actionable, non-repeating guidance lines** plus **2–3 randomized YouTube links** (from a 30-link pool per mood) to help users take a clear next step quickly.

---

## Tech Stack

**Frontend:** Angular (TypeScript, RxJS, HTML, CSS)
**Backend:** FastAPI (Python), Uvicorn, Pydantic, python-dotenv
**ML / NLP:** Hugging Face Transformers (DistilRoBERTa emotion model), FLAN-T5-Small for short titles, NumPy/Pandas (as needed)
**Infra / Dev:** CORS, `.env` configuration, Node.js (npm), Python venv, Postman (optional)

---

## Dataset and Usage

You can plug any text-emotion dataset (e.g., GoEmotions) or private data with fields like `text` and `label` (anger, joy, sadness, fear, surprise, neutral). Train offline in Colab/Jupyter and export the artifact to `backend/models/` (e.g., `model.pkl` or `.pt`). The backend loads the model at startup and serves inference through its API. By default, the app does not persist user inputs.

---

## Approach & Architecture

**Pipeline:** (1) lightweight preprocessing → (2) emotion classification (HF pipeline) → (3) short title generation (FLAN-T5) → (4) suggestion composer returns **3 distinct, randomized lines** → (5) attach **2–3 randomized, non-repeating YouTube links** picked from a **30-link pool per mood**.
**Flow:** Angular UI → HTTP/JSON → FastAPI (`/assist`) → Emotion + Suggestions. Angular reads `API_BASE_URL` from `src/environments/*`; FastAPI enables CORS for `http://localhost:4200`.

---

## Features

* 🔎 Emotion detection with confidence and per-label probabilities.
* 🧭 Three **actionable**, varied guidance lines (non-repeating between calls).
* 🎵 2–3 randomized YouTube links per mood (from a curated pool of 30).
* 🏷️ Auto-generated, concise chat “title” from user message.
* 🔐 No storage by default; easy to add logging/anonymization if required.

---

## API Endpoints (Backend)

* `GET /health` → `{ ok: true, model_device: "cuda"|"cpu" }`
* `POST /assist` → Request `{ "text": "..." }`; Response `{ title, mood, score, probs, suggestion_paragraph, music_links }`

  * `suggestion_paragraph` contains **3 lines** separated by `\n`.
* (Stubs) `POST /predict/csv` and `POST /analyze/pdf` return placeholder JSON.

---

## Frontend ↔ Backend Communication

The Angular service calls: `POST {API_BASE_URL}/assist` with `{"text": "..."} → 200 OK` and renders the three suggestion lines and 2–3 links (opening in a **new tab** with `target="_blank" rel="noopener noreferrer"`). Make sure CORS on the backend includes `http://localhost:4200`.

---

## Repository Structure

```
emotional-detector/
├─ backend/
│  ├─ app.py
│  ├─ music_links.py            # YT_MUSIC_MAP: 30 links per mood
│  ├─ models/                   # trained artifacts (optional)
│  ├─ requirements.txt
│  ├─ .env.example
│  └─ ... (routers/, services/, schemas/, core/ if you split files)
└─ frontend/
   ├─ src/app/
   │  ├─ services/api.service.ts
   │  ├─ data/youtube-links.ts  # optional if links live client-side
   │  └─ components/, pages/
   ├─ src/environments/
   │  ├─ environment.ts
   │  └─ environment.development.ts
   ├─ package.json
   └─ ...
```

---

## Local Setup — Backend (FastAPI)

**1) Environment file** (`backend/.env`, copy from `.env.example`)

```
ENV=dev
HOST=127.0.0.1
PORT=8000
ALLOWED_ORIGINS=http://localhost:4200,http://127.0.0.1:4200
MODEL_PATH=./models/model.pkl
```

**2) Create venv & install deps**

```bash
cd backend
python -m venv .venv
# Windows:
. .venv/Scripts/activate
# macOS/Linux:
source .venv/bin/activate
pip install --upgrade pip
pip install -r requirements.txt
```

> Use the `requirements.txt` you prepared (includes: fastapi, uvicorn[standard], pydantic, python-dotenv, transformers, tokenizers, safetensors, sentencepiece, torch, python-multipart, numpy, pandas, requests).
> **3) Run the API**

```bash
uvicorn app:app --reload --host 127.0.0.1 --port 8000
# Health: http://127.0.0.1:8000/health
# Docs:   http://127.0.0.1:8000/docs
```

---

## Local Setup — Frontend (Angular)

**1) Install deps**

```bash
cd frontend
npm ci   # or: npm install
```

**2) Point to the API** (`src/environments/environment.development.ts`)

```ts
export const environment = {
  production: false,
  API_BASE_URL: 'http://127.0.0.1:8000'
};
```

**3) Run the UI**

```bash
ng serve
# Open http://localhost:4200
```

---

## Quick Start (Both Services)

* **Terminal A** → backend: create venv → `pip install -r requirements.txt` → `uvicorn app:app --reload --host 127.0.0.1 --port 8000`
* **Terminal B** → frontend: `npm ci` → `ng serve` → open `http://localhost:4200`

---

## How to Test

**Curl smoke test:**

```bash
curl -X POST http://127.0.0.1:8000/assist \
  -H "Content-Type: application/json" \
  -d '{"text":"I feel overwhelmed but hopeful."}'
```

**Expect:** JSON with `title`, `mood`, `score`, `probs`, `suggestion_paragraph` (3 lines), and `music_links` (2–3 URLs).
**Postman:** Create a POST to `{{API_BASE_URL}}/assist`, Body → raw/JSON: `{"text":"today was heavy but I’m proud I made progress"}`.
**Frontend checks:** request succeeds, **no CORS errors**, suggestions vary across calls, links open in **new tabs**.

---

## Common Issues & Fixes

* **CORS errors** → Ensure `ALLOWED_ORIGINS` in backend `.env` includes `http://localhost:4200`.
* **Windows Uvicorn reloader crash** → Run without `--reload`, or `pip install --upgrade watchfiles`, or run `--reload-dir .` from `backend`.
* **Node version mismatch** → Use Node 18+ LTS; if issues persist, delete `node_modules` and run `npm ci`.
* **Model not found** → Verify `MODEL_PATH` and artifact presence under `backend/models/`.
* **Torch/Transformers download slowness** → Pre-pull models once; they’re cached under `~/.cache/huggingface`.

---

## Code Quality & Conventions

* **Backend:** type hints, docstrings, small single-purpose functions/modules.
* **Frontend:** services for HTTP/state; components presentational; strict TypeScript interfaces.
* **Naming:** Python `snake_case`; TypeScript `camelCase`/`PascalCase`.
* **Secrets:** never commit real `.env`; provide `.env.example`.
* **Tests (suggested):** `pytest` for `/health` and `/assist`; `ng test` for Angular services/components.
* **Linting (suggested):** `ruff`/`flake8` (Python) and Angular ESLint (TS).

---

## License & Maintainers

**License:** MIT (or update to your preferred license).
**Maintainers:** Joud & team (add contacts).
**Tip:** Add screenshots under `frontend/src/assets/readme/` and reference them in this README using standard Markdown image tags.
