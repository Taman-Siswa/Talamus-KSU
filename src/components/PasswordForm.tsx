'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { useAuth } from '@/lib/auth';
import Icon from './Icon';
import css from '@/app/profil/profil.module.css';

// Shared by both Profil pages (student and admin).

export function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <label className={css.field}>
      <span className={css.label}>{label}</span>
      {children}
      {hint ? <span className={css.hint}>{hint}</span> : null}
    </label>
  );
}

/** A short-lived line after an action ("Profil disimpan") or its error. */
export function useFlash() {
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

export function PasswordForm({ onDone }: { onDone: (changed: boolean) => void }) {
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
