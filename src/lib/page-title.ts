import type { School } from '@/data/types';

/**
 * The browser tab title for an address. Done in the browser, not with Next's metadata, because the pages are client
 * components and a school the admin adds later has no page of its own in the static build.
 * Returns null where the page sets its own title (login, daftar).
 */
export function pageTitle(pathname: string, schools: School[]): string | null {
  const [area, sub, id] = pathname.split('/').filter(Boolean).map(decodeURIComponent);
  const school = (key?: string) => schools.find(s => s.id === key);
  const t = (name: string) => name + ' — KSU';
  switch (area) {
    case 'katalog': return t(sub ? school(sub)?.name ?? 'Sekolah' : 'Katalog');
    case 'checklist': return t(sub ? 'Checklist ' + (school(sub)?.short ?? '') : 'Checklist').trim().replace(/\s+—/, ' —');
    case 'timeline': return t('Timeline');
    case 'forum': return t('Forum');
    case 'profil': return t('Profil');
    case 'admin':
      if (sub !== 'sekolah') return t('Admin');
      if (!id) return t('Database SMA');
      return t(id === 'baru' ? 'Sekolah baru' : school(id)?.name ?? 'Edit sekolah');
    default: return null;
  }
}
