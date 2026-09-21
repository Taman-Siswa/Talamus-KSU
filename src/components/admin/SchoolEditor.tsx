'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { ChecklistItem, PhaseType, School, SchoolInfo } from '@/data/types';
import { isBundledSchool, newSchoolId, useSchoolsStore } from '@/lib/schools';
import Icon from '../Icon';
import ui from '../ui.module.css';
import css from './admin.module.css';
import { CheckGroup, TagInput, Field, RepeatList, Section, Select, StringList, Switch, TextArea, TextInput } from './fields';

/* One form per school, filled in by the marketing team from their Notion catalog.
   The top half uses Notion's own field names and order (school page, then the Alur Pendaftaran table),
   so it can be copied across. The bottom half exists only in KSU and is written from the school's PDF guide. */

const PHASE_TYPES: { value: PhaseType; label: string }[] = [
  { value: 'daftar', label: 'Pendaftaran' },
  { value: 'tes', label: 'Tes / seleksi' },
  { value: 'umum', label: 'Pengumuman' },
];

const KINDS: { value: SchoolInfo['kind']; label: string }[] = [
  { value: '', label: 'Pilih…' },
  { value: 'Negeri', label: 'Negeri' },
  { value: 'Swasta', label: 'Swasta' },
];

// The "Asrama/Tidak" options used in the Notion catalog.
const BOARDING = ['', 'Asrama Heterogen', 'Asrama Semi-Militer', 'Non-Asrama'].map(v => ({ value: v, label: v || 'Pilih…' }));
const FUNDING = ['Beasiswa', 'Berbayar'];
// Kurikulum tags already used in the Notion catalog; any other can be typed in.
const SUBJECTS = ['B. Indonesia', 'B. Inggris', 'Matematika', 'IPA', 'IPS'];
// kelas-semester, in school order
const SEMESTERS = ['7-1', '7-2', '8-1', '8-2', '9-1', '9-2'];
const CURRICULA = ['Kurikulum Merdeka', 'Kurikulum Nasional', 'Kurikulum K-13', 'Cambridge', 'International Baccalaureate', 'Olimpiade'];

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

/**
 * `school` is what students read now (blank for a school not published yet); `savedDraft` is unfinished work
 * stored apart from it. The form opens on the draft when there is one.
 */
