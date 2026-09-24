'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { ChecklistItem, ReqCategory, Requirement, School, SchoolInfo } from '@/data/types';
import { inferPhaseType, isBundledSchool, newSchoolId, reqCategory, useSchoolsStore } from '@/lib/schools';
import Icon from '../Icon';
import css from './admin.module.css';
import {
  AddButton, ChipLegend, ChipSet, Eyebrow, Field, PickChips, RepeatList, Section, StringList, Switch, TextArea, TextInput,
} from './fields';

/* One form per school, filled in by the marketing team from their Notion catalog, laid out as "Design system v2".
   The top half ("Dari Notion") uses Notion's own field names and order, so it can be copied across.
   The bottom half ("Khusus KSU") exists only in KSU and is written from the school's PDF guide. */

const KINDS: { value: SchoolInfo['kind']; label: string }[] = [
  { value: 'Negeri', label: 'Negeri' },
  { value: 'Swasta', label: 'Swasta' },
];
// The "Asrama/Tidak" options used in the Notion catalog.
const BOARDING = ['Asrama Heterogen', 'Asrama Semi-Militer', 'Non-Asrama'].map(v => ({ value: v, label: v }));
const FUNDING = ['Beasiswa', 'Berbayar'];
// Kurikulum tags already used in the Notion catalog; any other can be typed in.
const CURRICULA = ['Kurikulum Merdeka', 'Kurikulum Nasional', 'Kurikulum K-13', 'Cambridge', 'International Baccalaureate', 'Olimpiade'];
const SUBJECTS = ['B. Indonesia', 'B. Inggris', 'Matematika', 'IPA', 'IPS'];
// kelas-semester, in school order
const SEMESTERS = ['7-1', '7-2', '8-1', '8-2', '9-1', '9-2'];
const STATUSES: { value: School['status']; label: string }[] = [
  { value: 'resmi', label: 'Resmi — sudah diumumkan' },
  { value: 'est', label: 'Perkiraan — ikut tahun lalu' },
];

const CATEGORIES: ReqCategory[] = ['Akademik', 'Kesehatan', 'Administrasi', 'Domisili', 'Usia', 'Prestasi', 'Lainnya'];
const CAT_TONE: Record<ReqCategory, string> = {
  Akademik: css.catBlue, Kesehatan: css.catOk, Administrasi: css.catGrey, Domisili: css.catAmb,
  Usia: css.catGrey, Prestasi: css.catAmb, Lainnya: css.catGrey,
};
/** Optional detail fields some categories have: [key, label, placeholder, input type]. */
const DETAIL: Partial<Record<ReqCategory, { title: string; fields: [string, string, string, 'text' | 'date'][] }>> = {
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

/** Turns a label into an id like "surat-sehat"; checklist ids key the saved progress. */
const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 24) || 'item';

/** "SMA Pradita Dirgantara" → "Pradita Dirgantara". Names like "SMAN 8 Jakarta" are kept whole. */
const autoShort = (name: string) => name.trim().replace(/^SMAS?\s+(?!Negeri\b|\d)/i, '');
/** "Pradita Dirgantara" → "PD"; a single word gives its first three letters. */
const autoMono = (short: string) => {
  const words = short.split(/[\s.\-]+/).filter(w => /^[a-z]/i.test(w));
  return (words.length > 1 ? words.slice(0, 3).map(w => w[0]).join('') : (words[0] || '').slice(0, 3)).toUpperCase();
};
/** ISO dates compare as text. */
const endsEarly = (p: { s: string; e: string }) => !!p.s && !!p.e && p.e < p.s;
const autoPill = (i: SchoolInfo) => [i.kind, i.boarding, i.province].filter(Boolean).join(' · ');

type Part = 'profil' | 'alur' | 'dokumen' | 'syarat' | 'kalkulator' | 'checklist' | 'faq';
const PART_LABEL: Record<Part, string> = {
  profil: 'Profil', alur: 'Alur', dokumen: 'Dokumen', syarat: 'Syarat', kalkulator: 'Kalkulator', checklist: 'Checklist', faq: 'FAQ',
};

/**
 * `school` is what students read now (blank for a school not published yet); `savedDraft` is unfinished work
 * stored apart from it. The form opens on the draft when there is one.
 */
