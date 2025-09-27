# backend/app.py
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Dict, List, Optional, Tuple
import re, random, torch

from transformers import pipeline, AutoTokenizer, AutoModelForSeq2SeqLM
from music_links import YT_MUSIC_MAP  # your 30-links-per-mood dict

# ----------------- CONFIG -----------------
API_NAME = "Moodify API"
FRONTENDS = ["http://localhost:4200"]

# Emotion model
EMOTION_MODEL_ID = "j-hartmann/emotion-english-distilroberta-base"

# Tiny seq2seq just for TITLE (fast, OK quality)
T5_MODEL_ID = "google/flan-t5-small"

DEVICE = 0 if torch.cuda.is_available() else -1
try:
    torch.set_num_threads(1)
except Exception:
    pass

# ----------------- APP & CORS -----------------
app = FastAPI(title=API_NAME, version="4.0-composer")
app.add_middleware(
    CORSMiddleware,
    allow_origins=FRONTENDS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ----------------- SCHEMAS -----------------
class AssistRequest(BaseModel):
    text: str
    chat_id: Optional[str] = None
    suggestion_prompt: Optional[str] = None  # not used by composer but kept for compatibility

class AssistResponse(BaseModel):
    title: str
    mood: str
    score: float
    probs: Dict[str, float]
    suggestion_paragraph: str   # 3 lines separated by \n
    music_links: List[str]

# ----------------- PIPELINES -----------------
emotion_pipe = pipeline(
    "text-classification",
    model=EMOTION_MODEL_ID,
    return_all_scores=True,
    device=DEVICE
)

t5_tok = AutoTokenizer.from_pretrained(T5_MODEL_ID)
t5_mod = AutoModelForSeq2SeqLM.from_pretrained(T5_MODEL_ID)
t5_pipe = pipeline(
    "text2text-generation",
    model=t5_mod,
    tokenizer=t5_tok,
    device=DEVICE
)

def _warmup():
    try:
        with torch.inference_mode():
            _ = t5_pipe("Title: hello", max_new_tokens=4, do_sample=False)
    except Exception:
        pass
_warmup()

# ----------------- HELPERS -----------------
def make_title(text: str) -> str:
    prompt = (
        "Summarize the user's message into a concise chat title with 3 to 6 words. "
        "Use plain words only, no punctuation, no quotes.\n"
        f"Message: {text}\nTitle:"
    )
    with torch.inference_mode():
        out = t5_pipe(prompt, max_new_tokens=12, do_sample=False)[0]["generated_text"]
    out = re.sub(r"[^A-Za-z0-9\s]", "", out).strip()
    words = out.split()
    return " ".join(words[:6]) if len(words) >= 2 else (" ".join(text.split()[:6]) or "New chat")

def detect_emotion(text: str) -> Tuple[str, float, Dict[str, float]]:
    scores = emotion_pipe(text)[0]
    probs = {s["label"]: float(s["score"]) for s in scores}
    top = max(scores, key=lambda s: s["score"])
    return top["label"], float(top["score"]), probs

def emotion_music_links(emotion: str, k: int = 3) -> List[str]:
    pool = list({*YT_MUSIC_MAP.get(emotion.lower(), YT_MUSIC_MAP["neutral"])})
    random.shuffle(pool)
    return pool[:k]

# ----------------- FAST RULE-BASED COMPOSER -----------------
STOPWORDS = set("""
i me my myself we our ours ourselves you your yours yourself yourselves he him his
himself she her hers herself it its itself they them their theirs themselves what
which who whom this that these those am is are was were be been being have has had
having do does did doing a an the and but if or because as until while of at by for
with about against between into through during before after above below to from up
down in out on off over under again further then once here there when where why how
all any both each few more most other some such no nor not only own same so than
too very s t can will just don don should now
""".split())

# Keyword extraction (lightweight)
def extract_keywords(text: str, max_k: int = 5) -> List[str]:
    words = re.findall(r"[A-Za-z]{3,}", text.lower())
    filtered = [w for w in words if w not in STOPWORDS]
    # crude frequency
    freq = {}
    for w in filtered:
        freq[w] = freq.get(w, 0) + 1
    top = sorted(freq.items(), key=lambda x: (-x[1], x[0]))[:max_k]
    return [w for w, _ in top]

def tm() -> str:
    # tiny time variations to keep lines fresh
    return random.choice(["5 minutes", "10 minutes", "15 minutes", "2 minutes", "3 minutes"])

def breathe() -> str:
    return random.choice([
        "Breathe in 4, hold 4, out 4—repeat twice to settle your body.",
        "Try box breathing: in 4, hold 4, out 4, hold 4, for 4 rounds.",
        "Do 4-7-8 breathing once: in 4, hold 7, exhale 8, then sit for a beat.",
        "Take 60 seconds for slow nasal breaths; relax jaw and drop shoulders."
    ])

def micro_break() -> str:
    return random.choice([
        "Stand up, roll shoulders, sip water, and look at something far away.",
        "Step to the window and name five things you can see or hear.",
        "Walk a quick lap, shake out hands, and reset your posture.",
        "Stretch calves and neck for 30 seconds, then resume."
    ])

def social_ping() -> str:
    return random.choice([
        "Send a 2-line check-in to someone supportive and share one small next step.",
        "Text a friend: one thing you’re tackling and when you’ll update them.",
        "Ask a teammate for a 2-minute gut check; accept their quick notes."
    ])

def tiny_plan(keywords: List[str]) -> str:
    kword = keywords[0] if keywords else "one small task"
    return random.choice([
        f"List 3 micro-steps for {kword}; start the first for {tm()}.",
        f"Open a blank note: write next action for {kword} and do it for {tm()}.",
        f"Set a timer for {tm()} and do just the first step toward {kword}.",
        f"Cut {kword} in half; finish the smaller half in {tm()}."
    ])

def joy_lines(keywords: List[str]) -> List[str]:
    return [
        random.choice([
            "Capture the win: jot what worked and one thing to repeat this week.",
            "Snapshot momentum: list 2 habits that helped and schedule them again."
        ]),
        f"Pick a small stretch goal tied to {keywords[0] if keywords else 'today'} and work {tm()} on it.",
        random.choice([
            "Share thanks with someone who helped; reinforce what you want more of.",
            "Plan a short reward tonight so your brain links effort to joy."
        ]),
    ]

def sadness_lines(keywords: List[str]) -> List[str]:
    return [
        breathe(),
        tiny_plan(keywords),
        random.choice([
            micro_break(),
            "Write one compassionate sentence to yourself and read it aloud."
        ]),
    ]

def fear_lines(keywords: List[str]) -> List[str]:
    return [
        random.choice([
            "Name the top worry, then list one prevention and one fallback.",
            "Write the worst-case in one line, then add two realistic counters."
        ]),
        tiny_plan(keywords),
        breathe(),
    ]

def anger_lines(keywords: List[str]) -> List[str]:
    return [
        random.choice([
            "Do 30 seconds of fast walk in place, then exhale slowly for 8.",
            "Release energy: 15 squats or brisk stair up-down; then slow breath."
        ]),
        random.choice([
            "Draft the message you want to send—do not send—then rewrite it calmer.",
            "Note what boundary was crossed; choose one clear request you’ll make."
        ]),
        micro_break(),
    ]

def surprise_lines(keywords: List[str]) -> List[str]:
    return [
        random.choice([
            "Ground yourself: look around and name five things you see.",
            "Scan feet-to-head; relax any tight area and drop your shoulders."
        ]),
        tiny_plan(keywords),
        social_ping(),
    ]

def neutral_lines(keywords: List[str]) -> List[str]:
    return [
        tiny_plan(keywords),
        micro_break(),
        breathe(),
    ]

MOOD_DISPATCH = {
    "joy": joy_lines,
    "sadness": sadness_lines,
    "fear": fear_lines,
    "anger": anger_lines,
    "surprise": surprise_lines,
    "neutral": neutral_lines,
}

def compose_three_lines(mood: str, message: str) -> str:
    """
    Compose 3 unique, varied, actionable lines based on mood + message keywords.
    No static fallbacks across requests: randomness ensures fresh output.
    """
    keywords = extract_keywords(message, max_k=5)
    mood_fn = MOOD_DISPATCH.get(mood.lower(), neutral_lines)
    lines = mood_fn(keywords)

    # Deduplicate by normalized key and trim to 3
    seen, out = set(), []
    for ln in lines:
        key = re.sub(r"[^a-z0-9]+", " ", ln.lower()).strip()
        if key and key not in seen:
            seen.add(key)
            out.append(ln)
        if len(out) == 3:
            break

    # If duplicates slipped in (rare), fill with neutral variants
    if len(out) < 3:
        filler = neutral_lines(keywords)
        for ln in filler:
            key = re.sub(r"[^a-z0-9]+", " ", ln.lower()).strip()
            if key and key not in seen:
                seen.add(key); out.append(ln)
            if len(out) == 3:
                break

    return "\n".join(out[:3])

# ----------------- ROUTES -----------------
@app.get("/health")
def health():
    return {"ok": True, "model_device": "cuda" if DEVICE == 0 else "cpu"}

@app.post("/assist", response_model=AssistResponse)
def assist(req: AssistRequest):
    text = (req.text or "").strip()
    if not text:
        raise HTTPException(status_code=400, detail="text is required")

    title = make_title(text)
    mood, score, probs = detect_emotion(text)

    # FAST, dynamic, non-repetitive 3 lines
    suggestion_paragraph = compose_three_lines(mood, text)

    music_links = emotion_music_links(mood, k=3)

    return AssistResponse(
        title=title,
        mood=mood,
        score=score,
        probs=probs,
        suggestion_paragraph=suggestion_paragraph,
        music_links=music_links
    )

# Stubs (optional)
@app.post("/predict/csv")
def predict_csv(file: UploadFile = File(...)):
    return {"ok": True, "note": "CSV endpoint stub"}

@app.post("/analyze/pdf")
def analyze_pdf(file: UploadFile = File(...)):
    return {"ok": True, "note": "PDF endpoint stub"}
