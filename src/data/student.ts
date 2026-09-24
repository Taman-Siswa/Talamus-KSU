import type { User } from '@/lib/auth';

export const initials = (name: string) =>
  name.split(' ').filter(Boolean).map(w => w[0]).slice(0, 2).join('').toUpperCase();

/** The line under the name in the sidebar, e.g. "Kelas 9 · target SMA 2027", from what the student filled in on Profil. */
export function accountMeta(user: User | null) {
  if (user?.role === 'admin') return 'Admin · TamanSchool';
  const p = user?.profile || {};
  const parts = [p.grade?.trim(), p.year?.trim() ? 'target SMA ' + p.year.trim() : ''].filter(Boolean);
  return parts.length ? parts.join(' · ') : 'Siswa KSU';
}
