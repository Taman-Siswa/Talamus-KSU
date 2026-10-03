import { create } from 'zustand';
import { persist, type PersistStorage } from 'zustand/middleware';
import type { SchoolId } from '@/data/types';

export const PERSIST_KEY = 'tsprep-v1';

/** The student's TAMAN Fit Check and "Ceritaku" for one school. */
export interface FitState {
  /** scores 1–5 for T, A, M, A, N; 0 = not answered */
  me?: number[];
  /** the written answer under each letter */
  qual?: string[];
  /** the seven blanks of the "Ceritaku" paragraph, s1…s7 */
  story?: Record<string, string>;
  savedAt?: number;
}

export interface ForumPost { id: string; sid: string; q: string; by: string; at: number }
export interface ForumReply { n: string; t: string; at: number; role?: 'tutor' | 'admin' | 'murid' }
/** Forum content the student wrote or voted on, kept in this browser until there is a server. */
export interface ForumState {
  posts: ForumPost[];
  replies: Record<string, ForumReply[]>;
  /** thread ids and "ans:<thread>:<n>" keys the student upvoted */
  votes: Record<string, boolean>;
}

export interface Persisted {
  dark: boolean;
  page: string;
  fSchool: SchoolId;
  sbMin: boolean;
  sel: Partial<Record<SchoolId, boolean>>;
  checks: Record<string, boolean>;
  forms: Record<string, string>;
  /** "Cek syarat": report-card average per subject, keyed `<school>.<subject>` */
  quick: Record<string, string>;
  /** "Cek syarat": answers to the school's other requirements, per school */
  elig: Record<string, Record<string, 'ya' | 'tidak'>>;
  /** schools whose Cek syarat the student has submitted */
  eligDone: Record<string, boolean>;
  /** date of birth for age-limited schools (yyyy-mm-dd) */
  dob: string;
  fit: Record<string, FitState>;
  /** schools hidden from the combined Timeline (a view filter only) */
  tlHide: Record<string, boolean>;
  forum: ForumState;
  /** liked reviews, keyed `<school>.<index>` */
  rvLike: Record<string, boolean>;
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
  setQuick: (key: string, value: string) => void;
  setElig: (id: SchoolId, item: string, answer: 'ya' | 'tidak') => void;
  submitElig: (id: SchoolId) => void;
  resetElig: (id: SchoolId, subjects: string[]) => void;
  setDob: (value: string) => void;
  setFit: (id: SchoolId, patch: Partial<FitState>) => void;
  toggleTlHide: (id: SchoolId) => void;
  addPost: (post: ForumPost) => void;
  addReply: (threadId: string, reply: ForumReply) => void;
  toggleVote: (key: string) => void;
  toggleRvLike: (key: string) => void;
}

const defaults: Persisted = {
  dark: false,
  page: 'katalog',
  fSchool: '',
  sbMin: false,
  sel: {},
  checks: {},
  forms: {},
  quick: {},
  elig: {},
  eligDone: {},
  dob: '',
  fit: {},
  tlHide: {},
  forum: { posts: [], replies: {}, votes: {} },
  rvLike: {},
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
      // Retire the removed demo school's saved selection and progress on account load.
      if (state.fSchool === 'wardaya') state.fSchool = '';
      for (const key of ['sel', 'checks', 'forms', 'quick', 'elig', 'eligDone', 'fit', 'tlHide']) {
        const values = state[key];
        state[key] = values && typeof values === 'object'
          ? Object.fromEntries(Object.entries(values).filter(([id]) => id !== 'wardaya' && !id.startsWith('wardaya.')))
          : {};
      }
      // Saved before the Forum existed, or by an older build: make sure every part is there.
      const forum = (state.forum ?? {}) as Partial<ForumState>;
      state.forum = { posts: forum.posts ?? [], replies: forum.replies ?? {}, votes: forum.votes ?? {} };
      if (raw.v !== 2) state.dark = defaults.dark;
      if (!state.page || state.page === 'overview' || state.page === 'dash') state.page = 'katalog';
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
      setQuick: (key, value) => set({ quick: { ...get().quick, [key]: value } }),
      setElig: (id, item, answer) => set({ elig: { ...get().elig, [id]: { ...get().elig[id], [item]: answer } } }),
      submitElig: id => set({ eligDone: { ...get().eligDone, [id]: true } }),
      resetElig: (id, subjects) => {
        const quick = { ...get().quick };
        subjects.forEach(sb => delete quick[id + '.' + sb]);
        set({ quick, elig: { ...get().elig, [id]: {} }, eligDone: { ...get().eligDone, [id]: false } });
      },
      setDob: dob => set({ dob }),
      setFit: (id, patch) => set({ fit: { ...get().fit, [id]: { ...get().fit[id], ...patch } } }),
      toggleTlHide: id => set({ tlHide: { ...get().tlHide, [id]: !get().tlHide[id] } }),
      addPost: post => set({ forum: { ...get().forum, posts: [post, ...get().forum.posts] } }),
      addReply: (threadId, reply) => {
        const f = get().forum;
        set({ forum: { ...f, replies: { ...f.replies, [threadId]: [...(f.replies[threadId] || []), reply] } } });
      },
      toggleVote: key => {
        const f = get().forum;
        set({ forum: { ...f, votes: { ...f.votes, [key]: !f.votes[key] } } });
      },
      toggleRvLike: key => set({ rvLike: { ...get().rvLike, [key]: !get().rvLike[key] } }),
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
