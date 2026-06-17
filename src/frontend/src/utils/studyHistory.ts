import type { backendInterface } from "@/backend";

export interface StudyHistoryEntry {
  id: string;
  versionId: string;
  versionName: string;
  examName: string;
  date: string; // ISO 8601
  score: number; // 0-100
  passed: boolean;
  timeTaken: number; // seconds
  domainBreakdown: Record<string, { correct: number; total: number }>;
}

const STORAGE_KEY = "certprep_history";

function sortByDateDesc(entries: StudyHistoryEntry[]): StudyHistoryEntry[] {
  return [...entries].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
  );
}

export function entryToSyncedAttempt(entry: StudyHistoryEntry) {
  return {
    id: entry.id,
    payload: JSON.stringify(entry),
  };
}

export function syncedAttemptToEntry(attempt: {
  id: string;
  payload: string;
}): StudyHistoryEntry | null {
  try {
    const parsed = JSON.parse(attempt.payload) as StudyHistoryEntry;
    if (parsed.id && parsed.versionId && parsed.date) {
      return parsed;
    }
    return null;
  } catch {
    return null;
  }
}

export async function fetchCloudHistory(
  actor: backendInterface,
): Promise<StudyHistoryEntry[]> {
  try {
    const results = await actor.getMyResults();
    return sortByDateDesc(
      results
        .map(syncedAttemptToEntry)
        .filter((entry): entry is StudyHistoryEntry => entry !== null),
    );
  } catch (error) {
    console.error("Failed to fetch cloud study history", error);
    return [];
  }
}

export function mergeHistories(
  local: StudyHistoryEntry[],
  cloud: StudyHistoryEntry[],
): StudyHistoryEntry[] {
  const byId = new Map<string, StudyHistoryEntry>();
  for (const entry of [...local, ...cloud]) {
    const existing = byId.get(entry.id);
    if (
      !existing ||
      new Date(entry.date).getTime() > new Date(existing.date).getTime()
    ) {
      byId.set(entry.id, entry);
    }
  }
  return sortByDateDesc(Array.from(byId.values()));
}

export async function syncAttemptToCloud(
  actor: backendInterface,
  entry: StudyHistoryEntry,
): Promise<void> {
  try {
    await actor.saveMyResult(entryToSyncedAttempt(entry));
  } catch (error) {
    console.error("Failed to sync attempt to cloud", error);
  }
}

export async function syncAllLocalToCloud(
  actor: backendInterface,
  entries: StudyHistoryEntry[],
): Promise<void> {
  if (entries.length === 0) return;
  try {
    await actor.saveMyResultsBatch(entries.map(entryToSyncedAttempt));
  } catch (error) {
    console.error("Failed to batch sync attempts to cloud", error);
  }
}

export function saveAttempt(entry: StudyHistoryEntry): void {
  const existing = getHistory();
  // Prevent duplicates on re-render: check by id
  if (existing.some((e) => e.id === entry.id)) return;
  const updated = [entry, ...existing];
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch {
    // Storage quota exceeded or unavailable — silently ignore
  }
}

export function getHistory(): StudyHistoryEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as StudyHistoryEntry[];
    return sortByDateDesc(parsed);
  } catch {
    return [];
  }
}

export function setHistory(entries: StudyHistoryEntry[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
  } catch {
    // Storage quota exceeded or unavailable — silently ignore
  }
}

export function clearHistory(): void {
  localStorage.removeItem(STORAGE_KEY);
}
