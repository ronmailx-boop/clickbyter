const STORAGE_KEY = "clickbyter:history";
const MAX_ITEMS = 50;

export function getHistory() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function addHistoryItem({ url, sourceTitle, answer }) {
  try {
    const history = getHistory();
    history.unshift({
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      url,
      sourceTitle,
      answer,
      savedAt: new Date().toISOString(),
    });
    localStorage.setItem(STORAGE_KEY, JSON.stringify(history.slice(0, MAX_ITEMS)));
  } catch {
    // History is a convenience feature - silently skip persisting on quota/private-mode errors.
  }
}

export function clearHistory() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Nothing to clean up if storage isn't accessible.
  }
}
