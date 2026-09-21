'use client';

import FaqCard from '@/components/FaqCard';
import SchoolChips from '@/components/SchoolChips';
import css from '@/components/ui.module.css';

export default function FaqPage() {
  return (
    <div>
      <h1 className={css.h1}>FAQ</h1>
      <p className={css.lead}>Jawaban pertanyaan yang paling sering ditanyakan orang tua &amp; tutee.</p>
      <SchoolChips>{S => <FaqCard key={S.id} school={S} />}</SchoolChips>
    </div>
  );
}
