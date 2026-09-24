'use client';

import { useEffect, useState, type ReactNode } from 'react';
import Link from 'next/link';
import { AVATAR_COLORS, useAuth, useCurrentUser, type Profile, type User } from '@/lib/auth';
import { useStore } from '@/lib/store';
import { accountMeta, initials } from '@/data/student';
import { useTargetSchools } from '@/components/SchoolChips';
import Icon, { type IconName } from '@/components/Icon';
import ui from '@/components/ui.module.css';
import css from './profil.module.css';

const COLOR_NAMES: Record<(typeof AVATAR_COLORS)[number], string> = {
  blue: 'Biru', teal: 'Hijau toska', purple: 'Ungu', slate: 'Abu kebiruan', pink: 'Merah muda',
};

type Draft = { name: string } & Required<Profile>;
const draftOf = (u: User): Draft => ({
  name: u.name,
  nick: u.profile?.nick || '',
  color: u.profile?.color || 'blue',
  grade: u.profile?.grade || '',
  school: u.profile?.school || '',
  year: u.profile?.year || '',
  parent: u.profile?.parent || '',
});

function Card({ title, icon, children }: { title: string; icon: IconName; children: ReactNode }) {
  return (
    <section className={css.card}>
      <div className={css.cardHead}>
        <Icon name={icon} size={18} />
        <h2 className={css.cardTitle}>{title}</h2>
      </div>
      {children}
    </section>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <label className={css.field}>
      <span className={css.label}>{label}</span>
      {children}
      {hint ? <span className={css.hint}>{hint}</span> : null}
    </label>
  );
}

/** A short-lived line after an action ("Profil disimpan") or its error. */
function useFlash() {
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  useEffect(() => {
    if (!msg?.ok) return;
    const t = setTimeout(() => setMsg(null), 2500);
    return () => clearTimeout(t);
  }, [msg]);
  const node = msg ? (
    <span className={[css.msg, msg.ok ? css.msgOk : css.msgBad].join(' ')} role="status">
      {msg.ok ? <Icon name="check" size={15} stroke={2.2} /> : null}{msg.text}
    </span>
  ) : null;
  return { node, show: (ok: boolean, text: string) => setMsg({ ok, text }) };
}

function PasswordForm({ onDone }: { onDone: (changed: boolean) => void }) {
  const changePassword = useAuth(s => s.changePassword);
  const [cur, setCur] = useState('');
  const [next, setNext] = useState('');
  const [again, setAgain] = useState('');
  const [busy, setBusy] = useState(false);
  const flash = useFlash();
  const submit = async () => {
    if (next !== again) { flash.show(false, 'Password baru dan ulangannya belum sama.'); return; }
    setBusy(true);
    const err = await changePassword(cur, next);
    setBusy(false);
    if (err) { flash.show(false, err); return; }
    onDone(true);
  };
  return (
    <form className={css.pwForm} onSubmit={e => { e.preventDefault(); submit(); }}>
      <Field label="Password lama">
        <input className={css.input} type="password" autoComplete="current-password" value={cur} onChange={e => setCur(e.target.value)} />
      </Field>
      <Field label="Password baru" hint="Minimal 6 karakter">
        <input className={css.input} type="password" autoComplete="new-password" value={next} onChange={e => setNext(e.target.value)} />
      </Field>
      <Field label="Ulangi password baru">
        <input className={css.input} type="password" autoComplete="new-password" value={again} onChange={e => setAgain(e.target.value)} />
      </Field>
      <div className={css.actions}>
        <button type="submit" className={[css.btn, css.btnPrimary].join(' ')} disabled={busy || !cur || !next}>Simpan password</button>
        <button type="button" className={[css.btn, css.btnGhost].join(' ')} onClick={() => onDone(false)}>Batal</button>
      </div>
      {flash.node}
    </form>
  );
}

