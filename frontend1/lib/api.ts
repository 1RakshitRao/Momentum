const BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

async function req<T>(url: string, init?: RequestInit): Promise<T | null> {
  try {
    const res = await fetch(url, init);
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

// ── Profile ────────────────────────────────────────────────
export interface Profile {
  name: string;
  age?: number;
  mode: string;
  struggles: string[];
  kid_struggles: string[];
  phone?: string;
}

export async function fetchProfile(): Promise<Profile | null> {
  const d = await req<{ profile: Profile | null }>(`${BASE}/profile`);
  return d?.profile ?? null;
}

export async function saveProfile(p: Partial<Profile> & { name: string }): Promise<boolean> {
  const d = await req<{ success: boolean }>(`${BASE}/profile/save`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(p),
  });
  return d?.success ?? false;
}

// ── Tasks ─────────────────────────────────────────────────
export interface Task {
  id: number;
  raw_text: string;
  task_name: string;
  quest_title?: string;
  urgency: "high" | "medium" | "low";
  category: string;
  first_step: string;
  estimated_minutes: number;
  postpone_count: number;
  status: "pending" | "in_progress" | "completed";
  created_at: string;
}

export async function fetchTasks(): Promise<Task[]> {
  const d = await req<{ tasks: Task[] }>(`${BASE}/tasks`);
  return d?.tasks ?? [];
}

export async function captureTask(raw_text: string): Promise<Task | null> {
  const d = await req<{ task: Task }>(`${BASE}/task/capture`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ raw_text }),
  });
  return d?.task ?? null;
}

export async function whatNow(): Promise<{
  task_id: number; task_name: string; reason: string; first_step: string; audio_b64?: string;
} | null> {
  return req(`${BASE}/task/what-now`, { method: "POST", headers: { "Content-Type": "application/json" }, body: "{}" });
}

export interface MicroStep { id: string; step: number; action: string; seconds: number; celebration: string; }
export async function getMicroSteps(task_id: number): Promise<{ steps: MicroStep[] } | null> {
  return req(`${BASE}/task/micro-steps`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ task_id }),
  });
}

export async function braveStart(task_id: number) {
  return req(`${BASE}/task/brave-start`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ task_id }),
  });
}

export async function completeTask(task_id: number) {
  return req(`${BASE}/task/complete`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ task_id }),
  });
}

export async function postponeTask(task_id: number) {
  return req(`${BASE}/task/postpone`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ task_id }),
  });
}

export async function deleteTask(task_id: number) {
  return req(`${BASE}/task/delete`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ task_id }),
  });
}

// ── Calendar ──────────────────────────────────────────────
export interface CalendarEvent {
  id: number;
  event_name: string;
  event_datetime: string;
  location: string;
  prep_tasks: { id: number; action: string; due_time: string; status: string }[];
}

export async function fetchCalendar(): Promise<CalendarEvent[]> {
  const d = await req<{ events: CalendarEvent[] }>(`${BASE}/calendar`);
  return d?.events ?? [];
}

export async function addCalendarEvent(raw: string): Promise<CalendarEvent | null> {
  const d = await req<{ event: CalendarEvent }>(`${BASE}/calendar/add`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ raw_text: raw }),
  });
  return d?.event ?? null;
}

// ── Momentum / Stats ──────────────────────────────────────
export interface MomentumStats {
  brave_starts_this_week: number;
  quests_completed: number;
  streak_days: number;
  comeback_count: number;
  weekly_data: { label: string; starts: number; completed: number }[];
}

export async function fetchMomentum(): Promise<MomentumStats | null> {
  const d = await req<MomentumStats>(`${BASE}/momentum`);
  return d ?? null;
}

// ── Check-in ──────────────────────────────────────────────
export interface CheckInResult {
  validation: string;
  reframe: string;
  next_step: string;
  identity_statement: string;
  strength_spot: string;
  flags: string[];
  help_me_tell: string;
}

export async function submitCheckIn(feeling: string, message: string): Promise<CheckInResult | null> {
  return req(`${BASE}/checkin`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ feeling, message }),
  });
}

export async function getSocialRehearsal(scenario: string): Promise<{
  what_to_say: string; when_to_walk_away: string; when_to_get_adult: string;
  practice_line: string; affirmation: string;
} | null> {
  return req(`${BASE}/checkin/social-rehearsal`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ scenario }),
  });
}

// ── Wins ──────────────────────────────────────────────────
export interface Win {
  id: number;
  type: string;
  description: string;
  identity_statement: string;
  badge_emoji: string;
  created_at: string;
}

export async function fetchWins(): Promise<Win[]> {
  const d = await req<{ wins: Win[] }>(`${BASE}/wins`);
  return d?.wins ?? [];
}

export async function getStrengths(): Promise<{ strengths: { name: string; evidence: string; affirmation: string }[] } | null> {
  return req(`${BASE}/wins/strengths`);
}

// ── Parent Insights ───────────────────────────────────────
export interface ParentInsights {
  summary: string;
  alerts: string[];
  conversation_prompts: string[];
  wins_digest: string;
  strength_observations: string[];
  teacher_note: string;
}

export async function getParentInsights(): Promise<ParentInsights | null> {
  return req(`${BASE}/parent/insights`);
}

// ── Voice ─────────────────────────────────────────────────
export async function transcribeAudio(blob: Blob): Promise<string | null> {
  const form = new FormData();
  form.append("audio", blob, "audio.webm");
  const d = await req<{ text: string }>(`${BASE}/voice/transcribe`, { method: "POST", body: form });
  return d?.text ?? null;
}

export function playAudio(b64: string) {
  const audio = new Audio(`data:audio/mp3;base64,${b64}`);
  audio.play().catch(() => {});
}

export async function seedDemo(): Promise<boolean> {
  const d = await req<{ success: boolean }>(`${BASE}/demo/seed`, { method: "POST" });
  return d?.success ?? false;
}

export async function speakText(text: string): Promise<void> {
  try {
    const res = await fetch(`${BASE}/tts`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
    });
    const d = await res.json();
    if (d?.audio_b64) playAudio(d.audio_b64);
  } catch {}
}
