import os
import json
import anthropic
from dotenv import load_dotenv

load_dotenv()
client = anthropic.Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))

# ── Struggle label map ────────────────────────────────────────
STRUGGLE_LABELS = {
    "starting":       "starting tasks even when they seem easy",
    "focus":          "staying focused mid-task",
    "overwhelm":      "feeling overwhelmed by long task lists",
    "time-blindness": "losing track of time without noticing",
    "forgetting":     "forgetting things they meant to do",
    "transitions":    "switching between tasks smoothly",
    "procrastination":"putting things off all day",
    "finishing":      "getting close to done but not finishing",
    "priority":       "deciding what to do first",
    "rejection":      "shutting down after criticism or setbacks",
    "hyperfocus":     "getting sucked into one thing and losing hours",
    "motivation":     "low motivation on difficult days",
}

# ── Kid-specific LLM instruction map (mirrors kidStruggleOptions in frontend) ─
KID_STRUGGLE_NOTES = {
    "cant_start":   "struggles to initiate — make first step under 5 seconds, always use 'brave start' framing, celebrate the attempt not the result",
    "forgetting":   "prone to forgetting — add written anchors in every step, repeat key information, suggest physical cues",
    "distracted":   "easily distracted — keep every step under 15 seconds, name the single next action explicitly, no multi-part instructions",
    "overwhelmed":  "overwhelm-prone — always offer exactly one option, validate feelings before any instruction, shrink tasks aggressively",
    "feel_bad":     "low self-worth signals — always open with identity statement, use 'You are someone who' framing, maximise affirmations, never outcome-based praise",
    "mean_kids":    "experiencing peer difficulty — proactively activate Truth Shield framing, watch for shame language, always separate what was said from what is true",
    "angry_sad":    "emotional dysregulation — always validate first, reduce task complexity during emotional states, never push through distress",
    "school_hard":  "school difficulties — scaffold all academic tasks into tiny pieces, generate accommodation language, use extra encouraging tone",
    "dont_know":    "priority paralysis — always give one clear directive, never list multiple options, be very decisive",
}

def build_user_context(profile: dict | None) -> str:
    """Return a personalised context block injected into every prompt."""
    if not profile:
        return "User: someone with ADHD (no profile on file yet)."

    name      = profile.get("name") or "the user"
    mode      = profile.get("mode", "adult")
    age       = profile.get("age")
    # For kids, prefer kid_struggles (feature-mapped ids); fall back to struggles
    if mode == "kid":
        struggles = profile.get("kid_struggles") or profile.get("struggles", [])
    else:
        struggles = profile.get("struggles", [])

    age_note  = f", age {age}" if age else ""

    if mode == "kid":
        # Use kid-specific notes — richer, feature-mapped instructions
        kid_notes = [
            KID_STRUGGLE_NOTES[s] for s in struggles if s in KID_STRUGGLE_NOTES
        ]
        if kid_notes:
            struggle_text = "\n".join(f"  • {note}" for note in kid_notes)
        else:
            struggle_text = "  • general ADHD challenges — use short sentences, playful tone, celebrate effort"

        return (
            f"You are speaking with {name}{age_note}, a child with ADHD.\n"
            f"Behaviour-specific instructions (follow precisely for every response):\n"
            f"{struggle_text}\n"
            f"Always address them by name ({name}). "
            f"Use simple language (max grade 4 reading level). "
            f"Sentences under 12 words. Never use: 'just', 'simply', 'you should', 'you need to'."
        )
    else:
        # Adult mode — use adult struggle labels
        struggle_text = (
            "\n".join(f"  • {STRUGGLE_LABELS.get(s, s)}" for s in struggles)
            if struggles
            else "  • general ADHD challenges"
        )
        return (
            f"You are speaking with {name}{age_note}, an adult with ADHD.\n"
            f"Their specific struggles (use these to personalise every response):\n"
            f"{struggle_text}\n"
            f"Always address them by name ({name}). "
            f"Adapt your tone, language complexity, and step sizes to these exact challenges."
        )


# ── Claude functions ──────────────────────────────────────────

