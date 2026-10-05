'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { SCHOOL_COLORS, type ChecklistItem, type IconKey, type Requirement, type Review, type School, type SchoolColor, type SchoolInfo } from '@/data/types';
import { sc, schoolColor } from '@/lib/murid';
import { bundledDefault, inferPhaseType, isBundledSchool, newSchoolId, useSchoolsStore } from '@/lib/schools';
import Icon from '../Icon';
import { REQUIREMENT_GROUPS, ageQuestion, ageText, gradeText, requirementGroup, schoolProblems, automaticSchoolLabels, schoolShortName, schoolMonogram, toFormShape, updateRequirementText } from '@/lib/school-form';
import SchoolProfile from '../SchoolProfile';
import SchoolCard from '../SchoolCard';
import ChecklistCard from '../ChecklistCard';
import ForumThreads from '../murid/ForumThreads';
import CekSyaratModal from '../murid/CekSyaratModal';
import ChecklistSettings from './ChecklistSettings';
import PhotoUploader from './PhotoUploader';
import { cleanPhotos } from '@/lib/photos';
import css from './admin.module.css';
import {
  AddButton, ChipLegend, ChipSet, Eyebrow, Field, LineList, PickChips, RepeatList, Section, Switch, TextArea, TextInput,
} from './fields';

// The sections follow the student's school page from top to bottom (Claude Design "Murid v3"): card and header,
// the Tentang / Fasilitas / Alumni / Ulasan tabs, the registration panel, then Cek syarat, Checklist and Forum.

const KINDS: { value: SchoolInfo['kind']; label: string }[] = [
  { value: 'Negeri', label: 'Negeri' },
  { value: 'Swasta', label: 'Swasta' },
];
// The "Asrama/Tidak" options used in the Notion catalog.
const BOARDING = ['Tersedia', 'Asrama Heterogen', 'Asrama Semi-Militer', 'Non-Asrama'].map(v => ({ value: v, label: v }));
const FUNDING = ['Beasiswa', 'Berbayar'];
// Kurikulum tags already used in the Notion catalog; any other can be typed in.
const CURRICULA = ['Kurikulum Merdeka', 'Kurikulum Nasional', 'Kurikulum K-13', 'Cambridge', 'International Baccalaureate', 'Olimpiade'];
// Suggestions for "Provinsi": the Katalog's Lokasi filter lists exactly what is typed, so spelling must match.
const PROVINCES = ['Aceh', 'Sumatera Utara', 'Sumatera Barat', 'Riau', 'Kepulauan Riau', 'Jambi', 'Sumatera Selatan', 'Bangka Belitung', 'Bengkulu', 'Lampung',
  'DKI Jakarta', 'Banten', 'Jawa Barat', 'Jawa Tengah', 'DI Yogyakarta', 'Jawa Timur', 'Bali', 'Nusa Tenggara Barat', 'Nusa Tenggara Timur',
  'Kalimantan Barat', 'Kalimantan Tengah', 'Kalimantan Selatan', 'Kalimantan Timur', 'Kalimantan Utara', 'Sulawesi Utara', 'Gorontalo', 'Sulawesi Tengah',
  'Sulawesi Barat', 'Sulawesi Selatan', 'Sulawesi Tenggara', 'Maluku', 'Maluku Utara', 'Papua', 'Papua Barat', 'Papua Selatan', 'Papua Tengah', 'Papua Pegunungan', 'Papua Barat Daya'];
const STATUSES: { value: School['status']; label: string }[] = [
  { value: 'resmi', label: 'Resmi — sudah diumumkan' },
  { value: 'est', label: 'Perkiraan — ikut tahun lalu' },
];

const SUBJECTS = ['B. Indonesia', 'B. Inggris', 'Matematika', 'IPA', 'IPS'];
/** ISO dates compare as text. */
const endsEarly = (p: { s: string; e: string }) => !!p.s && !!p.e && p.e < p.s;

