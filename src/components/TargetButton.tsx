'use client';

import type { School } from '@/data/types';
import { useStore } from '@/lib/store';
import Icon from './Icon';
import css from './ui.module.css';

/** Adds or removes a school from the student's targets. Shared by the Katalog card and the school profile. */
export default function TargetButton({ school, className, onSelected }: {
  school: School;
  className?: string;
  /** runs right after the school becomes a target (not when it is un-targeted) */
  onSelected?: () => void;
}) {
  const isTarget = !!useStore(st => st.sel[school.id]);
  const toggleSel = useStore(st => st.toggleSel);
  return (
    <button type="button" aria-pressed={isTarget} aria-label={'Jadikan ' + school.short + ' sebagai target'}
      title={isTarget ? 'Klik untuk batalkan' : undefined}
      className={[css.cartBtn, isTarget ? css.cartBtnOn : '', className || ''].join(' ')}
      // the Katalog card is itself clickable, so this must not bubble up
      onClick={e => {
        e.stopPropagation();
        toggleSel(school.id);
        if (!isTarget) onSelected?.();
      }}>
      {isTarget ? <Icon name="check" size={14} stroke={2.2} /> : <Icon name="star" size={14} stroke={1.8} />}
      <span>{isTarget ? 'Target kamu' : 'Jadikan target'}</span>
    </button>
  );
}
