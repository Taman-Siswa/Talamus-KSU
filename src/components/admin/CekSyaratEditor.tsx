'use client';

import type { School } from '@/data/types';
import { P, fmt } from '@/lib/dates';
import css from './admin.module.css';
import { ChipSet, Eyebrow, Field, LineList, Switch, TextInput } from './fields';
import Icon from '../Icon';

/* The part of "Persyaratan" the student can check for themselves ("Cek syarat"): report-card averages, age, and
   yes/no questions. It sits under the requirement lists so the admin writes a rule once and then says how it is
   checked, instead of finding a second form elsewhere. */

const SUBJECTS = ['B. Indonesia', 'B. Inggris', 'Matematika', 'IPA', 'IPS'];
const firstLine = (t: string) => t.split('\n')[0].trim();
const clip = (t: string, n = 46) => (t.length > n ? t.slice(0, n - 1) + '…' : t);

export default function CekSyaratEditor({ draft, patch }: { draft: School; patch: (p: Partial<School>) => void }) {
  const calc = draft.calc;
  const elig = draft.eligibility ?? { items: [] };
  const setElig = (p: Partial<NonNullable<School['eligibility']>>) => patch({ eligibility: { ...elig, ...p } });
  const dob = elig.dob;
  const setDob = (p: Partial<NonNullable<typeof dob>>) => {
    const next = { max: 17, at: '', q: '', ...dob, ...p };
    next.q = next.at ? `Tanggal lahir (maks. ${next.max} tahun per ${fmt(P(next.at), true)})` : 'Tanggal lahir';
    setElig({ dob: next });
  };
  const used = new Set(elig.items.map(i => i.q.trim().toLowerCase()));
  const picks = draft.reqs.map(r => firstLine(r.v)).filter(t => t && !used.has(t.toLowerCase()));

  return (
    <div className={css.group}>
      <Eyebrow>Dicek siswa sebelum mendaftar (Cek syarat)</Eyebrow>
      <p className={css.intro}>Opsional. Syarat di atas bisa dijadikan pengecekan otomatis: siswa mengisi nilai, tanggal lahir, dan menjawab ya/tidak, lalu melihat hasilnya.</p>

      <Switch checked={!!calc} label="Batas nilai rapor"
        onChange={on => patch({ calc: on ? { subjects: ['Matematika'], sems: [], minAvg: 85, minSem: null } : null })} />
      {calc && (
        <div className={css.gap}>
          <Field label="Mata pelajaran yang dinilai" group>
            <ChipSet label="Mata pelajaran" value={calc.subjects} onChange={v => patch({ calc: { ...calc, subjects: v } })} options={SUBJECTS} />
          </Field>
          <div className={[css.grid3, css.gap].join(' ')}>
            <Field label="Rata-rata minimal per mapel">
              <TextInput type="number" min="0" max="100" placeholder="85" value={calc.minAvg ? String(calc.minAvg) : ''} onChange={v => patch({ calc: { ...calc, minAvg: Math.min(100, Number(v) || 0) } })} />
            </Field>
          </div>
        </div>
      )}

      <div className={css.gap}>
        <Switch checked={!!dob} label="Batas usia" onChange={on => (on ? setDob({}) : setElig({ dob: undefined }))} />
      </div>
      {dob && (
        <div className={[css.grid3, css.gap].join(' ')}>
          <Field label="Usia maksimal"><TextInput type="number" min="1" value={String(dob.max)} onChange={v => setDob({ max: Number(v) || 0 })} /></Field>
          <Field label="Dihitung per tanggal"><TextInput type="date" value={dob.at} onChange={v => setDob({ at: v })} /></Field>
        </div>
      )}

      <Field label="Pertanyaan ya / tidak" note="mis. sehat jasmani, WNI, bersedia tinggal di asrama" group className={css.gap}>
        {picks.length > 0 && (
          <div className={css.quick}>
            <span className={css.quickLabel}>Ambil dari syarat</span>
            {picks.slice(0, 8).map(t => (
              <button key={t} type="button" className={[css.chip, css.chipSugg].join(' ')} title={t}
                onClick={() => setElig({ items: [...elig.items, { id: 'q' + Math.random().toString(36).slice(2, 7), q: t }] })}>
                <Icon name="plus" size={12} stroke={2.2} />{clip(t)}
              </button>
            ))}
          </div>
        )}
        <LineList items={elig.items} onChange={v => setElig({ items: v })} cols="1fr" blank={() => ({ id: 'q' + Math.random().toString(36).slice(2, 7), q: '' })}
          addLabel="Tulis pertanyaan sendiri" empty="Belum ada pertanyaan."
          render={(it, set) => <TextInput label="Pertanyaan" value={it.q} onChange={q => set({ q })} placeholder="Sehat jasmani dan rohani, tidak buta warna?" />} />
      </Field>
    </div>
  );
}
