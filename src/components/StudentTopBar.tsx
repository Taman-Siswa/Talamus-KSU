'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { startOfToday } from '@/lib/dates';
import { useKatalogFilter } from '@/lib/katalog-filter';
import { deadlineNotifs, MULTI, isMulti } from '@/lib/murid';
import { useSchools } from '@/lib/schools';
import { useStore } from '@/lib/store';
import Icon from './Icon';
import css from './StudentTopBar.module.css';

const TITLES: [RegExp, string][] = [
  [/^\/katalog(\/|$)/, 'Katalog Sekolah Unggulan'],
  [/^\/checklist(\/|$)/, 'Checklist'],
  [/^\/timeline(\/|$)/, 'Timeline'],
  [/^\/forum(\/|$)/, 'Forum'],
  [/^\/profil(\/|$)/, 'Profil Saya'],
];

function KatalogFilters({ onPick }: { onPick: () => void }) {
  const schools = useSchools();
  const f = useKatalogFilter();
  const provinces = [...new Set(schools.map(s => s.info.province).filter(Boolean))].sort();
  if (schools.some(isMulti)) provinces.push(MULTI);
  const pick = (patch: Parameters<typeof f.set>[0]) => { f.set(patch); onPick(); };
  const pill = (on: boolean) => [css.pill, on ? css.pillOn : ''].join(' ');
  const select = (label: string, value: string, options: [string, string][], onChange: (v: string) => void) => (
    <label className={pill(value !== 'all')}>
      <select aria-label={label} value={value} onChange={e => onChange(e.target.value)}>
        {options.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
      </select>
      <Icon name="chevronDown" size={14} stroke={2.2} />
    </label>
  );
  return (
    <div className={css.filters}>
      {select('Lokasi', f.lok, [['all', 'Lokasi'], ...provinces.map(p => [p, p] as [string, string])], v => pick({ lok: v }))}
      {select('Asrama', f.asr, [['all', 'Asrama'], ['ya', 'Berasrama'], ['tidak', 'Tanpa asrama']], v => pick({ asr: v }))}
      {select('Biaya', f.biaya, [['all', 'Biaya'], ['gratis', 'Gratis'], ['bayar', 'Berbayar']], v => pick({ biaya: v }))}
      <div className={css.search}>
        {f.qOpen && (
          <input autoFocus value={f.q} placeholder="Cari nama sekolah…" aria-label="Cari nama sekolah"
            onChange={e => pick({ q: e.target.value })}
            onKeyDown={e => { if (e.key === 'Escape') f.set({ qOpen: false, q: '' }); }} />
        )}
        <button type="button" className={css.searchBtn} title={f.qOpen ? 'Tutup pencarian' : 'Cari nama sekolah'}
          aria-label={f.qOpen ? 'Tutup pencarian' : 'Cari nama sekolah'}
          onClick={() => f.set(f.qOpen ? { qOpen: false, q: '' } : { qOpen: true })}>
          <Icon name={f.qOpen ? 'x' : 'search'} size={f.qOpen ? 16 : 18} stroke={2.2} />
        </button>
      </div>
    </div>
  );
}

function Bell() {
  const [open, setOpen] = useState(false);
  const schools = useSchools();
  const sel = useStore(s => s.sel);
  const items = deadlineNotifs(schools, sel, startOfToday());
  const shown = items.slice(0, 8);
  return (
    <div className={css.bellWrap}>
      <button type="button" className={css.bell} title="Notifikasi" aria-label="Notifikasi" aria-expanded={open} onClick={() => setOpen(o => !o)}>
        <Icon name="bell" size={19} stroke={1.8} />
        {items.length > 0 && <span className={css.badge}>{Math.min(items.length, 9)}</span>}
      </button>
      {open && (
        <>
          <div className={css.overlay} onClick={() => setOpen(false)} />
          <div className={css.panel} role="dialog" aria-label="Notifikasi">
            <div className={css.panelTitle}>Notifikasi</div>
            {items.length > 0 && <div className={css.panelSub}>Jadwal 60 hari ke depan dari sekolah yang kamu simpan</div>}
            {items.length === 0 && <div className={css.panelEmpty}>Belum ada notifikasi. Simpan sekolah di Katalog untuk dapat pengingat jadwal.</div>}
            <div className={css.panelList}>
              {shown.map(n => (
                <Link key={n.key} href={n.href} className={css.item} onClick={() => setOpen(false)}>
                  <span className={[css.itemIcon, n.tone === 'warn' ? css.itemWarn : css.itemAmb].join(' ')}><Icon name="navTimeline" size={16} stroke={1.8} /></span>
                  <span className={css.itemText}>
                    <span className={css.itemTitle}>{n.title}</span>
                    <span className={css.itemSub}>{n.sub}</span>
                  </span>
                  <span className={[css.itemWhen, n.days <= 14 ? css.itemWhenSoon : ''].join(' ')}>{n.when}</span>
                </Link>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

/** The sticky bar of the student pages: page title (and a back button inside a school's checklist), Katalog filters, notifications. */
export default function StudentTopBar({ pathname, onMenu }: { pathname: string; onMenu: () => void }) {
  const title = TITLES.find(([re]) => re.test(pathname))?.[1] ?? '';
  const inKatalog = /^\/katalog(\/|$)/.test(pathname);
  const inSchoolChecklist = /^\/checklist\/[^/]+/.test(pathname);
  const router = useRouter();
  return (
    <div className={css.bar}>
      <span className={css.left}>
        <button type="button" className={css.burger} title="Menu" aria-label="Buka menu" onClick={onMenu}><Icon name="menu" size={20} stroke={1.6} /></button>
        {inSchoolChecklist && (
          <Link href="/checklist" className={css.back} title="Kembali ke semua SMA pilihan" aria-label="Kembali ke semua SMA pilihan">
            <Icon name="arrowLeft" size={16} stroke={2} />
          </Link>
        )}
        <span className={css.title}>{title}</span>
      </span>
      {inKatalog ? <div className={css.center}><KatalogFilters onPick={() => { if (pathname !== '/katalog') router.push('/katalog'); }} /></div> : <span />}
      <div className={css.right}><Bell /></div>
    </div>
  );
}
