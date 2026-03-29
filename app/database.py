import sqlite3
import json
from datetime import datetime

DB_PATH = "momentum.db"

# ── User Profile ─────────────────────────────────────────────

def save_profile(
    name: str,
    age: int | None,
    phone: str | None,
    mode: str,
    struggles: list[str],
    kid_struggles: list[str] | None = None,
) -> int:
    """Upsert the single user profile (row id=1)."""
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("""
        INSERT INTO user_profiles (id, name, age, phone, mode, struggles, kid_struggles, updated_at)
        VALUES (1, ?, ?, ?, ?, ?, ?, datetime('now'))
        ON CONFLICT(id) DO UPDATE SET
            name          = excluded.name,
            age           = excluded.age,
            phone         = excluded.phone,
            mode          = excluded.mode,
            struggles     = excluded.struggles,
            kid_struggles = excluded.kid_struggles,
            updated_at    = excluded.updated_at
    """, (name, age, phone, mode, json.dumps(struggles), json.dumps(kid_struggles or [])))
    conn.commit()
    conn.close()
    return 1

def get_profile() -> dict | None:
    """Return the single user profile or None if not set yet."""
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM user_profiles WHERE id = 1")
    row = cursor.fetchone()
    conn.close()
    if not row:
        return None
    profile = dict(row)
    profile["struggles"]     = json.loads(profile.get("struggles") or "[]")
    profile["kid_struggles"] = json.loads(profile.get("kid_struggles") or "[]")
    return profile

def get_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS tasks (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            raw_text TEXT NOT NULL,
            task_name TEXT,
            urgency TEXT DEFAULT 'medium',
            category TEXT DEFAULT 'general',
            first_step TEXT,
            estimated_minutes INTEGER DEFAULT 15,
            postpone_count INTEGER DEFAULT 0,
            status TEXT DEFAULT 'pending',
            created_at TEXT DEFAULT (datetime('now')),
            updated_at TEXT DEFAULT (datetime('now'))
        )
    """)

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS calendar_events (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            event_name TEXT NOT NULL,
            event_datetime TEXT NOT NULL,
            location TEXT,
            created_at TEXT DEFAULT (datetime('now'))
        )
    """)

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS prep_tasks (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            calendar_event_id INTEGER NOT NULL,
            action TEXT NOT NULL,
            due_time TEXT,
            status TEXT DEFAULT 'pending',
            FOREIGN KEY (calendar_event_id) REFERENCES calendar_events(id)
        )
    """)

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS sessions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            task_id INTEGER NOT NULL,
            steps_completed INTEGER DEFAULT 0,
            total_steps INTEGER DEFAULT 5,
            brave_start BOOLEAN DEFAULT 0,
            distress_detected BOOLEAN DEFAULT 0,
            started_at TEXT DEFAULT (datetime('now')),
            ended_at TEXT,
            FOREIGN KEY (task_id) REFERENCES tasks(id)
        )
    """)

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS brave_starts (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            task_id INTEGER NOT NULL,
            started_at TEXT DEFAULT (datetime('now')),
            FOREIGN KEY (task_id) REFERENCES tasks(id)
        )
    """)

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS user_profiles (
            id INTEGER PRIMARY KEY,
            name TEXT,
            age INTEGER,
            phone TEXT,
            mode TEXT DEFAULT 'adult',
            struggles TEXT DEFAULT '[]',
            kid_struggles TEXT DEFAULT '[]',
            created_at TEXT DEFAULT (datetime('now')),
            updated_at TEXT DEFAULT (datetime('now'))
        )
    """)
    # Add kid_struggles column to existing databases
    try:
        cursor.execute("ALTER TABLE user_profiles ADD COLUMN kid_struggles TEXT DEFAULT '[]'")
    except Exception:
        pass  # column already exists

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS check_ins (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            feeling TEXT,
            message TEXT,
            ai_validation TEXT,
            ai_reframe TEXT,
            ai_next_step TEXT,
            ai_identity TEXT,
            ai_strength TEXT,
            ai_help_me_tell TEXT,
            flags TEXT DEFAULT '[]',
            created_at TEXT DEFAULT (datetime('now'))
        )
    """)

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS win_logs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            type TEXT NOT NULL,
            description TEXT,
            identity_statement TEXT,
            badge_emoji TEXT DEFAULT '⭐',
            created_at TEXT DEFAULT (datetime('now'))
        )
    """)

    conn.commit()
    conn.close()
    print("Database initialized successfully.")

def add_task(raw_text, task_name, urgency, category, first_step, estimated_minutes):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("""
        INSERT INTO tasks (raw_text, task_name, urgency, category, first_step, estimated_minutes)
        VALUES (?, ?, ?, ?, ?, ?)
    """, (raw_text, task_name, urgency, category, first_step, estimated_minutes))
    task_id = cursor.lastrowid
    conn.commit()
    conn.close()
    return task_id

