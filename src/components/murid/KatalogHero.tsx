'use client';

import { useRef, useState } from 'react';
import Link from 'next/link';
import type { School } from '@/data/types';
import { useIsMobile } from '@/lib/hooks';
import { highlightsOf, sc } from '@/lib/murid';
import { useStore } from '@/lib/store';
import Icon from '../Icon';
import css from './katalog.module.css';

const title = (s: School) => (s.status === 'resmi' ? `Pendaftaran ${s.short} sudah dibuka` : s.name);
const sub = (s: School) => {
  const h = highlightsOf(s)[0];
  return s.status === 'resmi' || !h?.d ? s.tag : `${h.t}. ${h.d}`;
};

/** The swipeable highlight strip at the top of the Katalog: schools with official info first, then the rest. */
export default function KatalogHero({ schools }: { schools: School[] }) {
  const mobile = useIsMobile();
  const sel = useStore(s => s.sel);
  const toggleSel = useStore(s => s.toggleSel);
  const [idx, setIdx] = useState(0);
  const downX = useRef<number | null>(null);
  const lock = useRef(0);
  const acc = useRef(0);

  const list = schools.slice().sort((a, b) => Number(b.status === 'resmi') - Number(a.status === 'resmi') || Number(!!b.photos?.[0]) - Number(!!a.photos?.[0]));
  const n = list.length;
  if (!n) return null;
  const i = ((idx % n) + n) % n;
  const w = mobile ? 88 : 70;
  const go = (to: number) => setIdx(((to % n) + n) % n);

  return (
    <>
      <div className={css.hero}>
        <div className={css.track} style={{ transform: `translateX(calc(${-i * w}% - ${i * 16}px))` }}
          onPointerDown={e => { downX.current = e.clientX; }}
          onPointerUp={e => {
            if (downX.current == null) return;
            const dx = e.clientX - downX.current; downX.current = null;
            if (Math.abs(dx) > 40) go(i + (dx < 0 ? 1 : -1));
          }}
          onWheel={e => {
            if (Math.abs(e.deltaX) <= Math.abs(e.deltaY)) return;
            const now = Date.now();
            if (now < lock.current) return;
            acc.current += e.deltaX;
            if (Math.abs(acc.current) > 50) { const dir = acc.current > 0 ? 1 : -1; acc.current = 0; lock.current = now + 650; go(i + dir); }
          }}>
          {list.map((s, k) => {
            const on = !!sel[s.id], cur = k === i;
            return (
              <div key={s.id} {...sc(s)} className={css.slide} style={{ flex: `0 0 ${w}%`, cursor: cur ? 'default' : 'pointer' }}
                onClick={() => { if (!cur) go(k); }}>
                <span className={css.watermark}>{s.mono}</span>
                <div className={css.slideText}>
                  <span className={css.slideEyebrow}>SMA UNGGULAN PALING DIINCAR</span>
                  <h2 className={css.slideTitle}>{title(s)}</h2>
                  <p className={css.slideSub}>{sub(s)}</p>
                  <div className={css.slideGap} />
                  <div className={css.slideActions}>
                    <Link href={'/katalog/' + s.id} className={css.slideOpen} onClick={e => e.stopPropagation()}>Lihat sekolah</Link>
                    <button type="button" className={css.slideHeart} aria-pressed={on} title={on ? 'Batal simpan' : 'Simpan sekolah'}
                      aria-label={(on ? 'Batal simpan ' : 'Simpan ') + s.short}
                      onClick={e => { e.stopPropagation(); toggleSel(s.id); }}>
                      <Icon name="heart" size={18} stroke={1.8} fill={on} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
      {n > 1 && (
        <div className={css.dots}>
          {list.map((s, k) => (
            <button key={s.id} type="button" className={css.dot} style={{ width: k === i ? 24 : 8, background: k === i ? 'var(--cta-bg)' : 'var(--hair-strong)' }}
              title={s.short} aria-label={'Sorotan ' + s.short} aria-current={k === i} onClick={() => go(k)} />
          ))}
        </div>
      )}
    </>
  );
}