const COLOR_LABEL: Record<SchoolColor, string> = { hijau: 'Hijau', biru: 'Biru', kuning: 'Kuning', merah: 'Merah', ungu: 'Ungu' };
const ICONS: { value: IconKey; label: string }[] = [
  { value: 'spark', label: 'Bintang' }, { value: 'shield', label: 'Perisai' }, { value: 'home', label: 'Asrama' },
  { value: 'cap', label: 'Toga' }, { value: 'book', label: 'Buku' }, { value: 'lab', label: 'Lab' }, { value: 'pc', label: 'Komputer' },
  { value: 'trophy', label: 'Piala' }, { value: 'heart', label: 'Kesehatan' }, { value: 'globe', label: 'Dunia' },
  { value: 'wave', label: 'Kolam' }, { value: 'users', label: 'Orang' },
];
const FACT_LABELS = ['BERDIRI', 'PENGELOLA', 'KAMPUS PUSAT', 'LUAS KAMPUS', 'SISTEM', 'KUOTA', 'JALUR', 'SELEKSI', 'KONTAK'];
const RATINGS = ['1', '2', '3', '4', '5'].map(v => ({ value: v, label: v + '★' }));
const num = (v: string) => (v.trim() === '' ? 0 : Math.max(0, Number(v) || 0));

function IconSelect({ value, onChange, label }: { value: IconKey; onChange: (v: IconKey) => void; label: string }) {
  return (
    <span className={css.iconPick}>
      <Icon name={value} size={20} stroke={1.6} />
      <select className={css.input} aria-label={label} value={value} onChange={e => onChange(e.target.value as IconKey)}>
        {ICONS.map(i => <option key={i.value} value={i.value}>{i.label}</option>)}
      </select>
    </span>
  );
}

type Part = 'header' | 'tentang' | 'fasilitas' | 'alumni' | 'ulasan' | 'pendaftaran' | 'syarat' | 'faq';
const PART_LABEL: Record<Part, string> = {
  header: 'Card & headline', tentang: 'Tentang', fasilitas: 'Fasilitas', alumni: 'Alumni & prestasi', ulasan: 'Ulasan',
  pendaftaran: 'Panel pendaftaran', syarat: 'Syarat, berkas & tugas', faq: 'Forum',
};

/**
 * `school` is what students read now (blank for a school not published yet); `savedDraft` is unfinished work
 * stored apart from it. The form opens on the draft when there is one.
 */
