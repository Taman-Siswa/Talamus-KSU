'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { SCHOOL_COLORS, type ChecklistItem, type IconKey, type Requirement, type Review, type School, type SchoolColor, type SchoolInfo } from '@/data/types';
import { costChip, isBoarding, sc, schoolColor } from '@/lib/murid';
import { bundledDefault, inferPhaseType, isBundledSchool, newSchoolId, useSchoolsStore } from '@/lib/schools';
import Icon from '../Icon';
import { requirementGroup, schoolProblems, automaticSchoolLabels, schoolShortName, schoolMonogram, toFormShape } from '@/lib/school-form';
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
  ChipSet, Eyebrow, Field, LineList, PickChips, RepeatList, Section, Switch, TextArea, TextInput,
} from './fields';

// Sections follow the admin spreadsheet; each section names its student-facing destination.

const KINDS: { value: SchoolInfo['kind']; label: string }[] = [
  { value: 'Negeri', label: 'Negeri' },
  { value: 'Swasta', label: 'Swasta' },
];
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
const FACT_LABELS = ['BERDIRI', 'PENGELOLA', 'KAMPUS PUSAT', 'LUAS KAMPUS', 'SISTEM', 'KUOTA', 'JALUR', 'SELEKSI'];
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

type Part = 'kartu' | 'header' | 'fasilitas' | 'pendaftaran' | 'syarat' | 'berkas' | 'cek' | 'faq' | 'alumni' | 'ulasan';
const PART_LABEL: Record<Part, string> = {
  kartu: 'Kartu Katalog', header: 'Informasi sekolah', fasilitas: 'Fasilitas', pendaftaran: 'Pendaftaran', syarat: 'Persyaratan calon siswa',
  berkas: 'Checklist dokumen', cek: 'Cek syarat', faq: 'FAQ', alumni: 'Alumni & prestasi', ulasan: 'Ulasan',
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
    store('publish', {
      ...draft,
      reqs: draft.reqs.map(r => ({ ...r, k: r.k.trim() || r.v.trim() })),
      phases: draft.phases.map(p => ({ ...p, e: p.e || p.s })),
    });
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
  const gaps = (vals: string[]) => vals.filter(v => !v.trim()).length;
  const headerGaps = gaps([draft.name, draft.mono, draft.tag, info.kind, info.province, info.boarding, draft.about || '']);
  const cardGaps = gaps([draft.name, draft.tag]);
  const registrationIndex = draft.phases.findIndex(p => p.t === 'daftar');
  const registration = draft.phases[registrationIndex];
  const setRegistration = (update: Partial<School['phases'][number]>) => {
    const next = { ...(registration ?? { l: 'Pendaftaran', s: '', e: '', t: 'daftar' as const }), ...update };
    set('phases', registrationIndex < 0 ? [next, ...draft.phases] : draft.phases.map((p, i) => i === registrationIndex ? next : p));
  };
  const status: Record<Part, { text: string; done: boolean }> = {
    kartu: { text: cardGaps ? cardGaps + ' kolom utama kosong' : 'Lengkap', done: !cardGaps },
    header: { text: headerGaps ? headerGaps + ' kolom utama kosong' : 'Lengkap', done: !headerGaps },
    fasilitas: count(draft.facilities?.length ?? 0, 'fasilitas', true),
    pendaftaran: count(draft.phases.filter(p => p.l.trim() && p.s && !endsEarly(p)).length, 'tahap terisi'),
    syarat: count(reqCount, 'syarat'),
    berkas: count(draft.checklist.filter(c => c.l.trim()).length, 'item'),
    cek: count((draft.calc ? 1 : 0) + (draft.eligibility?.items.filter(item => item.q.trim()).length ?? 0), 'aturan', true),
    faq: count(draft.faq.filter(f => f.q.trim() && f.a.trim()).length, 'jawaban terisi'),
    alumni: count((draft.alumni?.length ?? 0) + (draft.achievements?.length ?? 0), 'data', true),
    ulasan: count(draft.reviews?.length ?? 0, 'ulasan', true),
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

      <Section id="kartu" title="Kartu Katalog" icon="navKatalog" status={status.kartu}>
        <div className={css.cardFormLayout}>
          <div className={css.cardFormFields}>
            <Field label="Gambar kartu" group>
              <PhotoUploader single photos={draft.photos || []} onChange={v => set('photos', v)} />
            </Field>
            <Field label="Nama sekolah" required>
              <TextInput value={draft.name} onChange={setName} placeholder="SMA Taruna Nusantara" strong />
            </Field>
            <Field label="Kalimat singkat" required>
              <TextInput value={draft.tag} onChange={v => set('tag', v)} placeholder="Sekolah berasrama semi-militer di 6 kampus" />
            </Field>
            <Field label="Pendaftaran" group>
              <div className={css.grid2}>
                <TextInput label="Pendaftaran mulai" type="date" value={registration?.s || ''} onChange={s => setRegistration({ s })} />
                <TextInput label="Pendaftaran selesai" type="date" value={registration?.e || ''} onChange={e => setRegistration({ e })} invalid={!!registration && endsEarly(registration)} />
              </div>
            </Field>
            <div className={css.grid2}>
              <Field label="Lokasi">
                <TextInput value={info.city || ''} onChange={city => setInfo({ city })} placeholder="Magelang" />
              </Field>
              <Field label="Asrama">
                <select className={css.input} value={info.boarding ? (isBoarding(draft) ? 'asrama' : 'non') : ''}
                  onChange={e => setInfo({ boarding: e.target.value === 'asrama' ? 'Tersedia' : e.target.value === 'non' ? 'Non-Asrama' : '' })}>
                  <option value="">Pilih asrama</option><option value="asrama">Asrama</option><option value="non">Non-asrama</option>
                </select>
              </Field>
              <Field label="Biaya">
                <select className={css.input} value={costChip(draft)} onChange={e => setInfo({ funding: e.target.value === 'Gratis' ? ['Beasiswa'] : e.target.value ? ['Berbayar'] : [] })}>
                  <option value="">Pilih biaya</option><option value="Gratis">Gratis</option><option value="Berbayar">Berbayar</option>
                </select>
              </Field>
              <Field label="Kurikulum">
                <TextInput value={info.curriculum.join(', ')} onChange={v => setInfo({ curriculum: v ? v.split(',').map(t => t.trimStart()) : [] })} placeholder="Kurikulum Nasional" list="kurikulum-kartu" />
                <datalist id="kurikulum-kartu">{CURRICULA.map(c => <option key={c} value={c} />)}</datalist>
              </Field>
            </div>
          </div>
          <aside className={css.cardFormPreview} aria-label="Pratinjau kartu Katalog">
            <Eyebrow>Pratinjau kartu</Eyebrow>
            <div className="skin-murid"><SchoolCard school={draft} preview /></div>
          </aside>
        </div>
      </Section>

      <Section id="header" title="1. Informasi sekolah" icon="navKatalog" status={status.header} livePreview={<SchoolProfile school={draft} preview previewSection="informasi" />}>
        <Field label="Foto sekolah" group>
          <PhotoUploader photos={draft.photos || []} onChange={v => set('photos', v)} />
        </Field>
        <Field label="Lokasi sekolah">
          <TextInput value={draft.location || ''} onChange={v => set('location', v)} placeholder="Magelang (pusat) · Cimahi · Malang" />
        </Field>
        <div className={css.grid2}>
          <Field label="Jenis sekolah">
            <select className={css.input} value={info.kind} onChange={e => setInfo({ kind: e.target.value as SchoolInfo['kind'] })}>
              <option value="">Pilih jenis sekolah</option>{KINDS.map(k => <option key={k.value} value={k.value}>{k.label}</option>)}
            </select>
          </Field>
          <Field label="Provinsi">
            <TextInput value={info.province} onChange={v => setInfo({ province: v })} placeholder="Jawa Tengah" list="daftar-provinsi" />
            <datalist id="daftar-provinsi">{PROVINCES.map(p => <option key={p} value={p} />)}</datalist>
          </Field>
          <Field label="Jumlah kampus"><TextInput type="number" min="1" value={info.campusCount ? String(info.campusCount) : ''} onChange={v => setInfo({ campusCount: Number(v) > 0 ? Math.round(Number(v)) : undefined })} placeholder="1" /></Field>
          <Field label="Inisial sekolah"><TextInput value={draft.mono} onChange={v => set('mono', v.toUpperCase().slice(0, 4))} maxLength={4} placeholder="TN" code /></Field>
        </div>
        <Field label="Warna" group>
          <PickChips label="Warna sekolah" value={schoolColor(draft)} onChange={v => set('color', v)} options={SCHOOL_COLORS.map(c => ({ value: c, label: COLOR_LABEL[c] }))} />
        </Field>
        <div className={css.group}>
          <Eyebrow>Sorotan sekolah</Eyebrow>
          <LineList items={draft.highlights || []} onChange={v => set('highlights', v)} cols="150px 1.4fr 2fr" head={['Ikon', 'Judul', 'Keterangan']}
            blank={() => ({ icon: 'spark' as IconKey, t: '', d: '' })} addLabel="Tambah sorotan" empty="Belum ada sorotan."
            render={(h, setH) => <>
              <IconSelect label="Ikon sorotan" value={h.icon} onChange={icon => setH({ icon })} />
              <TextInput label="Judul sorotan" value={h.t} onChange={t => setH({ t })} placeholder="Gratis + beasiswa penuh" medium />
              <TextInput label="Keterangan sorotan" value={h.d} onChange={d => setH({ d })} placeholder="Pendaftaran gratis dan siswa diterima dapat beasiswa penuh." />
            </>} />
        </div>

        <div id="tentang" className={css.group}><Eyebrow>Tentang sekolah</Eyebrow></div>
        <Field label="Deskripsi sekolah" required>
          <TextArea value={draft.about || ''} onChange={v => set('about', v)} rows={4} placeholder="SMA Taruna Nusantara adalah sekolah berasrama yang…" />
        </Field>
        <div className={css.group}>
          <Eyebrow>Fakta sekolah</Eyebrow>
          <datalist id="fakta-label">{FACT_LABELS.map(l => <option key={l} value={l} />)}</datalist>
          <LineList items={draft.profile || []} onChange={v => set('profile', v)} cols="1fr 2fr" head={['Label', 'Isi']}
            blank={() => ({ k: '', v: '' })} addLabel="Tambah baris" empty="Belum ada fakta."
            render={(r, setR) => <>
              <TextInput label="Label fakta" value={r.k} onChange={k => setR({ k: k.toUpperCase() })} placeholder="BERDIRI" list="fakta-label" code />
              <TextInput label="Isi fakta" value={r.v} onChange={v => setR({ v })} placeholder="14 Juli 1990" />
            </>} />
        </div>
        <div className={css.group}>
          <Eyebrow>Kontak & alamat</Eyebrow>
          <div className={css.grid2}>
            <Field label="Telepon / WhatsApp"><TextInput type="tel" value={info.phone || ''} onChange={phone => setInfo({ phone })} placeholder="+62 …" /></Field>
            <Field label="Email"><TextInput type="email" value={info.email || ''} onChange={email => setInfo({ email })} placeholder="info@sekolah.sch.id" /></Field>
            <Field label="Website"><TextInput value={info.website || ''} onChange={website => setInfo({ website })} placeholder="https://sekolah.sch.id" /></Field>
            <Field label="Alamat lengkap"><TextArea value={info.address || ''} onChange={address => setInfo({ address })} rows={3} placeholder="Jalan, kecamatan, kabupaten/kota, provinsi" /></Field>
          </div>
          {!!info.contact && <Field label="Catatan kontak lama" note="Pindahkan ke kolom yang sesuai jika memungkinkan" className={css.gap}><TextArea value={info.contact} onChange={contact => setInfo({ contact })} rows={2} /></Field>}
        </div>
        <div className={css.group}>
          <Eyebrow>Kurikulum</Eyebrow>
          <LineList items={draft.curriculumCards || []} onChange={v => set('curriculumCards', v)} cols="1fr 2fr" head={['Judul', 'Keterangan']}
            blank={() => ({ t: '', d: '' })} addLabel="Tambah penjelasan kurikulum" empty="Belum ada penjelasan kurikulum."
            render={(c, setC) => <>
              <TextInput label="Judul penjelasan kurikulum" value={c.t} onChange={t => setC({ t })} placeholder="Kurikulum Nasional" medium />
              <TextInput label="Keterangan kurikulum" value={c.d} onChange={d => setC({ d })} placeholder="Peminatan IPA/IPS dengan standar akademik tinggi." />
            </>} />
        </div>

      </Section>

      <Section id="fasilitas" title="2. Fasilitas" icon="home" status={status.fasilitas} livePreview={<SchoolProfile school={draft} preview previewSection="fasilitas" />}>
        <LineList items={draft.facilities || []} onChange={v => set('facilities', v)} cols="150px 1fr" head={['Ikon', 'Fasilitas']}
          blank={() => ({ icon: 'home' as IconKey, t: '' })} addLabel="Tambah fasilitas" empty="Belum ada fasilitas."
          render={(f, setF) => <>
            <IconSelect label="Ikon fasilitas" value={f.icon} onChange={icon => setF({ icon })} />
            <TextInput label="Nama fasilitas" value={f.t} onChange={t => setF({ t })} placeholder="Laboratorium sains" />
          </>} />
      </Section>

      <Section id="pendaftaran" title="3. Pendaftaran" icon="navTimeline" status={status.pendaftaran} livePreview={<SchoolProfile school={draft} preview previewSection="pendaftaran" />}>
        <div className={css.group}>
          <div className={css.gridStatus}>
            <Field label="Status jadwal" group>
              <PickChips label="Status jadwal" value={draft.status} options={STATUSES} onChange={v => set('status', v)} />
            </Field>
            <Field label="Tahun ajaran"><TextInput value={info.admissionYear || ''} onChange={v => setInfo({ admissionYear: v })} placeholder="2027-2028" /></Field>
          </div>
        </div>

        <div className={css.group}>
          <Eyebrow>Keterangan biaya</Eyebrow>
          <TextArea value={draft.cost?.long || ''} onChange={v => set('cost', v ? { long: v } : undefined)} rows={2}
            placeholder="Contoh: Pendaftaran gratis" />
        </div>

        <div className={css.group}>
          <Eyebrow>Jadwal pendaftaran</Eyebrow>
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
                  <Switch checked={!!item.est} label="Tanggal perkiraan" tone="amber" onChange={est => setItem({ est })} />
                </div>
                <div className={[css.grid3, css.gap].join(' ')}>
                  <Field label="Kelompok tahap"><TextInput value={item.group || ''} onChange={v => setItem({ group: v })} placeholder="Tahap I" /></Field>
                  <Field label="Media pelaksanaan"><TextInput value={item.mode || ''} onChange={v => setItem({ mode: v })} placeholder="Online / onsite" /></Field>
                  <Field label="Lokasi / portal"><TextInput value={item.location || ''} onChange={v => setItem({ location: v })} placeholder="Portal calon siswa / kampus" /></Field>
                </div>
                <Field label="Keterangan" className={css.gap}>
                  <TextArea value={item.details || ''} onChange={v => setItem({ details: v })} rows={2} placeholder="Rincian tahap" />
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

      <Section id="syarat" title="4. Persyaratan calon siswa" icon="check" status={status.syarat} livePreview={<SchoolProfile school={draft} preview previewSection="syarat" />}>
        <div className={css.group}>
          <RepeatList<Requirement> items={draft.reqs}
            onChange={v => set('reqs', v)}
            blank={() => ({ group: 'utama', k: '', v: '' })}
            addLabel="Tambah syarat" rowLabel={item => item.k || item.v || 'Syarat baru'} empty="Belum ada syarat."
            render={(item, setItem) => {
              const category = item.group ?? requirementGroup(item);
              return (
                <>
                  <Field label="Judul syarat">
                    <TextInput value={item.k} onChange={k => setItem({ k })} placeholder="Nilai rapor" medium />
                  </Field>
                  <div className={css.requirementBody}>
                    <Field label="Isi syarat" required>
                      <TextArea value={item.v} onChange={v => setItem({ v })} rows={3}
                        placeholder="Tidak ada ambang nilai minimum & tidak ada gugur berkas…" />
                    </Field>
                  </div>
                  <div className={css.requirementOptions}>
                    <Field label="Kategori" group className={css.requirementCategory}>
                      <PickChips label="Kategori syarat" value={category} options={[{ value: 'utama', label: 'Umum' }, { value: 'akademis', label: 'Akademik' }, { value: 'fisik', label: 'Fisik' }]} onChange={group => setItem({ group })} />
                    </Field>
                  </div>
                </>
              );
            }} />
        </div>
      </Section>

      <Section id="berkas" title="5. Checklist dokumen" icon="navChecklist" status={status.berkas} livePreview={<ChecklistCard school={draft} group="berkas" preview />}>
        <div className={css.group}>
          <Eyebrow>Dokumen pendaftaran</Eyebrow>
          <datalist id="kategori-dokumen">{['Administrasi umum', ...new Set(docs.map(c => c.document?.category?.trim()).filter(Boolean))].map(category => <option key={category} value={category} />)}</datalist>
          <RepeatList items={docs} onChange={v => set('checklist', [...tasks, ...v])}
            blank={(): ChecklistItem => ({ id: crypto.randomUUID(), l: '', dl: '', document: { required: true, rules: [], template: '' } })}
            addLabel="Tambah dokumen" rowLabel={item => item.l || 'Dokumen baru'} empty="Belum ada dokumen."
            render={(item, setItem) => item.document && (
              <>
                <Field label="Nama dokumen" required><TextInput value={item.l} onChange={l => setItem({ l })} placeholder="Scan rapor semester 1–4" medium /></Field>
                <Field label="Kategori / jalur" note="Kosong = Administrasi umum, berlaku untuk semua jalur" className={css.gap}>
                  <TextInput value={item.document.category || ''} onChange={category => setItem({ document: { ...item.document!, category } })} placeholder="Contoh: Khusus Jalur B2P" list="kategori-dokumen" />
                </Field>
                <div className={css.gap}>
                  <Field label="Kewajiban" note="Berlaku bagi peserta kategori/jalur dokumen ini" group>
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
          <Eyebrow>Tugas pendaftaran</Eyebrow>
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

      <Section id="cek" title="6. Cek Syarat" icon="calc" status={status.cek}>
        <div className={css.group}>
          <Switch checked={!!draft.calc} label="Gunakan kalkulator nilai"
            onChange={on => patch({ calc: on ? { subjects: [], sems: [], minAvg: 0, minSem: null } : null })} />
          {draft.calc && <div className={[css.grid2, css.gap].join(' ')}>
            <Field label="Mata pelajaran yang dinilai" group>
              <ChipSet label="Mata pelajaran" value={draft.calc.subjects} onChange={subjects => patch({ calc: { ...draft.calc!, subjects } })} options={SUBJECTS} />
            </Field>
            <Field label="Nilai minimal per mapel" required>
              <TextInput type="number" min="0" max="100" placeholder="85" value={draft.calc.minAvg ? String(draft.calc.minAvg) : ''} onChange={v => patch({ calc: { ...draft.calc!, minAvg: Math.min(100, Number(v) || 0) } })} />
            </Field>
          </div>}
        </div>
        <div className={css.group}>
          <Eyebrow>Persyaratan lain</Eyebrow>
          <RepeatList items={draft.eligibility?.items ?? []}
            onChange={items => patch({ eligibility: items.length ? { items } : undefined })}
            blank={() => ({ id: crypto.randomUUID(), q: '' })}
            addLabel="Tambah persyaratan" rowLabel={item => item.q || 'Persyaratan baru'} empty="Belum ada persyaratan."
            render={(item, setItem) => (
              <Field label="Pertanyaan untuk calon siswa" required>
                <TextInput value={item.q} onChange={q => setItem({ q })} placeholder="Bersedia tinggal di asrama?" medium />
              </Field>
            )} />
        </div>
      </Section>

      <Section id="faq" title="7. FAQ" icon="navForum" status={status.faq} livePreview={<ForumThreads schools={[draft]} filter="all" preview faqOnly />}>
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

      <Section id="alumni" title="8. Alumni & prestasi" icon="trophy" status={status.alumni} livePreview={<SchoolProfile school={draft} preview previewSection="alumni" />}>
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

      <Section id="ulasan" title="9. Ulasan alumni" icon="chats" status={status.ulasan} livePreview={<SchoolProfile school={draft} preview previewSection="ulasan" />}>
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

      <div className={css.foot}>
        <button type="button" className={css.btn} aria-expanded={preview} onClick={() => setPreview(v => !v)}>{preview ? 'Tutup pratinjau' : 'Pratinjau untuk siswa'}</button>
        <button type="button" className={[css.btn, css.btnPrimary].join(' ')} onClick={onSave} disabled={!unpublished}>
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
        <ChecklistCard school={draft} group="berkas" preview />
        <ChecklistCard school={draft} group="pendaftaran" preview />
        <div>
          <button type="button" className={css.btn} onClick={() => setCekOpen(true)}>Lihat Cek syarat</button>
        </div>
        <ForumThreads schools={[draft]} filter="all" preview />
      </section> : null}
      {cekOpen && <CekSyaratModal school={draft} onClose={() => setCekOpen(false)} preview />}
    </div>
  );
}
