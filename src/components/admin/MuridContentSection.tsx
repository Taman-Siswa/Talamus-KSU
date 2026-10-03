'use client';

import { useState } from 'react';
import { SCHOOL_COLORS, type IconKey, type School, type SchoolColor } from '@/data/types';
import { schoolColor } from '@/lib/murid';
import Icon from '../Icon';
import css from './admin.module.css';
import { Field, LineList, PickChips, Section, StringList, Switch, TextArea, TextInput } from './fields';

/* "Halaman sekolah untuk siswa": what the student page shows beyond the registration data. The tabs are the same
   as on the student's school page, so the admin fills it in the order the student reads it. Everything is optional;
   an empty part shows "belum ada data" to the student. */

const COLOR_LABEL: Record<SchoolColor, string> = { hijau: 'Hijau', biru: 'Biru', kuning: 'Kuning', merah: 'Merah', ungu: 'Ungu' };
const ICONS: { value: IconKey; label: string }[] = [
  { value: 'spark', label: 'Bintang' }, { value: 'shield', label: 'Perisai' }, { value: 'home', label: 'Asrama' },
  { value: 'cap', label: 'Toga' }, { value: 'book', label: 'Buku' }, { value: 'lab', label: 'Lab' }, { value: 'pc', label: 'Komputer' },
  { value: 'trophy', label: 'Piala' }, { value: 'heart', label: 'Kesehatan' }, { value: 'globe', label: 'Dunia' },
  { value: 'wave', label: 'Kolam' }, { value: 'users', label: 'Orang' },
];
const FACILITIES: { t: string; icon: IconKey }[] = [
  { t: 'Asrama putra & putri', icon: 'home' }, { t: 'Laboratorium sains', icon: 'lab' }, { t: 'Laboratorium komputer', icon: 'pc' },
  { t: 'Perpustakaan', icon: 'book' }, { t: 'Lapangan olahraga', icon: 'trophy' }, { t: 'Kolam renang', icon: 'wave' },
  { t: 'Masjid / musala', icon: 'users' }, { t: 'Layanan kesehatan asrama', icon: 'heart' },
];
const FACT_LABELS = ['BERDIRI', 'PENGELOLA', 'SISTEM', 'JALUR', 'LUAS KAMPUS'];
const RATINGS = ['1', '2', '3', '4', '5'].map(v => ({ value: v, label: v + '★' }));
const num = (v: string) => (v.trim() === '' ? 0 : Math.max(0, Number(v) || 0));

type TabKey = 'ringkas' | 'tentang' | 'fasilitas' | 'alumni' | 'ulasan';

/** Which tabs have something in them: shown as a badge so the admin sees what is still empty. */
function tabInfo(s: School): Record<TabKey, { label: string; badge: string; done: boolean }> {
  const n = (a?: unknown[]) => a?.length ?? 0;
  const ring = [s.sub, s.location, n(s.photos), n(s.highlights), s.cost?.long].filter(Boolean).length;
  const tentang = [s.about, n(s.profile), n(s.curriculumCards)].filter(Boolean).length;
  const alumni = n(s.alumni) + n(s.achievements);
  return {
    ringkas: { label: 'Ringkasan', badge: ring ? '✓' : '', done: ring > 0 },
    tentang: { label: 'Tentang', badge: tentang ? '✓' : '', done: tentang > 0 },
    fasilitas: { label: 'Fasilitas', badge: n(s.facilities) ? String(n(s.facilities)) : '', done: n(s.facilities) > 0 },
    alumni: { label: 'Alumni & prestasi', badge: alumni ? String(alumni) : '', done: alumni > 0 },
    ulasan: { label: 'Ulasan', badge: n(s.reviews) ? String(n(s.reviews)) : '', done: n(s.reviews) > 0 },
  };
}

export function muridContentStatus(s: School) {
  const info = Object.values(tabInfo(s));
  const n = info.filter(t => t.done).length;
  return { text: n ? `${n} dari ${info.length} tab terisi` : 'Belum diisi (opsional)', done: n === info.length };
}

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

