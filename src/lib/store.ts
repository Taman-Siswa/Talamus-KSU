import { create } from 'zustand';
import { persist, type PersistStorage } from 'zustand/middleware';
import { getSchools } from '@/lib/schools';
import type { SchoolId } from '@/data/types';

export const PERSIST_KEY = 'tsprep-v1';

export interface Persisted {
  dark: boolean;
  page: string;
  fSchool: SchoolId;
  sbMin: boolean;
  sel: Partial<Record<SchoolId, boolean>>;
  checks: Record<string, boolean>;
  forms: Record<string, string>;
  grades: Partial<Record<SchoolId, string[][]>>;
  iq: Partial<Record<SchoolId, string>>;
  body: Partial<Record<SchoolId, { tb?: string; bb?: string }>>;
  prestasi: Partial<Record<SchoolId, boolean>>;
}

interface Actions {
  hydrated: boolean;
  setDark: (dark: boolean) => void;
  setPage: (page: string) => void;
  setFSchool: (id: SchoolId) => void;
  toggleSbMin: () => void;
  toggleSel: (id: SchoolId) => void;
  toggleCheck: (key: string) => void;
  setForm: (key: string, value: string) => void;
  setGrade: (id: SchoolId, si: number, ci: number, value: string) => void;
  setIq: (id: SchoolId, value: string) => void;
  setBody: (id: SchoolId, k: 'tb' | 'bb', value: string) => void;
  togglePrestasi: (id: SchoolId) => void;
}

const emptyGrades = (id: SchoolId) => {
  const c = getSchools().find(s => s.id === id)?.calc;
  return c ? c.subjects.map(() => c.sems.map(() => '')) : [];
};

const defaults: Persisted = {
  dark: false,
  page: 'checklist',
  fSchool: 'mht',
  sbMin: false,
  sel: { mht: true, pradita: true, ktb: true, tn: true, wardaya: true },
  checks: {},
  forms: {},
  grades: {},
  iq: {},
  body: {},
  prestasi: {},
};

const PERSISTED_KEYS = Object.keys(defaults) as (keyof Persisted)[];

// Saved data is scoped per signed-in account: `tsprep-v1:<email>`. No account → nothing is read or written.
let activeKey: string | null = null;
export const userKey = (email: string) => PERSIST_KEY + ':' + email;

// Keeps the prototype's flat saved shape: { v: 2, dark, page, fSchool, ... }
const flatStorage: PersistStorage<Persisted> = {
  getItem: () => {
    // Always returns a full state so switching accounts never leaks the previous user's data.
    const fresh = { state: { ...defaults }, version: 2 };
    if (!activeKey) return fresh;
    try {
      const raw = JSON.parse(localStorage.getItem(activeKey) || 'null');
      if (!raw) return fresh;
      const state = { ...defaults } as Record<string, unknown>;
      PERSISTED_KEYS.forEach(k => {
        if (raw[k] !== undefined && raw[k] !== null) state[k] = raw[k];
      });
      if (raw.v !== 2) state.dark = defaults.dark;
      if (!state.page || state.page === 'overview' || state.page === 'dash') state.page = 'checklist';
      return { state: state as unknown as Persisted, version: 2 };
    } catch {
      return fresh;
    }
  },
  setItem: (_name, value) => {
    if (!activeKey) return;
    try {
      localStorage.setItem(activeKey, JSON.stringify({ v: 2, ...value.state }));
    } catch {}
  },
  removeItem: () => {
    if (activeKey) localStorage.removeItem(activeKey);
  },
};

export const useStore = create<Persisted & Actions>()(
  persist(
    (set, get) => ({
      ...defaults,
      hydrated: false,
      setDark: dark => set({ dark }),
      setPage: page => set({ page }),
      setFSchool: fSchool => set({ fSchool }),
      toggleSbMin: () => set({ sbMin: !get().sbMin }),
      toggleSel: id => set({ sel: { ...get().sel, [id]: !get().sel[id] } }),
      toggleCheck: key => set({ checks: { ...get().checks, [key]: !get().checks[key] } }),
      setForm: (key, value) => set({ forms: { ...get().forms, [key]: value } }),
      setGrade: (id, si, ci, value) => {
        const arr = (get().grades[id] || emptyGrades(id)).map(r => r.slice());
        arr[si][ci] = value;
        set({ grades: { ...get().grades, [id]: arr } });
      },
      setIq: (id, value) => set({ iq: { ...get().iq, [id]: value } }),
      setBody: (id, k, value) => set({ body: { ...get().body, [id]: { ...get().body[id], [k]: value } } }),
      togglePrestasi: id => set({ prestasi: { ...get().prestasi, [id]: !get().prestasi[id] } }),
    }),
    {
      name: PERSIST_KEY,
      version: 2,
      storage: flatStorage,
      skipHydration: true,
      partialize: s => Object.fromEntries(PERSISTED_KEYS.map(k => [k, s[k]])) as unknown as Persisted,
      onRehydrateStorage: () => () => useStore.setState({ hydrated: true }),
    },
  ),
);

/** Points the store at one account's saved data (or at nothing, on sign-out) and reloads it. */
export async function activateUser(email: string | null) {
  activeKey = null; // blocks writes while state is being swapped
  useStore.setState({ ...defaults, hydrated: false });
  if (!email) return;
  const key = userKey(email);
  try {
    // Data saved before accounts existed is adopted by the first account that signs in.
    // The theme is not adopted: a new account always starts in light mode.
    const legacy = localStorage.getItem(PERSIST_KEY);
    if (legacy && !localStorage.getItem(key)) {
      const data = JSON.parse(legacy);
      delete data.dark;
      localStorage.setItem(key, JSON.stringify(data));
      localStorage.removeItem(PERSIST_KEY);
    }
  } catch {}
  activeKey = key;
  await useStore.persist.rehydrate();
}
