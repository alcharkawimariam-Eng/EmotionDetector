
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
<img width="907" height="852" alt="docker" src="https://github.com/user-attachments/assets/96ea3346-4499-4bb6-bdc0-f7b3d71ba107" />

Dockerized UI (Public Image): The Angular UI is containerized and published on Docker Hub as mariamcharkawi/emotional-ui (tags: 1.0.0, 1.0.1, latest). We build a production bundle and serve it via Nginx in a multi-stage Dockerfile, then push versioned images. Run from Docker Hub: docker pull mariamcharkawi/emotional-ui:1.0.1 && docker run -d --name ui -p 5173:80 mariamcharkawi/emotional-ui:1.0.1 → open http://localhost:5173. After UI changes, rebuild locally, bump the tag (e.g., 1.0.2) and latest, push both, and redeploy (or point your platform to the new tag). If the UI calls a backend, remember the API base URL is baked at build time—rebuild with the correct public API URL and ensure backend CORS allows the UI domain.

---

## 🤝 Contributing
- Create a feature branch from `main`.  
- Commit with clear messages.  
- Open a PR with description + screenshots (for UI changes).  

---
<img width="1916" height="868" alt="Image20250927233044" src="https://github.com/user-attachments/assets/55b19874-c6c9-4f17-a9ad-f56751917fe0" />

Conversation – Dark mode (summary view)
Shows a single chat titled “Lately I feel heavy and tired.” The user’s message appears on the right; the assistant replies with a short breathing exercise (4-7-8), three micro-steps, and a quick posture/water tip. Mood is auto-detected as sadness (96.5%), and three YouTube song links are suggested. Message composer with “Send” is visible.

<img width="1910" height="850" alt="Image20250927233048" src="https://github.com/user-attachments/assets/1b7069fb-4264-4102-beb5-077eaf81295f" />

Conversation – Dark mode (emotion breakdown)
Same chat and assistant suggestions as #1, but the emotion confidence bars are expanded underneath: sadness (dominant) followed by neutral, disgust, surprise, fear, and anger with small percentages. Emphasizes the classifier’s detailed probabilities.
<img width="1920" height="881" alt="Image20250927233052" src="https://github.com/user-attachments/assets/29329339-535b-4e48-b4bb-fb4e53da0519" />

Conversation – Light mode (summary view)
Light theme version of #1. The user’s message card on the right, assistant block with breathing/micro-steps, sadness (96.5%) badge, and three recommended songs. Theme toggle is set to Light.
<img width="1920" height="899" alt="Image20250927233036" src="https://github.com/user-attachments/assets/636e3e86-cfd8-4c0d-af1e-3b9ed96e5a17" />

Chats list + Conversation pane (Light mode)
Left sidebar lists recent chats (e.g., “Lately I feel heavy and tired,” “A teammate dismisses my i…”) with Close / Rename / Delete controls and timestamps. Right pane shows the selected conversation with the assistant’s guidance, mood detection banner, and the three music links. Designed to highlight multi-chat navigation and quick management actions.


---

## 👥 Maintainers
- **Team**: Joumana and Mariam  

---


