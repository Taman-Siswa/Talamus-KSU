'use client';

import Link from 'next/link';
import Icon from '@/components/Icon';
import { isBundledSchool, useSchools, useSchoolsStore, useUnpublishedDrafts } from '@/lib/schools';
import css from '@/components/admin/admin.module.css';
import ui from '@/components/ui.module.css';

export default function AdminSchoolsPage() {
  const schools = useSchools();
  const overrides = useSchoolsStore(s => s.overrides);
  const drafts = useSchoolsStore(s => s.drafts);
  // Schools still being written come last; students do not see them.
  const rows = [...schools.map(s => ({ s, live: true })), ...useUnpublishedDrafts().map(s => ({ s, live: false }))];
  return (
    <div>
      <h1 className={ui.h1}>Data SMA</h1>
      <p className={[ui.lead, ui.leadWide].join(' ')}>
        Semua yang dibaca siswa diatur dari satu halaman.
      </p>
      <div className={css.listActions}>
        <Link href="/admin/sekolah/baru" className={[css.btn, css.btnPrimary].join(' ')}>
          <Icon name="plus" size={16} />Tambah sekolah
        </Link>
      </div>
      <div className={css.list}>
        {rows.map(({ s, live }) => (
          <Link key={s.id} href={'/admin/sekolah/' + s.id} className={css.listRow} data-school={s.id}>
            <span className={ui.mono}>{s.mono}</span>
            <div className={css.listGrow}>
              <div className={css.listName}>
                {s.short || 'Tanpa nama'}
                {!live || drafts[s.id] ? <span className={css.listDraft}>{live ? 'Ada draft' : 'Draft'}</span> : null}
              </div>
              <div className={css.listMeta}>{s.name}</div>
              <div className={css.listMeta}>
                {s.checklist.length} item checklist · {s.phases.length} tahapan · {s.faq.length} FAQ
                {!live ? ' · belum tampil ke siswa' : !isBundledSchool(s.id) ? ' · sekolah baru' : overrides[s.id] ? ' · sudah diubah' : ''}
              </div>
            </div>
            <span className={css.listGo}><Icon name="chevronRight" size={18} stroke={2} /></span>
          </Link>
        ))}
      </div>
    </div>
  );
}
