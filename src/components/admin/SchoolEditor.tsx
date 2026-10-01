'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { ChecklistItem, ReqCategory, Requirement, School, SchoolInfo } from '@/data/types';
import { bundledDefault, inferPhaseType, isBundledSchool, newSchoolId, reqCategory, useSchoolsStore } from '@/lib/schools';
import Icon from '../Icon';
import { REQUIREMENT_GROUPS, requirementGroup, schoolProblems, automaticSchoolLabels, schoolShortName, schoolMonogram, updateRequirementText } from '@/lib/school-form';
import SchoolProfile from '../SchoolProfile';
import ChecklistCard from '../ChecklistCard';
import FaqCard from '../FaqCard';
import ChecklistSettings from './ChecklistSettings';
import css from './admin.module.css';
import {
  ChipLegend, ChipSet, Eyebrow, Field, PickChips, RepeatList, Section, StringList, Switch, TextArea, TextInput,
} from './fields';

// The section order follows the internal school spreadsheet.

const KINDS: { value: SchoolInfo['kind']; label: string }[] = [
  { value: 'Negeri', label: 'Negeri' },
  { value: 'Swasta', label: 'Swasta' },
];
// The "Asrama/Tidak" options used in the Notion catalog.
const BOARDING = ['Tersedia', 'Asrama Heterogen', 'Asrama Semi-Militer', 'Non-Asrama'].map(v => ({ value: v, label: v }));
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

/** ISO dates compare as text. */
const endsEarly = (p: { s: string; e: string }) => !!p.s && !!p.e && p.e < p.s;