export default function SchoolEditor({ school, published, savedDraft }: { school: School; published: boolean; savedDraft: School | null }) {
  const router = useRouter();
  const { save, saveDraft, discardDraft, reset, remove } = useSchoolsStore.getState();
  const isEdited = useSchoolsStore(s => !!s.overrides[school.id]);
  // The form works on its own shape (see toFormShape); comparing against that keeps an untouched form clean.
  const base = useMemo(() => toFormShape(savedDraft ?? school), [savedDraft, school]);
  const [draft, setDraft] = useState<School>(base);
  const [saved, setSaved] = useState(false);
  const [preview, setPreview] = useState(false);
  const [cekOpen, setCekOpen] = useState(false);
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
    void cleanPhotos();
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
    void cleanPhotos();
    router.replace('/admin/sekolah');
  };

  const onDiscardDraft = () => {
    discardDraft(school.id);
    void cleanPhotos();
    if (!published) return router.replace('/admin/sekolah');
    setDraft(toFormShape(school));
    setSaved(false);
  };

  const onReset = () => {
    reset(school.id);
    void cleanPhotos();
    // Without this the form kept showing the old (overridden) values, so a later "Simpan" would
    // silently re-save them and undo the reset — refresh the form to the restored bundled data too.
    const def = bundledDefault(school.id);
    if (def) setDraft(toFormShape(def));
    setSaved(false);
  };

  const info = draft.info;

  const count = (n: number, unit: string, optional = false) => ({ text: n ? n + ' ' + unit : optional ? 'Opsional' : 'Belum diisi', done: n > 0 });
  const docs = draft.checklist.filter(c => c.document);
  const tasks = draft.checklist.filter(c => !c.document);
  const reqCount = draft.reqs.filter(r => r.k.trim() && r.v.trim()).length;
  const hasGradeRow = draft.reqs.some(r => r.kind === 'nilai');
  const hasAgeRow = draft.reqs.some(r => r.kind === 'usia');
  const gaps = (vals: string[]) => vals.filter(v => !v.trim()).length;
  const headerGaps = gaps([draft.name, draft.mono, draft.tag, info.kind, info.province, info.boarding]);
  const tentangRows = (draft.profile || []).filter(r => r.k.trim() && r.v.trim()).length;
  const status: Record<Part, { text: string; done: boolean }> = {
    header: { text: headerGaps ? headerGaps + ' kolom utama kosong' : 'Lengkap', done: !headerGaps },
    tentang: !draft.about?.trim() ? { text: 'Deskripsi kosong', done: false } : count(tentangRows, 'baris fakta'),
    fasilitas: count(draft.facilities?.length ?? 0, 'fasilitas', true),
    alumni: count((draft.alumni?.length ?? 0) + (draft.achievements?.length ?? 0), 'data', true),
    ulasan: count(draft.reviews?.length ?? 0, 'ulasan', true),
    pendaftaran: count(draft.phases.filter(p => p.l.trim() && p.s && !endsEarly(p)).length, 'tahap terisi'),
    syarat: { text: reqCount || docs.length ? `${reqCount} syarat · ${docs.length} berkas` + (tasks.length ? ` · ${tasks.length} tugas` : '') : 'Belum diisi', done: reqCount > 0 },
    faq: count(draft.faq.filter(f => f.q.trim() && f.a.trim()).length, 'jawaban terisi'),
  };
  const filled = Object.values(status).filter(s => s.done).length;

  const confirmLeave = (e: React.MouseEvent) => {
    if (dirty && !window.confirm('Ada perubahan yang belum disimpan. Tinggalkan halaman ini?')) e.preventDefault();
  };

  return (
    <div className={css.editor} {...sc(draft)}>
      <div className={css.head}>
        <Link href="/admin/sekolah" className={css.back} aria-label="Kembali ke semua sekolah" title="Semua sekolah" onClick={confirmLeave}>
          <Icon name="arrowLeft" size={20} />
        </Link>
        <div className={css.headText}>
          <h1 className={css.title}>{draft.name || (isNew ? 'Sekolah baru' : 'Tanpa nama')}</h1>
          <p className={css.lead}>
            {filled} dari {Object.keys(status).length} bagian terisi ·{' '}
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

      <Section id="header" title="1. Card & headline" icon="navKatalog" status={status.header}>
        <div className={css.group}>
          <Field label="Foto sekolah" note="maks. 5, foto pertama jadi foto utama" group>
            <PhotoUploader photos={draft.photos || []} onChange={v => set('photos', v)} />
          </Field>
        </div>

        <div className={css.group}>
          <Eyebrow>Identitas</Eyebrow>
          <div className={css.grid2}>
            <Field label="Nama sekolah" required>
              <TextInput value={draft.name} onChange={setName} placeholder="SMA Taruna Nusantara" strong />
            </Field>
            <Field label="Kode" required>
              <TextInput value={draft.mono} onChange={v => set('mono', v.toUpperCase().slice(0, 4))} maxLength={4} placeholder="TN" code />
            </Field>
          </div>
          <div className={[css.grid2, css.gap].join(' ')}>
            <Field label="Kalimat di kartu Katalog" required>
              <TextInput value={draft.tag} onChange={v => set('tag', v)} placeholder="Sekolah berasrama semi-militer di 6 kampus" />
            </Field>
            <Field label="Lokasi di bawah nama" note="kosong = kota, provinsi">
              <TextInput value={draft.location || ''} onChange={v => set('location', v)} placeholder="Magelang (pusat) · Cimahi · Malang" />
            </Field>
          </div>
          <Field label="Warna sekolah" group className={css.gap}>
            <PickChips label="Warna sekolah" value={schoolColor(draft)} onChange={v => set('color', v)}
              options={SCHOOL_COLORS.map(c => ({ value: c, label: COLOR_LABEL[c] }))} />
          </Field>
        </div>

        <div className={css.group}>
          <Eyebrow>Sorotan</Eyebrow>
          <LineList items={draft.highlights || []} onChange={v => set('highlights', v)} cols="150px 1.4fr 2fr" head={['Ikon', 'Judul', 'Keterangan']}
            blank={() => ({ icon: 'spark' as IconKey, t: '', d: '' })} addLabel="Tambah sorotan" empty="Belum ada sorotan."
            render={(h, setH) => <>
              <IconSelect label="Ikon sorotan" value={h.icon} onChange={icon => setH({ icon })} />
              <TextInput label="Judul sorotan" value={h.t} onChange={t => setH({ t })} placeholder="Gratis + beasiswa penuh" medium />
              <TextInput label="Keterangan sorotan" value={h.d} onChange={d => setH({ d })} placeholder="Pendaftaran gratis dan siswa diterima dapat beasiswa penuh." />
            </>} />
        </div>

        <div className={[css.group, css.groupLoose].join(' ')}>
          <div className={css.groupHead}>
            <Eyebrow>Filter Katalog</Eyebrow>
            <ChipLegend />
          </div>
          <div className={css.grid3}>
            <Field label="Negeri/Swasta" group>
              <PickChips label="Negeri/Swasta" value={info.kind} options={KINDS} clearable="" onChange={v => setInfo({ kind: v })} />
            </Field>
            <Field label="Asrama" group>
              <PickChips label="Asrama" value={info.boarding} options={BOARDING} clearable="" onChange={v => setInfo({ boarding: v })} />
            </Field>
            <Field label="Biaya" note="Beasiswa saja = tag Gratis" group>
              <ChipSet label="Biaya" value={info.funding} onChange={v => setInfo({ funding: v })} options={FUNDING} fixed sorted />
            </Field>
          </div>
          <div className={[css.grid3, css.gap].join(' ')}>
            <Field label="Provinsi">
              <TextInput value={info.province} onChange={v => setInfo({ province: v })} placeholder="Jawa Tengah" list="daftar-provinsi" />
              <datalist id="daftar-provinsi">{PROVINCES.map(p => <option key={p} value={p} />)}</datalist>
            </Field>
            <Field label="Kabupaten/kota"><TextInput value={info.city || ''} onChange={v => setInfo({ city: v })} placeholder="Magelang" /></Field>
            <Field label="Jumlah kampus" note="opsional"><TextInput type="number" min="1" value={info.campusCount ? String(info.campusCount) : ''} onChange={v => setInfo({ campusCount: Number(v) > 0 ? Math.round(Number(v)) : undefined })} placeholder="1" /></Field>
          </div>
          <Field label="Kurikulum" group className={css.gap}>
            <ChipSet label="Kurikulum" value={info.curriculum} onChange={v => setInfo({ curriculum: v })} options={CURRICULA} />
          </Field>
        </div>
      </Section>

      <Section id="tentang" title="2. Tentang" icon="book" status={status.tentang}>
        <Field label="Deskripsi sekolah" required>
          <TextArea value={draft.about || ''} onChange={v => set('about', v)} rows={4} placeholder="SMA Taruna Nusantara adalah sekolah berasrama yang…" />
        </Field>
        <div className={css.group}>
          <Eyebrow>Fakta</Eyebrow>
          <datalist id="fakta-label">{FACT_LABELS.map(l => <option key={l} value={l} />)}</datalist>
          <LineList items={draft.profile || []} onChange={v => set('profile', v)} cols="1fr 2fr" head={['Label', 'Isi']}
            blank={() => ({ k: '', v: '' })} addLabel="Tambah baris" empty="Belum ada fakta."
            render={(r, setR) => <>
              <TextInput label="Label fakta" value={r.k} onChange={k => setR({ k: k.toUpperCase() })} placeholder="BERDIRI" list="fakta-label" code />
              <TextInput label="Isi fakta" value={r.v} onChange={v => setR({ v })} placeholder="14 Juli 1990" />
            </>} />
        </div>
        <div className={css.group}>
          <Eyebrow>Kurikulum</Eyebrow>
          <LineList items={draft.curriculumCards || []} onChange={v => set('curriculumCards', v)} cols="1fr 2fr" head={['Judul', 'Keterangan']}
            blank={() => ({ t: '', d: '' })} addLabel="Tambah kurikulum" empty="Belum ada. Siswa melihat kurikulum dari filter Katalog."
            render={(c, setC) => <>
              <TextInput label="Judul kurikulum" value={c.t} onChange={t => setC({ t })} placeholder="Kurikulum Nasional" medium />
              <TextInput label="Keterangan kurikulum" value={c.d} onChange={d => setC({ d })} placeholder="Peminatan IPA/IPS dengan standar akademik tinggi." />
            </>} />
        </div>
      </Section>

      <Section id="fasilitas" title="3. Fasilitas" icon="home" status={status.fasilitas}>
        <LineList items={draft.facilities || []} onChange={v => set('facilities', v)} cols="150px 1fr" head={['Ikon', 'Fasilitas']}
          blank={() => ({ icon: 'home' as IconKey, t: '' })} addLabel="Tambah fasilitas" empty="Belum ada fasilitas."
          render={(f, setF) => <>
            <IconSelect label="Ikon fasilitas" value={f.icon} onChange={icon => setF({ icon })} />
            <TextInput label="Nama fasilitas" value={f.t} onChange={t => setF({ t })} placeholder="Laboratorium sains" />
          </>} />
      </Section>

      <Section id="alumni" title="4. Alumni & prestasi" icon="trophy" status={status.alumni}>
        <div className={css.grid2}>
          <Field label="Periode data lulusan"><TextInput value={draft.alumniYear || ''} onChange={v => set('alumniYear', v)} placeholder="Lulusan 2022–2025" /></Field>
        </div>
        <Field label="Sebaran lulusan" group className={css.gap}>
          <LineList items={draft.alumni || []} onChange={v => set('alumni', v)} cols="2fr 110px" head={['Tujuan', 'Persen']}
            blank={() => ({ k: '', v: 0, campuses: [] })} addLabel="Tambah tujuan lulusan" empty="Belum ada data."
            render={(a, setA) => <>
              <TextInput label="Tujuan lulusan" value={a.k} onChange={k => setA({ k })} placeholder="PTN dalam negeri" medium />
              <TextInput label="Persen" type="number" min="0" max="100" value={a.v ? String(a.v) : ''} onChange={v => setA({ v: Math.min(100, num(v)) })} placeholder="58" />
            </>} />
          {(draft.alumni || []).length > 0 && (
            <details className={css.fold}>
              <summary>Kampus tujuan per kategori</summary>
              {(draft.alumni || []).map((a, i) => (
                <Field key={i} label={a.k || 'Tujuan ' + (i + 1)} group className={css.gap}>
                  <LineList items={a.campuses || []} cols="2fr 110px" head={['Kampus', 'Alumni']}
                    onChange={v => set('alumni', (draft.alumni || []).map((x, j) => (j === i ? { ...x, campuses: v } : x)))}
                    blank={() => ({ n: '', c: 0 })} addLabel="Tambah kampus"
                    render={(c, setC) => <>
                      <TextInput label="Kampus" value={c.n} onChange={n => setC({ n })} placeholder="Universitas Indonesia" />
                      <TextInput label="Jumlah alumni" type="number" min="0" value={c.c ? String(c.c) : ''} onChange={v => setC({ c: num(v) })} placeholder="42" />
                    </>} />
                </Field>
              ))}
            </details>
          )}
        </Field>
        <Field label="Prestasi" group className={css.gap}>
          <LineList items={draft.achievements || []} onChange={v => set('achievements', v)} cols="3fr 130px" head={['Prestasi', 'Waktu']}
            blank={() => ({ t: '', yr: '' })} addLabel="Tambah prestasi" empty="Belum ada prestasi."
            render={(a, setA) => <>
              <TextInput label="Prestasi" value={a.t} onChange={t => setA({ t })} placeholder="Medali emas OSN Fisika" medium />
              <TextInput label="Waktu" value={a.yr} onChange={yr => setA({ yr })} placeholder="Jul 2026" />
            </>} />
        </Field>
        <div className={[css.grid2, css.gap].join(' ')}>
          <Field label="Prestasi terakhir diperbarui"><TextInput value={draft.achievementsUpdated || ''} onChange={v => set('achievementsUpdated', v)} placeholder="Okt 2026" /></Field>
        </div>
      </Section>

      <Section id="ulasan" title="5. Ulasan alumni" icon="chats" status={status.ulasan}>
        <RepeatList items={draft.reviews || []} onChange={v => set('reviews', v)}
          blank={(): Review => ({ name: '', role: '', title: '', text: '', rating: 5, date: '' })} addLabel="Tambah ulasan" empty="Belum ada ulasan."
          rowLabel={(r, i) => 'Ulasan ' + (i + 1) + (r.name ? ' · ' + r.name : '')} removeLabel="Hapus ulasan"
          render={(r, setR) => (
            <div className={css.reviewBox}>
              <div className={css.grid2}>
                <Field label="Nama"><TextInput value={r.name} onChange={name => setR({ name })} placeholder="Alumni A" medium /></Field>
                <Field label="Keterangan"><TextInput value={r.role} onChange={role => setR({ role })} placeholder="Angkatan 30 · kini di ITB" /></Field>
              </div>
              <Field label="Judul ulasan"><TextInput value={r.title} onChange={title => setR({ title })} placeholder="Tiga tahun yang mengubah cara aku belajar" /></Field>
              <Field label="Isi ulasan" note="baris kosong = paragraf baru"><TextArea value={r.text} onChange={text => setR({ text })} rows={4} placeholder="Waktu pertama masuk…" /></Field>
              <div className={css.grid2}>
                <Field label="Bintang" group><PickChips label="Bintang" value={String(r.rating)} options={RATINGS} onChange={v => setR({ rating: Number(v) })} /></Field>
                <Field label="Bulan ditulis"><TextInput type="month" value={r.date || ''} onChange={date => setR({ date })} /></Field>
              </div>
            </div>
          )} />
      </Section>

      <Section id="pendaftaran" title="6. Panel pendaftaran" icon="navTimeline" status={status.pendaftaran}>
        <div className={css.group}>
          <Eyebrow>Status info</Eyebrow>
          <div className={css.gridStatus}>
            <Field label="Status jadwal" group>
              <PickChips label="Status jadwal" value={draft.status} options={STATUSES} onChange={v => set('status', v)} />
            </Field>
            <Field label="Tahun ajaran"><TextInput value={info.admissionYear || ''} onChange={v => setInfo({ admissionYear: v })} placeholder="2027-2028" /></Field>
          </div>
          <Field label="Catatan status" className={css.gap}>
            <TextArea value={draft.banner} onChange={v => set('banner', v)} placeholder="Pendaftaran 2027/28 resmi dibuka 9–23 Sep 2026. Jadwal tahap berikutnya masih estimasi." />
          </Field>
        </div>

        <div className={css.group}>
          <Eyebrow>Keterangan biaya</Eyebrow>
          <TextArea value={draft.cost?.long || ''} onChange={v => set('cost', v ? { long: v } : undefined)} rows={2}
            placeholder="Pendaftaran dan seleksi gratis, siswa yang diterima mendapat beasiswa penuh." />
        </div>

        <div className={css.group}>
          <Eyebrow>Timeline pendaftaran</Eyebrow>
          <RepeatList items={draft.phases} onChange={v => set('phases', v)}
            blank={() => ({ l: '', s: '', e: '', t: 'tes' as const, est: draft.status === 'est' })}
            addLabel="Tambah tahap" rowLabel={(item, i) => (i + 1) + '. ' + (item.l || 'Tahap baru')} empty="Belum ada tahap."
            render={(item, setItem) => (
              <>
                <Field label="Nama tahap" required>
                  {/* The kind (registration / test / announcement) follows the name; see inferPhaseType. */}
                  <TextInput value={item.l} onChange={v => setItem({ l: v, t: inferPhaseType(v) })} placeholder="Seleksi administrasi" />
                </Field>
                <div className={[css.grid2, css.gridEnd, css.gap].join(' ')}>
                  <Field label="Mulai" required>
                    <TextInput type="date" value={item.s} max={item.e || undefined} onChange={v => setItem({ s: v })} />
                  </Field>
                  <Field label="Selesai" note="kosong = satu hari">
                    <TextInput type="date" value={item.e} min={item.s || undefined} invalid={endsEarly(item)} onChange={v => setItem({ e: v })} />
                  </Field>
                </div>
                <div className={css.gap}>
                  <Switch checked={!!item.est} label="Tanggal perkiraan (label Estimasi)" tone="amber" onChange={est => setItem({ est })} />
                </div>
                <div className={[css.grid3, css.gap].join(' ')}>
                  <Field label="Kelompok tahap"><TextInput value={item.group || ''} onChange={v => setItem({ group: v })} placeholder="Tahap I" /></Field>
                  <Field label="Media pelaksanaan"><TextInput value={item.mode || ''} onChange={v => setItem({ mode: v })} placeholder="Online / onsite" /></Field>
                  <Field label="Lokasi / portal"><TextInput value={item.location || ''} onChange={v => setItem({ location: v })} placeholder="Portal calon siswa / kampus" /></Field>
                </div>
                <Field label="Keterangan" className={css.gap}>
                  <TextArea value={item.details || ''} onChange={v => setItem({ details: v })} rows={2} placeholder="Materi tes, bahasa pengantar, atau rincian seleksi…" />
                </Field>
              </>
            )} />
        </div>

        <div className={css.group}>
          <Eyebrow>Dokumen resmi &amp; arsip</Eyebrow>
          <RepeatList items={draft.docs} onChange={v => set('docs', v)} blank={() => ({ l: '', m: '', h: '', arsip: false })}
            addLabel="Tambah dokumen" rowLabel={item => item.l || 'Dokumen baru'} empty="Belum ada dokumen."
            render={(item, setItem) => (
              <>
                <div className={css.grid2}>
                  <Field label="Judul dokumen"><TextInput value={item.l} onChange={v => setItem({ l: v })} placeholder="Pedoman pendaftaran 2027/28" /></Field>
                  <Field label="Tautan"><TextInput type="url" value={item.h} onChange={v => setItem({ h: v })} placeholder="https://…" /></Field>
                </div>
                <div className={[css.grid2, css.gridEnd, css.gap].join(' ')}>
                  <Field label="Keterangan"><TextInput value={item.m} onChange={v => setItem({ m: v })} placeholder="PDF resmi dari panitia" /></Field>
                  <Switch checked={item.arsip} label="Arsip tahun lalu" tone="amber" onChange={v => setItem({ arsip: v })} />
                </div>
              </>
            )} />
        </div>
      </Section>

      <Section id="syarat" title="7. Syarat, berkas & tugas" icon="navChecklist" status={status.syarat}>
        {REQUIREMENT_GROUPS.map(group => <div className={css.group} key={group.value}>
          <Eyebrow>{group.label}</Eyebrow>
          <RepeatList<Requirement> items={draft.reqs.filter(r => requirementGroup(r) === group.value)}
            onChange={v => set('reqs', [...draft.reqs.filter(r => requirementGroup(r) !== group.value), ...v])}
            blank={() => ({ group: group.value, k: '', v: '' })}
            addLabel="Tambah syarat" rowLabel={item => (item.kind === 'nilai' ? 'Nilai rapor' : item.kind === 'usia' ? 'Batas usia' : item.k || 'Syarat baru')} empty="Belum ada syarat."
            extra={<>
              {group.value === 'akademis' && !hasGradeRow && (
                <AddButton onClick={() => patch({ calc: { subjects: [], sems: [], minAvg: 0, minSem: null }, reqs: [...draft.reqs, { group: 'akademis', k: '', v: '', kind: 'nilai' }] })}>Tambah syarat nilai rapor</AddButton>
              )}
              {group.value === 'utama' && !hasAgeRow && (
                <AddButton onClick={() => patch({ eligibility: { items: [], ...draft.eligibility, dob: { max: 0, at: '', q: 'Tanggal lahir' } }, reqs: [...draft.reqs, { group: 'utama', k: '', v: '', kind: 'usia' }] })}>Tambah syarat usia</AddButton>
              )}
            </>}
            render={(item, setItem) => {
              const text = (
                <Field label="Isi syarat" required>
                  <TextArea value={item.v} onChange={v => setItem(updateRequirementText(item, v))} rows={2}
                    placeholder={item.kind ? 'Terisi otomatis dari isian di atas, boleh ditambah' : 'Sehat jasmani dan rohani'} />
                </Field>
              );
              if (item.kind === 'nilai' && draft.calc) {
                const calc = draft.calc;
                // the text follows the fields until the admin has worded it differently
                const setCalc = (p: Partial<typeof calc>) => {
                  const next = { ...calc, ...p };
                  patch({ calc: next });
                  if (!item.v.trim() || item.v === gradeText(calc)) setItem(updateRequirementText(item, gradeText(next)));
                };
                return <>
                  <div className={css.grid2}>
                    <Field label="Mata pelajaran yang dinilai" group>
                      <ChipSet label="Mata pelajaran" value={calc.subjects} onChange={subjects => setCalc({ subjects })} options={SUBJECTS} />
                    </Field>
                    <Field label="Nilai minimal per mapel" required>
                      <TextInput type="number" min="0" max="100" placeholder="85" value={calc.minAvg ? String(calc.minAvg) : ''} onChange={v => setCalc({ minAvg: Math.min(100, Number(v) || 0) })} />
                    </Field>
                  </div>
                  <div className={css.gap}>{text}</div>
                </>;
              }
              if (item.kind === 'usia' && draft.eligibility?.dob) {
                const dob = draft.eligibility.dob;
                const setDob = (p: Partial<typeof dob>) => {
                  const next = { ...dob, ...p };
                  patch({ eligibility: { items: [], ...draft.eligibility, dob: { ...next, q: ageQuestion(next) } } });
                  if (!item.v.trim() || item.v === ageText(dob)) setItem(updateRequirementText(item, ageText(next)));
                };
                return <>
                  <div className={css.grid2}>
                    <Field label="Usia maksimal (tahun)" required><TextInput type="number" min="1" placeholder="17" value={dob.max ? String(dob.max) : ''} onChange={v => setDob({ max: Number(v) || 0 })} /></Field>
                    <Field label="Dihitung per tanggal" required><TextInput type="date" value={dob.at} onChange={v => setDob({ at: v })} /></Field>
                  </div>
                  <div className={css.gap}>{text}</div>
                </>;
              }
              return <>
                {text}
                <div className={css.gap}>
                  <Switch checked={!!item.check} label="Murid bisa mengecek syarat ini sendiri (ya / tidak)"
                    onChange={on => setItem({ check: on, id: item.id ?? 'q' + Math.random().toString(36).slice(2, 7) })} />
                </div>
              </>;
            }} />
        </div>)}

        <div className={css.group}>
          <Eyebrow>Berkas yang harus disiapkan</Eyebrow>
          <RepeatList items={docs} onChange={v => set('checklist', [...tasks, ...v])}
            blank={(): ChecklistItem => ({ id: crypto.randomUUID(), l: '', dl: '', document: { required: true, rules: [], template: '' } })}
            addLabel="Tambah berkas" rowLabel={item => item.l || 'Berkas baru'} empty="Belum ada berkas."
            render={(item, setItem) => item.document && (
              <>
                <Field label="Nama berkas" required><TextInput value={item.l} onChange={l => setItem({ l })} placeholder="Scan rapor semester 1–4" medium /></Field>
                <div className={css.gap}>
                  <Field label="Kewajiban" group>
                    <PickChips label="Kewajiban" value={item.document.required ? 'wajib' : 'opsional'} options={[{ value: 'wajib', label: 'Wajib' }, { value: 'opsional', label: 'Opsional' }]}
                      onChange={v => setItem({ document: { ...item.document!, required: v === 'wajib' } })} />
                  </Field>
                </div>
                <div className={css.gap}><ChecklistSettings item={item} onChange={setItem} dlRequired /></div>
                <div className={css.documentFields}>
                  <RepeatList items={item.document.rules} onChange={rules => setItem({ document: { ...item.document!, rules } })}
                    blank={() => ({ format: '', maxMB: '' })} addLabel="Tambah format file" rowLabel={r => r.format || 'Format file'} empty="Belum ada format file."
                    render={(rule, update) => <div className={css.grid2}>
                      <Field label="Format file" required><TextInput value={rule.format} onChange={format => update({ format })} placeholder="JPG/PNG atau PDF" /></Field>
                      <Field label="Ukuran maksimum (MB)" required><TextInput type="number" min="0.01" value={rule.maxMB} onChange={maxMB => update({ maxMB })} placeholder="5" /></Field>
                    </div>} />
                  <Field label="Tautan template" note="opsional"><TextInput type="url" value={item.document.template} onChange={template => setItem({ document: { ...item.document!, template } })} placeholder="https://…" /></Field>
                </div>
              </>
            )} />
        </div>

        <div className={css.group}>
          <Eyebrow>Tugas lain</Eyebrow>
          <RepeatList items={tasks} onChange={v => set('checklist', [...docs, ...v])}
            blank={(): ChecklistItem => ({ id: crypto.randomUUID(), l: '', dl: '' })}
            addLabel="Tambah tugas" rowLabel={item => item.l || 'Tugas baru'} empty="Belum ada tugas."
            render={(item, setItem) => (
              <>
                <Field label="Judul tugas" required><TextInput value={item.l} onChange={l => setItem({ l })} placeholder="Buat akun casis di portal pendaftaran" medium /></Field>
                <div className={css.gap}><ChecklistSettings item={item} onChange={setItem} /></div>
              </>
            )} />
        </div>
      </Section>

      <Section id="faq" title="8. Forum (FAQ)" icon="navForum" status={status.faq}>
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

     </div>
      {preview ? <section className={[css.preview, 'skin-murid'].join(' ')} aria-label="Pratinjau untuk siswa">
        <h2>Pratinjau untuk siswa</h2>
        <div className={css.previewCard}><SchoolCard school={draft} preview /></div>
        <SchoolProfile school={draft} preview />
        <ChecklistCard school={draft} preview />
        <div>
          <button type="button" className={css.btn} onClick={() => setCekOpen(true)}>Lihat Cek syarat</button>
        </div>
        <ForumThreads schools={[draft]} filter="all" preview />
        {cekOpen && <CekSyaratModal school={draft} onClose={() => setCekOpen(false)} preview />}
      </section> : null}
    </div>
  );
}