async def structure_task(raw_text: str, profile: dict | None = None) -> dict:
    """Convert raw voice text into a structured ADHD-aware task."""
    user_ctx = build_user_context(profile)
    is_kid   = (profile or {}).get("mode") == "kid"

    message = client.messages.create(
        model="claude-haiku-4-5",
        max_tokens=500,
        system=user_ctx,
        messages=[{
            "role": "user",
            "content": f"""Convert this raw task description into a structured task for someone with ADHD.

Raw text: "{raw_text}"

Return ONLY valid JSON with these exact fields:
{{
  "task_name": "clear short task name under 8 words",
  "urgency": "high|medium|low",
  "category": "homework|chore|appointment|creative|social|other",
  "first_step": "single physical action under 10 words",
  "estimated_minutes": <number between 5 and 120>
}}

Rules:
- task_name must be specific, never vague
- first_step must be a physical action (open, write, find, pack)
- Never use the word "just" or "simply"
- estimated_minutes must be realistic given their struggles (e.g. if they struggle with starting, add 10 extra minutes)
{"- Use language suitable for a child aged 8-12" if is_kid else "- Use calm, adult tone"}"""
        }]
    )
    text = message.content[0].text.strip()
    text = text.replace("```json", "").replace("```", "").strip()
    return json.loads(text)


async def get_what_now(tasks: list, profile: dict | None = None) -> dict:
    """Pick exactly ONE task for the user to do right now."""
    user_ctx = build_user_context(profile)
    name     = (profile or {}).get("name") or "there"
    struggles = (profile or {}).get("struggles", [])

    tasks_summary = [
        {
            "id":                t["id"],
            "task_name":         t["task_name"],
            "urgency":           t["urgency"],
            "category":          t["category"],
            "first_step":        t["first_step"],
            "postpone_count":    t["postpone_count"],
            "estimated_minutes": t["estimated_minutes"],
        }
        for t in tasks
    ]

    # Build struggle-specific coaching hints
    hints = []
    if "overwhelm" in struggles:
        hints.append("Pick the SMALLEST task to reduce overwhelm — momentum matters more than importance.")
    if "starting" in struggles:
        hints.append("Prioritise the task with the easiest first step — they struggle most with getting started.")
    if "procrastination" in struggles:
        hints.append("Avoid the task they've postponed the most — pick something fresh to build confidence.")
    if "priority" in struggles:
        hints.append("Be very decisive — they struggle to choose, so give a strong clear recommendation.")
    hint_block = ("\n".join(hints) + "\n") if hints else ""

    message = client.messages.create(
        model="claude-haiku-4-5",
        max_tokens=300,
        system=user_ctx,
        messages=[{
            "role": "user",
            "content": f"""From this task list, pick EXACTLY ONE task for {name} to do right now.

Tasks: {json.dumps(tasks_summary)}

{hint_block}Selection criteria:
1. Creates the most momentum (easiest to start wins over most important)
2. Reduces the most anxiety if completed
3. Matches their specific struggles above

Return ONLY valid JSON:
{{
  "task_id": <id of chosen task>,
  "task_name": "<name>",
  "reason": "one warm sentence addressing {name} by name, max 14 words",
  "first_step": "<the very first physical action>"
}}

The reason must feel supportive and personal, never generic or pressuring."""
        }]
    )
    text = message.content[0].text.strip()
    text = text.replace("```json", "").replace("```", "").strip()
    return json.loads(text)


async def generate_micro_steps(task: dict, profile: dict | None = None) -> list:
    """Generate BAT micro-steps personalised to the user's struggles."""
    user_ctx = build_user_context(profile)
    is_kid   = (profile or {}).get("mode") == "kid"
    struggles = (profile or {}).get("struggles", [])
    shrunk   = task.get("postpone_count", 0) >= 3

    # Build struggle-specific step guidance
    extra_rules = []
    if "finishing" in struggles:
        extra_rules.append("- Include an explicit 'almost done — one thing left' step near the end.")
    if "focus" in struggles:
        extra_rules.append("- Keep each step under 20 seconds. Shorter is better.")
    if "time-blindness" in struggles:
        extra_rules.append("- Be very precise about time per step. Repeat the duration in the celebration message.")
    if "transitions" in struggles:
        extra_rules.append("- Step 1 must include clearing the current environment before starting.")
    extra_block = ("\n".join(extra_rules) + "\n") if extra_rules else ""

    language_note = (
        "Language must work for a child aged 8-12 — playful, short sentences."
        if is_kid
        else "Language should be calm, adult, and encouraging — never childish."
    )

    message = client.messages.create(
        model="claude-haiku-4-5",
        max_tokens=700,
        system=user_ctx,
        messages=[{
            "role": "user",
            "content": f"""Generate task activation micro-steps using Behavioral Activation Therapy principles.

Task: "{task['task_name']}"
First step hint: "{task['first_step']}"
{"⚠️ This task has been avoided 3+ times. Make steps EXTRA tiny. Max 2 minutes total." if shrunk else ""}

Generate exactly 5 micro-steps.

Rules:
- Step 1 MUST be environment setup (open app, get notebook, sit at desk)
- Each step is ONE physical action only
- Each step takes under 30 seconds
- State the time explicitly: "This takes 10 seconds"
- Never use "just" or "simply"
- Count UP in celebration messages, never down
{extra_block}{language_note}

Return ONLY valid JSON array:
[
  {{
    "step": 1,
    "action": "physical action described simply",
    "seconds": <number>,
    "celebration": "what the app says when this step is done — specific, warm, addresses user by name"
  }}
]"""
        }]
    )
    text = message.content[0].text.strip()
    text = text.replace("```json", "").replace("```", "").strip()
    return json.loads(text)


