'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import type { School } from '@/data/types';
import { P, fmt, startOfToday } from '@/lib/dates';
import { keyDatesOf } from '@/lib/schools';
import { useStore } from '@/lib/store';
import TargetButton from './TargetButton';
import Icon from './Icon';
import css from './ui.module.css';

export default function SchoolCard({ school: s }: { school: School }) {
  const router = useRouter();
  const checks = useStore(st => st.checks);
  const today = startOfToday();

  const href = '/katalog/' + s.id;
  const total = s.checklist.length;
  const done = s.checklist.filter(c => checks[s.id + '.' + c.id]).length;
  const next = keyDatesOf(s).map(k => ({ k, d: P(k.d) })).find(x => x.d >= today);
  const resmi = s.status === 'resmi';

  return (
    <div className={css.schoolCard} data-school={s.id} onClick={() => router.push(href)}>
      <div className={css.schoolHead}>
        <span className={css.mono}>{s.mono}</span>
        <Link href={href} className={css.schoolName} onClick={e => e.stopPropagation()}>{s.short}</Link>
        <span className={[css.statusPill, resmi ? css.ok : css.amb].join(' ')}>{resmi ? 'Info resmi' : 'Perkiraan'}</span>
      </div>
      <div className={css.next}>
        {next ? 'Berikutnya: ' + next.k.l + ' · ' + fmt(next.d, true) : 'Seluruh tahapan terjadwal sudah lewat.'}
      </div>
      <div className={[css.track, css.trackSm].join(' ')}>
        <div className={css.trackFill} style={{ width: (total ? Math.round((done / total) * 100) : 0) + '%' }} />
      </div>
      <div className={css.progLabel}>Checklist {done} dari {total} selesai</div>
      <div className={css.cardActions}>
        <TargetButton school={s} />
        <Link href={href} className={css.detailBtn} onClick={e => e.stopPropagation()} aria-label={'Lihat detail ' + s.short} title="Lihat detail">
          <Icon name="arrowRight" size={18} stroke={1.8} />
        </Link>
      </div>
    </div>
  );
}
