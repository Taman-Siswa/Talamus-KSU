import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// MOCK AUTH — accounts live in this browser's localStorage only. There is no server, so this
// separates data per account on a shared device but is not real security. Swap the three
// actions below for real API calls (Supabase, Auth.js, ...) when a backend exists.

export const AUTH_KEY = 'tsprep-auth';

export type Role = 'siswa' | 'admin';

export interface User {
  email: string;
  name: string;
  role: Role;
  hash: string;
}

/** Where each role lands after signing in. */
export const homeFor = (role: Role) => (role === 'admin' ? '/admin/sekolah' : '/checklist');

// DEMO ONLY — admins cannot self-register, so one is seeded to make the admin side reachable.
// Remove this (and seed admins by invitation) before anything real.
export const DEMO_ADMIN = { email: 'admin@tamanschool.id', password: 'admin123', name: 'Admin TamanSchool' };

interface AuthState {
  users: User[];
  /** email of the signed-in user */
  session: string | null;
  hydrated: boolean;
  /** each resolves to an error message, or null on success */
  register: (name: string, email: string, password: string) => Promise<string | null>;
  login: (email: string, password: string) => Promise<string | null>;
  logout: () => void;
}

const norm = (email: string) => email.trim().toLowerCase();

async function hash(email: string, password: string) {
  const text = norm(email) + ':' + password;
  if (globalThis.crypto?.subtle) {
    const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
    return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
  }
  // non-secure contexts (plain http on a LAN IP) have no SubtleCrypto
  let h = 5381;
  for (let i = 0; i < text.length; i++) h = ((h << 5) + h + text.charCodeAt(i)) | 0;
  return 'djb2:' + (h >>> 0).toString(16);
}

export const useAuth = create<AuthState>()(
  persist(
    (set, get) => ({
      users: [],
      session: null,
      hydrated: false,
      // Self-registration always creates a student.
      register: async (name, email, password) => {
        const e = norm(email), n = name.trim();
        if (!n) return 'Nama wajib diisi.';
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)) return 'Format email tidak valid.';
        if (password.length < 6) return 'Password minimal 6 karakter.';
        if (get().users.some(u => u.email === e)) return 'Email ini sudah terdaftar. Silakan masuk.';
        const user: User = { email: e, name: n, role: 'siswa', hash: await hash(e, password) };
        set({ users: [...get().users, user], session: e });
        return null;
      },
      login: async (email, password) => {
        const e = norm(email);
        const user = get().users.find(u => u.email === e);
        if (!user || user.hash !== (await hash(e, password))) return 'Email atau password salah.';
        set({ session: e });
        return null;
      },
      logout: () => set({ session: null }),
    }),
    {
      name: AUTH_KEY,
      skipHydration: true,
      partialize: s => ({ users: s.users, session: s.session }),
      onRehydrateStorage: () => () => useAuth.setState({ hydrated: true }),
    },
  ),
);

// One shared promise: hashing is async, so two callers (React runs effects twice in dev)
// would otherwise both pass the "does it exist" check and add the account twice.
let seeding: Promise<void> | null = null;

/** Creates the demo admin once, so the admin side can be opened on a fresh browser. */
export function ensureAdminSeed() {
  seeding ??= (async () => {
    if (useAuth.getState().users.some(u => u.email === DEMO_ADMIN.email)) return;
    const admin: User = {
      email: DEMO_ADMIN.email,
      name: DEMO_ADMIN.name,
      role: 'admin',
      hash: await hash(DEMO_ADMIN.email, DEMO_ADMIN.password),
    };
    const users = useAuth.getState().users;
    if (users.some(u => u.email === admin.email)) return;
    useAuth.setState({ users: [...users, admin] });
  })();
  return seeding;
}

export const useCurrentUser = () => useAuth(s => s.users.find(u => u.email === s.session) || null);

// Accounts created before roles existed are students.
export const roleOf = (user: User | null): Role => user?.role ?? 'siswa';
