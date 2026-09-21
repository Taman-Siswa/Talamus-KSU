'use client';

import ChecklistCard from '@/components/ChecklistCard';
import SchoolChips from '@/components/SchoolChips';
import css from '@/components/ui.module.css';

export default function ChecklistPage() {
  return (
    <div>
      <h1 className={css.h1}>Checklist</h1>
      <p className={css.lead}>Persiapan berkas administratif</p>
      <SchoolChips>{S => <ChecklistCard key={S.id} school={S} />}</SchoolChips>
    </div>
  );
}
