from fastapi import FastAPI, HTTPException, UploadFile, File
from fastapi.staticfiles import StaticFiles
from fastapi.responses import HTMLResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
import os
from dotenv import load_dotenv
from app.database import (
    init_db, add_task, get_all_tasks, get_task_by_id,
    update_task_status, increment_postpone, log_brave_start,
    get_brave_start_count, add_calendar_event, add_prep_task,
    get_prep_tasks, get_all_calendar_events, create_session,
    save_profile, get_profile, delete_task,
    log_check_in, get_recent_check_ins,
    log_win, get_win_logs,
)
from app.claude import (
    structure_task, get_what_now, generate_micro_steps,
    generate_prep_tasks, process_check_in, generate_social_rehearsal,
    generate_parent_insights, detect_strengths_from_history
)
from app.voice import (
    transcribe_audio, generate_audio_b64,
    build_what_now_script, build_step_script
)

load_dotenv()
app = FastAPI(title="ADHD Voice Copilot")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000", "http://localhost:3001", "http://127.0.0.1:3001"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.mount("/static", StaticFiles(directory="app/static"), name="static")
init_db()

# ── Request models ──────────────────────────────────────────
class TaskCaptureRequest(BaseModel):
    raw_text: str

class WhatNowRequest(BaseModel):
    pass

class MicroStepsRequest(BaseModel):
    task_id: int

class PostponeRequest(BaseModel):
    task_id: int

class BraveStartRequest(BaseModel):
    task_id: int

class CalendarEventRequest(BaseModel):
    event_name: str
    event_datetime: str
    location: Optional[str] = ""

class CompleteTaskRequest(BaseModel):
    task_id: int

class DeleteTaskRequest(BaseModel):
    task_id: int

class CheckInRequest(BaseModel):
    feeling: str
    message: Optional[str] = ""

class SocialRehearsalRequest(BaseModel):
    scenario: str

class LogWinRequest(BaseModel):
    type: str
    description: str
    identity_statement: str
    badge_emoji: Optional[str] = "⭐"

class TTSRequest(BaseModel):
    text: str

class ProfileSaveRequest(BaseModel):
    name: str
    age: Optional[int] = None
    phone: Optional[str] = None
    mode: str = "adult"
    struggles: list[str] = []
    kid_struggles: list[str] = []

# ── Routes ───────────────────────────────────────────────────
@app.get("/", response_class=HTMLResponse)
async def serve_frontend():
    with open("app/static/index.html") as f:
        return f.read()

@app.post("/voice/transcribe")
async def transcribe_voice(audio: UploadFile = File(...)):
    """ElevenLabs Scribe STT — audio file → text"""
    audio_bytes = await audio.read()
    text = transcribe_audio(audio_bytes, audio.filename or "audio.webm")
    if not text:
        raise HTTPException(status_code=500, detail="Transcription failed")
    return {"text": text}

@app.get("/profile")
async def fetch_profile():
    """Return the saved user profile"""
    profile = get_profile()
    return {"profile": profile}

@app.post("/profile/save")
async def save_user_profile(req: ProfileSaveRequest):
    """Persist user profile from onboarding"""
    save_profile(
        name=req.name,
        age=req.age,
        phone=req.phone,
        mode=req.mode,
        struggles=req.struggles,
        kid_struggles=req.kid_struggles,
    )
    return {"success": True, "profile": get_profile()}

@app.post("/task/capture")
async def capture_task(req: TaskCaptureRequest):
    """Voice dump inbox — raw text → structured task"""
    profile = get_profile()
    structured = await structure_task(req.raw_text, profile)
    task_id = add_task(
        raw_text=req.raw_text,
        task_name=structured["task_name"],
        urgency=structured["urgency"],
        category=structured["category"],
        first_step=structured["first_step"],
        estimated_minutes=structured["estimated_minutes"]
    )
    task = get_task_by_id(task_id)
    return {"success": True, "task": task}

@app.get("/tasks")
async def list_tasks():
    """Get all pending tasks"""
    tasks = get_all_tasks()
    brave_count = get_brave_start_count()
    return {"tasks": tasks, "brave_starts_this_week": brave_count}

@app.post("/task/what-now")
async def what_now():
    """Returns exactly ONE task to do right now, with voice line"""
    tasks = get_all_tasks()
    if not tasks:
        return {"task": None, "message": "No tasks yet — add something first!"}
    profile = get_profile()
    result = await get_what_now(tasks, profile)
    script = build_what_now_script(result["task_name"], result["reason"], result["first_step"])
    result["audio_b64"] = generate_audio_b64(script)
    return result

