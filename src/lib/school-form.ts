import type { Requirement, School } from '../data/types';

export const REQUIREMENT_GROUPS = [
  { value: 'utama', label: 'Syarat utama' },
  { value: 'akademis', label: 'Akademis' },
  { value: 'fisik', label: 'Fisik' },
] as const;

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
export function automaticSchoolLabels(s: School): School {
  return { ...s, short: schoolShortName(s.name), pill: [s.info.kind, s.info.boarding, s.info.province].filter(Boolean).join(' · ') };
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
    const label = `Dokumen/tugas ${i + 1}`;
    need(c.l, label);
    if (!c.id || ids.has(c.id)) errors.push(label + ': ID tugas harus unik');
    ids.add(c.id);
    if (c.dl && !validDate(c.dl)) errors.push(label + ': tenggat tidak valid');
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
  s.reqs.forEach((r, i) => { need(r.k, `Nama syarat ${i + 1}`); need(r.v, `Deskripsi syarat ${i + 1}`); });
  s.faq.forEach((f, i) => { need(f.q, `Pertanyaan FAQ ${i + 1}`); need(f.a, `Jawaban FAQ ${i + 1}`); });
  s.docs.forEach((d, i) => {
    need(d.l, `Judul referensi ${i + 1}`);
    if (!isWebUrl(d.h)) errors.push(`Referensi ${i + 1}: tautan harus http/https`);
  });
  // What the student pages show: every row that was added needs its main text, so no empty card or line appears.
  s.photos?.forEach((u, i) => { if (u.trim() && !isWebUrl(u.trim())) errors.push(`Foto ${i + 1}: tautan harus http/https`); });
  s.highlights?.forEach((h, i) => need(h.t, `Judul sorotan ${i + 1}`));
  s.profile?.forEach((r, i) => { need(r.k, `Label fakta ${i + 1}`); need(r.v, `Isi fakta ${i + 1}`); });
  s.curriculumCards?.forEach((c, i) => need(c.t, `Judul kartu kurikulum ${i + 1}`));
  s.facilities?.forEach((f, i) => need(f.t, `Nama fasilitas ${i + 1}`));
  s.alumni?.forEach((a, i) => {
    need(a.k, `Tujuan lulusan ${i + 1}`);
    if (!(a.v >= 0 && a.v <= 100)) errors.push(`Tujuan lulusan ${i + 1}: persen harus 0–100`);
    a.campuses?.forEach((c, j) => need(c.n, `Kampus ${j + 1} pada tujuan lulusan ${i + 1}`));
  });
  s.achievements?.forEach((a, i) => need(a.t, `Prestasi ${i + 1}`));
  s.reviews?.forEach((r, i) => { need(r.name, `Nama pemberi ulasan ${i + 1}`); need(r.text, `Isi ulasan ${i + 1}`); });
  const dob = s.eligibility?.dob;
  if (dob && (!(dob.max > 0) || !validDate(dob.at))) errors.push('Cek syarat usia: isi usia maksimal dan tanggal acuan');
  s.eligibility?.items.forEach((it, i) => need(it.q, `Pertanyaan Cek syarat ${i + 1}`));
  if (s.calc) {
    if (!s.calc.subjects.length) errors.push('Syarat nilai rapor memerlukan minimal satu mata pelajaran');
    if ([s.calc.minAvg, s.calc.minSem].some(n => n !== null && (!Number.isFinite(n) || n < 0 || n > 100)))
      errors.push('Batas nilai kalkulator harus antara 0 dan 100');
  }
  if (s.info.website && !isWebUrl(s.info.website)) errors.push('Website sekolah harus http/https');
  if (s.info.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s.info.email)) errors.push('Email sekolah tidak valid');
  const quotas = s.info.quotas || [];
  const years = quotas.map(q => q.year);
  if (new Set(years).size !== years.length) errors.push('Tahun ajaran kuota tidak boleh berulang');
  quotas.forEach((q, i) => {
    if (!validYear(q.year)) errors.push(`Kuota ${i + 1}: gunakan tahun ajaran berurutan, misalnya 2027-2028`);
    if (!q.seats.trim() || !Number.isSafeInteger(Number(q.seats)) || Number(q.seats) <= 0) errors.push(`Kuota ${i + 1}: jumlah harus bilangan bulat positif`);
  });
  if (s.info.admissionYear && !validYear(s.info.admissionYear)) errors.push('Periode penerimaan harus berupa tahun ajaran, misalnya 2027-2028');
  return errors;
}
