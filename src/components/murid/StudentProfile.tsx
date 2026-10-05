'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { initials } from '@/data/student';
import { useAuth, type Profile, type User } from '@/lib/auth';
import { progressOf, sc } from '@/lib/murid';
import { useSchools } from '@/lib/schools';
import { useStore } from '@/lib/store';
import Icon from '../Icon';
import { PasswordForm } from '../PasswordForm';
import css from './profile.module.css';

type Key = 'name' | 'nisn' | 'birth' | 'school' | 'grade' | 'domicile' | 'phone' | 'studentEmail';
type Draft = Record<Key, string>;

const FIELDS: { k: Key; l: string; ph: string; type?: string }[] = [
  { k: 'name', l: 'NAMA LENGKAP', ph: '' },
  { k: 'nisn', l: 'NISN', ph: '10 digit' },
  { k: 'birth', l: 'TANGGAL LAHIR', ph: '', type: 'date' },
  { k: 'school', l: 'SEKOLAH ASAL', ph: 'mis. SMPN 115 Jakarta' },
  { k: 'grade', l: 'KELAS', ph: 'mis. 9' },
  { k: 'domicile', l: 'DOMISILI', ph: 'Kota / kabupaten' },
  { k: 'phone', l: 'NO. HP SISWA', ph: '08xx', type: 'tel' },
  { k: 'studentEmail', l: 'EMAIL SISWA', ph: 'nama@email.com', type: 'email' },
];

const draftOf = (u: User, dob: string): Draft => {
  const p = u.profile || {};
  return {
    name: u.name, nisn: p.nisn || '', birth: p.birth || dob || '', school: p.school || '', grade: p.grade || '',
    domicile: p.domicile || '', phone: p.phone || '', studentEmail: p.studentEmail || '',
  };
};
const kelas = (g: string) => (/^\d+$/.test(g.trim()) ? 'Kelas ' + g.trim() : g.trim());

