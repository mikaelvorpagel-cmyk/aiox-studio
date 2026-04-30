export interface ActivityEntry {
  id: string;
  ts: string;
  type: "agent_activated" | "brief_saved" | "scout_search" | "section_updated" | "checklist_item";
  message: string;
  meta?: Record<string, string>;
}

const MAX_ENTRIES = 100;
const STORAGE_PREFIX = "aiox-activity-";
const GLOBAL_KEY = "aiox-activity-global";

function getKey(projectKey?: string): string {
  return projectKey ? `${STORAGE_PREFIX}${projectKey}` : GLOBAL_KEY;
}

export function addActivity(
  entry: Omit<ActivityEntry, "id" | "ts">,
  projectKey?: string
): void {
  if (typeof window === "undefined") return;
  try {
    const key = getKey(projectKey);
    const existing = getActivity(projectKey);
    const newEntry: ActivityEntry = {
      ...entry,
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      ts: new Date().toISOString(),
    };
    const updated = [newEntry, ...existing].slice(0, MAX_ENTRIES);
    localStorage.setItem(key, JSON.stringify(updated));

    // Also write to global feed
    if (projectKey) {
      const global = getActivity();
      const updatedGlobal = [newEntry, ...global].slice(0, MAX_ENTRIES);
      localStorage.setItem(GLOBAL_KEY, JSON.stringify(updatedGlobal));
    }
  } catch {
    /* quota ignore */
  }

  // Fire-and-forget backend persistence
  fetch("/api/activity", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ entry, projectKey }),
  }).catch(() => { /* non-critical, localStorage is primary */ });
}

export function getActivity(projectKey?: string): ActivityEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const key = getKey(projectKey);
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as ActivityEntry[]) : [];
  } catch {
    return [];
  }
}

export function clearActivity(projectKey?: string): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(getKey(projectKey));
    if (!projectKey) {
      localStorage.removeItem(GLOBAL_KEY);
    }
  } catch {
    /* ignore */
  }
}

export function formatRelativeTime(isoTs: string): string {
  const diff = Date.now() - new Date(isoTs).getTime();
  const secs = Math.floor(diff / 1000);
  if (secs < 60) return "agora mesmo";
  const mins = Math.floor(secs / 60);
  if (mins < 60) return `há ${mins} minuto${mins !== 1 ? "s" : ""}`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `há ${hours} hora${hours !== 1 ? "s" : ""}`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `há ${days} dia${days !== 1 ? "s" : ""}`;
  const months = Math.floor(days / 30);
  return `há ${months} mês${months !== 1 ? "es" : ""}`;
}
