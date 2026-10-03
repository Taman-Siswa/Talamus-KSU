'use client';

import { useSyncExternalStore } from 'react';

/** Tracks a CSS media query; false on the server. */
export function useMedia(query: string) {
  return useSyncExternalStore(
    cb => {
      const m = window.matchMedia(query);
      m.addEventListener('change', cb);
      return () => m.removeEventListener('change', cb);
    },
    () => window.matchMedia(query).matches,
    () => false,
  );
}

/** The same breakpoint the sidebar turns into a drawer at. */
export const useIsMobile = () => useMedia('(max-width: 860px)');
