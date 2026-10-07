'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import type { School } from '@/data/types';
import { startOfToday } from '@/lib/dates';
import { progressOf, sc, upcomingOf } from '@/lib/murid';
import { useRouteId } from '@/lib/route-id';
import { useSchool } from '@/lib/schools';
import { useStore } from '@/lib/store';
import ChecklistCard from '../ChecklistCard';
import Icon from '../Icon';
import CekSyaratModal from './CekSyaratModal';
import FitCheck from './FitCheck';
import PhotoTile from './PhotoTile';
import { STORY_KEYS } from './fit';
import css from './checklist.module.css';
import ui from './murid.module.css';

type Tab = 'berkas' | 'pendaftaran' | 'non';

/** One saved school's checklist: administrative items, the TAMAN Fit Check, and the side cards. */
export default function ChecklistDetail() {
  const id = useRouteId();
  const school = useSchool(id);
  const saved = useStore(s => !!s.sel[id]);
  if (!school || !saved) {
    return (
      <div className={css.emptyBox}>
        <div className={css.emptyTitle}>{school ? school.short + ' belum disimpan' : 'Sekolah tidak ditemukan'}</div>
        <div className={css.emptySub}>
          {school ? 'Simpan sekolah ini dulu — checklist persiapannya otomatis muncul.' : 'Tidak ada sekolah dengan kode itu.'}
        </div>
        <Link href={school ? '/katalog/' + school.id : '/katalog'} className={ui.pillBtn}>{school ? 'Lihat profil sekolah' : 'Buka Katalog'}</Link>
      </div>
    );
  }
  return <Detail school={school} />;
}

function Detail({ school: S }: { school: School }) {
  const [tab, setTab] = useState<Tab>('berkas');
  const [cek, setCek] = useState(false);
  const checks = useStore(s => s.checks);
  const fit = useStore(s => s.fit[S.id]) ?? {};
  const eligDone = useStore(s => !!s.eligDone[S.id]);

  // "#non" (from the Ceritaku note on the picker) opens the non-administrative tab.
  useEffect(() => {
    const sync = () => {
      const hash = location.hash.slice(1);
      setTab(hash === 'non' || hash === 'pendaftaran' ? hash : 'berkas');
    };
    sync();
    window.addEventListener('hashchange', sync);
    return () => window.removeEventListener('hashchange', sync);
  }, []);

  const { pct: pA } = progressOf(S, checks);
  const berkas = progressOf(S, checks, 'berkas');
  const daftar = progressOf(S, checks, 'pendaftaran');
  const goTab = (next: Tab) => { setTab(next); history.replaceState(null, '', '#' + next); };
  const scored = (fit.me ?? []).filter(x => x > 0).length;
  const nDone = scored
    + [0, 1, 2, 3, 4].filter(i => (fit.qual?.[i] ?? '').trim()).length
    + STORY_KEYS.filter(k => (fit.story?.[k] ?? '').trim()).length;
  const pN = Math.round((nDone / 17) * 100);
  const pE = eligDone ? 100 : 0;
  const bars: { k: 'syarat' | Tab; l: string; c: string; pct: number; bar: string }[] = [
    { k: 'syarat', l: 'Cek Syarat', c: eligDone ? 'Sudah dicek' : 'Belum dicek', pct: pE, bar: '#9A6B00' },
    { k: 'non', l: 'Non-Administratif', c: nDone + '/17 isian', pct: pN, bar: '#2E7CB8' },
    { k: 'berkas', l: 'Kesiapan berkas', c: berkas.done + '/' + berkas.total + ' berkas', pct: berkas.pct, bar: '#2D6327' },
    { k: 'pendaftaran', l: 'Pendaftaran & seleksi', c: daftar.done + '/' + daftar.total + ' langkah', pct: daftar.pct, bar: '#9A6B00' },
  ];

  const today = startOfToday();
  const up = upcomingOf(S, today);
  const remCls = !up ? css.remChip : up.days <= 14 ? css.remWarn : css.remAmb;
  const tabs: [Tab, string, string][] = [['berkas', 'Berkas', berkas.done + '/' + berkas.total], ['pendaftaran', 'Pendaftaran', daftar.done + '/' + daftar.total], ['non', 'Non-Administratif', scored + '/5']];

  return (
    <div className={css.detail} {...sc(S)}>
      <div className={css.left}>
        <div className={css.hero}><PhotoTile school={S} size={44} /></div>
        <div className={css.head}>
          <span className={css.headMono}>{S.mono}</span>
          <div className={css.headName}>{S.name}</div>
          <div className={css.seg} role="tablist">
            {tabs.map(([k, l, c]) => (
              <button key={k} type="button" role="tab" aria-selected={tab === k} className={[css.segBtn, tab === k ? css.segOn : ''].join(' ')}
                onClick={() => goTab(k)}>
                {l}<span className={css.segCount}>{c}</span>
              </button>
            ))}
          </div>
        </div>
        {tab === 'non' ? <FitCheck school={S} /> : <ChecklistCard school={S} group={tab} />}
      </div>

      <div className={css.right}>
        <Link href="/timeline" className={[css.remind, remCls].join(' ')} title="Lihat di Timeline">
          <div className={css.remEye}><Icon name="bell" size={15} stroke={1.9} />{up ? 'JADWAL TERDEKAT · ' + (up.days === 0 ? 'HARI INI' : up.days + ' HARI LAGI') : 'JADWAL TERDEKAT'}</div>
          <div className={css.remDate}>{up ? up.date.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : 'Belum ada'}</div>
          <div className={css.remTip}>{up ? up.label : 'Jadwal 2027/28 belum dirilis'}</div>
          <div className={css.remSub}>{S.short}</div>
        </Link>

        <div className={css.side}>
          <div className={css.sideHead}>
            <span className={css.sideTitle}>Progres persiapan</span>
            <span className={css.sideTotal}>{Math.round((pE + pN + pA) / 3)}%</span>
          </div>
          {bars.map(b => (
            <button key={b.k} type="button" className={css.pg} onClick={() => (b.k === 'syarat' ? setCek(true) : goTab(b.k))}>
              <div className={css.pgHead}><span>{b.l}</span><span>{b.c} · <strong>{b.pct}%</strong></span></div>
              <div className={css.pgBar}><div className={css.pgFill} style={{ width: b.pct + '%', background: b.bar }} /></div>
            </button>
          ))}
        </div>

        <div className={css.side}>
          <div className={css.cekHead}>
            <span className={[css.cekIcon, eligDone ? css.cekIconOk : ''].join(' ')}><Icon name="badge" size={18} stroke={1.8} /></span>
            <div>
              <div className={css.sideTitle}>Cek syarat</div>
              <div className={css.cekStatus}>{eligDone ? 'Sudah dicek — buka untuk lihat hasilnya' : 'Belum dicek'}</div>
            </div>
          </div>
          <div className={css.cekDesc}>Nilai rapor, usia, dan persyaratan lain {S.short} — cek sebelum mulai menyiapkan berkas.</div>
          <button type="button" className={css.cekBtn} onClick={() => setCek(true)}>{eligDone ? 'Lihat / ubah jawaban' : 'Mulai cek syarat'}</button>
        </div>
      </div>
      {cek && <CekSyaratModal school={S} onClose={() => setCek(false)} />}
    </div>
  );
}
