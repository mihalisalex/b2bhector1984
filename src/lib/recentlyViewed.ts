const KEY = "hector_recently_viewed";
const MAX = 12;

export function getRecentlyViewed(): string[] {
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
}

export function pushRecentlyViewed(styleId: string): void {
  try {
    const next = [styleId, ...getRecentlyViewed().filter((id) => id !== styleId)].slice(0, MAX);
    window.localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    // localStorage unavailable — non-critical, just won't persist
  }
}
