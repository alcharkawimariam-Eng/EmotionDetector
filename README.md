
# Emotional Detector — Web App (Frontend + Backend)

A small full-stack app that analyzes user text (and/or other inputs) to detect the underlying emotion, then returns tailored suggestions (e.g., coping tips, music links).

---

## 📌 What’s this project about?
- **Frontend**: Angular UI for submitting text and viewing results.  
- **Backend**: FastAPI REST API for emotion inference.  
- **Goal**: Turn text into actionable support (emotion detection + recommendations).  

---

## 🛠️ Tech Stack
**Frontend**  
- Angular (TypeScript)  
- RxJS, HTML, CSS  

**Backend**  
- FastAPI (Python)  
- Uvicorn, Pydantic  

**ML / Utils (as applicable)**  
- scikit-learn / PyTorch  
- NumPy, Pandas  

**Cross-cutting**  
- CORS  
- `.env` configuration  

**Dev Tools**  
- Node.js (npm)  
- Python venv  

---

## 🔗 Frontend & Backend Communication

The Angular app calls FastAPI endpoints over HTTP:

```
┌──────────────┐       POST /api/v1/analyze
│  Angular UI  │ ──────────────────────────────────►  FastAPI
│  (localhost) │       JSON: { "text": "..." }         (localhost)
└─────┬────────┘                                       └──────────────┬─────┘
      │                      JSON response                           │
      └───────────────────────────────────────────────────────────────┘
```

- **POST** `/api/v1/analyze` → returns `{ emotion, confidence, suggestions, links }`  
- **GET** `/health` → quick status check  
- **CORS**: Backend configured to allow Angular origin (e.g., `http://localhost:4200`)  

---

## 📂 Repository Structure
```
emotional-detector/
├─ backend/
│  ├─ app.py
│  ├─ requirements.txt
│  ├─ models/               # model files / weights (optional)
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
```

---

## ⚙️ Backend (FastAPI)

### 1. Configure environment
Create `backend/.env` (copy from `.env.example` if present):

```env
ENV=dev
HOST=127.0.0.1
PORT=8000
ALLOWED_ORIGINS=http://localhost:4200,http://127.0.0.1:4200
MODEL_PATH=./models/model.pkl
```

### 2. Create virtual environment & install deps
```bash
cd backend
python -m venv .venv
# Activate:
# Windows: . .venv/Scripts/activate
# Linux/macOS: source .venv/bin/activate

pip install --upgrade pip
pip install -r requirements.txt
```

**Typical `requirements.txt`:**
```
fastapi
uvicorn[standard]
pydantic
python-dotenv
numpy
pandas
scikit-learn
# torch torchvision torchaudio   # if using PyTorch
```

### 3. Run the API
```bash
uvicorn app:app --reload --host 127.0.0.1 --port 8000
```

- Health check → [http://127.0.0.1:8000/health](http://127.0.0.1:8000/health)  
- API docs (Swagger) → [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)  

---

## 🎨 Frontend (Angular)

### 1. Install dependencies
```bash
cd frontend
npm ci   # or npm install
```

### 2. Configure API URL
Edit `src/environments/environment.development.ts`:

```ts
export const environment = {
  production: false,
  API_BASE_URL: 'http://127.0.0.1:8000'
};
```

### 3. Run the UI
```bash
ng serve
```

App → [http://localhost:4200](http://localhost:4200)

---

## 🚀 Quick Local Run

**Terminal 1 (Backend):**
```bash
cd backend
python -m venv .venv
# activate venv...
pip install -r requirements.txt
uvicorn app:app --reload --host 127.0.0.1 --port 8000
```

**Terminal 2 (Frontend):**
```bash
cd frontend
npm ci
ng serve
```

---

## 📡 Example Request
```bash
curl -X POST http://127.0.0.1:8000/api/v1/analyze   -H "Content-Type: application/json"   -d '{"text":"I feel overwhelmed but hopeful."}'
```

**Sample Response:**
```json
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
```

---

## 🛑 Common Issues & Fixes
- **CORS errors** → Ensure `ALLOWED_ORIGINS` matches browser origin.  
- **Node version mismatch** → Use Node 18+ LTS. If errors, remove `node_modules` & `npm ci`.  
- **Model not found** → Check `MODEL_PATH` in `.env`.  
- **Windows Uvicorn crash** → Run without `--reload` or upgrade `watchfiles`.  

---

## 📜 Scripts

**Backend (Makefile suggestion):**
```makefile
run:
	uvicorn app:app --reload --host 127.0.0.1 --port 8000

install:
	pip install -r requirements.txt
```

**Frontend (`package.json`):**
```json
{
  "scripts": {
    "start": "ng serve",
    "build": "ng build",
    "lint": "ng lint",
    "test": "ng test"
  }
}
```

---

## 🤝 Contributing
- Create a feature branch from `main`.  
- Commit with clear messages.  
- Open a PR with description + screenshots (for UI changes).  

---



---

## 👥 Maintainers
- **Team**: Joumana and Mariam  

---


