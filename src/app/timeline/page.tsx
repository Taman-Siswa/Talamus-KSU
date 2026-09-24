'use client';

import { EmptyTargets, useTargetSchools } from '@/components/SchoolChips';
import TimelineGantt, { UpcomingDeadlines } from '@/components/TimelineGantt';
import { useSchools } from '@/lib/schools';
import { useStore } from '@/lib/store';
import css from '@/components/ui.module.css';

export default function TimelinePage() {
  const schools = useSchools();
  const targets = useTargetSchools();
  const sel = useStore(s => s.sel);
  const toggleSel = useStore(s => s.toggleSel);
  return (
    <div>
      <h1 className={css.h1}>Timeline</h1>
      <p className={[css.lead, css.leadTight].join(' ')}>Jadwal gabungan sekolah pilihan</p>
      {/* Every school, lit when it is a target: clicking adds or removes it here and in the Katalog. */}
      <div className={css.selChips} role="group" aria-label="Sekolah target">
        {schools.map(s => {
          const on = !!sel[s.id];
          return (
            <button key={s.id} type="button" data-school={s.id} aria-pressed={on}
              className={[css.selChip, on ? css.selChipOn : ''].join(' ')} onClick={() => toggleSel(s.id)}>
              <span className={css.chipDot} />{s.short}
            </button>
          );
        })}
      </div>
      {targets.length === 0 ? (
        <EmptyTargets />
      ) : (
        <>
          <UpcomingDeadlines schools={targets} />
          <TimelineGantt schools={targets} />
        </>
      )}
    </div>
  );
}