function ProfilForm({ user }: { user: User }) {
  const updateProfile = useAuth(s => s.updateProfile);
  const logout = useAuth(s => s.logout);
  const dark = useStore(s => s.dark);
  const setDark = useStore(s => s.setDark);
  const targets = useTargetSchools();
  const isStudent = user.role !== 'admin';

  const [draft, setDraft] = useState<Draft>(() => draftOf(user));
  const [pwOpen, setPwOpen] = useState(false);
  const saved = useFlash();
  const pwSaved = useFlash();
  const set = <K extends keyof Draft>(k: K, v: Draft[K]) => setDraft(d => ({ ...d, [k]: v }));
  const text = (k: Exclude<keyof Draft, 'color'>, placeholder?: string, invalid?: boolean) => (
    <input className={[css.input, invalid ? css.inputBad : ''].join(' ')} value={draft[k]} placeholder={placeholder}
      aria-invalid={invalid || undefined} onChange={e => set(k, e.target.value)} />
  );

  const save = () => {
    const { name, ...rest } = draft;
    // students' school fields are kept only for students
    const profile: Profile = isStudent ? rest : { nick: rest.nick, color: rest.color };
    const err = updateProfile(name, profile);
    saved.show(!err, err || 'Profil disimpan');
  };
  const name = draft.name.trim() || user.name;
  const preview: User = { ...user, profile: { ...user.profile, grade: draft.grade, year: draft.year } };

  return (
    <div className={css.page}>
      <h1 className={ui.h1}>Profil</h1>
      <p className={ui.lead}>
        {isStudent ? 'Data diri kamu di KSU, tersimpan di perangkat ini.' : 'Identitas akun admin kamu, tersimpan di perangkat ini.'}
      </p>

      <div className={css.head}>
        <div className={css.avatar} data-av={draft.color}>{initials(name)}</div>
        <div style={{ minWidth: 0 }}>
          <p className={css.headName}>{name}</p>
          <div className={css.headMeta}>{accountMeta(preview)} · {user.email}</div>
        </div>
      </div>

      <div className={css.grid}>
        <div className={css.stack}>
          <Card title="Identitas" icon="user">
            <div className={css.fields}>
              <div className={css.grid2}>
                <Field label="Nama lengkap">{text('name', undefined, !draft.name.trim())}</Field>
                <Field label="Nama panggilan" hint="Opsional">{text('nick')}</Field>
              </div>
              <div className={css.field}>
                <span className={css.label} id="warna-avatar">Warna avatar</span>
                <div className={css.swatches} role="radiogroup" aria-labelledby="warna-avatar">
                  {AVATAR_COLORS.map(c => (
                    <button key={c} type="button" role="radio" aria-checked={draft.color === c} aria-label={COLOR_NAMES[c]}
                      title={COLOR_NAMES[c]} data-av={c} className={[css.swatch, draft.color === c ? css.swatchOn : ''].join(' ')}
                      onClick={() => set('color', c)}>
                      {initials(name)}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </Card>

          {isStudent ? (
            <Card title="Sekolah dan target" icon="navKatalog">
              <div className={css.fields}>
                <div className={css.grid2}>
                  <Field label="Jenjang" hint="Contoh: Kelas 9">{text('grade', 'Kelas 9')}</Field>
                  <Field label="Sekolah asal">{text('school', 'SMP Negeri 1 Jakarta')}</Field>
                </div>
                <Field label="Tahun masuk SMA" hint="Tampil di bawah namamu di sidebar">{text('year', '2027')}</Field>
                <div className={css.field}>
                  <span className={css.label}>SMA target</span>
                  {targets.length ? (
                    <div className={css.targets}>
                      {targets.map(s => (
                        <Link key={s.id} href={'/katalog/' + s.id} data-school={s.id} className={css.target}>
                          <span className={css.targetDot} />{s.short}
                        </Link>
                      ))}
                    </div>
                  ) : (
                    <span className={css.targetsEmpty}>Belum ada sekolah target.</span>
                  )}
                  <span className={css.hint}>
                    Diambil dari sekolah yang kamu jadikan target. <Link href="/katalog" className={css.linkInline}>Ubah di Katalog</Link>
                  </span>
                </div>
                <Field label="Nama orang tua" hint="Opsional">{text('parent')}</Field>
              </div>
            </Card>
          ) : null}

          <div className={css.actions}>
            <button type="button" className={[css.btn, css.btnPrimary].join(' ')} onClick={save}>
              <Icon name="check" size={17} stroke={2} />Simpan profil
            </button>
            <button type="button" className={[css.btn, css.btnGhost].join(' ')} onClick={() => setDraft(draftOf(user))}>
              Batalkan perubahan
            </button>
            {saved.node}
          </div>
        </div>

        <div className={css.stack}>
          <Card title="Data akun" icon="lock">
            <div className={css.rows}>
              <div className={css.row}><span className={css.rowK}>Peran</span><span className={css.rowV}>{isStudent ? 'Siswa' : 'Admin'}</span></div>
              <div className={css.row}><span className={css.rowK}>Email</span><span className={css.rowV}>{user.email}</span></div>
            </div>
            <p className={css.note}>Peran dan email dipakai untuk masuk, jadi tidak bisa diubah dari sini.</p>
          </Card>

          <Card title="Tampilan dan akun" icon="sun">
            <div className={css.btnStack}>
              <button type="button" className={[css.btn, css.btnGhost, css.btnBlock].join(' ')} onClick={() => setDark(!dark)}>
                <Icon name={dark ? 'sun' : 'moon'} size={16} />Ganti mode terang atau gelap
              </button>
              {pwOpen ? (
                <PasswordForm onDone={changed => { setPwOpen(false); if (changed) pwSaved.show(true, 'Password diganti'); }} />
              ) : (
                <button type="button" className={[css.btn, css.btnGhost, css.btnBlock].join(' ')} onClick={() => setPwOpen(true)}>
                  <Icon name="lock" size={16} />Ganti password
                </button>
              )}
              {/* Signing out clears the session; Shell's route guard then sends the user to /login. */}
              <button type="button" className={[css.btn, css.btnGhost, css.btnBlock].join(' ')} onClick={logout}>
                <Icon name="logout" size={16} />Keluar
              </button>
              {pwSaved.node}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default function ProfilPage() {
  const user = useCurrentUser();
  // Shell only renders pages for a signed-in account; the key resets the form when the account changes.
  return user ? <ProfilForm key={user.email} user={user} /> : null;
}
