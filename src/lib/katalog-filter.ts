import { create } from 'zustand';

/** Filters of the Katalog. They live in the top bar, so the bar and the page share this store; nothing is saved. */
interface KatalogFilter {
  /** province, or 'all' */
  lok: string;
  /** 'all' | 'ya' | 'tidak' */
  asr: string;
  /** 'all' | 'gratis' | 'bayar' */
  biaya: string;
  q: string;
  qOpen: boolean;
  set: (patch: Partial<Omit<KatalogFilter, 'set'>>) => void;
}

export const useKatalogFilter = create<KatalogFilter>(set => ({
  lok: 'all', asr: 'all', biaya: 'all', q: '', qOpen: false,
  set: patch => set(patch),
}));
