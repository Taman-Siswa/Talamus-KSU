'use client';

import CalculatorCard from '@/components/CalculatorCard';
import SchoolChips from '@/components/SchoolChips';
import css from '@/components/ui.module.css';

export default function KalkulatorPage() {
  return (
    <div>
      <h1 className={css.h1}>Kalkulator Syarat</h1>
      <p className={css.lead}>Cek kualifikasi rapot kamu.</p>
      <SchoolChips>{S => <CalculatorCard key={S.id} school={S} />}</SchoolChips>
    </div>
  );
}
