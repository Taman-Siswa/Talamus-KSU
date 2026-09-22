'use client';

import { useEffect, useState, type ReactNode } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { ensureAdminSeed, homeFor, roleOf, useAuth, useCurrentUser, type Role } from '@/lib/auth';
import { trackPath } from '@/lib/nav';
import { useSchoolsStore } from '@/lib/schools';
import { activateUser, useStore } from '@/lib/store';
import { STUDENT, initials } from '@/data/student';
import Icon, { type IconName } from './Icon';
import css from './Shell.module.css';

type NavItem = { href: string; label: string; icon: IconName };

const NAV: Record<Role, NavItem[]> = {
  siswa: [
    { href: '/checklist', label: 'Checklist', icon: 'navChecklist' },
    { href: '/kalkulator', label: 'Kalkulator Syarat', icon: 'navKalkulator' },
    { href: '/timeline', label: 'Timeline', icon: 'navTimeline' },
    { href: '/katalog', label: 'SMA Unggulan', icon: 'navKatalog' },
    { href: '/faq', label: 'FAQ', icon: 'navFaq' },
  ],
  admin: [
    { href: '/admin/sekolah', label: 'Database SMA', icon: 'database' },
  ],
};

const AUTH_PAGES = ['/login', '/daftar'];
const isAdminPath = (p: string) => p === '/admin' || p.startsWith('/admin/');
// Pages both roles can open. Everything else belongs to one side only.
const SHARED_PAGES = ['/profil'];
// Admins may also open every student page, as a preview: the school data is shared per browser, and
// the admin account keeps its own student-side progress (targets, checks, grades) apart from any student.
const isStudentPath = (p: string) => !isAdminPath(p) && !AUTH_PAGES.includes(p) && !SHARED_PAGES.includes(p);
const PREVIEW_LABEL = 'Pratinjau tampilan siswa';

function NavLink({ item: n, pathname, onClick }: { item: NavItem; pathname: string; onClick: () => void }) {
  const active = pathname === n.href || pathname.startsWith(n.href + '/');
  return (
    <Link href={n.href} onClick={onClick} title={n.label} aria-current={active ? 'page' : undefined}
      className={[css.nav, active ? css.navActive : ''].join(' ')}>
      <Icon name={n.icon} />
      <span className={css.label}>{n.label}</span>
    </Link>
  );
}