export default function SchoolEditor({ school, published, savedDraft }: { school: School; published: boolean; savedDraft: School | null }) {
  const router = useRouter();
  const { save, saveDraft, discardDraft, reset } = useSchoolsStore.getState();
  const isEdited = useSchoolsStore(s => !!s.overrides[school.id]);
  const base = savedDraft ?? school;
  const [draft, setDraft] = useState<School>(base);
  const [saved, setSaved] = useState(false);
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

  // Nama pendek, kode singkat and the card label fill themselves in until the admin types over them.
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

  // What stops a save, in the admin's words; shown next to the button.
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
  const status = {
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

  return (
    <div data-school={draft.id}>
      <h1 className={ui.h1}>{draft.name || (isNew ? 'Sekolah baru' : 'Tanpa nama')}</h1>
      <p className={ui.lead}>
        {filled} dari 7 bagian terisi ·{' '}
        {dirty ? 'ada perubahan yang belum disimpan'
          : savedDraft ? (published ? 'ada draft perubahan, siswa masih melihat versi lama' : 'draft, belum tampil ke siswa')
          : isNew ? 'belum dibuat'
          : !isBundledSchool(school.id) ? 'sekolah tambahan'
          : isEdited ? 'sudah diubah dari data bawaan' : 'sama dengan data bawaan'}
      </p>

      <Link href="/admin/sekolah" className={css.back} aria-label="Kembali ke semua sekolah" title="Semua sekolah"
        onClick={e => { if (dirty && !window.confirm('Ada perubahan yang belum disimpan. Tinggalkan halaman ini?')) e.preventDefault(); }}>
        <Icon name="arrowLeft" size={20} />
      </Link>

      <Section id="profil" title="Profil sekolah" icon="navKatalog" status={status.profil}
        desc="Dari halaman sekolah di Notion. Tampil di Katalog dan halaman profil sekolah.">
        <Field label="Nama sekolah" required hint="Judul halaman sekolah di Notion">
          <TextInput value={draft.name} onChange={setName} placeholder="SMA Pradita Dirgantara" />
        </Field>
        <div className={css.grid2}>
          <Field label="Nama pendek" required hint="Terisi otomatis dari nama sekolah. Ini yang dibaca siswa di menu pilihan sekolah dan Timeline.">
            <TextInput value={draft.short} onChange={setShort} placeholder="Pradita Dirgantara" />
          </Field>
          <Field label="Kode singkat" required hint="2–3 huruf di kotak kecil sebelah nama sekolah. Terisi otomatis.">
            <TextInput value={draft.mono} onChange={v => set('mono', v.toUpperCase())} maxLength={4} placeholder="PD" />
          </Field>
        </div>
        <div className={css.grid3}>
          <Field label="Negeri/Swasta"><Select value={info.kind} onChange={v => setInfo({ kind: v })} options={KINDS} /></Field>
          <Field label="Provinsi"><TextInput value={info.province} onChange={v => setInfo({ province: v })} placeholder="Jawa Tengah" /></Field>
          <Field label="Asrama/Tidak"><Select value={info.boarding} onChange={v => setInfo({ boarding: v })} options={BOARDING} /></Field>
        </div>
        <Field label="Label di kartu sekolah" hint="Terisi otomatis dari tiga kolom di atas. Boleh dipendekkan.">
          <TextInput value={draft.pill} onChange={v => set('pill', v)} placeholder="Swasta · Asrama Semi-Militer · Jawa Tengah" />
        </Field>
        <div className={css.grid3}>
          <Field label="Tahun berdiri"><TextInput value={info.founded} onChange={v => setInfo({ founded: v })} placeholder="2018" /></Field>
          <Field label="Kuota/angkatan"><TextInput value={info.quota} onChange={v => setInfo({ quota: v })} placeholder="150" /></Field>
          <Field label="Pembiayaan" group>
            <CheckGroup label="Pembiayaan" value={info.funding} onChange={v => setInfo({ funding: v })} options={FUNDING} />
          </Field>
        </div>
        <Field label="Kurikulum" group hint="Satu sekolah boleh punya beberapa. Klik saran di bawah, atau ketik lalu tekan Enter.">
          <TagInput label="Kurikulum" value={info.curriculum} onChange={v => setInfo({ curriculum: v })}
            placeholder="Kurikulum Merdeka" suggestions={CURRICULA} />
        </Field>
        <Field label="Kontak sekolah" hint="Website, Instagram, atau nomor admin sekolah">
          <TextInput value={info.contact} onChange={v => setInfo({ contact: v })} placeholder="https://praditadirgantara.sch.id" />
        </Field>
        <Field label="Tentang sekolah" hint="Satu–dua kalimat dari bagian Tentang Sekolah di Notion. Tampil di bawah nama sekolah.">
          <TextArea value={draft.tag} onChange={v => set('tag', v)} rows={2}
            placeholder="Sekolah berasrama di bawah naungan TNI AU di Boyolali, dengan kurikulum nasional dan IB." />
        </Field>
        <Field label="Fakta tambahan" hint="Opsional. Hal lain yang perlu diketahui siswa, misalnya lokasi kampus atau batas usia.">
          <StringList items={draft.facts} onChange={v => set('facts', v)} addLabel="Tambah fakta"
            placeholder="Boyolali, Jawa Tengah (kompleks Bandara Adi Soemarmo)" empty="Belum ada fakta tambahan." />
        </Field>
      </Section>

      <Section id="alur" title="Alur pendaftaran" icon="navTimeline" status={status.alur}
        desc="Dari tabel Alur Pendaftaran Sekolah di Notion. Tiap tahap cukup diisi sekali: dari sini dibuat Timeline, daftar deadline, dan jadwal di halaman sekolah.">
        <Field label="Status" hint="Sama dengan kolom Status di Notion">
          <Select value={draft.status} onChange={v => set('status', v)}
            options={[{ value: 'resmi', label: 'Resmi — jadwal tahun ini sudah diumumkan sekolah' }, { value: 'est', label: 'Perkiraan — mengikuti jadwal tahun lalu' }]} />
        </Field>
        <Field label="Catatan status untuk siswa" hint="Kotak info di atas halaman sekolah.">
          <TextArea value={draft.banner} onChange={v => set('banner', v)}
            placeholder="Jadwal 2027/28 belum rilis. Tanggal di bawah mengikuti pola tahun lalu, cek lagi saat pengumuman resmi keluar." />
        </Field>
        <Field label="Tahapan" hint="Satu baris per nomor di kolom Alur Pendaftaran, urut dari atas.">
          <RepeatList items={draft.phases} onChange={v => set('phases', v)}
            blank={() => ({ l: '', s: '', e: '', t: 'tes' as PhaseType, est: draft.status === 'est' })}
            addLabel="Tambah tahap" rowLabel={(item, i) => (i + 1) + '. ' + (item.l || 'Tahap baru')} empty="Belum ada tahap."
            render={(item, setItem) => (
              <>
                <Field label="Nama tahap" required><TextInput value={item.l} onChange={v => setItem({ l: v })} placeholder="Seleksi administrasi" /></Field>
                <div className={css.grid3}>
                  <Field label="Tanggal mulai" required>
                    <TextInput type="date" value={item.s} max={item.e || undefined} onChange={v => setItem({ s: v })} />
                  </Field>
                  <Field label="Tanggal selesai" hint="Kosongkan kalau hanya satu hari"
                    error={endsEarly(item) ? 'Tanggal selesai lebih awal dari tanggal mulai' : undefined}>
                    <TextInput type="date" value={item.e} min={item.s || undefined} invalid={endsEarly(item)} onChange={v => setItem({ e: v })} />
                  </Field>
                  <Field label="Jenis tahap"><Select value={item.t} onChange={v => setItem({ t: v })} options={PHASE_TYPES} /></Field>
                </div>
                <Switch checked={!!item.est} label="Tanggal tahap ini masih perkiraan"
                  note="Siswa melihat keterangan “perkiraan” di tahap ini. Matikan kalau tanggalnya sudah resmi."
                  onChange={v => setItem({ est: v })} />
              </>
            )} />
        </Field>
      </Section>

      <Section id="dokumen" title="Dokumen & link" icon="doc" status={status.dokumen}
        desc="Kolom Dokumen dan Link PPDB di Notion: pedoman pendaftaran, situs PPDB, dan arsip tahun lalu.">
        <RepeatList items={draft.docs} onChange={v => set('docs', v)} blank={() => ({ l: '', m: '', h: '', arsip: false })}
          addLabel="Tambah dokumen" rowLabel={item => item.l || 'Dokumen baru'} empty="Belum ada dokumen."
          render={(item, setItem) => (
            <>
              <Field label="Judul dokumen"><TextInput value={item.l} onChange={v => setItem({ l: v })} placeholder="Pedoman pendaftaran 2027/28" /></Field>
              <Field label="Keterangan"><TextInput value={item.m} onChange={v => setItem({ m: v })} placeholder="PDF resmi dari panitia, 24 halaman" /></Field>
              <Field label="Tautan"><TextInput type="url" value={item.h} onChange={v => setItem({ h: v })} placeholder="https://psb.praditadirgantara.sch.id/pedoman.pdf" /></Field>
              <Switch checked={item.arsip} label="Arsip tahun lalu"
                note="Ditandai kuning supaya siswa tahu ini bukan dokumen tahun ini." onChange={v => setItem({ arsip: v })} />
            </>
          )} />
      </Section>

      <div className={css.tier}>
        <h2 className={css.tierTitle}>Khusus KSU</h2>
        <p className={css.tierDesc}>Tidak ada di Notion. Disusun dari pedoman pendaftaran (PDF) sekolah, dan boleh dilengkapi belakangan. Klik judul bagian untuk membukanya.</p>
      </div>

      <Section id="syarat" title="Syarat utama" icon="navChecklist" status={status.syarat} collapsible
        desc="Ringkasan syarat di halaman profil sekolah.">
        <RepeatList items={draft.reqs} onChange={v => set('reqs', v)} blank={() => ({ k: '', v: '' })}
          addLabel="Tambah syarat" rowLabel={item => item.k || 'Syarat baru'} empty="Belum ada syarat."
          render={(item, setItem) => (
            <>
              <Field label="Nama syarat"><TextInput value={item.k} onChange={v => setItem({ k: v })} placeholder="Nilai rapor" /></Field>
              <Field label="Penjelasan"><TextArea value={item.v} onChange={v => setItem({ v })}
                  placeholder="B. Indonesia, B. Inggris, Matematika, IPA semester 1–5: rata-rata tiap mapel minimal 90." /></Field>
            </>
          )} />
      </Section>

      <Section id="kalkulator" title="Kalkulator syarat" icon="navKalkulator" status={status.kalkulator} collapsible
        desc="Batas nilai rapor yang dipakai halaman Kalkulator Syarat untuk mengecek nilai siswa.">
        <Switch checked={!!calc} label="Sekolah ini punya batas nilai rapor"
          note="Matikan kalau seleksi tidak memakai nilai rapor, seperti KTB."
          onChange={on => set('calc', on ? { subjects: ['Matematika'], sems: ['7-1'], minAvg: 85, minSem: null } : null)} />
        {calc ? (
          <>
            <Field label="Mata pelajaran">
              <TagInput label="Mata pelajaran" value={calc.subjects} onChange={v => set('calc', { ...calc, subjects: v })}
                placeholder="Matematika" suggestions={SUBJECTS} />
            </Field>
            <Field label="Semester yang dihitung" group hint="Format kelas-semester: 7-1 berarti kelas 7 semester 1.">
              <TagInput label="Semester yang dihitung" value={calc.sems} onChange={v => set('calc', { ...calc, sems: v })}
                placeholder="7-1" suggestions={SEMESTERS} sorted />
            </Field>
            <div className={css.grid2}>
              <Field label="Rata-rata minimal per mapel">
                <TextInput type="number" placeholder="85" value={String(calc.minAvg)} onChange={v => set('calc', { ...calc, minAvg: Number(v) || 0 })} />
              </Field>
              <Field label="Nilai minimal tiap semester" hint="Kosongkan kalau tidak ada batas per semester">
                <TextInput type="number" placeholder="80" value={calc.minSem == null ? '' : String(calc.minSem)}
                  onChange={v => set('calc', { ...calc, minSem: v === '' ? null : Number(v) || 0 })} />
              </Field>
            </div>
            <Field label="Penjelasan untuk siswa" hint="Tampil di atas tabel nilai: nilai rapor mana yang dipakai dan berapa batasnya.">
              <TextArea value={draft.calcNote} onChange={v => set('calcNote', v)}
                placeholder="Nilai pengetahuan rapor 5 semester (kelas 7 sem 1 s.d. kelas 9 sem 1). Syarat: rata-rata tiap mapel ≥ 90, tidak ada batas per semester." />
            </Field>
            <div className={css.grid2}>
              <Field label="Pesan kalau nilainya memenuhi" hint="Muncul di bawah tulisan “Memenuhi syarat nilai”. Isi langkah berikutnya.">
                <TextArea value={draft.passNote || ''} onChange={v => set('passNote', v)}
                  placeholder="Rata-rata memenuhi batas 90. Selanjutnya penentu adalah Tes Akademik." />
              </Field>
              <Field label="Pesan kalau nilainya belum memenuhi" hint="Muncul setelah daftar mapel yang kurang. Isi saran untuk siswa.">
                <TextArea value={draft.failNote || ''} onChange={v => set('failNote', v)}
                  placeholder="Nilai sem 1 kelas 9 masih dihitung, fokus naikkan di sana bila belum final." />
              </Field>
            </div>
          </>
        ) : (
          <>
            <Field label="Penjelasan untuk siswa" hint="Tampil di bagian atas halaman Kalkulator: kenapa sekolah ini tidak memakai nilai rapor.">
              <TextArea value={draft.calcNote} onChange={v => set('calcNote', v)}
                placeholder="Sekolah ini tidak memakai batas nilai rapor, seleksi murni lewat tes." />
            </Field>
            <Field label="Pesan pengganti hasil" hint="Muncul di bawah tulisan “Tidak ada ambang nilai rapor”, sebagai ganti hasil memenuhi/belum.">
              <TextArea value={draft.noGradeNote || ''} onChange={v => set('noGradeNote', v)}
                placeholder="Tidak ada gugur berkas, fokus persiapan ke tes potensi akademik." />
            </Field>
          </>
        )}
        <Field label="Catatan tinggi & berat badan" hint="Muncul di samping kolom tinggi dan berat badan siswa. Kosongkan kalau sekolah ini tidak menilai postur.">
          <TextArea value={draft.bodyNote || ''} onChange={v => set('bodyNote', v)} rows={2}
            placeholder="Tidak ada angka resmi, postur dinilai saat tes kesehatan. IMT 17–25 patokan aman." />
        </Field>
      </Section>

      <Section id="checklist" title="Checklist persiapan" icon="navChecklist" status={status.checklist} collapsible
        desc="Daftar tugas yang dicentang siswa. Urutannya sama dengan yang mereka lihat.">
        <RepeatList items={draft.checklist} onChange={v => set('checklist', v)}
          blank={(): ChecklistItem => ({ id: 'item-' + Date.now().toString(36), l: '', d: '', dl: '' })}
          addLabel="Tambah item checklist" rowLabel={item => item.l || 'Item baru'} empty="Belum ada item."
          render={(item, setItem) => (
            <>
              <Field label="Judul tugas">
                <TextInput value={item.l} onChange={v => setItem({ l: v, id: item.l ? item.id : slug(v) })} placeholder="Surat keterangan sehat dari dokter" />
              </Field>
              <Field label="Catatan" hint="Baris kecil di bawah judul"><TextInput value={item.note || ''} onChange={v => setItem({ note: v })} placeholder="Dari dokter pemerintah, maksimal 3 bulan terakhir" /></Field>
              <div className={css.grid2}>
                <Field label="Teks tenggat" hint="Yang terbaca siswa di sebelah tugas">
                  <TextInput value={item.d} onChange={v => setItem({ d: v })} placeholder="±2 Feb 2027" />
                </Field>
                <Field label="Tanggal tenggat" hint="Dipakai untuk menandai lewat tenggat">
                  <TextInput type="date" value={item.dl} onChange={v => setItem({ dl: v })} />
                </Field>
              </div>
              <Switch checked={!!item.up} label="Perlu lampiran berkas" onChange={v => setItem({ up: v })} />
              <Field label="Kolom isian" hint="Data yang diketik siswa di bawah tugas ini, seperti NISN atau akun pendaftaran">
                <RepeatList items={item.f || []} onChange={v => setItem({ f: v.length ? v : undefined })}
                  blank={() => ({ k: '', p: '' })} addLabel="Tambah kolom isian"
                  rowLabel={f => f.p || 'Kolom baru'} empty="Tidak ada kolom isian."
                  render={(f, setF) => (
                    <div className={css.grid2}>
                      <Field label="Kode kolom" hint="Huruf kecil tanpa spasi"><TextInput value={f.k} onChange={v => setF({ k: v })} placeholder="nisn" /></Field>
                      <Field label="Teks petunjuk"><TextInput value={f.p} onChange={v => setF({ p: v })} placeholder="NISN (10 digit)" /></Field>
                    </div>
                  )} />
              </Field>
            </>
          )} />
      </Section>

      <Section id="faq" title="FAQ" icon="navFaq" status={status.faq} collapsible
        desc="Pertanyaan yang sering ditanyakan orang tua dan siswa.">
        <RepeatList items={draft.faq} onChange={v => set('faq', v)} blank={() => ({ q: '', a: '' })}
          addLabel="Tambah pertanyaan" rowLabel={item => item.q || 'Pertanyaan baru'} empty="Belum ada pertanyaan."
          render={(item, setItem) => (
            <>
              <Field label="Pertanyaan"><TextInput value={item.q} onChange={v => setItem({ q: v })} placeholder="Apakah ada biaya pendaftaran?" /></Field>
              <Field label="Jawaban"><TextArea value={item.a} onChange={v => setItem({ a: v })} rows={4}
                placeholder="Tidak ada. Pendaftaran dan seluruh tahap seleksi gratis, peserta hanya menanggung biaya perjalanan ke lokasi tes." /></Field>
            </>
          )} />
      </Section>

      <div className={css.foot}>
        <button type="button" className={[css.btn, css.btnPrimary].join(' ')} onClick={onSave} disabled={!unpublished || problems.length > 0}>
          <Icon name="check" size={16} stroke={2.2} />{published ? 'Simpan' : 'Simpan & tampilkan ke siswa'}
        </button>
        <button type="button" className={css.btn} onClick={onSaveDraft} disabled={!dirty}>
          <Icon name="doc" size={16} />Simpan sebagai draft
        </button>
        {savedDraft ? (
          <button type="button" className={css.btn} onClick={onDiscardDraft}>
            <Icon name="trash" size={16} />Buang draft
          </button>
        ) : null}
        {isEdited && !savedDraft ? (
          <button type="button" className={css.btn} onClick={onReset}>
            <Icon name="reset" size={16} />Kembalikan ke data bawaan
          </button>
        ) : null}
        {saved && !dirty ? (
          <span className={css.saved}><Icon name="check" size={14} stroke={2.4} />Draft tersimpan</span>
        ) : null}
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