type Part = 'profil' | 'alur' | 'syarat' | 'checklist' | 'faq';
const PART_LABEL: Record<Part, string> = {
  profil: 'Profil sekolah', alur: 'Alur pendaftaran', syarat: 'Persyaratan', checklist: 'Persyaratan dokumen', faq: 'FAQ',
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
  const [draft, setDraft] = useState<School>(() => automaticSchoolLabels(base));
  const [saved, setSaved] = useState(false);
  const [preview, setPreview] = useState(false);
  const advancedRef = useRef<HTMLDetailsElement>(null);
  const showAdvanced = () => {
    if (!advancedRef.current) return;
    advancedRef.current.open = true;
    advancedRef.current.scrollIntoView({ block: 'start' });
  };
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
    setDraft(d => automaticSchoolLabels({ ...d, ...p }));
    setSaved(false);
  };
  const set = <K extends keyof School>(k: K, v: School[K]) => patch({ [k]: v } as Pick<School, K>);

  // Short name and card label always follow their source fields. Code remains editable.
  const setName = (name: string) => patch({ name,
    ...(!draft.mono || draft.mono === schoolMonogram(schoolShortName(draft.name))
      ? { mono: schoolMonogram(schoolShortName(name)) } : {}),
  });
  const setInfo = (p: Partial<SchoolInfo>) => patch({ info: { ...draft.info, ...p } });

  const problems = schoolProblems(draft);

  // Publishing returns to the school list. A draft keeps the admin on the form, and the first draft
  // of a new school moves to that school's own address so a reload finds it.
  const store = (kind: 'draft' | 'publish', data: School) => {
    const next = automaticSchoolLabels({ ...data, id: data.id || newSchoolId() });
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
  const onSave = () => {
    if (schoolProblems(draft).length) return;
    store('publish', { ...draft, phases: draft.phases.map(p => ({ ...p, e: p.e || p.s })) });
  };

  const onDelete = () => {
    if (!window.confirm(`Hapus "${draft.name || draft.short || 'sekolah ini'}" untuk selamanya? Siswa yang menjadikannya target akan kehilangan checklist dan datanya untuk sekolah ini.`)) return;
    remove(school.id);
    router.replace('/admin/sekolah');
  };

  const onDiscardDraft = () => {
    discardDraft(school.id);
    if (!published) return router.replace('/admin/sekolah');
    setDraft(automaticSchoolLabels(school));
    setSaved(false);
  };

  const onReset = () => {
    reset(school.id);
    // Without this the form kept showing the old (overridden) values, so a later "Simpan" would
    // silently re-save them and undo the reset — refresh the form to the restored bundled data too.
    const def = bundledDefault(school.id);
    if (def) setDraft(automaticSchoolLabels(def));
    setSaved(false);
  };

  const calc = draft.calc;
  const info = draft.info;
  const documents = draft.checklist.filter(c => !!c.document);
  const tasks = draft.checklist.filter(c => !c.document);
  const updateChecklist = (id: string, changes: Partial<ChecklistItem>) => set('checklist', draft.checklist.map(c => c.id === id ? { ...c, ...changes } : c));

  const count = (n: number, unit: string) => ({ text: n ? n + ' ' + unit : 'Belum diisi', done: n > 0 });
  const profileGaps = [draft.name, draft.short, draft.mono, info.kind, info.province, info.boarding, draft.tag].filter(v => !v.trim()).length;
  const status: Record<Part, { text: string; done: boolean }> = {
    profil: { text: profileGaps ? profileGaps + ' kolom utama kosong' : 'Lengkap', done: !profileGaps },
    alur: count(draft.phases.filter(p => p.l.trim() && p.s && !endsEarly(p)).length, 'tahap terisi'),
    syarat: count(draft.reqs.filter(r => r.k.trim() && r.v.trim()).length, 'syarat terisi'),
    checklist: count(documents.filter(c => c.l.trim()).length, 'dokumen'),
    faq: count(draft.faq.filter(f => f.q.trim() && f.a.trim()).length, 'jawaban terisi'),
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
            {filled} dari 5 bagian terisi ·{' '}
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
          <a href={'#' + k} key={k} className={[css.progressPill, status[k].done ? css.progressDone : ''].join(' ')}>
            <i />{PART_LABEL[k]}
          </a>
        ))}
      </div>

      <Section id="profil" title="1. Profil sekolah" icon="navKatalog" status={status.profil}>
        <div className={css.group}>
          <Eyebrow>Identitas</Eyebrow>
          <div className={css.grid2}>
            <Field label="Nama sekolah" required>
              <TextInput value={draft.name} onChange={setName} placeholder="SMA Pradita Dirgantara" strong />
            </Field>
            <Field label="Kode" required>
              <TextInput value={draft.mono} onChange={v => set('mono', v.toUpperCase().slice(0, 4))} maxLength={4} placeholder="PD" code />
            </Field>
          </div>
          <p className={css.intro}>Nama pendek otomatis: <strong>{draft.short || '—'}</strong><br />Label kartu otomatis: <strong>{draft.pill || '—'}</strong></p>
        </div>

        <div className={css.group}>
          <Eyebrow>Klasifikasi</Eyebrow>
          <div className={css.grid3}>
            <Field label="Kategori (Negeri/Swasta)" group>
              <PickChips label="Negeri/Swasta" value={info.kind} options={KINDS} clearable="" onChange={v => setInfo({ kind: v })} />
            </Field>
            <Field label="Provinsi">
              <TextInput value={info.province} onChange={v => setInfo({ province: v })} placeholder="Jawa Tengah" />
            </Field>
            <Field label="Asrama" note="kosong = belum diketahui" group>
              <PickChips label="Asrama/Tidak" value={info.boarding} options={BOARDING} clearable="" onChange={v => setInfo({ boarding: v })} />
            </Field>
          </div>

        </div>

        <div className={css.group}>
          <div className={css.grid2}>
            <Field label="Kabupaten/kota"><TextInput value={info.city || ''} onChange={v => setInfo({ city: v })} placeholder="Kabupaten Bogor" /></Field>
            <Field label="Alamat / lokasi kampus"><TextInput value={info.address || ''} onChange={v => setInfo({ address: v })} placeholder="Cibinong" /></Field>
          </div>
        </div>
        <div className={[css.group, css.groupLoose].join(' ')}>
          <Eyebrow>Penerimaan siswa</Eyebrow>
          <div className={css.grid2}>

            <Field label="Sistem penerimaan"><TextInput value={info.admissionSystem || ''} onChange={v => setInfo({ admissionSystem: v })} placeholder="Tes seleksi" /></Field>
          </div>
          <RepeatList items={info.quotas || []} onChange={v => setInfo({ quotas: v })} blank={() => ({ year: '', seats: '' })}
            addLabel="Tambah kuota per tahun ajaran" rowLabel={q => q.year || 'Kuota penerimaan'}
            render={(q, update) => <div className={css.grid2}>
              <Field label="Tahun ajaran"><TextInput value={q.year} onChange={v => update({ year: v })} placeholder="2027-2028" /></Field>
              <Field label="Kuota siswa"><TextInput type="number" min="1" value={q.seats} onChange={v => update({ seats: v })} placeholder="180" /></Field>
            </div>} />
        </div>

        <div className={[css.group, css.groupLoose].join(' ')}>
          <div className={css.groupHead}>
            <Eyebrow>Kurikulum</Eyebrow>
            <ChipLegend />
          </div>

          <Field label="Kurikulum" group>
            <ChipSet label="Kurikulum" value={info.curriculum} onChange={v => setInfo({ curriculum: v })} options={CURRICULA} />
          </Field>
        </div>

        <div className={[css.group, css.groupLoose].join(' ')}>
          <Eyebrow>Kontak &amp; deskripsi</Eyebrow>
          <div className={css.grid3}>
            <Field label="Telepon"><TextInput value={info.phone || ''} onChange={v => setInfo({ phone: v })} placeholder="+62…" /></Field>
            <Field label="Email"><TextInput value={info.email || ''} onChange={v => setInfo({ email: v })} placeholder="admission@sekolah.sch.id" /></Field>
            <Field label="Website"><TextInput type="url" value={info.website || ''} onChange={v => setInfo({ website: v })} placeholder="https://…" /></Field>
          </div>

          <Field label="Tentang sekolah">
            <TextArea value={draft.tag} onChange={v => set('tag', v)} placeholder="Ringkasan sekolah seperti pada baris pembuka spreadsheet." />
          </Field>

        </div>
      </Section>

      <Section id="alur" title="2. Alur pendaftaran" icon="navTimeline" status={status.alur}>
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
              <div className={[css.grid3, css.gap].join(' ')}>
                <Field label="Kelompok tahap"><TextInput value={item.group || ''} onChange={v => setItem({ group: v })} placeholder="Tahap I" /></Field>
                <Field label="Media pelaksanaan"><TextInput value={item.mode || ''} onChange={v => setItem({ mode: v })} placeholder="Online / onsite" /></Field>
                <Field label="Lokasi / portal"><TextInput value={item.location || ''} onChange={v => setItem({ location: v })} placeholder="Portal calon siswa / kampus" /></Field>
              </div>
              <Field label="Keterangan, materi & bahasa ujian" className={css.gap}>
                <TextArea value={item.details || ''} onChange={v => setItem({ details: v })} rows={3} placeholder="Materi tes, bahasa pengantar, atau rincian seleksi terpusat…" />
              </Field>
              <div className={[css.grid2, css.gridEnd, css.gap].join(' ')}>
                <Field label="Mulai" required>
                  <TextInput type="date" value={item.s} max={item.e || undefined} onChange={v => setItem({ s: v })} />
                </Field>
                <Field label="Selesai" note="kosong = satu hari">
                  <TextInput type="date" value={item.e} min={item.s || undefined}
                    invalid={endsEarly(item)} onChange={v => setItem({ e: v })} />
                </Field>

              </div>
            </>
          )} />
      </Section>

      <Section id="syarat" title="3. Persyaratan" icon="navChecklist" status={status.syarat}>
        <p className={css.intro}>
          Isi satu syarat per baris, sesuai kelompok pada spreadsheet.
        </p>
        {REQUIREMENT_GROUPS.map(group => <div className={css.group} key={group.value}>
        <Eyebrow>{group.label}</Eyebrow>
        <RepeatList<Requirement> items={draft.reqs.filter(r => requirementGroup(r) === group.value)}
          onChange={v => set('reqs', [...draft.reqs.filter(r => requirementGroup(r) !== group.value), ...v])}
          blank={() => ({ group: group.value, cat: group.value === 'akademis' ? 'Akademik' : group.value === 'fisik' ? 'Kesehatan' : '', k: '', v: '' })}
          addLabel="Tambah syarat" rowLabel={item => item.k || 'Syarat baru'} empty="Belum ada syarat."
          render={(item, setItem) => (
            <Field label="Isi syarat" required>
              <TextArea value={item.v} onChange={v => setItem(updateRequirementText(item, v))}
                placeholder="Salin satu syarat dari spreadsheet…" rows={3} />
            </Field>
          )} />
        </div>)}

      </Section>

      <Section id="checklist" title="4. Persyaratan dokumen" icon="navChecklist" status={status.checklist}>
        <RepeatList items={documents} onChange={v => set('checklist', [...v, ...tasks])}
          blank={(): ChecklistItem => ({ id: crypto.randomUUID(), l: '', dl: '', document: { required: true, rules: [], template: '' } })}
          addLabel="Tambah persyaratan dokumen" rowLabel={item => item.l || 'Dokumen baru'} empty="Belum ada dokumen."
          render={(item, setItem) => (
            <>
              <Field label="Nama dokumen" required><TextInput value={item.l} onChange={l => setItem({ l })} placeholder="Scan KTP Ayah/Wali" /></Field>
              <div className={css.documentFields}>
                <Field label="Kategori dokumen" group>
                  <PickChips label="Kategori dokumen" value={item.document!.required ? 'wajib' : 'opsional'} options={[{ value: 'wajib', label: 'Wajib' }, { value: 'opsional', label: 'Opsional' }]}
                    onChange={v => setItem({ document: { ...item.document!, required: v === 'wajib' } })} />
                </Field>
                <RepeatList items={item.document!.rules} onChange={rules => setItem({ document: { ...item.document!, rules } })}
                  blank={() => ({ format: '', maxMB: '' })} addLabel="Tambah format file" rowLabel={r => r.format || 'Format file'}
                  render={(rule, update) => <div className={css.grid2}>
                    <Field label="Format file" required><TextInput value={rule.format} onChange={format => update({ format })} placeholder="JPG/PNG atau PDF" /></Field>
                    <Field label="Ukuran maksimum (MB)" required><TextInput type="number" min="0.01" value={rule.maxMB} onChange={maxMB => update({ maxMB })} placeholder="5" /></Field>
                  </div>} />
                <Field label="Tautan template" note="opsional"><TextInput type="url" value={item.document!.template} onChange={template => setItem({ document: { ...item.document!, template } })} placeholder="https://…" /></Field>
              </div>
            </>
          )} />
        {tasks.length > 0 && <p className={css.intro}>{tasks.length} tugas tambahan tersedia di <button type="button" className={css.inlineLink} onClick={showAdvanced}>Pengaturan lanjutan</button>.</p>}
      </Section>

      <Section id="faq" title="5. FAQ" icon="navFaq" status={status.faq}>
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

      <details id="lanjutan" ref={advancedRef} className={[css.section, css.advanced].join(' ')}>
        <summary>Pengaturan lanjutan <span>Opsional · pengaturan aplikasi dan informasi tambahan</span></summary>
        <div className={css.sectionBody}>
          <Eyebrow>Profil tambahan</Eyebrow>
          <div className={[css.grid3, css.gap].join(' ')}>
            <Field label="Tahun berdiri"><TextInput value={info.founded} onChange={v => setInfo({ founded: v })} placeholder="2018" /></Field>
            {info.quota && !info.quotas?.length ? <Field label="Kuota lama" note="belum dikaitkan tahun ajaran"><TextInput value={info.quota} onChange={v => setInfo({ quota: v })} /></Field> : null}
          </div>
            <Field label="Periode penerimaan" note="untuk jadwal dan syarat di halaman ini"><TextInput value={info.admissionYear || ''} onChange={v => setInfo({ admissionYear: v })} placeholder="2027-2028" /></Field>
          <Field label="Pembiayaan" group>
            <ChipSet label="Pembiayaan" value={info.funding} onChange={v => setInfo({ funding: v })} options={FUNDING} fixed sorted />
          </Field>
          <Field label="Kontak lainnya / catatan kontak">
            <TextInput value={info.contact} onChange={v => setInfo({ contact: v })} placeholder="Instagram atau kontak tambahan" />
          </Field>
          <Field label="Informasi tambahan" group>
            <StringList items={draft.facts} onChange={v => set('facts', v)} addLabel="Tambah informasi"
              placeholder="Lokasi kampus, batas usia, dll." />
          </Field>
          <Eyebrow>Status jadwal</Eyebrow>
        <div className={css.gridStatus}>
          <Field label="Status jadwal" group>
            <PickChips label="Status jadwal" value={draft.status} options={STATUSES} onChange={v => set('status', v)} />
          </Field>
          <Field label="Catatan status untuk siswa">
            <TextArea value={draft.banner} onChange={v => set('banner', v)} placeholder="Jadwal 2027/28 belum rilis. Tanggal mengikuti pola tahun lalu…" />
          </Field>
        </div>

          {draft.phases.map((phase, i) => <div key={i} className={css.group}>
            <Switch checked={!!phase.est} label={`${phase.l || 'Tahap ' + (i + 1)} · tanggal perkiraan`}
              onChange={est => set('phases', draft.phases.map((p, j) => j === i ? { ...p, est } : p))} />
          </div>)}
          <details className={css.subsection}>
            <summary>Detail persyaratan</summary>
            {draft.reqs.length === 0 && <p className={css.intro}>Tambahkan syarat di bagian Persyaratan terlebih dahulu.</p>}
            {draft.reqs.map((item, i) => {
              const cat = reqCategory(item);
              const spec = cat ? DETAIL[cat] : undefined;
              const setItem = (p: Partial<Requirement>) => set('reqs', draft.reqs.map((r, j) => j === i ? { ...r, ...p } : r));
              return <div key={i} className={[css.row, css.advancedRow].join(' ')}>
                <p className={css.intro}>{item.v || 'Syarat ' + (i + 1)}</p>
                <Field label="Nama syarat" note="otomatis dari isi syarat; dapat disesuaikan"><TextInput value={item.k} onChange={k => setItem({ k })} /></Field>
                <Field label="Kelompok persyaratan" group><PickChips label="Kelompok persyaratan" value={requirementGroup(item)} options={[...REQUIREMENT_GROUPS]} onChange={group => setItem({ group })} /></Field>
                <Field label="Kategori detail" group><PickChips<ReqCategory | ''> label="Kategori detail" value={cat} options={CATEGORIES.map(c => ({ value: c, label: c }))} onChange={cat => setItem({ cat })} /></Field>
                {spec && <>
                  <Eyebrow>{spec.title}</Eyebrow>
                  <div className={css.grid2}>{spec.fields.map(([k, label, placeholder, type]) => <Field key={k} label={label}>
                    <TextInput type={type} value={item.det?.[k] || ''} placeholder={placeholder} onChange={v => setItem({ det: { ...item.det, [k]: v } })} />
                  </Field>)}</div>
                </>}
              </div>;
            })}
          </details>
        <details className={css.subsection}>
        <summary>Aturan nilai rapor & kalkulator</summary>
        <p className={css.intro}>Aktifkan setelah aturan rata-rata dan nilai per semester jelas. Pengecualian prestasi atau konversi nilai ditulis dalam penjelasan dan FAQ.</p>
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
                <TextInput type="number" min="0" max="100" placeholder="85" value={String(calc.minAvg)} onChange={v => set('calc', { ...calc, minAvg: Number(v) || 0 })} />
              </Field>
              <Field label="Nilai minimal tiap semester" note="opsional">
                <TextInput type="number" min="0" max="100" placeholder="Kosong = tidak ada batas" value={calc.minSem == null ? '' : String(calc.minSem)}
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
        </details>
          <details className={css.subsection}>
            <summary>Tenggat & kolom isian dokumen</summary>
            {documents.length === 0 && <p className={css.intro}>Tambahkan dokumen di bagian Persyaratan dokumen terlebih dahulu.</p>}
            {documents.map(item => <div key={item.id} className={[css.row, css.advancedRow].join(' ')}>
              <Eyebrow>{item.l || 'Dokumen baru'}</Eyebrow>
              <ChecklistSettings item={item} onChange={p => updateChecklist(item.id, p)} />
            </div>)}
          </details>
          <details className={css.subsection}>
            <summary>Tugas tambahan ({tasks.length})</summary>
            <RepeatList items={tasks} onChange={v => set('checklist', [...documents, ...v])}
              blank={(): ChecklistItem => ({ id: crypto.randomUUID(), l: '', dl: '' })}
              addLabel="Tambah tugas non-dokumen" rowLabel={item => item.l || 'Tugas baru'} empty="Belum ada tugas tambahan."
              render={(item, update) => <>
                <Field label="Judul tugas tambahan" required><TextInput value={item.l} onChange={l => update({ l })} /></Field>
                <ChecklistSettings item={item} onChange={update} />
                <button type="button" className={css.btn} onClick={() => update({ document: { required: true, rules: [], template: '' } })}>Jadikan persyaratan dokumen</button>
              </>} />
          </details>
      <div className={css.group}><Eyebrow>Referensi · pedoman, brosur & arsip</Eyebrow>
        <RepeatList items={draft.docs} onChange={v => set('docs', v)} blank={() => ({ l: '', m: '', h: '', arsip: false })}
          addLabel="Tambah referensi" rowLabel={item => item.l || 'Dokumen baru'} empty="Belum ada dokumen."
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
      </div>

        </div>
      </details>

      <div className={css.foot}>
        <button type="button" className={css.btn} aria-expanded={preview} onClick={() => setPreview(v => !v)}>{preview ? 'Tutup pratinjau' : 'Pratinjau untuk siswa'}</button>
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

ˆø      </div>
      {preview ? <section className={css.preview} aria-label="Pratinjau untuk siswa">
        <h2>Pratinjau untuk siswa</h2>
        <p className={css.intro}>Menampilkan isian saat ini. Draft belum dipublikasikan. Checklist pada pratinjau tidak mengubah progres siswa.</p>
        <SchoolProfile school={draft} preview />
        <ChecklistCard school={draft} preview />
        {calc ? <p className={css.intro}>Kalkulator: {calc.subjects.join(', ')} · semester {calc.sems.join(', ')} · rata-rata minimal {calc.minAvg}{calc.minSem != null ? ` · tiap semester minimal ${calc.minSem}` : ''}. {draft.calcNote}</p> : null}
        <FaqCard school={draft} />
      </section> : null}
    </div>
  );
}
