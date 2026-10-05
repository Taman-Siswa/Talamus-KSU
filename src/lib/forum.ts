import type { School } from '@/data/types';
import type { ForumState } from './store';

/* The Forum is built from three sources: each school's FAQ (shown as questions answered by the TamanSchool team),
   questions the student wrote, and the replies and upvotes kept in this browser. Nothing else: every thread and
   answer a student sees was typed by the admin (FAQ) or by the student. */

export type AnswerRole = 'admin' | 'self';

export interface Answer { key: string; name: string; text: string; role: AnswerRole; when: string; votes: number; voted: boolean; top: boolean }
export interface Thread {
  id: string; sid: string; q: string; by: string; when: string; order: number;
  votes: number; voted: boolean; answers: Answer[];
}
export type ForumSort = 'new' | 'top' | 'hot';

export const ROLE_LABEL: Record<AnswerRole, string> = { admin: 'Admin TamanSchool', self: 'Kamu' };

export function ago(at: number | undefined, now = Date.now()): string {
  if (!at) return '';
  const m = Math.max(0, Math.floor((now - at) / 60000));
  if (m < 1) return 'baru saja';
  if (m < 60) return m + ' menit lalu';
  if (m < 1440) return Math.floor(m / 60) + ' jam lalu';
  return Math.floor(m / 1440) + ' hari lalu';
}

interface Raw { id: string; sid: string; q: string; by: string; t: number; faq?: string }

/** Threads for one Forum view, filtered and sorted. Newest: own posts first, then the FAQs in order. Top: most upvotes. Trending: most answers, then upvotes. */
export function forumThreads(schools: School[], forum: ForumState, filter: string, sort: ForumSort): Thread[] {
  const faq: Raw[] = schools.flatMap((s, si) => s.faq.map((f, qi) => ({ id: `${s.id}-${qi}`, sid: s.id, q: f.q, by: '', t: 1000 - qi * 10 - si, faq: f.a })));
  const ids = new Set(schools.map(s => s.id));
  const posts: Raw[] = forum.posts.filter(p => ids.has(p.sid)).map(p => ({ id: p.id, sid: p.sid, q: p.q, by: p.by, t: p.at }));
  const nAns = (r: Raw) => (r.faq ? 1 : 0) + (forum.replies[r.id]?.length ?? 0);
  const votes = (r: Raw) => (forum.votes[r.id] ? 1 : 0);

  const list = [...posts, ...faq].filter(r => filter === 'all' || r.sid === filter);
  const pos = new Map(list.map((r, i) => [r.id, i]));
  list.sort((a, b) => sort === 'top' ? votes(b) - votes(a) || pos.get(a.id)! - pos.get(b.id)!
    : sort === 'hot' ? nAns(b) - nAns(a) || votes(b) - votes(a) || pos.get(a.id)! - pos.get(b.id)!
    : b.t - a.t || pos.get(a.id)! - pos.get(b.id)!);

  return list.map((r): Thread => {
    const mine = (forum.replies[r.id] || []).map(x => ({ n: x.n, t: x.t, role: 'self' as const, at: x.at as number | undefined }));
    const answers = [...(r.faq ? [{ n: 'Tim TamanSchool', t: r.faq, role: 'admin' as const, at: undefined }] : []), ...mine].map((a, i): Answer => {
      const key = `${r.id}:${i}`;
      const voted = !!forum.votes['ans:' + key];
      return { key, name: a.n, text: a.t, role: a.role, when: ago(a.at), votes: voted ? 1 : 0, voted, top: false };
    }).sort((a, b) => b.votes - a.votes);
    if (answers.length > 1 && answers[0].votes > 0) answers[0].top = true;
    return { id: r.id, sid: r.sid, q: r.q, by: r.by, order: r.t, when: r.t > 1e12 ? ago(r.t) : '', votes: votes(r), voted: !!forum.votes[r.id], answers };
  });
}

/** Thread count per school for the "Ruang diskusi" list. */
export function forumCounts(schools: School[], forum: ForumState): Record<string, number> {
  const out: Record<string, number> = {};
  for (const s of schools) out[s.id] = s.faq.length;
  for (const p of forum.posts) if (p.sid in out) out[p.sid]++;
  return out;
}
