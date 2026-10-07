import { SCHOOL_COLORS, type School, type SchoolColor } from '@/data/types';
import { MO, P, fmt, fmtR } from './dates';
import { schoolContact } from './school-contact';
import { checklistOf, keyDatesOf, type ChecklistGroup } from './schools';

/* Pure helpers for the student pages ("Murid v3"). Nothing here touches the stores. */

const hash = (s: string) => [...s].reduce((a, c) => (a * 31 + c.charCodeAt(0)) >>> 0, 7);

/** The school's identity color: the admin's pick, else a stable one from its id. */
export const schoolColor = (s: Pick<School, 'id' | 'color'>): SchoolColor =>
  s.color ?? SCHOOL_COLORS[hash(s.id) % SCHOOL_COLORS.length];

/** Spread onto an element to give it --s-bar / --s-tint / --s-text. */
export const sc = (s: Pick<School, 'id' | 'color'>) => ({ 'data-sc': schoolColor(s) });

export const isBoarding = (s: School) => !!s.info.boarding && !/non/i.test(s.info.boarding);

/** Free = the admin said so; otherwise funding that is only scholarship. */
export const isFree = (s: School) => s.cost?.free ?? (s.info.funding.includes('Beasiswa') && !s.info.funding.includes('Berbayar'));

/** "International Baccalaureate" is too long for a chip. */
/**
 * Katalog chip: the international programme when there is one ("IB Diploma", "IB + Cambridge"),
 * otherwise the national curriculum.
 */
export const curriculumLabel = (s: School) => {
  const all = s.info.curriculum;
  const intl = all.filter(c => /baccalaureate|^ib\b|cambridge/i.test(c));
  const short = (c: string) => c.replace(/International Baccalaureate( Diploma)?/i, 'IB');
  if (intl.length === 1) return /cambridge/i.test(intl[0]) ? intl[0] : short(intl[0]) + ' Diploma';
  return (intl.length ? intl : all).map(short).join(' + ');
};

/** Katalog badge: "Info resmi 2027" or "Ref. tahun lalu". */
export const statusLabel = (s: School) => {
  if (s.status !== 'resmi') return 'Ref. tahun lalu';
  const y = (s.info.admissionYear || '').slice(0, 4);
  return y ? 'Info resmi ' + y : 'Info resmi';
};

export const cardSub = (s: School) => {
  const t = s.tag.trim();
  return t && !/[.!?]$/.test(t) ? t + '.' : t;
};

export const locationLabel = (s: School) => s.location || [s.info.city, s.info.province].filter(Boolean).join(', ');

/** The city on the Katalog card chip, without "Kabupaten"/"Kota": "Kabupaten Bogor" → "Bogor". */
export const placeChip = (s: School) => (s.info.city || '').replace(/^(kabupaten|kab\.|kota)\s+/i, '').trim() || s.info.province;

/** The Biaya chip, same words as the Biaya filter; empty while the form's Biaya chips are not picked. */
export const costChip = (s: School) => (isFree(s) ? 'Gratis' : s.info.funding.length ? 'Berbayar' : '');

/** Value of the Lokasi filter that lists schools with more than one campus. */
export const MULTI = 'Multi-kampus';
export const isMulti = (s: School) => (s.info.campusCount ?? 0) > 1;

/** "Pendaftaran: 9–23 Sep 2026" — from the registration stage, else the first stage. */
export const daftarLabel = (s: School): string => {
  const dated = s.phases.filter(p => p.s);
  const p = dated.find(x => x.t === 'daftar') ?? dated[0];
  if (!p) return 'Jadwal belum diumumkan';
  if (!p.est) return fmtR(p.s, p.e || p.s);
  // An estimate only claims the month: "±Nov 2026", "±Des 2026–Jan 2027".
  const A = P(p.s), B = P(p.e || p.s), m = (d: Date, y: boolean) => MO[d.getMonth()] + (y ? ' ' + d.getFullYear() : '');
  if (A.getMonth() === B.getMonth() && A.getFullYear() === B.getFullYear()) return '±' + m(A, true);
  return '±' + m(A, A.getFullYear() !== B.getFullYear()) + '–' + m(B, true);
};

/**
 * Sort key for "Pendaftaran terdekat": registration open now first (closing soonest), then registration not yet open
 * (opening soonest), then ended (most recent first). A school without a dated registration comes last.
 */
export function daftarRank(s: School, today: Date): number {
  const p = s.phases.find(x => x.t === 'daftar' && x.s);
  if (!p) return Infinity;
  const open = P(p.s).valueOf(), close = P(p.e || p.s).valueOf(), now = today.valueOf();
  if (now > close) return 1e15 + (now - close);
  if (now >= open) return close - now;
  return 1e13 + (open - now);
}

/** Sorotan under the school name; older records only have one-line "facts". */
export const highlightsOf = (s: School) =>
  (s.highlights ?? (s.facts ?? []).map(t => ({ icon: 'spark' as const, t, d: '' }))).filter(h => h.t.trim());

