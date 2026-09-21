'use client';

import Link from 'next/link';
import type { School } from '@/data/types';
import { P, R0, SPAN, fmt, fmtR, pct, startOfToday } from '@/lib/dates';
import { keyDatesOf } from '@/lib/schools';
import Icon from './Icon';
import css from './ui.module.css';

const MONTHS = ['Sep', 'Okt', 'Nov', 'Des', 'Jan', 'Feb', 'Mar', 'Apr'];

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
        {evts.map(e => {
          const days = Math.round((e.d.valueOf() - today.valueOf()) / 864e5);
          return (
            <div key={e.s.id + e.k.d} className={css.dlRow} data-school={e.s.id}>
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

/** Gantt + conflict check for the given schools (the student's Katalog targets). */
export default function TimelineGantt({ schools: selected }: { schools: School[] }) {
  const today = startOfToday();
  const todayLeft = (((today.valueOf() - R0.valueOf()) / SPAN) * 100).toFixed(2) + '%';

  // Conflict = test/selection phases of two different selected schools overlapping.
  const confs: { range: string; title: string }[] = [];
  for (let i = 0; i < selected.length; i++) for (let j = i + 1; j < selected.length; j++) {
    selected[i].phases.filter(p => p.t === 'tes').forEach(pa => {
      selected[j].phases.filter(p => p.t === 'tes').forEach(pb => {
        const s0 = Math.max(P(pa.s).valueOf(), P(pb.s).valueOf());
        const e0 = Math.min(P(pa.e).valueOf(), P(pb.e).valueOf());
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
        <div className={css.ganttHead}>
          <div className={css.cardTitle}>Timeline gabungan</div>
          <div className={css.ganttRange}>Sep 2026 – Apr 2027</div>
        </div>
        <div className={css.cardSub} style={{ marginBottom: 16 }}>
          Menampilkan {selected.length} sekolah target.{' '}
          <Link href="/katalog" className={css.linkBtn}>Ubah di Katalog</Link>
        </div>
        <div className={css.scrollX}>
          <div className={css.gantt}>
            <div className={css.months}>
              <div className={css.monthsPad} />
              <div className={css.monthsGrid}>
                {MONTHS.map(m => <span key={m} className={css.month}>{m}</span>)}
              </div>
            </div>
            <div className={css.ganttBody}>
              {/* today marker is positioned inside the lane area (after the 120px name column) */}
              <div className={css.todayLine} style={{ left: `calc(120px + (100% - 120px) * ${parseFloat(todayLeft) / 100})` }} />
              <div className={css.todayLabel} style={{ left: `calc(120px + (100% - 120px) * ${parseFloat(todayLeft) / 100})` }}>Hari ini</div>
              {selected.map(s => (
                <div key={s.id} className={css.ganttRow} data-school={s.id}>
                  <div className={css.ganttName}>
                    <span className={[css.mono, css.monoSm].join(' ')}>{s.mono}</span>
                    <span className={css.ganttShort}>{s.short}</span>
                  </div>
                  <div className={css.ganttLane}>
                    {s.phases.map(p => {
                      const l = pct(p.s), w = Math.max(1.2, pct(p.e) - l + 0.8);
                      return (
                        <div key={p.l} title={p.l + ' · ' + fmtR(p.s, p.e) + (p.est ? ' (perkiraan)' : '')}
                          className={[css.bar, p.t === 'tes' ? css.barTes : '', p.t === 'umum' ? css.barUmum : ''].join(' ')}
                          style={{ left: l.toFixed(2) + '%', width: w.toFixed(2) + '%' }} />
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
            <div className={css.legend}>
              <span className={css.legendItem}><span className={css.lgDaftar} />Pendaftaran</span>
              <span className={css.legendItem}><span className={css.lgTes} />Tes / seleksi</span>
              <span className={css.legendItem}><span className={css.lgUmum} />Pengumuman</span>
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
            ? 'Jadwal tes/seleksi sekolah terpilih beririsan di periode berikut — sebagian masih perkiraan, cek lagi saat info resmi keluar.'
            : 'Jadwal tes sekolah yang dipilih tidak beririsan. Cek lagi saat jadwal resmi keluar.'}
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