@app.post("/task/micro-steps")
async def micro_steps(req: MicroStepsRequest):
    """Generate BAT micro-steps for a task, with voice for step 1"""
    task = get_task_by_id(req.task_id)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    profile = get_profile()
    steps = await generate_micro_steps(task, profile)
    session_id = create_session(req.task_id, total_steps=len(steps))
    first_step_audio = generate_audio_b64(build_step_script(steps[0])) if steps else None
    return {"steps": steps, "session_id": session_id, "first_step_audio_b64": first_step_audio}

@app.post("/task/brave-start")
async def brave_start(req: BraveStartRequest):
    """Log that user started a task — the brave start"""
    task = get_task_by_id(req.task_id)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    log_brave_start(req.task_id)
    count = get_brave_start_count()
    return {
        "success": True,
        "message": f"Brave start logged! You've started {count} times this week.",
        "brave_starts_this_week": count
    }

@app.post("/task/postpone")
async def postpone_task(req: PostponeRequest):
    """Postpone a task — track avoidance"""
    task = get_task_by_id(req.task_id)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    increment_postpone(req.task_id)
    updated = get_task_by_id(req.task_id)
    shrunk = False
    if updated["postpone_count"] >= 3:
        shrunk = True
    return {
        "success": True,
        "postpone_count": updated["postpone_count"],
        "shrunk": shrunk,
        "message": "That's okay. We'll try again when you're ready." if not shrunk
                   else "This task has been tough to start. We've made it smaller for you."
    }

@app.post("/task/complete")
async def complete_task(req: CompleteTaskRequest):
    """Mark task as done"""
    update_task_status(req.task_id, "completed")
    return {"success": True, "message": "Quest complete! Amazing work."}

@app.post("/task/delete")
async def delete_task_endpoint(req: DeleteTaskRequest):
    """Parent admin — permanently delete a task"""
    task = get_task_by_id(req.task_id)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    delete_task(req.task_id)
    return {"success": True}

@app.post("/calendar/add")
async def add_calendar(req: CalendarEventRequest):
    """Add a calendar event and auto-generate prep tasks"""
    event_id = add_calendar_event(
        req.event_name, req.event_datetime, req.location
    )
    profile = get_profile()
    prep = await generate_prep_tasks(req.event_name, req.event_datetime, req.location, profile)
    for p in prep:
        add_prep_task(event_id, p["action"], p["due_time"])
    tasks = get_prep_tasks(event_id)
    return {"success": True, "event_id": event_id, "prep_tasks": tasks}

@app.get("/calendar")
@app.get("/calendar/events")
async def list_calendar_events():
    """Get all calendar events with their prep tasks"""
    events = get_all_calendar_events()
    result = []
    for event in events:
        preps = get_prep_tasks(event["id"])
        result.append({**event, "prep_tasks": preps})
    return {"events": result}

# ── Check-in & emotional support ────────────────────────────
@app.post("/checkin")
async def check_in(req: CheckInRequest):
    """Process a child's emotional check-in — validate, reframe, next step + calming voice"""
    profile = get_profile()
    result = await process_check_in(req.feeling, req.message or "", profile)

    # Generate calming audio from the validation response
    validation_text = result.get("validation", "")
    if validation_text:
        try:
            result["audio_b64"] = generate_audio_b64(validation_text)
        except Exception:
            result["audio_b64"] = None

    # Auto-log a win if it's a brave check-in
    if req.feeling in ("proud", "happy", "ready", "excited"):
        log_win(
            win_type="positive_checkin",
            description=f"Checked in feeling {req.feeling}",
            identity_statement=result.get("identity_statement", "You are someone who shows up."),
            badge_emoji="✨"
        )

    log_check_in(
        feeling=req.feeling,
        message=req.message or "",
        ai_validation=result.get("validation", ""),
        ai_reframe=result.get("reframe", ""),
        ai_next_step=result.get("next_step", ""),
        ai_identity=result.get("identity_statement", ""),
        ai_strength=result.get("strength_spot", ""),
        ai_help_me_tell=result.get("help_me_tell"),
        flags=result.get("flags", []),
    )
    return result

@app.post("/checkin/social-rehearsal")
async def social_rehearsal(req: SocialRehearsalRequest):
    """Generate a social rehearsal script for a scenario"""
    profile = get_profile()
    return await generate_social_rehearsal(req.scenario, profile)

