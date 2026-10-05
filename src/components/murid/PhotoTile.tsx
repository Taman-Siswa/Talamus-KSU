import type { School } from '@/data/types';
import { usePhotoUrl } from '@/lib/photos';
import css from './murid.module.css';

/**
 * A school photo slot: a tinted tile with the school's monogram, covered by the photo when the school has one at
 * this index (and this browser holds it).
 */
export default function PhotoTile({ school, index = 0, className = '', size = 34 }: {
  school: School; index?: number; className?: string; size?: number;
}) {
  const src = usePhotoUrl(school.photos?.[index]);
  return (
    <div className={[css.tile, className].join(' ')} role={src ? 'img' : undefined} aria-label={src ? school.name : undefined}
      style={src ? { backgroundImage: `url("${src}")` } : undefined}>
      {!src && <span className={css.tileMono} style={{ fontSize: size }}>{school.mono}</span>}
    </div>
  );
}
