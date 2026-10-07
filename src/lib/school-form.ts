import type { ReqCategory, Requirement, School } from '../data/types';
import { P, fmt } from './dates';
import { profileRows } from './murid';
import { schoolContact } from './school-contact';

export const REQUIREMENT_GROUPS = [
  { value: 'utama', label: 'Syarat utama' },
  { value: 'akademis', label: 'Akademis' },
  { value: 'fisik', label: 'Fisik' },
] as const;

/** Detail fields older records kept per requirement category; the form folds them into the requirement text (see toFormShape). */
export const REQ_DETAIL: Partial<Record<ReqCategory, { title: string; fields: [string, string, string, 'text' | 'date'][] }>> = {
  Akademik: {
    title: 'Detail tes akademik',
    fields: [
      ['jenis', 'Jenis tes', 'Tes tulis / CBT / wawancara', 'text'],
      ['mapel', 'Mata pelajaran', 'Matematika, IPA, B. Inggris', 'text'],
      ['standar', 'Standar nilai', 'Rata-rata ≥ 90', 'text'],
      ['jadwal', 'Jadwal', 'Feb 2027 / lihat alur', 'text'],
    ],
  },
  Kesehatan: {
    title: 'Detail pemeriksaan',
    fields: [
      ['jenis', 'Jenis assessment', 'Rikkes, tes buta warna, kesamaptaan', 'text'],
      ['tanggal', 'Tanggal', '', 'date'],
      ['tempat', 'Tempat', 'RS rujukan / lokasi seleksi', 'text'],
      ['catatan', 'Catatan', 'IMT 17–25, tidak berkacamata > 2 dioptri', 'text'],
    ],
  },
};

export function requirementGroup(r: Requirement): 'utama' | 'akademis' | 'fisik' {
  if (r.group) return r.group;
  if (r.cat === 'Akademik') return 'akademis';
  if (r.cat === 'Kesehatan') return 'fisik';
  if (r.cat === undefined && /nilai|rapor|akademik|tes|seleksi|iq/i.test(r.k)) return 'akademis';
  if (r.cat === undefined && /sehat|fisik|postur|tinggi/i.test(r.k)) return 'fisik';
  return 'utama';
}

/** Derived display fields are regenerated on edits and save, including old manual labels. */
export const schoolShortName = (name: string) => name.trim().replace(/^SMAS?\s+(?!Negeri\b|\d)/i, '');
export const schoolMonogram = (short: string) => {
  const words = short.split(/[\s.\-]+/).filter(w => /^[a-z]/i.test(w));
  return (words.length > 1 ? words.slice(0, 3).map(w => w[0]).join('') : (words[0] || '').slice(0, 3)).toUpperCase();
};
const firstLine = (t: string) => t.split('\n')[0].trim();
const ageText = (d?: { max: number; at: string }) => (d && d.max > 0 && /^\d{4}-\d{2}-\d{2}$/.test(d.at) ? `Usia maksimal ${d.max} tahun per ${fmt(P(d.at), true)}` : '');

/**
 * Derived labels follow the identity fields. Cek Syarat has its own section, so its calculator and questions are
 * retained independently from the public requirement list.
 */
export function automaticSchoolLabels(s: School): School {
  return {
    ...s,
    short: schoolShortName(s.name),
    pill: [s.info.kind, s.info.boarding, s.info.province].filter(Boolean).join(' · '),
    calc: s.calc,
    eligibility: s.eligibility ? { items: s.eligibility.items } : undefined,
  };
}

/** Older Cek Syarat rules are kept, while its previous date-of-birth rule becomes a simple yes/no question. */
function adoptChecks(s: School): School {
  const reqs = s.reqs.map(r => {
    const spec = r.cat ? REQ_DETAIL[r.cat] : undefined;
    const extra = spec ? spec.fields.filter(([k]) => r.det?.[k]?.trim()).map(([k, label, , type]) => `${label}: ${type === 'date' ? fmt(P(r.det![k]), true) : r.det![k]}`) : [];
    const { det, ...rest } = r;
    void det;
    return { ...rest, group: requirementGroup(r), v: extra.length ? [r.v, ...extra].join('\n') : r.v };
  });
  const items = [...(s.eligibility?.items ?? [])];
  reqs.filter(r => r.check && !r.kind && r.id && r.v.trim()).forEach(r => {
    if (!items.some(item => item.id === r.id)) items.push({ id: r.id!, q: firstLine(r.v) });
  });
  const legacyAge = ageText(s.eligibility?.dob);
  if (legacyAge && !items.some(item => item.id === 'legacy-age')) items.push({ id: 'legacy-age', q: legacyAge });
  return { ...s, reqs, eligibility: items.length ? { items } : undefined };
}

/**
 * Older records keep some page content in fields the form no longer has (one-line facts, a separate card line,
 * contact and quota fields). The form moves them to where the student page shows them, so nothing is lost and
 * nothing hidden stays behind.
 */
export function toFormShape(s: School): School {
  const { facts, sub, ...rest } = s;
  const { info } = schoolContact(s);
  return automaticSchoolLabels(adoptChecks({
    ...rest,
    tag: sub || s.tag,
    info,
    highlights: s.highlights ?? (facts ?? []).filter(t => t.trim()).map(t => ({ icon: 'spark', t, d: '' })),
    about: s.about ?? '',
    profile: profileRows(s),
    cost: s.cost?.long ? { long: s.cost.long } : undefined,
  }));
}