def get_all_tasks(status="pending"):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM tasks WHERE status = ? ORDER BY created_at DESC", (status,))
    rows = cursor.fetchall()
    conn.close()
    return [dict(row) for row in rows]

def get_task_by_id(task_id):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM tasks WHERE id = ?", (task_id,))
    row = cursor.fetchone()
    conn.close()
    return dict(row) if row else None

def delete_task(task_id):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM tasks WHERE id = ?", (task_id,))
    conn.commit()
    conn.close()

def update_task_status(task_id, status):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("""
        UPDATE tasks SET status = ?, updated_at = datetime('now') WHERE id = ?
    """, (status, task_id))
    conn.commit()
    conn.close()

def increment_postpone(task_id):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("""
        UPDATE tasks SET postpone_count = postpone_count + 1,
        updated_at = datetime('now') WHERE id = ?
    """, (task_id,))
    conn.commit()
    conn.close()

def add_calendar_event(event_name, event_datetime, location=""):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("""
        INSERT INTO calendar_events (event_name, event_datetime, location)
        VALUES (?, ?, ?)
    """, (event_name, event_datetime, location))
    event_id = cursor.lastrowid
    conn.commit()
    conn.close()
    return event_id

def add_prep_task(calendar_event_id, action, due_time):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("""
        INSERT INTO prep_tasks (calendar_event_id, action, due_time)
        VALUES (?, ?, ?)
    """, (calendar_event_id, action, due_time))
    conn.commit()
    conn.close()

def get_prep_tasks(calendar_event_id):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("""
        SELECT * FROM prep_tasks WHERE calendar_event_id = ?
    """, (calendar_event_id,))
    rows = cursor.fetchall()
    conn.close()
    return [dict(row) for row in rows]

def get_all_calendar_events():
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM calendar_events ORDER BY event_datetime ASC")
    rows = cursor.fetchall()
    conn.close()
    return [dict(row) for row in rows]

def log_brave_start(task_id):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("INSERT INTO brave_starts (task_id) VALUES (?)", (task_id,))
    conn.commit()
    conn.close()

def get_brave_start_count():
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("""
        SELECT COUNT(*) as count FROM brave_starts
        WHERE started_at >= datetime('now', '-7 days')
    """)
    row = cursor.fetchone()
    conn.close()
    return row["count"] if row else 0

def create_session(task_id, total_steps=5):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("""
        INSERT INTO sessions (task_id, total_steps) VALUES (?, ?)
    """, (task_id, total_steps))
    session_id = cursor.lastrowid
    conn.commit()
    conn.close()
    return session_id

def update_session(session_id, steps_completed=None, distress_detected=None, ended=False):
    conn = get_connection()
    cursor = conn.cursor()
    if steps_completed is not None:
        cursor.execute("UPDATE sessions SET steps_completed = ? WHERE id = ?",
                      (steps_completed, session_id))
    if distress_detected is not None:
        cursor.execute("UPDATE sessions SET distress_detected = ? WHERE id = ?",
                      (distress_detected, session_id))
    if ended:
        cursor.execute("UPDATE sessions SET ended_at = datetime('now') WHERE id = ?",
                      (session_id,))
    conn.commit()
    conn.close()

# ── Check-ins ─────────────────────────────────────────────────

def log_check_in(feeling, message, ai_validation, ai_reframe, ai_next_step,
                 ai_identity, ai_strength, ai_help_me_tell, flags):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("""
        INSERT INTO check_ins (feeling, message, ai_validation, ai_reframe, ai_next_step,
                               ai_identity, ai_strength, ai_help_me_tell, flags)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (feeling, message, ai_validation, ai_reframe, ai_next_step,
          ai_identity, ai_strength, ai_help_me_tell, json.dumps(flags)))
    row_id = cursor.lastrowid
    conn.commit()
    conn.close()
    return row_id

def get_recent_check_ins(limit=20):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM check_ins ORDER BY created_at DESC LIMIT ?", (limit,))
    rows = cursor.fetchall()
    conn.close()
    result = []
    for r in rows:
        d = dict(r)
        d["flags"] = json.loads(d.get("flags") or "[]")
        result.append(d)
    return result

# ── Win logs ──────────────────────────────────────────────────

def log_win(win_type, description, identity_statement, badge_emoji="⭐"):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("""
        INSERT INTO win_logs (type, description, identity_statement, badge_emoji)
        VALUES (?, ?, ?, ?)
    """, (win_type, description, identity_statement, badge_emoji))
    row_id = cursor.lastrowid
    conn.commit()
    conn.close()
    return row_id

def get_win_logs(limit=30):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM win_logs ORDER BY created_at DESC LIMIT ?", (limit,))
    rows = cursor.fetchall()
    conn.close()
    return [dict(r) for r in rows]
