import type { School } from '@/data/types';
import css from './murid.module.css';

/**
 * A school photo slot. Until real assets exist it is a tinted tile with the school's monogram;
 * when the school has a photo at this index, the photo covers the tile.
 */
export default function PhotoTile({ school, index = 0, className = '', size = 34 }: {
  school: School; index?: number; className?: string; size?: number;
}) {
  const src = school.photos?.[index];
  return (
    <div className={[css.tile, className].join(' ')} role={src ? 'img' : undefined} aria-label={src ? school.name : undefined}
      style={src ? { backgroundImage: `url("${src}")` } : undefined}>
      {!src && <span className={css.tileMono} style={{ fontSize: size }}>{school.mono}</span>}
    </div>
  );
}