/** Student Profil: "Data diri" (read view, edit with a sticky save bar), SMA target progress, and the account. */
export default function StudentProfile({ user }: { user: User }) {
  const updateProfile = useAuth(s => s.updateProfile);
  const logout = useAuth(s => s.logout);
  const dob = useStore(s => s.dob);
  const setDob = useStore(s => s.setDob);
  const sel = useStore(s => s.sel);
  const checks = useStore(s => s.checks);
  const schools = useSchools();
  const [draft, setDraft] = useState<Draft | null>(null);
  const [toast, setToast] = useState(false);
  const [error, setError] = useState('');
  const [pwOpen, setPwOpen] = useState(false);
  const [pwDone, setPwDone] = useState(false);

  useEffect(() => {
    if (!toast && !pwDone) return;
    const t = setTimeout(() => { setToast(false); setPwDone(false); }, 2600);
    return () => clearTimeout(t);
  }, [toast, pwDone]);

  const saved = draftOf(user, dob);
  const src = draft ?? saved;
  const filled = FIELDS.filter(f => src[f.k].trim()).length;
  const sub = [saved.grade ? kelas(saved.grade) : 'Kelas 9', saved.school || 'Sekolah asal belum diisi', saved.domicile]
    .filter(Boolean).join(' · ') + ' · Target masuk ' + (user.profile?.year || '2027');
  const dirty = !!draft && JSON.stringify(draft) !== JSON.stringify(saved);
  const targets = schools.filter(s => sel[s.id]);

  const save = () => {
    if (!draft) return;
    const { name, ...rest } = draft;
    const profile: Profile = { ...user.profile, ...Object.fromEntries(Object.entries(rest).map(([k, v]) => [k, v.trim()])) };
    const err = updateProfile(name, profile);
    if (err) { setError(err); return; }
    // The date of birth also answers the age question in Cek syarat.
    if (profile.birth) setDob(profile.birth);
    setError(''); setDraft(null); setToast(true);
  };

  const show = (k: Key, type?: string) => {
    const v = saved[k];
    if (!v) return null;
    return type === 'date' ? new Date(v + 'T00:00').toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : v;
  };

  return (
    <div className={css.page}>
      <div className={css.main}>
        <div className={css.card}>
          <div className={css.head}>
            <div className={css.headTop}>
              <div className={css.avatar}>{initials(saved.name)}</div>
              {!draft && (
                <button type="button" className={css.edit} onClick={() => { setDraft(saved); setToast(false); }}>
                  <Icon name="pencil" size={15} stroke={1.8} />Edit profil
                </button>
              )}
            </div>
            <div>
              <div className={css.name}>{saved.name}</div>
              <div className={css.sub}>{sub}</div>
            </div>
            <div style={{ width: '100%' }}>
              <div className={css.pctRow}><span>Kelengkapan profil</span><span>{filled}/{FIELDS.length}</span></div>
              <div className={css.track}><div className={css.fill} style={{ width: Math.round((filled / FIELDS.length) * 100) + '%' }} /></div>
            </div>
          </div>
          <div className={css.group}>
            <div className={css.groupTitle}>Data diri</div>
            <div className={css.fields}>
              {FIELDS.map(f => (
                <div key={f.k} className={css.field}>
                  <label className={css.label} htmlFor={'pf-' + f.k}>{f.l}</label>
                  {draft ? (
                    <input id={'pf-' + f.k} className={css.input} type={f.type || 'text'} value={draft[f.k]}
                      placeholder={f.ph} onChange={e => setDraft({ ...draft, [f.k]: e.target.value })} />
                  ) : (
                    <span className={[css.value, show(f.k, f.type) ? '' : css.empty].join(' ')}>{show(f.k, f.type) ?? 'Belum diisi'}</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
        {draft && (
          <div className={css.bar}>
            <span className={css.barText}>{error ? <span className={css.error}>{error}</span> : dirty ? 'Ada perubahan yang belum disimpan' : 'Sedang mengedit profil'}</span>
            <button type="button" className={css.cancel} onClick={() => { setDraft(null); setError(''); }}>Batal</button>
            <button type="button" className={css.save} onClick={save}>Simpan</button>
          </div>
        )}
        {toast && <div className={css.toast} role="status"><Icon name="check" size={16} stroke={2} />Perubahan profil tersimpan.</div>}
      </div>

      <div className={css.side}>
        <div className={css.sideCard}>
          <div className={css.sideHead}>
            <span className={css.eyebrow}>SMA TARGET</span>
            <Link href="/katalog" className={css.ubah}>Ubah</Link>
          </div>
          {targets.length === 0 && <div className={css.none}>Belum ada sekolah target. Simpan sekolah dari Katalog.</div>}
          {targets.map(s => {
            const { done, total, pct } = progressOf(s, checks);
            return (
              <Link key={s.id} href={'/katalog/' + s.id} className={css.target} {...sc(s)}>
                <span className={css.targetMono}>{s.mono}</span>
                <div style={{ minWidth: 0 }}>
                  <div className={css.targetName}>{s.name}</div>
                  <div className={css.targetTrack}><div className={css.targetFill} style={{ width: pct + '%' }} /></div>
                </div>
                <span className={css.targetLbl}>{done}/{total}</span>
              </Link>
            );
          })}
        </div>

        {/* Not in the design, which has no sign-out: the account actions the app still needs. */}
        <div className={css.sideCard}>
          <span className={css.eyebrow}>AKUN</span>
          <div className={css.acctMail}>{user.email}</div>
          <div className={css.acct}>
            {pwOpen
              ? <PasswordForm onDone={changed => { setPwOpen(false); setPwDone(changed); }} />
              : <button type="button" className={css.acctBtn} onClick={() => setPwOpen(true)}><Icon name="lock" size={16} />Ganti password</button>}
            {pwDone && <div className={css.toast} role="status"><Icon name="check" size={16} stroke={2} />Password diganti.</div>}
            {/* Signing out clears the session; Shell's route guard then sends the user to /login. */}
            <button type="button" className={css.acctBtn} onClick={logout}><Icon name="logout" size={16} />Keluar</button>
          </div>
        </div>
      </div>
    </div>
  );
}