export default function SchoolEditor({ school, published, savedDraft }: { school: School; published: boolean; savedDraft: School | null }) {
  const router = useRouter();
  const { save, saveDraft, discardDraft, reset, remove } = useSchoolsStore.getState();
  const isEdited = useSchoolsStore(s => !!s.overrides[school.id]);
  const base = savedDraft ?? school;
  const [draft, setDraft] = useState<School>(base);
  const [saved, setSaved] = useState(false);
  // Which of the "Khusus KSU" sections, and which requirement detail panels, are open.
  const [open, setOpen] = useState<Record<string, boolean>>({ syarat: true });
  const toggle = (k: string) => setOpen(o => ({ ...o, [k]: !o[k] }));
  const isNew = !published;

  // dirty = typed but not stored anywhere yet; a stored draft is safe but still unpublished
  const dirty = JSON.stringify(draft) !== JSON.stringify(base);
  const unpublished = dirty || !!savedDraft || !published;

  // Closing or reloading the tab with unstored changes asks first.
  useEffect(() => {
    if (!dirty) return;
    const warn = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [dirty]);
  const patch = (p: Partial<School>) => {
    setDraft(d => ({ ...d, ...p }));
    setSaved(false);
  };
  const set = <K extends keyof School>(k: K, v: School[K]) => patch({ [k]: v } as Pick<School, K>);

  // Nama pendek, kode and the card label fill themselves in until the admin types over them.
  const setName = (name: string) => {
    const p: Partial<School> = { name };
    if (!draft.short || draft.short === autoShort(draft.name)) {
      p.short = autoShort(name);
      if (!draft.mono || draft.mono === autoMono(draft.short)) p.mono = autoMono(p.short);
    }
    patch(p);
  };
  const setShort = (short: string) =>
    patch(!draft.mono || draft.mono === autoMono(draft.short) ? { short, mono: autoMono(short) } : { short });
  const setInfo = (p: Partial<SchoolInfo>) => {
    const info = { ...draft.info, ...p };
    patch(!draft.pill || draft.pill === autoPill(draft.info) ? { info, pill: autoPill(info) } : { info });
  };

  // What stops a save, in the admin's words; shown under the buttons.
  const problems = [
    !draft.name.trim() && 'nama sekolah masih kosong',
    !draft.short.trim() && 'nama pendek masih kosong',
    !draft.mono.trim() && 'kode singkat masih kosong',
    ...draft.phases.map((p, i) => {
      const name = `tahap ${i + 1}${p.l ? ' (' + p.l + ')' : ''}`;
      return !p.s ? name + ' belum punya tanggal mulai' : endsEarly(p) ? name + ' selesai sebelum mulai' : false;
    }),
  ].filter((x): x is string => !!x);

  // Publishing returns to the school list. A draft keeps the admin on the form, and the first draft
  // of a new school moves to that school's own address so a reload finds it.
  const store = (kind: 'draft' | 'publish', data: School) => {
    const next = { ...data, id: data.id || newSchoolId() };
    (kind === 'draft' ? saveDraft : save)(next);
    if (kind === 'publish') {
      // replace, so the browser's back button does not land on the blank "new school" form
      if (isNew) router.replace('/admin/sekolah'); else router.push('/admin/sekolah');
      return;
    }
    setDraft(next);
    setSaved(true);
    if (!data.id) router.replace('/admin/sekolah/' + next.id);
  };
  // A draft is stored as typed, gaps and all. Publishing needs the form to be valid.
  const onSaveDraft = () => store('draft', draft);
  // A stage with one date is a single day.
  const onSave = () => store('publish', { ...draft, phases: draft.phases.map(p => ({ ...p, e: p.e || p.s })) });

  const onDelete = () => {
    if (!window.confirm(`Hapus "${draft.name || draft.short || 'sekolah ini'}" untuk selamanya? Siswa yang menjadikannya target akan kehilangan checklist dan datanya untuk sekolah ini.`)) return;
    remove(school.id);
    router.replace('/admin/sekolah');
  };

  const onDiscardDraft = () => {
    discardDraft(school.id);
    if (!published) return router.replace('/admin/sekolah');
    setDraft(school);
    setSaved(false);
  };

  const onReset = () => {
    reset(school.id);
    setSaved(false);
  };

  const calc = draft.calc;
  const info = draft.info;

  const count = (n: number, unit: string) => ({ text: n ? n + ' ' + unit : 'Belum diisi', done: n > 0 });
  const profileGaps = [draft.name, draft.short, draft.mono, info.kind, info.province, info.boarding, draft.tag].filter(v => !v.trim()).length;
  const status: Record<Part, { text: string; done: boolean }> = {
    profil: { text: profileGaps ? profileGaps + ' kolom utama kosong' : 'Lengkap', done: !profileGaps },
    alur: count(draft.phases.length, 'tahap'),
    dokumen: count(draft.docs.length, 'dokumen'),
    syarat: count(draft.reqs.length, 'syarat'),
    kalkulator: calc ? { text: 'Pakai nilai rapor', done: true }
      : { text: draft.calcNote || draft.noGradeNote ? 'Tanpa nilai rapor' : 'Belum diisi', done: !!(draft.calcNote || draft.noGradeNote) },
    checklist: count(draft.checklist.length, 'item'),
    faq: count(draft.faq.length, 'pertanyaan'),
  };
  const filled = Object.values(status).filter(s => s.done).length;

  const confirmLeave = (e: React.MouseEvent) => {
    if (dirty && !window.confirm('Ada perubahan yang belum disimpan. Tinggalkan halaman ini?')) e.preventDefault();
  };

  return (
    <div className={css.editor} data-school={draft.id}>
      <div className={css.head}>
        <Link href="/admin/sekolah" className={css.back} aria-label="Kembali ke semua sekolah" title="Semua sekolah" onClick={confirmLeave}>
          <Icon name="arrowLeft" size={20} />
        </Link>
        <div className={css.headText}>
          <h1 className={css.title}>{draft.name || (isNew ? 'Sekolah baru' : 'Tanpa nama')}</h1>
          <p className={css.lead}>
            {filled} dari 7 bagian terisi ·{' '}
            {dirty ? 'ada perubahan yang belum disimpan'
              : savedDraft ? (published ? 'ada draft perubahan, siswa masih melihat versi lama' : 'draft, belum tampil ke siswa')
              : isNew ? 'belum dibuat'
              : !isBundledSchool(school.id) ? 'sekolah tambahan'
              : isEdited ? 'sudah diubah dari data bawaan' : 'sama dengan data bawaan'}
          </p>
        </div>
      </div>

      <div className={css.progress} aria-label="Kelengkapan tiap bagian">
        {(Object.keys(status) as Part[]).map(k => (
          <span key={k} className={[css.progressPill, status[k].done ? css.progressDone : ''].join(' ')}>
            <i />{PART_LABEL[k]}
          </span>
        ))}
      </div>

      <Eyebrow className={css.tier}>Dari Notion</Eyebrow>

      <Section id="profil" title="Profil sekolah" icon="navKatalog" status={status.profil}>
        <div className={css.group}>
          <Eyebrow>Identitas</Eyebrow>
          <div className={css.gridIdent}>
            <Field label="Nama sekolah" required>
              <TextInput value={draft.name} onChange={setName} placeholder="SMA Pradita Dirgantara" strong />
            </Field>
            <Field label="Nama pendek" required>
              <TextInput value={draft.short} onChange={setShort} placeholder="Pradita Dirgantara" />
            </Field>
            <Field label="Kode" required>
              <TextInput value={draft.mono} onChange={v => set('mono', v.toUpperCase().slice(0, 4))} maxLength={4} placeholder="PD" code />
            </Field>
          </div>
        </div>

        <div className={css.group}>
          <Eyebrow>Klasifikasi</Eyebrow>
          <div className={css.grid3}>
            <Field label="Negeri/Swasta" group>
              <PickChips label="Negeri/Swasta" value={info.kind} options={KINDS} clearable="" onChange={v => setInfo({ kind: v })} />
            </Field>
            <Field label="Provinsi">
              <TextInput value={info.province} onChange={v => setInfo({ province: v })} placeholder="Jawa Tengah" />
            </Field>
            <Field label="Asrama/Tidak" group>
              <PickChips label="Asrama/Tidak" value={info.boarding} options={BOARDING} clearable="" onChange={v => setInfo({ boarding: v })} />
            </Field>
          </div>
          <div className={[css.grid3, css.gap].join(' ')}>
            <Field label="Tahun berdiri"><TextInput value={info.founded} onChange={v => setInfo({ founded: v })} placeholder="2018" /></Field>
            <Field label="Kuota/angkatan"><TextInput value={info.quota} onChange={v => setInfo({ quota: v })} placeholder="150" /></Field>
            <Field label="Label di kartu">
              <TextInput value={draft.pill} onChange={v => set('pill', v)} placeholder="Swasta · Asrama · Jawa Tengah" />
            </Field>
          </div>
        </div>

        <div className={[css.group, css.groupLoose].join(' ')}>
          <div className={css.groupHead}>
            <Eyebrow>Pembiayaan &amp; kurikulum</Eyebrow>
            <ChipLegend />
          </div>
          <Field label="Pembiayaan" group>
            <ChipSet label="Pembiayaan" value={info.funding} onChange={v => setInfo({ funding: v })} options={FUNDING} fixed sorted />
          </Field>
          <Field label="Kurikulum" group>
            <ChipSet label="Kurikulum" value={info.curriculum} onChange={v => setInfo({ curriculum: v })} options={CURRICULA} />
          </Field>
        </div>

        <div className={[css.group, css.groupLoose].join(' ')}>
          <Eyebrow>Kontak &amp; deskripsi</Eyebrow>
          <Field label="Kontak sekolah">
            <TextInput value={info.contact} onChange={v => setInfo({ contact: v })} placeholder="Website, Instagram, atau nomor admin" />
          </Field>
          <Field label="Tentang sekolah">
            <TextArea value={draft.tag} onChange={v => set('tag', v)} placeholder="Satu–dua kalimat dari Notion. Tampil di bawah nama sekolah." />
          </Field>
          <Field label="Informasi tambahan" group>
            <StringList items={draft.facts} onChange={v => set('facts', v)} addLabel="Tambah informasi"
              placeholder="Lokasi kampus, batas usia, dll." />
          </Field>
        </div>
      </Section>

      <Section id="alur" title="Alur pendaftaran" icon="navTimeline" status={status.alur}>
        <div className={css.gridStatus}>
          <Field label="Status jadwal" group>
            <PickChips label="Status jadwal" value={draft.status} options={STATUSES} onChange={v => set('status', v)} />
          </Field>
          <Field label="Catatan status untuk siswa">
            <TextArea value={draft.banner} onChange={v => set('banner', v)} placeholder="Jadwal 2027/28 belum rilis. Tanggal mengikuti pola tahun lalu…" />
          </Field>
        </div>
        <Eyebrow className={css.gap}>Tahapan</Eyebrow>
        <RepeatList items={draft.phases} onChange={v => set('phases', v)}
          blank={() => ({ l: '', s: '', e: '', t: 'tes' as const, est: draft.status === 'est' })}
          addLabel="Tambah tahap" rowLabel={(item, i) => (i + 1) + '. ' + (item.l || 'Tahap baru')} empty="Belum ada tahap."
          render={(item, setItem) => (
            <>
              <Field label="Nama tahap" required>
                {/* The kind (registration / test / announcement) follows the name; see inferPhaseType. */}
                <TextInput value={item.l} onChange={v => setItem({ l: v, t: inferPhaseType(v) })} placeholder="Seleksi administrasi" />
              </Field>
              <div className={[css.grid3, css.gridEnd, css.gap].join(' ')}>
                <Field label="Mulai" required>
                  <TextInput type="date" value={item.s} max={item.e || undefined} onChange={v => setItem({ s: v })} />
                </Field>
                <div className={css.field}>
                  <TextInput type="date" label="Tanggal selesai (kosong = satu hari)" value={item.e} min={item.s || undefined}
                    invalid={endsEarly(item)} onChange={v => setItem({ e: v })} />
                </div>
                <Switch checked={!!item.est} label="Masih perkiraan" onChange={v => setItem({ est: v })} />
              </div>
            </>
          )} />
      </Section>

      <Section id="dokumen" title="Dokumen & link" icon="doc" status={status.dokumen}>
        <RepeatList items={draft.docs} onChange={v => set('docs', v)} blank={() => ({ l: '', m: '', h: '', arsip: false })}
          addLabel="Tambah dokumen" rowLabel={item => item.l || 'Dokumen baru'} empty="Belum ada dokumen."
          render={(item, setItem) => (
            <>
              <div className={css.grid2}>
                <Field label="Judul dokumen"><TextInput value={item.l} onChange={v => setItem({ l: v })} placeholder="Pedoman pendaftaran 2027/28" /></Field>
                <Field label="Tautan"><TextInput type="url" value={item.h} onChange={v => setItem({ h: v })} placeholder="https://…" /></Field>
              </div>
              <div className={[css.grid2, css.gridEnd, css.gap].join(' ')}>
                <Field label="Keterangan"><TextInput value={item.m} onChange={v => setItem({ m: v })} placeholder="PDF resmi dari panitia, 24 halaman" /></Field>
                <Switch checked={item.arsip} label="Arsip tahun lalu" tone="amber" onChange={v => setItem({ arsip: v })} />
              </div>
            </>
          )} />
      </Section>

      <Eyebrow className={css.tierLater}>Khusus KSU · dari pedoman PDF sekolah</Eyebrow>

      <Section id="syarat" title="Persyaratan" icon="navChecklist" status={status.syarat}
        collapsible open={!!open.syarat} onToggle={() => toggle('syarat')}>
        <p className={css.intro}>
          Tiap syarat punya kategori, nama, dan deskripsi. Detail tambahan muncul sesuai kategori — opsional, buka hanya bila ada datanya.
        </p>
        <RepeatList<Requirement> items={draft.reqs} onChange={v => set('reqs', v)} blank={() => ({ cat: '', k: '', v: '' })}
          addLabel="Tambah syarat" rowLabel={item => item.k || 'Syarat baru'} empty="Belum ada syarat."
          rowBadge={item => {
            const cat = reqCategory(item);
            return <span className={[css.cat, cat ? CAT_TONE[cat] : css.catNone].join(' ')}>{cat || 'Tanpa kategori'}</span>;
          }}
          render={(item, setItem, i) => {
            const cat = reqCategory(item);
            const spec = cat ? DETAIL[cat] : undefined;
            const det = item.det || {};
            const filledDet = spec ? spec.fields.filter(f => det[f[0]]).length : 0;
            const key = 'req' + i;
            return (
              <>
                <Field label="Kategori" group>
                  <PickChips<ReqCategory | ''> label="Kategori" value={cat} onChange={v => setItem({ cat: v })}
                    options={CATEGORIES.map(c => ({ value: c, label: c }))} />
                </Field>
                <Field label="Nama syarat" className={css.gap}>
                  <TextInput value={item.k} onChange={v => setItem({ k: v })} placeholder="Nilai rapor" />
                </Field>
                <Field label="Deskripsi" className={css.gap}>
                  <TextArea value={item.v} onChange={v => setItem({ v })}
                    placeholder="B. Indonesia, B. Inggris, Matematika, IPA semester 1–5: rata-rata tiap mapel minimal 90." />
                </Field>
                {spec ? (
                  <>
                    <button type="button" className={css.detToggle} aria-expanded={!!open[key]} onClick={() => toggle(key)}>
                      <Icon name="chevronDown" size={14} stroke={2} className={[css.caret, open[key] ? css.caretOpen : ''].join(' ')} />
                      {spec.title} (opsional)
                      <span className={css.detSummary}>{filledDet ? '· ' + filledDet + ' terisi' : '· belum diisi'}</span>
                    </button>
                    {open[key] ? (
                      <div className={css.detPanel}>
                        {spec.fields.map(([k, label, placeholder, type]) => (
                          <Field key={k} label={label}>
                            <TextInput type={type} value={det[k] || ''} placeholder={placeholder}
                              onChange={v => setItem({ det: { ...det, [k]: v } })} />
                          </Field>
                        ))}
                      </div>
                    ) : null}
                  </>
                ) : null}
              </>
            );
          }} />
      </Section>

      <Section id="kalkulator" title="Kalkulator syarat" icon="navKalkulator" status={status.kalkulator}
        collapsible open={!!open.kalkulator} onToggle={() => toggle('kalkulator')}>
        <Switch checked={!!calc} label="Sekolah ini punya batas nilai rapor"
          onChange={on => set('calc', on ? { subjects: ['Matematika'], sems: ['7-1'], minAvg: 85, minSem: null } : null)} />
        {calc ? (
          <>
            <Field label="Mata pelajaran" group>
              <ChipSet label="Mata pelajaran" value={calc.subjects} onChange={v => set('calc', { ...calc, subjects: v })} options={SUBJECTS} />
            </Field>
            <Field label="Semester yang dihitung" note="kelas-semester" group>
              <ChipSet label="Semester yang dihitung" value={calc.sems} onChange={v => set('calc', { ...calc, sems: v })} options={SEMESTERS} fixed sorted />
            </Field>
            <div className={css.grid2}>
              <Field label="Rata-rata minimal per mapel">
                <TextInput type="number" placeholder="85" value={String(calc.minAvg)} onChange={v => set('calc', { ...calc, minAvg: Number(v) || 0 })} />
              </Field>
              <Field label="Nilai minimal tiap semester" note="opsional">
                <TextInput type="number" placeholder="Kosong = tidak ada batas" value={calc.minSem == null ? '' : String(calc.minSem)}
                  onChange={v => set('calc', { ...calc, minSem: v === '' ? null : Number(v) || 0 })} />
              </Field>
            </div>
            <Field label="Penjelasan untuk siswa">
              <TextArea value={draft.calcNote} onChange={v => set('calcNote', v)} placeholder="Nilai rapor mana yang dipakai dan berapa batasnya." />
            </Field>
            <div className={css.grid2}>
              <Field label="Pesan bila memenuhi">
                <TextArea value={draft.passNote || ''} onChange={v => set('passNote', v)} placeholder="Langkah berikutnya untuk siswa." />
              </Field>
              <Field label="Pesan bila belum memenuhi">
                <TextArea value={draft.failNote || ''} onChange={v => set('failNote', v)} placeholder="Saran untuk siswa." />
              </Field>
            </div>
          </>
        ) : (
          <div className={css.grid2}>
            <Field label="Penjelasan untuk siswa">
              <TextArea value={draft.calcNote} onChange={v => set('calcNote', v)} placeholder="Kenapa sekolah ini tidak memakai nilai rapor." />
            </Field>
            <Field label="Pesan pengganti hasil">
              <TextArea value={draft.noGradeNote || ''} onChange={v => set('noGradeNote', v)} placeholder="Tidak ada gugur berkas, fokus ke tes potensi akademik." />
            </Field>
          </div>
        )}
        <Field label="Catatan tinggi & berat badan" note="kosongkan bila tidak dinilai">
          <TextArea value={draft.bodyNote || ''} onChange={v => set('bodyNote', v)}
            placeholder="Tidak ada angka resmi, postur dinilai saat tes kesehatan. IMT 17–25 patokan aman." />
        </Field>
      </Section>

      <Section id="checklist" title="Checklist persiapan" icon="navChecklist" status={status.checklist}
        collapsible open={!!open.checklist} onToggle={() => toggle('checklist')}>
        <RepeatList items={draft.checklist} onChange={v => set('checklist', v)}
          blank={(): ChecklistItem => ({ id: 'item-' + Date.now().toString(36), l: '', d: '', dl: '' })}
          addLabel="Tambah item checklist" rowLabel={item => item.l || 'Item baru'} empty="Belum ada item."
          render={(item, setItem) => {
            const fields = item.f || [];
            const setFields = (f: typeof fields) => setItem({ f: f.length ? f : undefined });
            return (
              <>
                <Field label="Judul tugas">
                  <TextInput value={item.l} onChange={v => setItem({ l: v, id: item.l ? item.id : slug(v) })} placeholder="Surat keterangan sehat dari dokter" medium />
                </Field>
                <div className={[css.grid3, css.gap].join(' ')}>
                  <Field label="Catatan"><TextInput value={item.note || ''} onChange={v => setItem({ note: v })} placeholder="Baris kecil di bawah judul" /></Field>
                  <Field label="Teks tenggat"><TextInput value={item.d} onChange={v => setItem({ d: v })} placeholder="±2 Feb 2027" /></Field>
                  <Field label="Tanggal tenggat"><TextInput type="date" value={item.dl} onChange={v => setItem({ dl: v })} /></Field>
                </div>
                <div className={css.rowTools}>
                  <AddButton onClick={() => setFields([...fields, { k: '', p: '' }])}>Tambah kolom isian siswa</AddButton>
                </div>
                {fields.map((f, j) => (
                  <div key={j} className={css.fieldRow}>
                    <Field label="Kode kolom">
                      <TextInput value={f.k} onChange={v => setFields(fields.map((x, q) => (q === j ? { ...x, k: v } : x)))} placeholder="nisn" />
                    </Field>
                    <Field label="Teks petunjuk untuk siswa">
                      <TextInput value={f.p} onChange={v => setFields(fields.map((x, q) => (q === j ? { ...x, p: v } : x)))} placeholder="NISN (10 digit)" />
                    </Field>
                    <button type="button" className={[css.rowBtn, css.rowBtnDanger].join(' ')} aria-label="Hapus kolom" title="Hapus kolom"
                      onClick={() => setFields(fields.filter((_, q) => q !== j))}>
                      <Icon name="x" size={14} stroke={1.8} />
                    </button>
                  </div>
                ))}
              </>
            );
          }} />
      </Section>

      <Section id="faq" title="FAQ" icon="navFaq" status={status.faq}
        collapsible open={!!open.faq} onToggle={() => toggle('faq')}>
        <RepeatList items={draft.faq} onChange={v => set('faq', v)} blank={() => ({ q: '', a: '' })}
          addLabel="Tambah pertanyaan" rowLabel={item => item.q || 'Pertanyaan baru'} empty="Belum ada pertanyaan."
          render={(item, setItem) => (
            <>
              <Field label="Pertanyaan"><TextInput value={item.q} onChange={v => setItem({ q: v })} placeholder="Apakah ada biaya pendaftaran?" medium /></Field>
              <Field label="Jawaban" className={css.gap}>
                <TextArea value={item.a} onChange={v => setItem({ a: v })} rows={3}
                  placeholder="Tidak ada. Pendaftaran dan seluruh tahap seleksi gratis…" />
              </Field>
            </>
          )} />
      </Section>

      <div className={css.foot}>
        <button type="button" className={[css.btn, css.btnPrimary].join(' ')} onClick={onSave} disabled={!unpublished || problems.length > 0}>
          <Icon name="check" size={16} stroke={2.2} />{published ? 'Simpan' : 'Simpan & tampilkan ke siswa'}
        </button>
        <button type="button" className={css.btn} onClick={onSaveDraft} disabled={!dirty}>Simpan sebagai draft</button>
        {savedDraft ? <button type="button" className={css.btn} onClick={onDiscardDraft}>Buang draft</button> : null}
        {isEdited && !savedDraft ? <button type="button" className={css.btn} onClick={onReset}>Kembalikan ke data bawaan</button> : null}
        {!isBundledSchool(school.id) && published ? (
          <button type="button" className={[css.btn, css.btnDanger].join(' ')} onClick={onDelete}>Hapus sekolah</button>
        ) : null}
        {saved && !dirty ? <span className={css.saved}><Icon name="check" size={14} stroke={2.4} />Draft tersimpan</span> : null}
        <p className={css.footNote}>
          {published
            ? 'Simpan langsung mengubah yang dilihat siswa. Draft menyimpan pekerjaanmu tanpa mengubah apa pun di sisi siswa.'
            : 'Draft menyimpan pekerjaanmu tanpa menampilkan sekolah ini ke siswa, dan boleh belum lengkap.'}
        </p>
        {problems.length > 0 ? (
          <p className={css.footWhy}>Belum bisa disimpan untuk siswa: {problems.join('; ')}. Masih bisa disimpan sebagai draft.</p>
        ) : null}
      </div>
    </div>
  );
}
