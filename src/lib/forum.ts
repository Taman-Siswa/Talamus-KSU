import type { School } from '@/data/types';
import { isBundledSchool } from './schools';
import type { ForumState } from './store';

/* The Forum is built from three sources: each school's FAQ (shown as answered questions), questions the student
   wrote, and the replies and upvotes kept in this browser.

   The two sample schools (data/schools.ts) get the sample discussion of the student design — parents and tutees
   asking, TamanSchool tutors answering, starting vote counts. Schools the admin adds get none of that: their FAQ
   shows as asked in general and answered by the TamanSchool team, with no invented people or votes. */

export type AnswerRole = 'tutor' | 'admin' | 'self';

export interface Answer {
  key: string; name: string; text: string; role: AnswerRole; when: string; bio?: string; votes: number; voted: boolean; top: boolean;
}
export interface Thread {
  id: string; sid: string; q: string; by: string; when: string; order: number;
  votes: number; voted: boolean; answers: Answer[];
}
export type ForumSort = 'new' | 'top' | 'hot';

export const ROLE_LABEL: Record<AnswerRole, string> = { tutor: 'Tutor', admin: 'Admin TamanSchool', self: 'Kamu' };

// Sample people of the design's demo discussion.
const ASKERS = ['Orang tua murid', 'Tutee kelas 9', 'Orang tua murid', 'Tutee kelas 9', 'Orang tua murid', 'Tutee kelas 8'];
const TUTORS = ['Kak Nadia', 'Kak Raka', 'Kak Salsa', 'Kak Dimas'];
const TUTOR_BIO: Record<string, string> = {
  'Kak Nadia': 'Tutor TamanSchool · Alumni SMA Taruna Nusantara, kini Kedokteran UI',
  'Kak Raka': 'Tutor TamanSchool · Alumni SMA Pradita Dirgantara, kini Teknik Dirgantara ITB',
  'Kak Salsa': 'Tutor TamanSchool · Alumni SMAN MH Thamrin, kini Psikologi UGM',
  'Kak Dimas': 'Tutor TamanSchool · Alumni SMA Kesatuan Bangsa, kini Ilmu Komputer UI',
};
const ADMIN_NOTE = 'Halo! Menambahkan dari tim TamanSchool: info resmi terbaru selalu kami perbarui di halaman sekolah ini. Kalau masih ragu dengan kondisi anak, boleh konsultasi gratis lewat WhatsApp admin ya.';

interface Raw {
  id: string; sid: string; q: string; by: string; base: number; t: number; demo: boolean;
  seeded: { n: string; t: string; role: 'tutor' | 'admin' }[];
}

export function ago(at: number | undefined, now = Date.now()): string {
  if (!at) return '';
  const m = Math.max(0, Math.floor((now - at) / 60000));
  if (m < 1) return 'baru saja';
  if (m < 60) return m + ' menit lalu';
  if (m < 1440) return Math.floor(m / 60) + ' jam lalu';
  return Math.floor(m / 1440) + ' hari lalu';
}

/**
 * Threads for one Forum view, filtered and sorted. Like the design, the sample threads' "n hari lalu" labels and
 * answer votes follow the thread's place in the list.
 * Newest: own posts first, then the FAQs in order. Top: most upvotes. Trending: most answers, then upvotes.
 */
export function forumThreads(schools: School[], forum: ForumState, filter: string, sort: ForumSort): Thread[] {
  const seeds: Raw[] = schools.flatMap((s, si) => s.faq.map((f, qi): Raw => {
    const demo = isBundledSchool(s.id);
    return {
      id: `${s.id}-${qi}`, sid: s.id, q: f.q, demo,
      by: demo ? ASKERS[(si + qi) % ASKERS.length] : 'Pertanyaan umum',
      base: demo ? 24 - qi * 4 + si : 0,
      t: 1000 - qi * 10 - si,
      seeded: demo
        ? [{ n: TUTORS[(si + qi) % TUTORS.length], t: f.a, role: 'tutor' as const }, ...(qi % 2 === 1 ? [{ n: 'Tim TamanSchool', t: ADMIN_NOTE, role: 'admin' as const }] : [])]
        : [{ n: 'Tim TamanSchool', t: f.a, role: 'admin' }],
    };
  }));
  const ids = new Set(schools.map(s => s.id));
  const posts: Raw[] = forum.posts.filter(p => ids.has(p.sid))
    .map(p => ({ id: p.id, sid: p.sid, q: p.q, by: p.by, base: 0, t: p.at, demo: false, seeded: [] }));
  const nAns = (r: Raw) => r.seeded.length + (forum.replies[r.id]?.length ?? 0);
  const votes = (r: Raw) => r.base + (forum.votes[r.id] ? 1 : 0);

  const list = [...posts, ...seeds].filter(r => filter === 'all' || r.sid === filter);
  const pos = new Map(list.map((r, i) => [r.id, i]));
  list.sort((a, b) => sort === 'top' ? votes(b) - votes(a)
    : sort === 'hot' ? nAns(b) - nAns(a) || votes(b) - votes(a)
    : b.t - a.t || pos.get(a.id)! - pos.get(b.id)!);

  return list.map((r, idx): Thread => {
    const own = r.t > 1e12;
    const mine = (forum.replies[r.id] || []).map(x => ({ n: x.n, t: x.t, role: 'self' as const, at: x.at }));
    const answers = [...r.seeded.map(x => ({ ...x, at: undefined as number | undefined })), ...mine].map((a, i): Answer => {
      const key = `${r.id}:${i}`;
      const voted = !!forum.votes['ans:' + key];
      const base = !r.demo ? 0 : a.role === 'tutor' ? r.base + 3 + idx % 4 : a.role === 'admin' ? 6 + idx % 5 : 0;
      return {
        key, name: a.n, text: a.t, role: a.role, bio: a.role === 'tutor' ? TUTOR_BIO[a.n] : undefined,
        when: a.at ? ago(a.at) : !r.demo ? '' : a.role === 'tutor' ? (idx % 5 + 1) + ' hari lalu' : ((i + 1) * 4 + idx % 5) + ' jam lalu',
        votes: base + (voted ? 1 : 0), voted, top: false,
      };
    }).sort((a, b) => b.votes - a.votes);
    if (answers.length > 1 && answers[0].votes > 0) answers[0].top = true;
    return {
      id: r.id, sid: r.sid, q: r.q, by: r.by, order: r.t,
      when: own ? ago(r.t) : r.demo ? (idx % 5 + 2) + ' hari lalu' : '',
      votes: votes(r), voted: !!forum.votes[r.id], answers,
    };
  });
}

/** Thread count per school for the "Ruang diskusi" list. */
export function forumCounts(schools: School[], forum: ForumState): Record<string, number> {
  const out: Record<string, number> = {};
  for (const s of schools) out[s.id] = s.faq.length;
  for (const p of forum.posts) if (p.sid in out) out[p.sid]++;
  return out;
}
