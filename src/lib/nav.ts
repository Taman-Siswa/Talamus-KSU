// Tracks whether the student reached the current page from another KSU page.
// It lives in memory on purpose: a fresh tab or a refresh resets it, which is exactly when
// "go back" should not trust the browser history (it may hold a blank tab or another site).
let prev: string | null = null;
let cur: string | null = null;

/** Call on every route change. */
export function trackPath(path: string) {
  if (cur !== null && path !== cur) prev = cur;
  cur = path;
}

/** True when there is a KSU page to return to. */
export const hasInAppHistory = () => prev !== null;
