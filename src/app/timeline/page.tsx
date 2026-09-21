'use client';

import { EmptyTargets, useTargetSchools } from '@/components/SchoolChips';
import TimelineGantt, { UpcomingDeadlines } from '@/components/TimelineGantt';
import css from '@/components/ui.module.css';

export default function TimelinePage() {
  const targets = useTargetSchools();
  return (
    <div>
      <h1 className={css.h1}>Timeline</h1>
      <p className={[css.lead, css.leadWide].join(' ')}>Jadwal gabungan sekolah pilihan</p>
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
