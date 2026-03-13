/**
 * Fetch JSON from API without throwing — avoids Vercel lambda crash on timeout/bad JSON/down tunnel.
 */
export async function safeFetchJson<T>(url: string): Promise<T | null> {
  try {
    new URL(url);
  } catch {
    return null;
  }

  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), 10_000);

  try {
    const response = await fetch(url, {
      cache: "no-store",
      signal: ctrl.signal
    });
    clearTimeout(t);

    if (!response.ok) {
      return null;
    }

    const text = await response.text();
    try {
      return JSON.parse(text) as T;
    } catch {
      return null;
    }
  } catch {
    clearTimeout(t);
    return null;
  }
}
