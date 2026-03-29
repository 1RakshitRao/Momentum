"""
Demo seed — populates the database with logical, rich mock data for Alex (age 10).
Run with:  python -m app.seed_demo
Or via POST /demo/seed endpoint.
"""
import sqlite3
import json
from datetime import datetime, timedelta

DB_PATH = "momentum.db"

def get_conn():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def clear_demo_data():
    conn = get_conn()
    c = conn.cursor()
    c.execute("DELETE FROM tasks")
    c.execute("DELETE FROM calendar_events")
    c.execute("DELETE FROM prep_tasks")
    c.execute("DELETE FROM check_ins")
    c.execute("DELETE FROM win_logs")
    c.execute("DELETE FROM brave_starts")
    c.execute("DELETE FROM sessions")
    conn.commit()
    conn.close()

def seed():
    clear_demo_data()
    conn = get_conn()
    c = conn.cursor()

    # ── Profile ──────────────────────────────────────────────────
    c.execute("""
        INSERT INTO user_profiles (id, name, age, phone, mode, struggles, kid_struggles, updated_at)
        VALUES (1, ?, ?, ?, ?, ?, ?, datetime('now'))
        ON CONFLICT(id) DO UPDATE SET
            name=excluded.name, age=excluded.age, phone=excluded.phone,
            mode=excluded.mode, struggles=excluded.struggles,
            kid_struggles=excluded.kid_struggles, updated_at=excluded.updated_at
    """, (
        "Alex", 10, None, "kid",
        json.dumps([]),
        json.dumps(["focus", "getting_started", "anxiety", "transitions", "time_blindness"])
    ))

    # ── Tasks ────────────────────────────────────────────────────
    now = datetime.now()

    tasks = [
        # Two main DEMO tasks (pending)
        ("complete my math homework",
         "Complete Math Homework 📐", "high", "homework",
         "Get your math textbook and open to today's chapter", 30, "pending",
         now.strftime("%Y-%m-%d %H:%M:%S"), now.strftime("%Y-%m-%d %H:%M:%S")),
        ("add soccer match to routine for friday 5pm",
         "Soccer Match Prep ⚽", "medium", "routine",
         "Pack your soccer bag — boots, shin pads, and water bottle", 60, "pending",
         now.strftime("%Y-%m-%d %H:%M:%S"), now.strftime("%Y-%m-%d %H:%M:%S")),
        # Completed tasks for history
        ("read chapter 3 of my book",
         "Read Chapter 3 📚", "low", "reading",
         "Find your book and open to where you left off", 20, "completed",
         (now - timedelta(days=1)).strftime("%Y-%m-%d %H:%M:%S"),
         (now - timedelta(days=1)).strftime("%Y-%m-%d %H:%M:%S")),
        ("finish science project poster",
         "Science Project Poster 🔬", "high", "homework",
         "Lay out your poster board and gather your notes", 45, "completed",
         (now - timedelta(days=2)).strftime("%Y-%m-%d %H:%M:%S"),
         (now - timedelta(days=2)).strftime("%Y-%m-%d %H:%M:%S")),
        ("practice spelling words",
         "Spelling Practice ✏️", "medium", "homework",
         "Write each word once, then cover and try from memory", 15, "completed",
         (now - timedelta(days=3)).strftime("%Y-%m-%d %H:%M:%S"),
         (now - timedelta(days=3)).strftime("%Y-%m-%d %H:%M:%S")),
    ]

    task_ids = []
    for t in tasks:
        c.execute("""
            INSERT INTO tasks (raw_text, task_name, urgency, category, first_step,
                               estimated_minutes, status, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, t)
        task_ids.append(c.lastrowid)
    conn.commit()

    # ── Brave starts (8 across last 7 days) ─────────────────────
    brave_times = [
        now - timedelta(days=0, hours=1),
        now - timedelta(days=0, hours=3),
        now - timedelta(days=1, hours=2),
        now - timedelta(days=1, hours=5),
        now - timedelta(days=2, hours=1),
        now - timedelta(days=3, hours=2),
        now - timedelta(days=4, hours=4),
        now - timedelta(days=5, hours=3),
    ]
    for i, bt in enumerate(brave_times):
        tid = task_ids[i % len(task_ids)]
        c.execute("INSERT INTO brave_starts (task_id, started_at) VALUES (?, ?)",
                  (tid, bt.strftime("%Y-%m-%d %H:%M:%S")))
    conn.commit()

    # ── Calendar events ──────────────────────────────────────────
    # Find next Friday
    days_until_friday = (4 - now.weekday()) % 7
    if days_until_friday == 0:
        days_until_friday = 7
    friday = now + timedelta(days=days_until_friday)
    friday_str = friday.strftime("%Y-%m-%d") + " 17:00:00"

    # Soccer match (Friday 5pm)
    c.execute("""INSERT INTO calendar_events (event_name, event_datetime, location)
                 VALUES (?, ?, ?)""",
              ("Soccer Match vs Eagles ⚽", friday_str, "City Sports Park, Field 3"))
    soccer_id = c.lastrowid

    soccer_preps = [
        ("🎒 Pack your bag — boots, shin pads, water bottle, snack", friday.strftime("%Y-%m-%d") + " 16:00"),
        ("🍌 Eat a light snack — banana, toast, or crackers", friday.strftime("%Y-%m-%d") + " 16:15"),
        ("👕 Get changed into your full kit", friday.strftime("%Y-%m-%d") + " 16:30"),
        ("🚗 Leave for the field with a grown-up — don't be late!", friday.strftime("%Y-%m-%d") + " 16:45"),
        ("🏃 Warm up on the field — 5 min jog + stretches", friday.strftime("%Y-%m-%d") + " 16:55"),
    ]
    for action, due in soccer_preps:
        c.execute("INSERT INTO prep_tasks (calendar_event_id, action, due_time) VALUES (?, ?, ?)",
                  (soccer_id, action, due))

    # Math Test (Monday 9am)
    next_monday = now + timedelta(days=(7 - now.weekday()))
    monday_str = next_monday.strftime("%Y-%m-%d") + " 09:00:00"
    c.execute("""INSERT INTO calendar_events (event_name, event_datetime, location)
                 VALUES (?, ?, ?)""",
              ("Math Test 📐", monday_str, "School — Room 12"))
    math_id = c.lastrowid

    math_preps = [
        ("📖 Review your chapter notes for 20 minutes", next_monday.strftime("%Y-%m-%d") + " 20:00"),
        ("✏️ Pack calculator, pencils, and eraser in your bag", next_monday.strftime("%Y-%m-%d") + " 20:30"),
        ("😴 Lights out by 9pm — sleep helps your brain remember!", next_monday.strftime("%Y-%m-%d") + " 21:00"),
        ("🥣 Eat breakfast — your brain needs fuel for a test", next_monday.strftime("%Y-%m-%d") + " 08:00"),
    ]
    for action, due in math_preps:
        c.execute("INSERT INTO prep_tasks (calendar_event_id, action, due_time) VALUES (?, ?, ?)",
                  (math_id, action, due))

    conn.commit()

    # ── Check-ins (rich history) ──────────────────────────────────
    check_ins = [
        {
            "feeling": "worried",
            "message": "I have so much math homework and I don't know where to start",
            "ai_validation": "It makes complete sense that you feel worried — math homework can feel like a mountain when you're looking at it all at once. You're not alone in feeling this way.",
            "ai_reframe": "Here's the thing — you don't have to do it all at once. Even just opening the textbook is a win. One tiny step is all you need right now.",
            "ai_next_step": "Start with just problem number one. Set a timer for 5 minutes and see how it goes.",
            "ai_identity": "You are someone who faces hard things instead of running away.",
            "ai_strength": "Persistence",
            "ai_help_me_tell": "Alex is feeling overwhelmed by the amount of homework and needs help breaking it into smaller pieces.",
            "flags": [],
            "created_at": (now - timedelta(hours=2)).strftime("%Y-%m-%d %H:%M:%S"),
        },
        {
            "feeling": "proud",
            "message": "I finished my reading homework all by myself!",
            "ai_validation": "YES! That is a massive win and you should be incredibly proud. You did that all on your own — no one made you, you just did it!",
            "ai_reframe": "This is proof that when you start, you can finish. Your brain is more powerful than it feels sometimes.",
            "ai_next_step": "Tell someone you trust about this win. You deserve to celebrate it!",
            "ai_identity": "You are a reader who finishes what you start.",
            "ai_strength": "Follow-through",
            "ai_help_me_tell": None,
            "flags": [],
            "created_at": (now - timedelta(days=1, hours=4)).strftime("%Y-%m-%d %H:%M:%S"),
        },
        {
            "feeling": "frustrated",
            "message": "I can't focus today everything is distracting me",
            "ai_validation": "Ugh, that scattered feeling is SO hard. Your brain is not broken — sometimes it just needs a different setup to get going.",
            "ai_reframe": "Distraction isn't a character flaw. It means your brain is busy and needs a little help narrowing in. That's what we're here for.",
            "ai_next_step": "Try the 5-2-1 trick: find 5 things you can see, 2 you can hear, 1 you can touch. Then take one deep breath. Ready?",
            "ai_identity": "You are someone who finds ways through hard moments.",
            "ai_strength": "Resilience",
            "ai_help_me_tell": "Alex struggled to focus today and would benefit from a quieter work environment or movement break before homework.",
            "flags": ["attention_difficulty"],
            "created_at": (now - timedelta(days=2, hours=1)).strftime("%Y-%m-%d %H:%M:%S"),
        },
        {
            "feeling": "excited",
            "message": "Soccer match is tomorrow I can't wait!!",
            "ai_validation": "That excitement is ELECTRIC and I love it for you! You've been working hard and tomorrow you get to show everyone what you've got.",
            "ai_reframe": "Channel that energy tonight — but make sure you rest so your legs are ready to fly tomorrow.",
            "ai_next_step": "Pack your bag tonight so morning is stress-free. Boots, shin pads, water bottle — all ready to go!",
            "ai_identity": "You are an athlete who shows up ready.",
            "ai_strength": "Enthusiasm",
            "ai_help_me_tell": None,
            "flags": [],
            "created_at": (now - timedelta(days=1)).strftime("%Y-%m-%d %H:%M:%S"),
        },
        {
            "feeling": "tired",
            "message": "School was really long today and my brain feels empty",
            "ai_validation": "A whole day of school takes so much brain energy. Your tiredness makes total sense — you've been working hard all day.",
            "ai_reframe": "A tired brain isn't a lazy brain. It's a brain that worked hard. You deserve rest.",
            "ai_next_step": "Take 20 minutes to do something fun and low-effort — snack, draw, or just lie down. Then we can tackle one small thing.",
            "ai_identity": "You are someone who knows when to rest and when to go.",
            "ai_strength": "Self-awareness",
            "ai_help_me_tell": None,
            "flags": [],
            "created_at": (now - timedelta(days=3, hours=5)).strftime("%Y-%m-%d %H:%M:%S"),
        },
        {
            "feeling": "sad",
            "message": "I got a question wrong in class and everyone saw",
            "ai_validation": "Oh, that stings. Getting something wrong in front of others is one of the most uncomfortable feelings — I completely understand why you feel sad.",
            "ai_reframe": "Here's the truth: the bravest thing in that classroom was you trying to answer. Most kids stayed silent. You raised your hand.",
            "ai_next_step": "Write down one thing you DO know well about that subject. Your worth is not measured by one answer.",
            "ai_identity": "You are brave enough to try even when you might be wrong.",
            "ai_strength": "Courage",
            "ai_help_me_tell": "Alex felt embarrassed in class today after getting an answer wrong. Positive reinforcement from home would help rebuild confidence.",
            "flags": ["shame_event"],
            "created_at": (now - timedelta(days=4, hours=3)).strftime("%Y-%m-%d %H:%M:%S"),
        },
    ]
    for ci in check_ins:
        c.execute("""
            INSERT INTO check_ins (feeling, message, ai_validation, ai_reframe, ai_next_step,
                                   ai_identity, ai_strength, ai_help_me_tell, flags, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            ci["feeling"], ci["message"], ci["ai_validation"], ci["ai_reframe"],
            ci["ai_next_step"], ci["ai_identity"], ci["ai_strength"],
            ci["ai_help_me_tell"], json.dumps(ci["flags"]), ci["created_at"]
        ))
    conn.commit()

    # ── Wins ─────────────────────────────────────────────────────
    wins = [
        ("brave_start", "Started math homework even when it felt impossible",
         "You are someone who faces hard things head-on. ⚡", "⚡",
         (now - timedelta(hours=1)).strftime("%Y-%m-%d %H:%M:%S")),
        ("completion", "Finished reading Chapter 3 all the way through",
         "You are a reader who finishes what they start. 📚", "📚",
         (now - timedelta(days=1, hours=4)).strftime("%Y-%m-%d %H:%M:%S")),
        ("brave_start", "Started the science project without being asked",
         "You are someone who takes initiative without needing a push. 🔬", "🔬",
         (now - timedelta(days=2, hours=2)).strftime("%Y-%m-%d %H:%M:%S")),
        ("comeback", "Got distracted but came back to homework after 5 minutes",
         "You are someone who always comes back. That's a superpower. 🔄", "🔄",
         (now - timedelta(days=2, hours=5)).strftime("%Y-%m-%d %H:%M:%S")),
        ("completion", "Completed the science poster on time",
         "You are a scientist who follows through on their ideas. 🏆", "🏆",
         (now - timedelta(days=3, hours=1)).strftime("%Y-%m-%d %H:%M:%S")),
        ("brave_start", "Answered a question out loud in class",
         "You are brave enough to try even when you might be wrong. 🙋", "🙋",
         (now - timedelta(days=4, hours=6)).strftime("%Y-%m-%d %H:%M:%S")),
        ("positive_checkin", "Checked in feeling excited about soccer",
         "You are someone who shows up and gives 100%. ✨", "✨",
         (now - timedelta(days=5, hours=2)).strftime("%Y-%m-%d %H:%M:%S")),
    ]
    for win in wins:
        c.execute("""
            INSERT INTO win_logs (type, description, identity_statement, badge_emoji, created_at)
            VALUES (?, ?, ?, ?, ?)
        """, win)
    conn.commit()
    conn.close()
    print("✅ Demo data seeded successfully!")
    return True

if __name__ == "__main__":
    seed()