async def generate_prep_tasks(event_name: str, event_datetime: str,
                               location: str = "", profile: dict | None = None) -> list:
    """Generate hidden prep tasks for a calendar event."""
    user_ctx = build_user_context(profile)
    struggles = (profile or {}).get("struggles", [])

    # Build struggle-aware prep hints
    prep_hints = []
    if "time-blindness" in struggles:
        prep_hints.append("Include a 'set a phone alarm' prep task.")
    if "forgetting" in struggles:
        prep_hints.append("Include a 'write it down tonight' reminder prep task.")
    if "transitions" in struggles:
        prep_hints.append("Include a travel / transition buffer prep task.")
    hint_block = ("\n".join(prep_hints) + "\n") if prep_hints else ""

    message = client.messages.create(
        model="claude-haiku-4-5",
        max_tokens=500,
        system=user_ctx,
        messages=[{
            "role": "user",
            "content": f"""Generate hidden prep tasks for this calendar event for someone with ADHD.

Event: "{event_name}"
When: "{event_datetime}"
Location: "{location if location else 'not specified'}"

ADHD brains miss the hidden prep work before events. Generate exactly 3 prep tasks.

{hint_block}Think about:
- Items to find or pack
- Things to prepare the night before
- Travel or transition time buffers
- Reminders to set

Return ONLY valid JSON array:
[
  {{
    "action": "specific physical prep action under 10 words",
    "due_time": "when to do this e.g. 'the night before' or '30 minutes before'"
  }}
]

Make actions specific and physical. Never vague."""
        }]
    )
    text = message.content[0].text.strip()
    text = text.replace("```json", "").replace("```", "").strip()
    return json.loads(text)


# ── Emotional check-in ────────────────────────────────────────

async def process_check_in(feeling: str, message: str, profile: dict | None = None) -> dict:
    """
    Validate → Reframe → Tiny next step.
    Detects bullying signals, shame language, and spots strengths.
    """
    user_ctx = build_user_context(profile)
    name = (profile or {}).get("name") or "friend"

    response = client.messages.create(
        model="claude-haiku-4-5",
        max_tokens=800,
        system=(
            f"{user_ctx}\n\n"
            "You are a warm, non-judgmental ADHD companion for a child. "
            "Core principle: do NOT try to fix the child. Protect self-worth, "
            "build competence through tiny wins, never shame. "
            "Simple sentences under 15 words."
        ),
        messages=[{
            "role": "user",
            "content": f"""The child selected feeling: "{feeling}"
They said: "{message if message else '(nothing typed)'}"

Return ONLY valid JSON:
{{
  "validation": "1-2 sentences acknowledging what they said without judgment",
  "reframe": "1 sentence gently shifting the meaning — never denying the feeling",
  "next_step": "one tiny optional action — offer, not command",
  "identity_statement": "starts with 'You are someone who' — focus on effort or awareness, not outcome",
  "strength_spot": "ONE specific strength visible in what they shared (bravery, persistence, self-awareness, creativity, curiosity)",
  "flags": ["zero or more from: shame_language, bullying_signal, school_avoidance, low_mood, distress"],
  "help_me_tell": null
}}

Rules:
- validation MUST come before reframe
- Never use: just, simply, you should, you need to, don't worry
- shame language (I'm dumb, I'm stupid, I hate myself) → reframe directly and gently
- if bullying mentioned → set help_me_tell to a short message the child can show a trusted adult, written from child's perspective
- identity_statement MUST start with "You are someone who"
Return ONLY valid JSON."""
        }]
    )
    text = response.content[0].text.strip()
    text = text.replace("```json", "").replace("```", "").strip()
    result = json.loads(text)
    if not isinstance(result.get("flags"), list):
        result["flags"] = []
    return result


