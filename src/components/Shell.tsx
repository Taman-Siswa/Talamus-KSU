'use client';

import { useEffect, useState, type ReactNode } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { ensureAdminSeed, homeFor, roleOf, useAuth, useCurrentUser, type Role } from '@/lib/auth';
import { trackPath } from '@/lib/nav';
import { useSchoolsStore } from '@/lib/schools';
import { activateUser, useStore } from '@/lib/store';
import { accountMeta, initials } from '@/data/student';
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
// Matches the drawer breakpoint in Shell.module.css.
const MOBILE = '(max-width: 860px)';

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
  // Desktop only: the sidebar folds into an icon rail, saved with the account's other settings.
  const sbMin = useStore(s => s.sbMin);
  const toggleSbMin = useStore(s => s.toggleSbMin);
  const toggleMin = () => {
    // In the mobile drawer the same button just closes it.
    if (window.matchMedia(MOBILE).matches) setSbOpen(false);
    else toggleSbMin();
  };

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
  const name = user?.name || '';
  const meta = accountMeta(user);
  const avatarColor = user?.profile?.color;
  // Student pages use the "Design system v2 Murid" frame, also when an admin previews them;
  // the sidebar follows the role, so an admin always keeps the way back to Database SMA.
  const studentFrame = role === 'siswa' || previewing;

  const blocked = !session && !isAuthPage;
  if (!authHydrated || blocked || (session && isAuthPage) || wrongSide) return <div className={css.root} />;
  if (isAuthPage) return <div className={css.authRoot}>{children}</div>;

  const modeToggle = (
    // Label and icon show the current mode; clicking switches to the other one.
    <button type="button" className={css.nav} onClick={() => setDark(!dark)} role="switch" aria-checked={dark}
      title={dark ? 'Mode gelap aktif. Klik untuk ganti ke mode terang' : 'Mode terang aktif. Klik untuk ganti ke mode gelap'}>
      <Icon name={dark ? 'moon' : 'sun'} />
      <span className={css.label}>{dark ? 'Mode gelap' : 'Mode terang'}</span>
    </button>
  );
  const menuButton = (
    <button type="button" className={[css.iconBtn, css.collapse].join(' ')} title="Ciutkan / lebarkan menu"
      aria-label="Ciutkan / lebarkan menu" aria-expanded={!sbMin} onClick={toggleMin}>
      <Icon name="menu" size={role === 'admin' ? 20 : 17} stroke={role === 'admin' ? 1.6 : 1.7} />
    </button>
  );
  const logo = (
    <>
      {/* eslint-disable @next/next/no-img-element */}
      <img src="/assets/logo-tamanschool-full.svg" alt="tamanSchool" className={[css.brandmark, css.logoLight].join(' ')} />
      <img src="/assets/logo-tamanschool-beige.svg" alt="tamanSchool" className={[css.brandmark, css.logoDark].join(' ')} />
      {/* eslint-enable @next/next/no-img-element */}
    </>
  );

  return (
    <div className={[css.root, sbMin ? css.mini : '', role === 'siswa' ? css.student : ''].join(' ')}>
      <aside className={[css.sidebar, sbOpen ? css.open : ''].join(' ')} aria-label="Navigasi utama">
        {role === 'admin' ? (
          <>
            <div className={css.brandRow}>
              <div className={css.brand}>
                {logo}
                <div className={css.role}>KSU Admin</div>
              </div>
              {menuButton}
            </div>
            <nav className={css.scroll}>
              {NAV.admin.map(n => <NavLink key={n.href} item={n} pathname={pathname} onClick={close} />)}
              <div className={css.navGroup}><Icon name="eye" size={14} />{PREVIEW_LABEL}</div>
              {NAV.siswa.map(n => <NavLink key={n.href} item={n} pathname={pathname} onClick={close} />)}
            </nav>
            <div className={css.foot}>
              {modeToggle}
              {/* Drawn like the design's plain account block, but still the way into Profil, where Keluar lives. */}
              <Link href="/profil" onClick={close} title={name} aria-label={'Profil ' + name} aria-current={onProfil ? 'page' : undefined}
                className={[css.nav, css.acct, onProfil ? css.acctActive : ''].join(' ')}>
                <div className={css.avatar} data-av={avatarColor}>{initials(name)}</div>
                <div className={css.who}>
                  <div className={css.name}>{name}</div>
                  <div className={css.meta}>{meta}</div>
                </div>
              </Link>
            </div>
          </>
        ) : (
          <>
            {/* Student design: the account sits on top (and opens Profil, where Keluar lives), mode toggle at the bottom. */}
            <div className={css.stHead}>
              <Link href="/profil" onClick={close} title={name} aria-label={'Profil ' + name} aria-current={onProfil ? 'page' : undefined}
                className={[css.stWho, onProfil ? css.stWhoOn : ''].join(' ')}>
                <div className={css.stAvatar} data-av={avatarColor}>{initials(name)}</div>
                <div className={css.who}>
                  <div className={css.stName}>{name}</div>
                  <div className={css.stMeta}>{meta}</div>
                </div>
              </Link>
              {menuButton}
            </div>
            <nav className={css.scroll}>
              {NAV.siswa.map(n => <NavLink key={n.href} item={n} pathname={pathname} onClick={close} />)}
            </nav>
            {modeToggle}
          </>
        )}
      </aside>
      {sbOpen && <div className={css.scrim} onClick={close} aria-hidden="true" />}

      <main className={[css.main, studentFrame ? css.stMain : css.adminMain].join(' ')}>
        <header className={studentFrame ? css.stTop : css.top}>
          <button type="button" className={[css.iconBtn, css.burger].join(' ')} aria-label="Buka menu" aria-expanded={sbOpen}
            onClick={() => setSbOpen(o => !o)}>
            <Icon name="menu" size={studentFrame ? 20 : 22} />
          </button>
          {studentFrame ? <span className={css.stLogo}>{logo}</span> : null}
        </header>
        {previewing ? (
          <div className={css.previewBar} role="note">
            <Icon name="eye" size={16} />
            <span>{PREVIEW_LABEL}. Yang tampil adalah data yang sudah disimpan, bukan draft. Target dan centang di sini milik akun admin, bukan siswa.</span>
          </div>
        ) : null}
        {/* Saved state, school data and "today" only exist in the browser, so pages render after hydration. */}
        <div className={css.content}>{hydrated && schoolsHydrated ? children : null}</div>
      </main>
    </div>
  );
}