/** Fact table on the Tentang tab: the admin's rows that have a value. Older records build it from their info. */
export function profileRows(s: School): { k: string; v: string }[] {
  if (s.profile) return schoolContact(s).profile.filter(r => r.k.trim() && r.v.trim());
  const i = s.info;
  return [
    { k: 'STATUS', v: i.kind },
    { k: 'BERDIRI', v: i.founded || '' },
    { k: 'LOKASI', v: [i.city, i.province].filter(Boolean).join(', ') + ((i.campusCount ?? 0) > 1 ? ` · ${i.campusCount} kampus` : '') },
    { k: 'SISTEM', v: i.boarding },
    { k: 'KUOTA', v: i.quotas?.length ? i.quotas.map(q => `${q.year}: ${q.seats}`).join(' · ') : i.quota || '' },
    { k: 'SISTEM PENERIMAAN', v: i.admissionSystem || '' },
    { k: 'TAHUN AJARAN', v: i.admissionYear ? i.admissionYear.replace('-', '/') : '' },
  ].filter(r => r.v);
}

export const costText = (s: School) =>
  s.cost?.long || (s.info.funding.length ? 'Biaya: ' + s.info.funding.join(' · ') + '.' : '');

/** Checklist progress of one school. */
export function progressOf(s: School, checks: Record<string, boolean>, group?: ChecklistGroup) {
  const list = checklistOf(s, group);
  const total = list.length;
  const done = list.filter(c => checks[s.id + '.' + c.id]).length;
  return { total, done, pct: total ? Math.round((done / total) * 100) : 0 };
}

/** The unfinished item with the nearest deadline. */
export function nextPending(s: School, checks: Record<string, boolean>) {
  return checklistOf(s)
    .filter(c => c.dl && !checks[s.id + '.' + c.id])
    .sort((a, b) => P(a.dl).valueOf() - P(b.dl).valueOf())[0];
}

export const daysBetween = (a: Date, b: Date) => Math.round((b.valueOf() - a.valueOf()) / 864e5);

/** Next dated moment of a school on or after today. */
export function upcomingOf(s: School, today: Date) {
  const hit = keyDatesOf(s).map(k => ({ k, d: P(k.d) })).find(e => e.d >= today);
  return hit ? { label: hit.k.l, date: hit.d, days: daysBetween(today, hit.d) } : null;
}

export type ElegibilityMark = 'ok' | 'x' | '?';
export interface EligLine { l: string; st: ElegibilityMark; note: string }

/** The Cek syarat result: report-card averages, age, then the school's other requirements. */
export function evalEligibility(
  s: School,
  quick: Record<string, string>,
  answers: Record<string, 'ya' | 'tidak'> = {},
  dob: string,
): EligLine[] {
  const out: EligLine[] = [];
  const min = s.calc?.minAvg;
  const subs = s.calc?.subjects ?? [];
  if (min) {
    const vals = subs.map(sb => parseFloat(quick[s.id + '.' + sb]));
    const missing = vals.some(n => isNaN(n));
    const low = subs.filter((_, i) => vals[i] < min);
    out.push({
      l: 'Nilai rapor',
      st: missing ? '?' : low.length ? 'x' : 'ok',
      note: missing ? 'Isi rata-rata semua mapel.' : low.length ? `Di bawah ${min}: ${low.join(', ')}.` : `Semua mapel ≥ ${min}.`,
    });
  }
  const rule = s.eligibility?.dob;
  if (rule) {
    if (!dob) out.push({ l: 'Usia', st: '?', note: 'Isi tanggal lahir.' });
    else {
      const b = P(dob), at = P(rule.at);
      let age = at.getFullYear() - b.getFullYear();
      if (at < new Date(at.getFullYear(), b.getMonth(), b.getDate())) age--;
      out.push({ l: 'Usia', st: age <= rule.max ? 'ok' : 'x', note: `Usia ${age} tahun per ${fmt(at, true)} (maks. ${rule.max}).` });
    }
  }
  (s.eligibility?.items ?? []).forEach(it => {
    const a = answers[it.id];
    out.push({ l: it.q, st: !a ? '?' : a === 'ya' ? 'ok' : 'x', note: !a ? 'Belum dijawab.' : a === 'ya' ? 'Terpenuhi.' : 'Belum terpenuhi — siapkan sebelum pendaftaran.' });
  });
  return out;
}

export interface Notif {
  key: string;
  title: string;
  sub: string;
  when: string;
  days: number;
  href: string;
  tone: 'warn' | 'amb';
}

/** Deadlines within the next 60 days of the schools the student saved. */
export function deadlineNotifs(schools: School[], saved: Partial<Record<string, boolean>>, today: Date): Notif[] {
  const out: Notif[] = [];
  schools.filter(s => saved[s.id]).forEach(s => keyDatesOf(s).forEach(k => {
    const d = P(k.d);
    const days = daysBetween(today, d);
    if (days < 0 || days > 60) return;
    out.push({
      key: s.id + k.d + k.l, title: k.l, sub: s.short + ' · ' + fmt(d, true),
      when: days === 0 ? 'Hari ini' : days + ' hari lagi', days, href: '/timeline', tone: days <= 14 ? 'warn' : 'amb',
    });
  }));
  return out.sort((a, b) => a.days - b.days);
}

/** Stars for a 1–5 rating. */
export const stars = (n: number) => '★'.repeat(Math.max(0, Math.min(5, n))) + '☆'.repeat(5 - Math.max(0, Math.min(5, n)));

/** "Agu 2026" from "2026-08". */
export const monthLabel = (ym?: string) => (ym && /^\d{4}-\d{2}$/.test(ym) ? MO[Number(ym.slice(5)) - 1] + ' ' + ym.slice(0, 4) : '');
