"use client";
import React, { createContext, useContext, useState, useCallback, useEffect } from "react";
import type { Task, Profile } from "./api";
import { fetchTasks, fetchProfile } from "./api";

interface AppState {
  mode: "kid" | "parent";
  setMode: (m: "kid" | "parent") => void;
  onboarded: boolean;
  setOnboarded: (v: boolean) => void;
  profile: Profile;
  setProfile: (p: Partial<Profile>) => void;
  tasks: Task[];
  setTasks: (t: Task[]) => void;
  tasksLoading: boolean;
  refreshTasks: () => Promise<void>;
  addTask: (t: Task) => void;
  completeTask: (id: number) => void;
  removeTask: (id: number) => void;
  activeTask: Task | null;
  setActiveTask: (t: Task | null) => void;
  parentPin: string;
  setParentPin: (p: string) => void;
  parentUnlocked: boolean;
  setParentUnlocked: (v: boolean) => void;
}

const defaultProfile: Profile = {
  name: "Explorer",
  mode: "kid",
  struggles: [],
  kid_struggles: [],
};

const Ctx = createContext<AppState | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [mode, setMode] = useState<"kid" | "parent">("kid");
  const [onboarded, setOnboarded] = useState(false);
  const [profile, setProfileState] = useState<Profile>(defaultProfile);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [tasksLoading, setTasksLoading] = useState(true);
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [parentPin, setParentPin] = useState("1234");
  const [parentUnlocked, setParentUnlocked] = useState(false);

  const setProfile = useCallback((p: Partial<Profile>) => {
    setProfileState((prev) => ({ ...prev, ...p }));
  }, []);

  const refreshTasks = useCallback(async () => {
    setTasksLoading(true);
    try {
      const t = await fetchTasks();
      setTasks(t);
    } catch {}
    setTasksLoading(false);
  }, []);

  useEffect(() => {
    refreshTasks();
    fetchProfile().then((p) => {
      if (p) { setProfile(p); setOnboarded(true); }
    });
  }, []);

  const addTask = useCallback((t: Task) => setTasks((p) => [t, ...p]), []);
  const completeTask = useCallback((id: number) => {
    setTasks((p) => p.map((t) => t.id === id ? { ...t, status: "completed" } : t));
  }, []);
  const removeTask = useCallback((id: number) => {
    setTasks((p) => p.filter((t) => t.id !== id));
  }, []);

  return (
    <Ctx.Provider value={{
      mode, setMode, onboarded, setOnboarded,
      profile, setProfile,
      tasks, setTasks, tasksLoading, refreshTasks, addTask, completeTask, removeTask,
      activeTask, setActiveTask,
      parentPin, setParentPin, parentUnlocked, setParentUnlocked,
    }}>
      {children}
    </Ctx.Provider>
  );
}

export function useApp() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useApp must be inside AppProvider");
  return c;
}
