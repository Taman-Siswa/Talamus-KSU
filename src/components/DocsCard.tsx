import type { School } from '@/data/types';
import Icon from './Icon';
import css from './ui.module.css';

export default function DocsCard({ school: S }: { school: School }) {
  return (
    <div className={css.card} style={{ marginBottom: 0 }}>
      <div className={css.cardTitle} style={{ marginBottom: 4 }}>Dokumen &amp; arsip</div>
      <div className={css.cardSub} style={{ marginBottom: 10 }}>Kalau info tahun ini belum rilis, pakai dokumen tahun lalu sebagai acuan sementara.</div>
      <div className={css.col}>
        {S.docs.map(d => (
          <div key={d.l} className={css.doc}>
            <Icon name="doc" color="var(--sub)" />
            <div className={css.docText}>
              <div className={css.docLabel}>{d.l}</div>
              <div className={css.docMeta}>{d.m}</div>
            </div>
            <span className={[css.pill, d.arsip ? css.amb : css.ok].join(' ')}>{d.arsip ? 'Arsip tahun lalu' : 'Resmi'}</span>
            <a href={d.h} target="_blank" rel="noopener noreferrer" className={css.docOpen}>Buka</a>
          </div>
        ))}
      </div>
    </div>
  );
}
