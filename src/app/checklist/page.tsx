'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Icon from '@/components/Icon';
import PhotoTile from '@/components/murid/PhotoTile';
import css from '@/components/murid/checklist.module.css';
import ui from '@/components/murid/murid.module.css';
import { storySummary } from '@/components/murid/fit';
import { dlLabel } from '@/lib/dates';
import { nextPending, progressOf, sc } from '@/lib/murid';
import { checklistOf, useSchools } from '@/lib/schools';
import { useStore } from '@/lib/store';

/** Checklist home: one card per saved school; a card opens that school's checklist. */
export default function ChecklistPage() {
  const schools = useSchools();
  const sel = useStore(s => s.sel);
  const checks = useStore(s => s.checks);
  const fit = useStore(s => s.fit);
  const router = useRouter();
  const saved = schools.filter(s => sel[s.id]);

  if (!saved.length) {
    return (
      <div className={css.emptyBox}>
        <div className={css.emptyTitle}>Belum ada SMA pilihan</div>
        <div className={css.emptySub}>Simpan sekolah dari Katalog — checklist persiapannya otomatis muncul di sini.</div>
        <Link href="/katalog" className={ui.pillBtn}>Buka Katalog</Link>
      </div>
    );
  }

  return (
    <div className={css.page}>
      <div className={css.eyebrow}>SMA PILIHANMU</div>
      <div className={css.grid}>
        {saved.map(S => {
          const { pct } = progressOf(S, checks);
          const pend = nextPending(S, checks);
          const story = storySummary(S.short, fit[S.id]?.story);
          return (
            <Link key={S.id} href={'/checklist/' + S.id} className={css.pick} {...sc(S)}>
              <div className={css.pickImg}><PhotoTile school={S} size={28} /></div>
              <div className={css.pickRow}>
                <span className={css.mono}>{S.mono}</span>
                <span className={css.pickName}>{S.short}</span>
                <span className={[css.pct, pct === 100 ? css.pctDone : ''].join(' ')}>{pct}%</span>
              </div>
              <div className={css.bar}><div className={css.barFill} style={{ width: pct + '%', background: pct === 100 ? '#2D6327' : undefined }} /></div>
              <div className={css.next}>
                {pend ? `Berikutnya: ${clip(pend.l.split(' — ')[0])} · ${dlLabel(pend.dl, pend.est)}` : checklistOf(S).length ? 'Semua item siap' : 'Checklist belum diisi admin'}
              </div>
              {story.count > 0 && (
                <div className={css.story} role="button" tabIndex={0} title="Buka Ceritaku"
                  onClick={e => { e.preventDefault(); e.stopPropagation(); router.push('/checklist/' + S.id + '#non'); }}
                  onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); router.push('/checklist/' + S.id + '#non'); } }}>
                  <div className={css.storyHead}>
                    <Icon name="book" size={14} stroke={1.8} />
                    <span className={css.storyTag}>CERITAKU</span>
                    <span className={css.storyCount}>{story.count}/5 kalimat</span>
                  </div>
                  <span className={css.storyText}>“{story.text}”</span>
                </div>
              )}
            </Link>
          );
        })}
        <Link href="/katalog" className={css.add}><Icon name="plus" size={18} stroke={2} />Tambah sekolah</Link>
      </div>
    </div>
  );
}

const clip = (l: string) => (l.length > 60 ? l.slice(0, 60) + '…' : l);
