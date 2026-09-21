'use client';

import SchoolCard from '@/components/SchoolCard';
import { useSchools } from '@/lib/schools';
import css from '@/components/ui.module.css';

export default function KatalogPage() {
  const schools = useSchools();
  return (
    <div>
      <h1 className={css.h1}>Katalog SMA Unggulan</h1>
      <p className={[css.lead, css.leadWide].join(' ')}>Cari sekolah impian kamu</p>
      <div className={css.grid}>
        {schools.map(s => <SchoolCard key={s.id} school={s} />)}
      </div>
    </div>
  );
}
