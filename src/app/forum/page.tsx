'use client';

import { useState } from 'react';
import ForumThreads from '@/components/murid/ForumThreads';
import { forumCounts } from '@/lib/forum';
import { sc } from '@/lib/murid';
import { useSchools } from '@/lib/schools';
import { useStore } from '@/lib/store';
import css from '@/components/murid/forum.module.css';
import ui from '@/components/murid/murid.module.css';

export default function ForumPage() {
  const schools = useSchools();
  const forum = useStore(s => s.forum);
  const [filter, setFilter] = useState('all');
  if (!schools.length) return <div className={ui.empty}>Belum ada sekolah, jadi belum ada ruang diskusi.</div>;
  const counts = forumCounts(schools, forum);
  const total = Object.values(counts).reduce((a, b) => a + b, 0);
  const active = schools.some(s => s.id === filter) ? filter : 'all';
  return (
    <div className={css.layout}>
      <div className={css.spaces}>
        <div className={css.spacesTitle}>RUANG DISKUSI</div>
        <button type="button" className={[css.space, active === 'all' ? css.spaceOn : ''].join(' ')} aria-pressed={active === 'all'} onClick={() => setFilter('all')}>
          <span className={[css.spaceMono, css.spaceAll].join(' ')}>ALL</span>
          <span className={css.spaceName}>Semua diskusi</span>
          <span className={css.spaceCount}>{total}</span>
        </button>
        {schools.map(s => (
          <button key={s.id} type="button" {...sc(s)} className={[css.space, active === s.id ? css.spaceOn : ''].join(' ')} aria-pressed={active === s.id} onClick={() => setFilter(s.id)}>
            <span className={css.spaceMono}>{s.mono}</span>
            <span className={css.spaceName}>{s.short}</span>
            <span className={css.spaceCount}>{counts[s.id] || 0}</span>
          </button>
        ))}
      </div>
      <div className={css.main}>
        <ForumThreads schools={schools} filter={active} />
      </div>
    </div>
  );
}