@app.get("/checkin/history")
async def check_in_history():
    """Recent check-ins (for parent view)"""
    return {"check_ins": get_recent_check_ins(20)}

# ── Wins & strengths ─────────────────────────────────────────
@app.get("/wins")
async def list_wins():
    """All logged wins"""
    return {"wins": get_win_logs(30)}

@app.post("/wins/log")
async def add_win(req: LogWinRequest):
    """Manually log a win"""
    win_id = log_win(req.type, req.description, req.identity_statement, req.badge_emoji)
    return {"success": True, "win_id": win_id}

@app.get("/wins/strengths")
async def strength_detect():
    """Detect and surface strengths from task + check-in history"""
    profile = get_profile()
    tasks = get_all_tasks("completed") + get_all_tasks("pending")
    check_ins = get_recent_check_ins(20)
    strengths = await detect_strengths_from_history(tasks, check_ins, profile)
    return {"strengths": strengths}

# ── Parent insights ───────────────────────────────────────────
@app.get("/parent/insights")
async def parent_insights():
    """AI-generated pattern summary for parents"""
    profile = get_profile()
    check_ins = get_recent_check_ins(15)
    tasks = get_all_tasks("pending") + get_all_tasks("completed")
    brave_count = get_brave_start_count()
    insights = await generate_parent_insights(check_ins, tasks, brave_count, profile)
    return {"insights": insights, "check_in_count": len(check_ins), "alert_flags": [
        f for c in check_ins for f in c.get("flags", [])
    ]}

@app.get("/momentum")
async def get_momentum():
    """Momentum stats for parent dashboard — brave starts, completed quests, streak, weekly chart"""
    from datetime import datetime, timedelta
    conn = __import__("sqlite3").connect("momentum.db")
    conn.row_factory = __import__("sqlite3").Row

    brave_count = get_brave_start_count()
    completed = len(get_all_tasks("completed"))
    pending_tasks = get_all_tasks("pending")

    # Weekly chart: last 7 days
    weekly_data = []
    for i in range(6, -1, -1):
        day = datetime.now() - timedelta(days=i)
        label = day.strftime("%a")
        cur = conn.cursor()
        cur.execute("""
            SELECT COUNT(*) as cnt FROM brave_starts
            WHERE date(started_at) = date(?)
        """, (day.strftime("%Y-%m-%d"),))
        r = cur.fetchone()
        starts = r["cnt"] if r else 0
        cur.execute("""
            SELECT COUNT(*) as cnt FROM tasks
            WHERE status='completed' AND date(updated_at) = date(?)
        """, (day.strftime("%Y-%m-%d"),))
        r2 = cur.fetchone()
        done = r2["cnt"] if r2 else 0
        weekly_data.append({"label": label, "starts": starts, "completed": done})

    # Streak = consecutive days with at least 1 brave start
    streak = 0
    for i in range(0, 30):
        day = datetime.now() - timedelta(days=i)
        cur = conn.cursor()
        cur.execute("""
            SELECT COUNT(*) as cnt FROM brave_starts WHERE date(started_at) = date(?)
        """, (day.strftime("%Y-%m-%d"),))
        r = cur.fetchone()
        if r and r["cnt"] > 0:
            streak += 1
        else:
            if i > 0:
                break

    # Comeback count = check-ins where kid returned after frustration/tired
    cur = conn.cursor()
    cur.execute("SELECT COUNT(*) as cnt FROM check_ins WHERE feeling IN ('comeback', 'frustrated', 'tired')")
    r = cur.fetchone()
    comeback = r["cnt"] if r else 0
    conn.close()

    return {
        "brave_starts_this_week": brave_count,
        "quests_completed": completed,
        "streak_days": streak,
        "comeback_count": comeback,
        "weekly_data": weekly_data,
    }

@app.post("/demo/seed")
async def seed_demo():
    """Load rich demo data for presentations"""
    from app.seed_demo import seed
    seed()
    return {"success": True, "message": "Demo data loaded! Refresh the app."}

@app.post("/tts")
async def text_to_speech(req: TTSRequest):
    """Convert any text to Zap's voice — used for gentle nudges"""
    audio_b64 = generate_audio_b64(req.text)
    if not audio_b64:
        raise HTTPException(status_code=500, detail="TTS failed")
    return {"audio_b64": audio_b64}

@app.get("/health")
async def health():
    return {"status": "running", "message": "ADHD Voice Copilot is live"}
