'use client';

import { useState } from 'react';
import SchoolEditor from '@/components/admin/SchoolEditor';
import { blankSchool } from '@/lib/schools';

/** Same editor as an existing school, starting from an empty record. The school is only created on Simpan. */
export default function NewSchoolPage() {
  const [school] = useState(blankSchool);
  return <SchoolEditor school={school} published={false} savedDraft={null} />;
}
