'use client';

import { useState, type FormEvent } from 'react';
import Link from 'next/link';
import { DEMO_ADMIN, useAuth } from '@/lib/auth';
import Icon from './Icon';
import css from './AuthForm.module.css';

export default function AuthForm({ mode }: { mode: 'login' | 'daftar' }) {
  const isLogin = mode === 'login';
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [show, setShow] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const { login, register } = useAuth.getState();
    const err = isLogin ? await login(email, password) : await register(name, email, password);
    // On success Shell's route guard redirects to the dashboard.
    setError(err);
    setBusy(false);
  };

  return (
    <div className={css.wrap}>
      {/* eslint-disable @next/next/no-img-element */}
      <img src="/assets/logo-tamanschool-full.svg" alt="tamanSchool" className={[css.logo, css.logoLight].join(' ')} />
      <img src="/assets/logo-tamanschool-beige.svg" alt="tamanSchool" className={[css.logo, css.logoDark].join(' ')} />
      {/* eslint-enable @next/next/no-img-element */}
      <h1 className={css.jargon}>Education should make dreams <em>possible</em>.</h1>
      <p className={css.intro}>
        Siapkan pendaftaran SMA unggulan di satu tempat: checklist berkas, kalkulator syarat nilai, dan timeline seleksi.
      </p>
      <form className={css.card} onSubmit={submit} noValidate>
        <div className={css.eyebrow}>{isLogin ? 'Masuk ke KSU' : 'Buat akun KSU'}</div>
        <div aria-live="polite">{error ? <div className={css.error} role="alert"><Icon name="warning" style={{ marginTop: 2 }} /><span>{error}</span></div> : null}</div>
        {!isLogin && (
          <label className={css.field}>
            <span className={css.label}>Nama lengkap</span>
            <input className={css.input} value={name} onChange={e => setName(e.target.value)} autoComplete="name" required />
          </label>
        )}
        <label className={css.field}>
          <span className={css.label}>Email</span>
          <input className={css.input} type="email" placeholder="nama@email.com" value={email} onChange={e => setEmail(e.target.value)} autoComplete="email" required />
        </label>
        <label className={css.field}>
          <span className={css.label}>Password</span>
          <span className={css.inputWrap}>
            <input className={[css.input, css.inputPw].join(' ')} type={show ? 'text' : 'password'} value={password}
              onChange={e => setPassword(e.target.value)} placeholder={isLogin ? 'Password kamu' : 'Buat password'}
              autoComplete={isLogin ? 'current-password' : 'new-password'} required />
            <button type="button" className={css.eye} onClick={() => setShow(!show)}
              aria-label={show ? 'Sembunyikan password' : 'Tampilkan password'}>
              <Icon name={show ? 'eyeOff' : 'eye'} />
            </button>
          </span>
          {!isLogin && <span className={css.hint}>Minimal 6 karakter.</span>}
        </label>
        <button className={css.submit} type="submit" disabled={busy}>{busy ? 'Memeriksa...' : isLogin ? 'Masuk' : 'Daftar'}</button>
        <p className={css.alt}>
          {isLogin ? 'Belum punya akun? ' : 'Sudah punya akun? '}
          <Link href={isLogin ? '/daftar' : '/login'}>{isLogin ? 'Daftar' : 'Masuk'}</Link>
        </p>
      </form>
      <p className={css.demo}>
        Mode demo — akun dan data tersimpan di perangkat ini saja.
        {isLogin ? <><br />Akun admin contoh: <b>{DEMO_ADMIN.email}</b> / <b>{DEMO_ADMIN.password}</b></> : null}
      </p>
    </div>
  );
}
