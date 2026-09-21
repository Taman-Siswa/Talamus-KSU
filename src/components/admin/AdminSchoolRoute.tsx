'use client';

import Link from 'next/link';
import { blankSchool, useDraft, useSchool } from '@/lib/schools';
import { useRouteId } from '@/lib/route-id';
import ui from '../ui.module.css';
import SchoolEditor from './SchoolEditor';

export default function AdminSchoolRoute() {
  const schoolId = useRouteId();
  const school = useSchool(schoolId);
  const draft = useDraft(schoolId);
  if (!school && !draft) {
    return (
      <div>
        <h1 className={ui.h1}>Sekolah tidak ditemukan</h1>
        <p className={ui.lead}>Tidak ada sekolah dengan kode itu.</p>
        <Link href="/admin/sekolah" className={ui.ctaLink}>Kembali ke Data SMA</Link>
      </div>
    );
  }
  // A school that only exists as a draft has no published version to compare against.
  return <SchoolEditor key={schoolId} school={school ?? { ...blankSchool(), id: schoolId }} published={!!school} savedDraft={draft} />;
}