export default function MuridContentSection({ draft, patch, n }: { draft: School; patch: (p: Partial<School>) => void; n: number }) {
  const [tab, setTab] = useState<TabKey>('ringkas');
  const info = tabInfo(draft);
  const have = (draft.facilities || []).map(f => f.t.toLowerCase());
  return (
    <Section id="halaman" title={n + '. Halaman sekolah untuk siswa'} icon="navKatalog" status={muridContentStatus(draft)}>
      <p className={css.intro}>Opsional. Isi per tab, urutannya sama dengan halaman sekolah yang dilihat siswa. Yang kosong tampil sebagai “belum ada data”.</p>
      <div className={css.tabs} role="tablist" aria-label="Bagian halaman sekolah">
        {(Object.keys(info) as TabKey[]).map(k => (
          <button key={k} type="button" role="tab" aria-selected={tab === k} className={[css.tab, tab === k ? css.tabOn : ''].join(' ')} onClick={() => setTab(k)}>
            {info[k].label}{info[k].badge ? <span className={[css.tabBadge, info[k].done ? css.tabBadgeDone : ''].join(' ')}>{info[k].badge}</span> : null}
          </button>
        ))}
      </div>

      {tab === 'ringkas' && (
        <>
          <p className={css.tabHint}>Kartu di Katalog dan bagian atas halaman sekolah.</p>
          <div className={css.grid2}>
            <Field label="Warna sekolah" group>
              <PickChips label="Warna sekolah" value={draft.color ?? schoolColor(draft)} onChange={v => patch({ color: v })}
                options={SCHOOL_COLORS.map(c => ({ value: c, label: COLOR_LABEL[c] }))} />
            </Field>
            <Field label="Label Gratis" group>
              <Switch checked={draft.cost?.free ?? (draft.info.funding.includes('Beasiswa') && !draft.info.funding.includes('Berbayar'))}
                onChange={v => patch({ cost: { ...draft.cost, free: v } })} label="Tampilkan tag Gratis dan masuk filter Gratis" />
            </Field>
          </div>
          <div className={[css.grid2, css.gap].join(' ')}>
            <Field label="Kalimat di kartu" note="kosong = ringkasan sekolah">
              <TextInput value={draft.sub || ''} onChange={v => patch({ sub: v })} placeholder="Sekolah berasrama semi-militer di 6 kampus" />
            </Field>
            <Field label="Lokasi di bawah nama" note="kosong = kota, provinsi">
              <TextInput value={draft.location || ''} onChange={v => patch({ location: v })} placeholder="Magelang (pusat) · Cimahi · Malang" />
            </Field>
          </div>
          <Field label="Biaya" note="teks di panel Pendaftaran" className={css.gap}>
            <TextArea value={draft.cost?.long || ''} onChange={v => patch({ cost: { ...draft.cost, long: v } })} rows={2}
              placeholder="Gratis — biaya pendidikan dan asrama ditanggung beasiswa penuh." />
          </Field>
          <Field label="Foto sekolah" note="tautan gambar; foto pertama dipakai di kartu, lima foto di halaman sekolah" group className={css.gap}>
            <StringList items={draft.photos || []} onChange={v => patch({ photos: v })} addLabel="Tambah tautan foto" placeholder="https://…" />
          </Field>
          <Field label="Sorotan" note="3 poin singkat di bawah nama sekolah" group className={css.gap}>
            <LineList items={draft.highlights || []} onChange={v => patch({ highlights: v })} cols="150px 1.4fr 2fr" head={['Ikon', 'Judul', 'Keterangan']}
              blank={() => ({ icon: 'spark' as IconKey, t: '', d: '' })} addLabel="Tambah sorotan" empty="Belum ada sorotan."
              render={(h, set) => <>
                <IconSelect label="Ikon sorotan" value={h.icon} onChange={icon => set({ icon })} />
                <TextInput label="Judul sorotan" value={h.t} onChange={t => set({ t })} placeholder="Gratis + beasiswa penuh" medium />
                <TextInput label="Keterangan sorotan" value={h.d} onChange={d => set({ d })} placeholder="Untuk angkatan 2027/28…" />
              </>} />
          </Field>
        </>
      )}

      {tab === 'tentang' && (
        <>
          <p className={css.tabHint}>Tab Tentang: paragraf, tabel fakta, dan kartu kurikulum.</p>
          <Field label="Deskripsi sekolah">
            <TextArea value={draft.about || ''} onChange={v => patch({ about: v })} rows={4} placeholder="SMA Taruna Nusantara adalah sekolah berasrama yang…" />
          </Field>
          <Field label="Tabel fakta" note="kosong = diambil dari profil sekolah" group className={css.gap}>
            <datalist id="fakta-label">{FACT_LABELS.map(l => <option key={l} value={l} />)}</datalist>
            <LineList items={draft.profile || []} onChange={v => patch({ profile: v })} cols="1fr 2fr" head={['Label', 'Isi']}
              blank={() => ({ k: '', v: '' })} addLabel="Tambah fakta"
              render={(r, set) => <>
                <TextInput label="Label fakta" value={r.k} onChange={k => set({ k: k.toUpperCase() })} placeholder="BERDIRI" list="fakta-label" code />
                <TextInput label="Isi fakta" value={r.v} onChange={v => set({ v })} placeholder="14 Juli 1990" />
              </>} />
          </Field>
          <Field label="Kartu kurikulum" group className={css.gap}>
            <LineList items={draft.curriculumCards || []} onChange={v => patch({ curriculumCards: v })} cols="1fr 2fr" head={['Judul', 'Keterangan']}
              blank={() => ({ t: '', d: '' })} addLabel="Tambah kartu"
              render={(c, set) => <>
                <TextInput label="Judul kartu" value={c.t} onChange={t => set({ t })} placeholder="Kurikulum Nasional" medium />
                <TextInput label="Keterangan kartu" value={c.d} onChange={d => set({ d })} placeholder="Peminatan IPA/IPS dengan standar akademik tinggi." />
              </>} />
          </Field>
        </>
      )}

      {tab === 'fasilitas' && (
        <>
          <p className={css.tabHint}>Daftar fasilitas dua kolom di tab Fasilitas.</p>
          <div className={css.quick}>
            <span className={css.quickLabel}>Tambah cepat</span>
            {FACILITIES.filter(f => !have.includes(f.t.toLowerCase())).map(f => (
              <button key={f.t} type="button" className={[css.chip, css.chipSugg].join(' ')} onClick={() => patch({ facilities: [...(draft.facilities || []), f] })}>
                <Icon name="plus" size={12} stroke={2.2} />{f.t}
              </button>
            ))}
          </div>
          <LineList items={draft.facilities || []} onChange={v => patch({ facilities: v })} cols="150px 1fr" head={['Ikon', 'Fasilitas']}
            blank={() => ({ icon: 'home' as IconKey, t: '' })} addLabel="Tambah fasilitas lain" empty="Belum ada fasilitas."
            render={(f, set) => <>
              <IconSelect label="Ikon fasilitas" value={f.icon} onChange={icon => set({ icon })} />
              <TextInput label="Nama fasilitas" value={f.t} onChange={t => set({ t })} placeholder="Laboratorium sains" />
            </>} />
        </>
      )}

      {tab === 'alumni' && (
        <>
          <p className={css.tabHint}>Sebaran lulusan (batang persen) dan daftar prestasi.</p>
          <Field label="Periode data lulusan"><TextInput value={draft.alumniYear || ''} onChange={v => patch({ alumniYear: v })} placeholder="Lulusan 2022–2025" /></Field>
          <Field label="Sebaran lulusan" group className={css.gap}>
            <LineList items={draft.alumni || []} onChange={v => patch({ alumni: v })} cols="2fr 110px" head={['Tujuan', 'Persen']}
              blank={() => ({ k: '', v: 0, campuses: [] })} addLabel="Tambah tujuan lulusan" empty="Belum ada data."
              render={(a, set) => <>
                <TextInput label="Tujuan lulusan" value={a.k} onChange={k => set({ k })} placeholder="PTN dalam negeri" medium />
                <TextInput label="Persen" type="number" min="0" max="100" value={a.v ? String(a.v) : ''} onChange={v => set({ v: Math.min(100, num(v)) })} placeholder="58" />
              </>} />
            {(draft.alumni || []).length > 0 && (
              <details className={css.fold}>
                <summary>Kampus tujuan per kategori (opsional)</summary>
                {(draft.alumni || []).map((a, i) => (
                  <Field key={i} label={a.k || 'Tujuan ' + (i + 1)} group className={css.gap}>
                    <LineList items={a.campuses || []} cols="2fr 110px" head={['Kampus', 'Alumni']}
                      onChange={v => patch({ alumni: (draft.alumni || []).map((x, j) => (j === i ? { ...x, campuses: v } : x)) })}
                      blank={() => ({ n: '', c: 0 })} addLabel="Tambah kampus"
                      render={(c, set) => <>
                        <TextInput label="Kampus" value={c.n} onChange={n => set({ n })} placeholder="Universitas Indonesia" />
                        <TextInput label="Jumlah alumni" type="number" min="0" value={c.c ? String(c.c) : ''} onChange={v => set({ c: num(v) })} placeholder="42" />
                      </>} />
                  </Field>
                ))}
              </details>
            )}
          </Field>
          <Field label="Prestasi" group className={css.gap}>
            <LineList items={draft.achievements || []} onChange={v => patch({ achievements: v })} cols="3fr 130px" head={['Prestasi', 'Waktu']}
              blank={() => ({ t: '', yr: '' })} addLabel="Tambah prestasi" empty="Belum ada prestasi."
              render={(p, set) => <>
                <TextInput label="Prestasi" value={p.t} onChange={t => set({ t })} placeholder="Medali emas IPhO 2026" medium />
                <TextInput label="Waktu" value={p.yr} onChange={yr => set({ yr })} placeholder="Jul 2026" />
              </>} />
            <div className={css.gap}>
              <Field label="Terakhir diperbarui"><TextInput value={draft.achievementsUpdated || ''} onChange={v => patch({ achievementsUpdated: v })} placeholder="Okt 2024" /></Field>
            </div>
          </Field>
        </>
      )}

      {tab === 'ulasan' && (
        <>
          <p className={css.tabHint}>Ulasan alumni di tab Ulasan. Pisahkan paragraf dengan baris kosong.</p>
          <LineList items={draft.reviews || []} onChange={v => patch({ reviews: v })} cols="1fr" 
            blank={() => ({ name: '', role: '', title: '', text: '', rating: 5, ago: 0, likes: 0 })} addLabel="Tambah ulasan" empty="Belum ada ulasan."
            render={(r, set) => (
              <div className={css.reviewBox}>
                <div className={css.grid2}>
                  <TextInput label="Nama" value={r.name} onChange={name => set({ name })} placeholder="Nama, mis. Alumni A" medium />
                  <TextInput label="Keterangan" value={r.role} onChange={role => set({ role })} placeholder="Angkatan 30 · kini di ITB" />
                </div>
                <TextInput label="Judul ulasan" value={r.title} onChange={title => set({ title })} placeholder="Judul ulasan" />
                <TextArea value={r.text} onChange={text => set({ text })} rows={3} placeholder="Isi ulasan…" />
                <div className={css.reviewMeta}>
                  <PickChips label="Bintang" value={String(r.rating)} options={RATINGS} onChange={v => set({ rating: Number(v) })} />
                  <details className={css.fold}>
                    <summary>Waktu tulis dan jumlah suka</summary>
                    <div className={css.grid2}>
                      <Field label="Ditulis" note="bulan lalu, 0 = minggu ini"><TextInput type="number" min="0" value={String(r.ago)} onChange={v => set({ ago: num(v) })} /></Field>
                      <Field label="Jumlah suka"><TextInput type="number" min="0" value={String(r.likes)} onChange={v => set({ likes: num(v) })} /></Field>
                    </div>
                  </details>
                </div>
              </div>
            )} />
        </>
      )}
    </Section>
  );
}
