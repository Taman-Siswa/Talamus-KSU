'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import type { School } from '@/data/types';
import { P, fmt, fmtR, startOfToday } from '@/lib/dates';
import { sc } from '@/lib/murid';
import { useSchools } from '@/lib/schools';
import { useStore } from '@/lib/store';
import Icon from '../Icon';
import ui from './murid.module.css';
import css from './timeline.module.css';

type Phase = School['phases'][number];
interface Pop { school: School; n: string; l: string; items: { n: string; l: string; date: string; status: string; est: boolean }[] }

const DAY = 864e5;
const MONTH_PX = 900;
const HEAD = 56;
const clean = (l: string) => l.replace(/\s*\(.*\)\s*$/, '');

/**
 * Every saved school on one board: a row per school, its stages as pills on a day scale that scrolls sideways.
 * Stages that start close together share one pill. The board spans the months that hold the stages (at least eight).
 */
export default function TimelineBoard() {
  const schools = useSchools();
  const sel = useStore(s => s.sel);
  const hide = useStore(s => s.tlHide);
  const toggleTlHide = useStore(s => s.toggleTlHide);
  const [pop, setPop] = useState<Pop | null>(null);
  const [cfOpen, setCfOpen] = useState(false);
  const scroller = useRef<HTMLDivElement>(null);

  const selected = schools.filter(s => sel[s.id]);
  const today = startOfToday();
  const dated = (s: School) => s.phases.filter(p => p.s).map(p => ({ ...p, e: p.e || p.s }));

  // Range: whole months around every stage and today, at least eight of them.
  const all = selected.flatMap(dated);
  const lo = new Date(Math.min(today.valueOf(), ...all.map(p => P(p.s).valueOf())));
  const hi = new Date(Math.max(today.valueOf(), ...all.map(p => P(p.e).valueOf())));
  const R0 = new Date(lo.getFullYear(), lo.getMonth(), 1);
  let months = (hi.getFullYear() - R0.getFullYear()) * 12 + hi.getMonth() - R0.getMonth() + 1;
  months = Math.max(8, months);
  const R1 = new Date(R0.getFullYear(), R0.getMonth() + months, 1);
  const SPAN = R1.valueOf() - R0.valueOf();
  const pctD = (d: Date) => Math.min(100, Math.max(0, ((d.valueOf() - R0.valueOf()) / SPAN) * 100));
  const pct = (iso: string) => pctD(P(iso));
  const width = months * MONTH_PX;
  const TW = width - HEAD;
  const MINP = (200 / TW) * 100;
  const DAYP = 100 / (SPAN / DAY);
  const frac = (today.valueOf() - R0.valueOf()) / SPAN;
  const at = (f: number) => `calc(${HEAD}px + (100% - ${HEAD}px) * ${f.toFixed(4)})`;

  // Opens scrolled to today, like the "Return" button.
  const toToday = (smooth: boolean) => {
    const el = scroller.current;
    if (el) el.scrollTo({ left: Math.max(0, (el.scrollWidth - HEAD) * frac - 80), behavior: smooth ? 'smooth' : 'auto' });
  };
  const hasRows = selected.length > 0;
  useEffect(() => { if (hasRows) toToday(false); }, [hasRows]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!hasRows) return <div className={css.empty}>Simpan sekolah dari Katalog untuk melihat timeline-nya di sini.</div>;

  const status = (p: Phase) => P(p.s) <= today
    ? (P(p.e || p.s) >= today ? 'Sedang berlangsung' : 'Sudah lewat')
    : 'Belum dimulai · ' + Math.ceil((P(p.s).valueOf() - today.valueOf()) / DAY) + ' hari lagi';

  const rows = selected.filter(s => !hide[s.id]).map(s => {
    const ph = dated(s).sort((a, b) => P(a.s).valueOf() - P(b.s).valueOf());
    const groups: { l: number; items: { p: Phase; i: number }[] }[] = [];
    ph.forEach((p, i) => {
      const g = groups[groups.length - 1];
      if (g && pct(p.s) < g.l + MINP) g.items.push({ p, i }); else groups.push({ l: pct(p.s), items: [{ p, i }] });
    });
    const segs = groups.map((g, gi) => {
      const { items } = g, first = items[0], last = items[items.length - 1], multi = items.length > 1;
      const on = P(first.p.s) <= today;
      const endMax = Math.max(...items.map(x => pct(x.p.e) + DAYP));
      const next = groups[gi + 1];
      const w = Math.max(MINP - 0.1, Math.min(endMax - g.l, next ? next.l - g.l - 0.1 : 1e9));
      const wide = (w / 100) * TW >= 280;
      const allEst = items.every(x => x.p.est), anyEst = items.some(x => x.p.est);
      const n = multi ? `${first.i + 1}–${last.i + 1}/${ph.length}` : `${first.i + 1}/${ph.length}`;
      return {
        key: gi, on, left: g.l, w, n, allEst,
        l: multi ? items.length + ' tahap · ' + clean(first.p.l) : clean(first.p.l),
        tag: wide ? (allEst ? 'Perkiraan' : anyEst ? 'Campuran' : 'Resmi') : (allEst ? 'E' : anyEst ? 'E/R' : 'R'),
        tip: items.map(x => `${x.i + 1}/${ph.length} ${x.p.l} · ${fmtR(x.p.s, x.p.e)}`).join('\n'),
        pop: {
          school: s, n: n.replace('/', ' dari '), l: multi ? items.length + ' tahap berdekatan' : first.p.l,
          items: items.map(x => ({ n: `${x.i + 1}/${ph.length}`, l: x.p.l, date: fmtR(x.p.s, x.p.e), status: status(x.p), est: !!x.p.est })),
        },
      };
    });
    const firstS = ph[0] ? P(ph[0].s) : null;
    const idle = !!firstS && firstS > today && (firstS.valueOf() - today.valueOf()) / DAY > 30;
    return { s, segs, idle, firstS };
  });

  // Tests of two saved schools that overlap (announcements and registration windows don't clash).
  const pairs = new Map<string, { range: string; a: string; b: string; n: number }>();
  selected.forEach((A, i) => selected.slice(i + 1).forEach(B => {
    dated(A).filter(p => p.t === 'tes').forEach(pa => dated(B).filter(p => p.t === 'tes').forEach(pb => {
      const s0 = Math.max(P(pa.s).valueOf(), P(pb.s).valueOf()), e0 = Math.min(P(pa.e).valueOf(), P(pb.e).valueOf());
      if (s0 > e0) return;
      const k = A.mono + ' × ' + B.mono, prev = pairs.get(k);
      if (prev) prev.n++;
      else pairs.set(k, { range: fmt(new Date(s0)) + (s0 === e0 ? '' : '–' + fmt(new Date(e0))), a: pa.l, b: pb.l, n: 1 });
    }));
  }));
  const cut = (t: string) => { const x = clean(t); return x.length > 40 ? x.slice(0, 39) + '…' : x; };
  const conflicts = [...pairs].map(([pair, c]) => ({ pair, range: c.range, what: cut(c.a) + ' vs ' + cut(c.b) + (c.n > 1 ? ` (+${c.n - 1} tahap lain)` : '') }));
  const showCf = cfOpen && conflicts.length > 0;

  const ticks: { left: number; d: number; tip: string }[] = [];
  const monthsAt: { left: number; l: string }[] = [];
  for (let m = 0; m < months; m++) {
    const first = new Date(R0.getFullYear(), R0.getMonth() + m, 1);
    monthsAt.push({ left: pctD(first), l: fmt(first).split(' ')[1] });
    [1, 8, 15, 22, 29].forEach(d => {
      const dt = new Date(first.getFullYear(), first.getMonth(), d);
      if (dt.getMonth() === first.getMonth()) ticks.push({ left: pctD(dt), d, tip: fmt(dt) });
    });
  }

  return (
    <div className={css.card}>
      <div className={css.top}>
        <div className={css.title}>Timeline gabungan</div>
        <div className={css.chips}>
          <button type="button" className={css.ret} title="Kembali ke hari ini" onClick={() => toToday(true)}>
            <Icon name="undo" size={14} stroke={2} />Return
          </button>
          {selected.map(s => (
            <button key={s.id} type="button" className={[css.chip, hide[s.id] ? css.chipOff : ''].join(' ')} title={s.name}
              aria-pressed={!hide[s.id]} onClick={() => toggleTlHide(s.id)} {...sc(s)}>
              <span className={css.chipMono}>{s.mono}</span>{s.short}
            </button>
          ))}
        </div>
      </div>

      <div className={css.scroll} ref={scroller}>
        <div className={css.board} style={{ minWidth: width }}>
          <div className={css.months}>
            <div className={css.today} style={{ left: at(frac) }}>Hari ini</div>
            <div className={css.stick} />
            <div className={css.monthRow}>
              {monthsAt.map(m => <span key={m.left} className={css.month} style={{ left: m.left + '%' }}>{m.l}</span>)}
            </div>
          </div>
          <div className={css.tickRow}>
            <div className={css.stick} />
            <div className={css.ticks}>
              {ticks.map(t => <span key={t.left} title={t.tip} className={[css.tick, t.d === 1 ? css.tickFirst : ''].join(' ')} style={{ left: t.left.toFixed(2) + '%' }}>{t.d}</span>)}
            </div>
          </div>
          <div className={css.rows}>
            <div className={css.line} style={{ left: at(frac) }} />
            {rows.map(({ s, segs, idle, firstS }) => (
              <div key={s.id} className={css.row} {...sc(s)}>
                <div className={css.rowHead}><span className={css.rowMono} title={s.short}>{s.mono}</span></div>
                <div className={css.lane} style={{ background: `repeating-linear-gradient(to right, var(--hair-soft) 0, var(--hair-soft) 1px, transparent 1px, transparent ${100 / months}%)` }}>
                  {idle && firstS && (
                    <div className={css.idle} style={{ left: `calc(${(frac * 100).toFixed(2)}% + 10px)` }}>
                      Belum ada tahap berjalan · tahap 1 mulai <strong>{fmt(firstS)}</strong> ({Math.ceil((firstS.valueOf() - today.valueOf()) / DAY)} hari lagi) →
                    </div>
                  )}
                  {segs.map(g => (
                    <button key={g.key} type="button" title={g.tip} className={[css.seg, g.on ? css.segOn : ''].join(' ')}
                      style={{ left: g.left.toFixed(3) + '%', width: g.w.toFixed(3) + '%' }} onClick={() => setPop(g.pop)}>
                      <span className={css.segN}>{g.n}</span>
                      <span className={css.segL}>{g.l}</span>
                      <span className={[css.segTag, g.allEst ? css.segTagEst : ''].join(' ')}>{g.tag}</span>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className={css.legend}>
        <span className={css.legendItem}><span className={css.swOn} />Sedang berlangsung / sudah lewat</span>
        <span className={css.legendItem}><span className={css.swOff} />Belum dimulai</span>
      </div>

      <div className={[css.cf, conflicts.length ? css.cfWarn : ''].join(' ')}>
        <button type="button" className={css.cfBtn} aria-expanded={showCf} onClick={() => conflicts.length && setCfOpen(!cfOpen)}>
          <span className={css.cfTitle}>{conflicts.length ? conflicts.length + ' potensi bentrok jadwal' : 'Tidak ada bentrok jadwal'}</span>
          <span className={css.cfHint}>{conflicts.length ? (showCf ? 'Sembunyikan' : 'Lihat detail') : 'Jadwal tes aman'}</span>
          {conflicts.length > 0 && <Icon name="chevronDown" size={15} stroke={2.2} className={[css.cfChev, showCf ? css.cfChevOpen : ''].join(' ')} />}
        </button>
        {showCf && (
          <ul className={css.cfList}>
            {conflicts.map(c => <li key={c.pair}><strong>{c.range}</strong> · {c.pair}<span> — {c.what}</span></li>)}
          </ul>
        )}
      </div>

      {pop && (
        <div className={ui.modalBack} onClick={() => setPop(null)}>
          <div className={css.pop} onClick={e => e.stopPropagation()} role="dialog" aria-modal="true" aria-label={pop.l} {...sc(pop.school)}>
            <div className={css.popHead}>
              <span className={css.popMono}>{pop.school.mono}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className={css.popSub}>{pop.school.name} · Tahap {pop.n}</div>
                <div className={css.popTitle}>{pop.l}</div>
              </div>
              <button type="button" className={ui.modalClose} title="Tutup" onClick={() => setPop(null)}><Icon name="x" size={15} stroke={2.2} /></button>
            </div>
            <div className={css.popItems}>
              {pop.items.map(it => (
                <div key={it.n} className={css.popItem}>
                  <div className={css.popItemTop}>
                    <span className={css.popN}>{it.n}</span>
                    <span className={css.popL}>{it.l}</span>
                    <span className={[css.popTag, it.est ? css.popTagEst : ''].join(' ')}>{it.est ? 'Perkiraan' : 'Resmi'}</span>
                  </div>
                  <div className={css.popDate}>{it.date} · {it.status}</div>
                </div>
              ))}
            </div>
            <div className={css.popNote}>
              {pop.items.some(x => x.est) ? 'Perkiraan = diperkirakan dari pola tahun lalu. Cek lagi saat info resmi rilis.' : 'Tanggal sesuai pengumuman resmi sekolah.'}
            </div>
            <div className={css.popFoot}>
              <Link href={'/katalog/' + pop.school.id} className={ui.ghostBtn}>Lihat profil sekolah</Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
