'use client';

import { useEffect, useRef, useState } from 'react';
import type { PhaseType, School } from '@/data/types';
import { MO, P, R0, R1, fmt, fmtR, startOfToday } from '@/lib/dates';
import { keyDatesOf } from '@/lib/schools';
import Icon from './Icon';
import css from './ui.module.css';
import tl from './timeline.module.css';

export function UpcomingDeadlines({ schools }: { schools: School[] }) {
  const today = startOfToday();
  const evts = schools.flatMap(s => keyDatesOf(s).map(k => ({ s, k, d: P(k.d) })))
    .filter(e => e.d >= today)
    .sort((a, b) => a.d.valueOf() - b.d.valueOf())
    .slice(0, 5);
  return (
    <div className={css.card}>
      <div className={css.cardTitle} style={{ marginBottom: 4 }}>Deadline terdekat</div>
      <div className={css.cardSub} style={{ marginBottom: 14 }}>Per hari ini, {fmt(today, true)}</div>
      <div className={css.col}>
        {evts.length === 0 ? <div className={css.cardSub}>Tidak ada deadline mendatang untuk sekolah yang ditampilkan.</div> : null}
        {evts.map(e => {
          const days = Math.round((e.d.valueOf() - today.valueOf()) / 864e5);
          return (
            <div key={e.s.id + e.k.d + e.k.l} className={css.dlRow} data-school={e.s.id}>
              <span className={css.mono}>{e.s.mono}</span>
              <div className={css.rowBody}>
                <div className={css.dlLabel}>{e.k.l}</div>
                <div className={css.dlMeta}>{e.s.short} · {fmt(e.d, true)}</div>
              </div>
              <span className={[css.dayPill, days <= 7 ? css.warn : days <= 21 ? css.amb : ''].join(' ')}>
                {days === 0 ? 'Hari ini' : days + ' hari lagi'}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/*
 * Two scales, scrolled sideways: "Minggu" (one 84px column per week, wide enough to write a stage's name on
 * its bar) and "Bulan" (one ~140px column per month, the whole season in about one screen).
 */
export type Scale = 'week' | 'month';
const SCALE_KEY = 'tsprep-timeline-scale';
const DAY = 864e5;
const DAY_W: Record<Scale, number> = { week: 12, month: 4.6 };
const START = (() => {
  const d = new Date(R0);
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7)); // back to Monday, so week columns start on Monday
  return d;
})();
const DAYS = Math.ceil((R1.valueOf() - START.valueOf()) / DAY);
const dayIndex = (d: Date) => Math.round((d.valueOf() - START.valueOf()) / DAY);

const MONTH_STARTS = (() => {
  const out: { i: number; label: string }[] = [];
  for (let d = new Date(R0); d < R1; d.setMonth(d.getMonth() + 1)) {
    out.push({ i: dayIndex(d), label: MO[d.getMonth()] + (d.getMonth() === 0 || out.length === 0 ? ' ' + d.getFullYear() : '') });
  }
  return out;
})();
const WEEK_STARTS = Array.from({ length: Math.ceil(DAYS / 7) }, (_, w) => {
  const d = new Date(START);
  d.setDate(d.getDate() + w * 7);
  return { i: w * 7, label: String(d.getDate()) };
});

const TYPE_CLASS: Record<PhaseType, string> = { daftar: tl.barDaftar, tes: tl.barTes, umum: tl.barUmum };
const TYPE_LABEL: Record<PhaseType, string> = { daftar: 'Pendaftaran', tes: 'Tes & seleksi', umum: 'Pengumuman' };

type Placed = { key: string; label: string; t: PhaseType; left: number; width: number; when: string };

/**
 * A school's stages packed into as few lanes as possible: a stage goes on the first lane where it doesn't
 * touch the bar before it. Bars carry no text (the name shows on hover or tap), so lanes stay few.
 */
function packLanes(s: School, dayW: number): Placed[][] {
  const items: Placed[] = s.phases.filter(p => p.s).map(p => {
    const a = dayIndex(P(p.s)), b = dayIndex(P(p.e || p.s));
    return {
      key: p.l + p.s, label: p.l, t: p.t, left: a * dayW, width: Math.max(dayW, 8, (b - a + 1) * dayW),
      when: fmtR(p.s, p.e || p.s) + (p.est ? ' · perkiraan' : ''),
    };
  }).sort((x, y) => x.left - y.left);
  const lanes: Placed[][] = [];
  const ends: number[] = [];
  for (const it of items) {
    const i = ends.findIndex(e => e + 4 <= it.left);
    if (i < 0) { lanes.push([it]); ends.push(it.left + it.width); } else { lanes[i].push(it); ends[i] = it.left + it.width; }
  }
  return lanes;
}

/** Gantt + conflict check for the given schools: grouped by school, stages packed into lanes (see packLanes). */
export default function TimelineGantt({ schools: selected }: { schools: School[] }) {
  const today = startOfToday();
  // Remembered per browser; a missing or blocked storage just means the week view.
  const [scale, setScale] = useState<Scale>(() => {
    try { return localStorage.getItem(SCALE_KEY) === 'month' ? 'month' : 'week'; } catch { return 'week'; }
  });
  const pickScale = (next: Scale) => {
    setScale(next);
    try { localStorage.setItem(SCALE_KEY, next); } catch { /* the choice lasts for this visit only */ }
  };
  const dayW = DAY_W[scale];
  const totalW = DAYS * dayW;
  const todayX = dayIndex(today) * dayW + dayW / 2;
  const ticks = scale === 'week' ? WEEK_STARTS : MONTH_STARTS;
  const scroller = useRef<HTMLDivElement>(null);
  // The tapped bar, for touch screens where hover doesn't exist; hover and keyboard focus work through CSS.
  const [openTip, setOpenTip] = useState<string | null>(null);

  // Open on today, with a little of the past still in view (two weeks, or about half a month).
  const toToday = (smooth?: boolean) =>
    scroller.current?.scrollTo({ left: Math.max(0, todayX - 14 * DAY_W.week), behavior: smooth ? 'smooth' : 'auto' });
  useEffect(() => { toToday(); }, [scale]); // eslint-disable-line react-hooks/exhaustive-deps

  // Conflict = any stage of one school overlapping any stage of another (as in "Design system v2 Murid").
  const confs: { range: string; title: string }[] = [];
  for (let i = 0; i < selected.length; i++) for (let j = i + 1; j < selected.length; j++) {
    selected[i].phases.forEach(pa => {
      selected[j].phases.forEach(pb => {
        const s0 = Math.max(P(pa.s).valueOf(), P(pb.s).valueOf());
        const e0 = Math.min(P(pa.e || pa.s).valueOf(), P(pb.e || pb.s).valueOf());
        if (s0 <= e0) confs.push({
          range: fmt(new Date(s0)) + (s0 === e0 ? '' : '–' + fmt(new Date(e0))),
          title: selected[i].short + ' (' + pa.l + ') × ' + selected[j].short + ' (' + pb.l + ')',
        });
      });
    });
  }
  const has = confs.length > 0;

  return (
    <>
      <div className={css.card}>
        <div className={tl.head}>
          <div>
            <div className={css.cardTitle}>Timeline gabungan</div>
            <div className={tl.legend} aria-label="Keterangan warna">
              <span><i className={[tl.swatch, tl.barDaftar].join(' ')} />Pendaftaran</span>
              <span><i className={[tl.swatch, tl.barTes].join(' ')} />Tes &amp; seleksi</span>
              <span><i className={[tl.swatch, tl.barUmum].join(' ')} />Pengumuman</span>
            </div>
          </div>
          <div className={tl.tools}>
            <div className={tl.seg} role="radiogroup" aria-label="Skala waktu">
              {(['week', 'month'] as const).map(v => (
                <button key={v} type="button" role="radio" aria-checked={scale === v}
                  className={[tl.segBtn, scale === v ? tl.segOn : ''].join(' ')} onClick={() => pickScale(v)}>
                  {v === 'week' ? 'Minggu' : 'Bulan'}
                </button>
              ))}
            </div>
            <button type="button" className={tl.todayBtn} onClick={() => toToday(true)}>Hari ini</button>
          </div>
        </div>

        <div className={tl.scroller} ref={scroller}>
          <div className={tl.canvas} style={{ width: totalW }}>
            <div className={tl.todayLine} style={{ left: todayX }}><span className={[tl.todayTag, scale === 'month' ? tl.todayTagLow : ''].join(' ')}>Hari ini</span></div>
            <div className={tl.months}>
              {MONTH_STARTS.map(m => <span key={m.label} className={tl.month} style={{ left: m.i * dayW }}>{m.label}</span>)}
            </div>
            {/* week view: the date each week starts; month view has the month names above and nothing finer */}
            <div className={tl.weeks}>
              {scale === 'week' ? WEEK_STARTS.map(w => <span key={w.i} className={tl.week} style={{ left: w.i * dayW }}>{w.label}</span>) : null}
            </div>

            <div className={tl.body}>
              {ticks.map(t => <i key={t.i} className={tl.gridLine} style={{ left: t.i * dayW }} />)}
              {selected.map(s => {
                // The school's whole schedule next to its name, so a row that is empty in view says where to scroll.
                const dated = s.phases.filter(p => p.s);
                const first = dated.reduce((m, p) => (p.s < m ? p.s : m), dated[0]?.s || '');
                const last = dated.reduce((m, p) => ((p.e || p.s) > m ? p.e || p.s : m), '');
                return (
                <div key={s.id} data-school={s.id}>
                  <div className={tl.group}>
                    <span className={tl.groupLabel}>
                      <span className={[css.mono, css.monoSm].join(' ')}>{s.mono}</span>{s.short}
                      {first ? <span className={tl.groupRange}>{fmtR(first, last)}</span> : null}
                    </span>
                  </div>
                  {packLanes(s, dayW).map((lane, i) => (
                    <div key={i} className={tl.row}>
                      {lane.map(b => (
                        // A button so the tooltip also opens on tap (focus) and from the keyboard.
                        <button key={b.key} type="button" className={[tl.bar, TYPE_CLASS[b.t], openTip === s.id + b.key ? tl.barOpen : ''].join(' ')}
                          style={{ left: b.left, width: b.width }} aria-label={b.label + ', ' + b.when}
                          onClick={() => setOpenTip(k => (k === s.id + b.key ? null : s.id + b.key))} onBlur={() => setOpenTip(null)}>
                          {/* near the right edge the tooltip opens leftwards so it stays inside the timeline */}
                          <span className={[tl.tip, b.left > totalW - 280 ? tl.tipLeft : ''].join(' ')} role="tooltip">
                            <span className={tl.tipTitle}>{b.label}</span>
                            <span className={tl.tipMeta}>{TYPE_LABEL[b.t]} · {b.when}</span>
                          </span>
                        </button>
                      ))}
                    </div>
                  ))}
                </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      <div className={[css.conflict, has ? css.conflictWarn : ''].join(' ')}>
        <div className={css.conflictHead}>
          <Icon name={has ? 'warning' : 'checkCircle'} size={19} stroke={1.7} />
          <span className={css.conflictTitle}>{has ? 'Potensi bentrok jadwal (' + confs.length + ')' : 'Tidak ada bentrok jadwal'}</span>
        </div>
        <div className={css.conflictDesc}>
          {has
            ? 'Jadwal sekolah yang ditampilkan beririsan di periode berikut:'
            : 'Jadwal sekolah yang ditampilkan tidak beririsan. Cek lagi saat jadwal resmi keluar.'}
        </div>
        {confs.map((cf, i) => (
          <div key={i} className={css.conflictRow}>
            <span className={css.conflictRange}>{cf.range}</span>
            <span className={css.conflictText}>{cf.title}</span>
          </div>
        ))}
      </div>
    </>
  );
}
