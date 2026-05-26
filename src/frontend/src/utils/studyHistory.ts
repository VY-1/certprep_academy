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
    return parsed.sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
    );
  } catch {
    return [];
  }
}

export function clearHistory(): void {
  localStorage.removeItem(STORAGE_KEY);
}
