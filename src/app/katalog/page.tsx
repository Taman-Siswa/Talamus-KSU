'use client';

import KatalogHero from '@/components/murid/KatalogHero';
import SchoolCard from '@/components/SchoolCard';
import { useKatalogFilter } from '@/lib/katalog-filter';
import { isBoarding, isFree, MULTI, isMulti } from '@/lib/murid';
import { useSchools } from '@/lib/schools';
import css from '@/components/murid/katalog.module.css';
import ui from '@/components/murid/murid.module.css';

export default function KatalogPage() {
  const schools = useSchools();
  const { lok, asr, biaya, q } = useKatalogFilter();
  const query = q.trim().toLowerCase();
  const shown = schools.filter(s =>
    (lok === 'all' || s.info.province === lok || (lok === MULTI && isMulti(s)))
    && (asr === 'all' || (asr === 'ya') === isBoarding(s))
    && (biaya === 'all' || (biaya === 'gratis') === isFree(s))
    && (!query || `${s.name} ${s.short} ${s.mono}`.toLowerCase().includes(query)));

  if (!schools.length) return <div className={ui.empty}>Belum ada sekolah di katalog. Sekolah ditambahkan oleh admin.</div>;
  return (
    <div>
      <KatalogHero schools={schools} />
      {shown.length === 0
        ? <div className={ui.empty}>Belum ada sekolah yang cocok dengan filter ini. Coba longgarkan pencarianmu.</div>
        : (
          <div>
            <div className={css.rowHead}>
              <h2 className={css.rowTitle}>Semua SMA unggulan</h2>
            </div>
            <div className={css.grid}>{shown.map(s => <SchoolCard key={s.id} school={s} />)}</div>
          </div>
        )}
    </div>
  );
}