/** A single spreadsheet cell supplies the text; its optional display title follows until customized. */
export const requirementTitle = (text: string) => text.trim().split('\n')[0].slice(0, 64);
export function updateRequirementText(r: Requirement, text: string): Requirement {
  return { ...r, v: text, k: !r.k || r.k === requirementTitle(r.v) ? requirementTitle(text) : r.k };
}

/** Only web URLs can become clickable document links. Empty values are handled by their field. */
export function isWebUrl(value: string): boolean {
  try { return ['http:', 'https:'].includes(new URL(value).protocol); } catch { return false; }
}

const validDate = (value: string) => /^\d{4}-\d{2}-\d{2}$/.test(value)
  && Number.isFinite(Date.parse(value)) && new Date(value).toISOString().slice(0, 10) === value;
const validYear = (value: string) => /^\d{4}-\d{4}$/.test(value) && Number(value.slice(5)) === Number(value.slice(0, 4)) + 1;

/** Drafts may be incomplete. These checks apply only to publication. */
export function schoolProblems(s: School): string[] {
  const errors: string[] = [];
  const need = (value: string, label: string) => { if (!value.trim()) errors.push(label + ' masih kosong'); };
  need(s.name, 'Nama sekolah'); need(s.short, 'Nama pendek'); need(s.mono, 'Kode');
  s.phases.forEach((p, i) => {
    need(p.l, `Nama tahap ${i + 1}`);
    if (!validDate(p.s)) errors.push(`Tahap ${i + 1}: tanggal mulai harus lengkap`);
    if (p.e && (!validDate(p.e) || p.e < p.s)) errors.push(`Tahap ${i + 1}: tanggal selesai tidak valid atau sebelum mulai`);
  });
  const ids = new Set<string>();
  s.checklist.forEach((c, i) => {
    const label = `${c.document ? 'Berkas' : 'Tugas'} "${c.l.trim() || i + 1}"`;
    need(c.l, label);
    if (!c.id || ids.has(c.id)) errors.push(label + ': ID tugas harus unik');
    ids.add(c.id);
    if (c.document && !c.dl) errors.push(label + ': isi tenggat');
    else if (c.dl && !validDate(c.dl)) errors.push(label + ': tenggat tidak valid');
    if (c.document) {
      if (!c.document.rules.length) errors.push(label + ': tambahkan format file');
      c.document.rules.forEach(r => {
        if (!r.format.trim() || !r.maxMB.trim() || !Number.isFinite(Number(r.maxMB)) || Number(r.maxMB) <= 0)
          errors.push(label + ': format dan ukuran maksimum harus diisi dengan benar');
      });
      if (c.document.template && !isWebUrl(c.document.template)) errors.push(label + ': tautan template harus http/https');
    }
    const keys = (c.f || []).map(f => f.k.trim());
    if (keys.some(k => !k) || new Set(keys).size !== keys.length) errors.push(label + ': kode kolom siswa harus terisi dan unik');
  });
  s.reqs.forEach((r, i) => { need(r.v.trim() || r.k.trim(), `Isi syarat ${i + 1}`); });
  s.faq.forEach((f, i) => { need(f.q, `Pertanyaan FAQ ${i + 1}`); need(f.a, `Jawaban FAQ ${i + 1}`); });
  s.docs.forEach((d, i) => {
    need(d.l, `Judul referensi ${i + 1}`);
    if (!isWebUrl(d.h)) errors.push(`Referensi ${i + 1}: tautan harus http/https`);
  });
  s.highlights?.forEach((h, i) => need(h.t, `Judul sorotan ${i + 1}`));
  s.profile?.forEach((r, i) => { if (r.v.trim()) need(r.k, `Label baris fakta ${i + 1}`); });
  s.curriculumCards?.forEach((c, i) => need(c.t, `Judul kurikulum ${i + 1}`));
  s.facilities?.forEach((f, i) => need(f.t, `Nama fasilitas ${i + 1}`));
  s.alumni?.forEach((a, i) => { need(a.k, `Tujuan lulusan ${i + 1}`); a.campuses?.forEach((c, j) => need(c.n, `Kampus ${j + 1} pada tujuan lulusan ${i + 1}`)); });
  if ((s.alumni ?? []).reduce((t, a) => t + a.v, 0) > 100) errors.push('Sebaran lulusan: jumlah persen lebih dari 100');
  s.achievements?.forEach((a, i) => need(a.t, `Prestasi ${i + 1}`));
  s.reviews?.forEach((r, i) => { need(r.name, `Nama pengulas ${i + 1}`); need(r.text, `Isi ulasan ${i + 1}`); });
  s.photos?.forEach((u, i) => { if (!u.startsWith('ksu-photo:') && !isWebUrl(u.trim())) errors.push(`Foto ${i + 1}: tidak valid, unggah ulang`); });
  const dob = s.eligibility?.dob;
  if (dob && (!(dob.max > 0) || !validDate(dob.at))) errors.push('Cek syarat usia: isi usia maksimal dan tanggal acuan');
  s.eligibility?.items.forEach((it, i) => need(it.q, `Pertanyaan Cek syarat ${i + 1}`));
  if (s.calc) {
    if (!s.calc.subjects.length) errors.push('Syarat nilai rapor memerlukan minimal satu mata pelajaran');
    if (!(s.calc.minAvg > 0)) errors.push('Syarat nilai rapor: isi nilai minimal');
    if ([s.calc.minAvg, s.calc.minSem].some(n => n !== null && (!Number.isFinite(n) || n < 0 || n > 100)))
      errors.push('Batas nilai kalkulator harus antara 0 dan 100');
  }
  if (s.info.admissionYear && !validYear(s.info.admissionYear)) errors.push('Periode penerimaan harus berupa tahun ajaran, misalnya 2027-2028');
  return errors;
}
