'use client';

import Link from 'next/link';
import { useSchool } from '@/lib/schools';
import { useRouteId } from '@/lib/route-id';
import SchoolProfile from './SchoolProfile';
import css from './ui.module.css';

export default function SchoolProfileRoute() {
  const schoolId = useRouteId();
  const school = useSchool(schoolId);
  if (!school) {
    return (
      <div>
        <h1 className={css.h1}>Sekolah tidak ditemukan</h1>
        <p className={css.lead}>Tidak ada sekolah dengan kode itu.</p>
        <Link href="/katalog" className={css.ctaLink}>Kembali ke Katalog</Link>
      </div>
    );
  }
  return <SchoolProfile school={school} />;
}
