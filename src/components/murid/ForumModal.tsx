'use client';

import type { School } from '@/data/types';
import Icon from '../Icon';
import ForumThreads from './ForumThreads';
import css from './murid.module.css';

/** The Forum of one school, opened from its page. */
export default function ForumModal({ school, onClose }: { school: School; onClose: () => void }) {
  return (
    <div className={css.modalBack} onClick={onClose}>
      <div className={css.modal} style={{ maxWidth: 780 }} role="dialog" aria-label={'Forum ' + school.short} onClick={e => e.stopPropagation()}>
        <div className={css.modalHead}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className={css.modalTitle}>Forum</div>
            <div className={css.modalSub}>{school.name}</div>
          </div>
          <button type="button" className={css.modalClose} title="Tutup" aria-label="Tutup" onClick={onClose}><Icon name="x" size={16} stroke={2.2} /></button>
        </div>
        <div style={{ overflowY: 'auto', padding: '18px 20px 22px', display: 'flex', flexDirection: 'column', gap: 10 }}>
          <ForumThreads schools={[school]} filter={school.id} />
        </div>
      </div>
    </div>
  );
}
