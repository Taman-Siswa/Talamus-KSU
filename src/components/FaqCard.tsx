'use client';

import { useState } from 'react';
import type { School } from '@/data/types';
import Icon from './Icon';
import css from './ui.module.css';

export default function FaqCard({ school: S }: { school: School }) {
  const [open, setOpen] = useState<Record<string, boolean>>({});
  return (
    <div className={css.card} style={{ marginBottom: 0 }}>
      <div className={css.cardTitle} style={{ marginBottom: 8 }}>FAQ</div>
      <div className={css.col}>
        {S.faq.map((f, i) => {
          const k = S.id + i, isOpen = !!open[k];
          return (
            <div key={k} className={css.faqItem}>
              <button className={css.faqQ} aria-expanded={isOpen} onClick={() => setOpen({ ...open, [k]: !isOpen })}>
                <span className={css.faqQText}>{f.q}</span>
                <span className={[css.faqChevron, isOpen ? css.faqChevronOpen : ''].join(' ')} style={{ display: 'flex' }}>
                  <Icon name="chevronDown" size={15} stroke={2} color="var(--faint)" />
                </span>
              </button>
              {isOpen && <div className={css.faqA}>{f.a}</div>}
            </div>
          );
        })}
      </div>
    </div>
  );
}
