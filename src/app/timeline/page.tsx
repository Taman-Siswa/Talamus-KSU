'use client';

import { useState } from 'react';
import Link from 'next/link';
import { EmptyTargets, useTargetSchools } from '@/components/SchoolChips';
import Icon from '@/components/Icon';
import TimelineGantt, { UpcomingDeadlines } from '@/components/TimelineGantt';
import css from '@/components/ui.module.css';

export default function TimelinePage() {
  const targets = useTargetSchools();
  // A view filter only: hiding a school here leaves it a target (Katalog, Checklist and the rest keep it).
  const [hidden, setHidden] = useState<Record<string, boolean>>({});
  const shown = targets.filter(s => !hidden[s.id]);
  return (
    <div>
      <h1 className={css.h1}>Timeline</h1>
      <p className={[css.lead, css.leadTight].join(' ')}>Jadwal gabungan sekolah pilihan</p>
      {targets.length === 0 ? (
        <EmptyTargets />
      ) : (
        <>
          <div className={css.selChips} role="group" aria-label="Sekolah yang ditampilkan">
            {targets.map(s => {
              const on = !hidden[s.id];
              return (
                <button key={s.id} type="button" data-school={s.id} aria-pressed={on}
                  className={[css.selChip, on ? css.selChipOn : ''].join(' ')}
                  onClick={() => setHidden(h => ({ ...h, [s.id]: on }))}>
                  {on ? <Icon name="check" size={13} stroke={2.4} /> : <span className={css.chipDot} />}{s.short}
                </button>
              );
            })}
            <Link href="/katalog" className={css.linkBtn}>Ubah target di Katalog</Link>
          </div>
          {shown.length === 0 ? (
            <div className={css.card} style={{ textAlign: 'center' }}>
              <div className={css.cardSub}>Pilih minimal satu sekolah di atas untuk melihat jadwalnya.</div>
            </div>
          ) : (
            <>
              <UpcomingDeadlines schools={shown} />
              <TimelineGantt schools={shown} />
            </>
          )}
        </>
      )}
    </div>
  );
}