async def generate_social_rehearsal(scenario: str, profile: dict | None = None) -> dict:
    """Social skills rehearsal for a specific scenario."""
    user_ctx = build_user_context(profile)

    response = client.messages.create(
        model="claude-haiku-4-5",
        max_tokens=600,
        system=(
            f"{user_ctx}\n\n"
            "You are a social skills coach for a child with ADHD. "
            "Help them rehearse real situations with practical, safe responses. "
            "Language simple enough for ages 8-12."
        ),
        messages=[{
            "role": "user",
            "content": f"""Scenario: "{scenario}"

Return ONLY valid JSON:
{{
  "what_happened": "1 empathetic sentence describing the scenario",
  "what_to_say": ["2-3 short word-for-word responses the child could actually use"],
  "when_to_walk_away": "1 sentence — when walking away is right",
  "when_to_get_adult": "1 sentence — when to involve a trusted adult",
  "practice_line": "the single best thing to say — short enough to memorize",
  "affirmation": "1 sentence validating the child's worth after this scenario"
}}"""
        }]
    )
    text = response.content[0].text.strip()
    text = text.replace("```json", "").replace("```", "").strip()
    return json.loads(text)


async def generate_parent_insights(check_ins: list, tasks: list, brave_count: int,
                                    profile: dict | None = None) -> dict:
    """Analyze child's data and generate parent-facing pattern summaries."""
    name = (profile or {}).get("name") or "your child"
    struggles = (profile or {}).get("struggles", [])

    check_in_summary = [{
        "feeling": c.get("feeling"),
        "message": (c.get("message") or "")[:100],
        "flags": c.get("flags", []),
    } for c in check_ins[:10]]

    pending_count = sum(1 for t in tasks if t.get("status") == "pending")
    completed_count = sum(1 for t in tasks if t.get("status") == "completed")
    high_postpone = [t.get("task_name") for t in tasks if t.get("postpone_count", 0) >= 2][:3]

    response = client.messages.create(
        model="claude-haiku-4-5",
        max_tokens=900,
        system=(
            f"Parent insight assistant. Child: {name}. Struggles: {', '.join(struggles) or 'general ADHD'}. "
            "Be cautious, non-alarmist, solution-focused. Speak like a thoughtful school counselor."
        ),
        messages=[{
            "role": "user",
            "content": f"""Recent check-ins: {json.dumps(check_in_summary)}
Tasks: pending={pending_count}, completed={completed_count}, repeatedly avoided={high_postpone}
Brave starts this week: {brave_count}

Return ONLY valid JSON:
{{
  "summary": "2-3 sentence warm summary of how {name} has been doing",
  "alerts": ["0-3 things worth checking in on — cautious, not alarming, phrased as possibilities"],
  "conversation_prompts": ["3 specific things a parent could ask or say today"],
  "wins_digest": ["3-5 specific wins in identity-safe language — what {name} DID"],
  "strength_observations": ["1-2 patterns of strength visible in the data"],
  "teacher_note": "1 paragraph a parent could share with a teacher — accommodation suggestions based on {name}'s specific struggles"
}}"""
        }]
    )
    text = response.content[0].text.strip()
    text = text.replace("```json", "").replace("```", "").strip()
    return json.loads(text)


async def detect_strengths_from_history(tasks: list, check_ins: list,
                                         profile: dict | None = None) -> list:
    """Spot identity-safe strengths from behavior patterns."""
    name = (profile or {}).get("name") or "this child"
    brave_starts = len(tasks)
    came_back = sum(1 for t in tasks if t.get("postpone_count", 0) >= 1 and t.get("status") == "completed")
    messages_sample = [c.get("message", "")[:60] for c in check_ins[:5] if c.get("message")]

    response = client.messages.create(
        model="claude-haiku-4-5",
        max_tokens=400,
        system=f"Spot hidden strengths in ADHD children's behavior. Child: {name}. Be specific and warm.",
        messages=[{
            "role": "user",
            "content": f"""Tasks attempted: {brave_starts}, Finished after avoiding: {came_back}
Check-in samples: {json.dumps(messages_sample)}

Spot 2-3 genuine strengths. Return ONLY valid JSON array:
[
  {{
    "strength": "short strength label",
    "evidence": "1 sentence of specific behavioral evidence",
    "affirmation": "what to say to the child starting with 'You'"
  }}
]"""
        }]
    )
    text = response.content[0].text.strip()
    text = text.replace("```json", "").replace("```", "").strip()
    return json.loads(text)