export default function Shell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const authHydrated = useAuth(s => s.hydrated);
  const session = useAuth(s => s.session);
  const user = useCurrentUser();
  const role = roleOf(user);
  const isAuthPage = AUTH_PAGES.includes(pathname);
  const hydrated = useStore(s => s.hydrated);
  const schoolsHydrated = useSchoolsStore(s => s.hydrated);
  const dark = useStore(s => s.dark);
  const setDark = useStore(s => s.setDark);
  const setPage = useStore(s => s.setPage);
  const [sbOpen, setSbOpen] = useState(false);

  useEffect(() => {
    useSchoolsStore.persist.rehydrate();
    useAuth.persist.rehydrate()?.then?.(ensureAdminSeed);
  }, []);

  // Load the signed-in account's saved data; clear it from memory on sign-out.
  useEffect(() => {
    if (authHydrated) activateUser(session);
  }, [authHydrated, session]);

  // Route guard: signed-out users only see the auth pages, and each role stays on its own side.
  const wrongSide = !!session && !SHARED_PAGES.includes(pathname) && role !== 'admin' && isAdminPath(pathname);
  const previewing = role === 'admin' && isStudentPath(pathname);
  useEffect(() => {
    if (!authHydrated) return;
    if (!session) {
      if (!isAuthPage) router.replace('/login');
    } else if (isAuthPage || wrongSide) {
      router.replace(homeFor(role));
    }
  }, [authHydrated, session, isAuthPage, wrongSide, role, router]);

  useEffect(() => {
    if (!authHydrated || (session && !hydrated)) return;
    // Signed out (login, daftar) is always dark; signed in follows the account's own choice.
    if (!session || dark) document.documentElement.dataset.theme = 'dark';
    else delete document.documentElement.dataset.theme;
  }, [authHydrated, dark, hydrated, session]);

  // Keep the prototype's persisted `page` field in sync with the route.
  const seg = pathname.split('/').filter(Boolean);
  const page = seg[0] === 'katalog' && seg[1] ? seg[1] : seg[0] || 'checklist';
  useEffect(() => {
    trackPath(pathname);
  }, [pathname]);
  useEffect(() => {
    if (hydrated && !isAuthPage) setPage(page);
  }, [hydrated, isAuthPage, page, setPage]);

  const close = () => setSbOpen(false);
  const onProfil = pathname === '/profil';
  const name = user?.name || STUDENT.name;
  const meta = role === 'admin' ? 'Admin · TamanSchool' : STUDENT.meta;

  const blocked = !session && !isAuthPage;
  if (!authHydrated || blocked || (session && isAuthPage) || wrongSide) return <div className={css.root} />;
  if (isAuthPage) return <div className={css.authRoot}>{children}</div>;

  return (
    <div className={css.root}>
      <aside className={[css.sidebar, sbOpen ? css.open : ''].join(' ')} aria-label="Navigasi utama">
        <div className={css.brandRow}>
          <div className={css.brand}>
            {/* eslint-disable @next/next/no-img-element */}
            <img src="/assets/logo-tamanschool-full.svg" alt="tamanSchool" className={[css.brandmark, css.logoLight].join(' ')} />
            <img src="/assets/logo-tamanschool-beige.svg" alt="tamanSchool" className={[css.brandmark, css.logoDark].join(' ')} />
            {/* eslint-enable @next/next/no-img-element */}
            <div className={css.role}>{role === 'admin' ? 'KSU Admin' : 'KSU'}</div>
          </div>
          <button type="button" className={[css.iconBtn, css.collapse].join(' ')} title="Tutup menu"
            aria-label="Tutup menu" onClick={close}>
            <Icon name="menu" size={20} />
          </button>
        </div>
        <nav className={css.scroll}>
          {NAV[role].map(n => <NavLink key={n.href} item={n} pathname={pathname} onClick={close} />)}
          {role === 'admin' ? (
            <>
              <div className={css.navGroup}><Icon name="eye" size={14} />{PREVIEW_LABEL}</div>
              {NAV.siswa.map(n => <NavLink key={n.href} item={n} pathname={pathname} onClick={close} />)}
            </>
          ) : null}
        </nav>
        <div className={css.foot}>
          {/* Label and icon show the current mode; clicking switches to the other one. */}
          <button type="button" className={css.nav} onClick={() => setDark(!dark)} role="switch" aria-checked={dark}
            title={dark ? 'Mode gelap aktif. Klik untuk ganti ke mode terang' : 'Mode terang aktif. Klik untuk ganti ke mode gelap'}>
            <Icon name={dark ? 'moon' : 'sun'} />
            <span className={css.label}>{dark ? 'Mode gelap' : 'Mode terang'}</span>
          </button>
          {/* The account block is the way into Profil, where Keluar lives. */}
          <Link href="/profil" onClick={close} aria-label={'Profil ' + name} aria-current={onProfil ? 'page' : undefined}
            className={[css.nav, css.acct, onProfil ? css.navActive : ''].join(' ')}>
            <div className={css.avatar}>{initials(name)}</div>
            <div className={css.who}>
              <div className={css.name}>{name}</div>
              <div className={css.meta}>{meta}</div>
            </div>
            <Icon name="chevronRight" size={16} />
          </Link>
        </div>
      </aside>
      {sbOpen && <div className={css.scrim} onClick={close} aria-hidden="true" />}

      <main className={css.main}>
        <header className={css.top}>
          <button type="button" className={[css.iconBtn, css.burger].join(' ')} aria-label="Buka menu" aria-expanded={sbOpen}
            onClick={() => setSbOpen(o => !o)}>
            <Icon name="menu" size={22} />
          </button>
        </header>
        {/* Saved state, school data and "today" only exist in the browser, so pages render after hydration. */}
        {previewing ? (
          <div className={css.previewBar} role="note">
            <Icon name="eye" size={16} />
            <span>{PREVIEW_LABEL}. Yang tampil adalah data yang sudah disimpan, bukan draft. Target dan centang di sini milik akun admin, bukan siswa.</span>
          </div>
        ) : null}
        <div className={css.content}>{hydrated && schoolsHydrated ? children : null}</div>
      </main>
    </div>
  );
}
