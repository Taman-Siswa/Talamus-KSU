'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { School } from '@/data/types';
import { cardSub, costChip, curriculumLabel, daftarLabel, isBoarding, placeChip, sc, statusLabel } from '@/lib/murid';
import { useStore } from '@/lib/store';
import Icon from './Icon';
import PhotoTile from './murid/PhotoTile';
import css from './murid/katalog.module.css';

/** A school on the Katalog: status, one-line summary, four chips (kota, asrama, biaya, kurikulum), photo slot, and the save heart. */
export default function SchoolCard({ school: s, preview = false }: { school: School; preview?: boolean }) {
  const router = useRouter();
  const on = useStore(st => !preview && !!st.sel[s.id]);
  const toggleSel = useStore(st => st.toggleSel);
  const href = '/katalog/' + s.id;
  const resmi = s.status === 'resmi';
  const place = placeChip(s);
  const cost = costChip(s);
  const kur = curriculumLabel(s);
  return (
    <div className={css.card} {...sc(s)} onClick={() => { if (!preview) router.push(href); }}>
      <span className={[css.badge, resmi ? css.badgeOk : css.badgeAmb].join(' ')}>{statusLabel(s)}</span>
      <Link href={href} className={css.name} onClick={e => { e.stopPropagation(); if (preview) e.preventDefault(); }}>{s.name}</Link>
      <div className={css.desc}>{cardSub(s)}</div>
      <div className={css.meta}>Pendaftaran: {daftarLabel(s)}</div>
      <div className={css.feats}>
        {place && <span className={css.feat}><Icon name="pin" size={14} stroke={1.9} />{place}</span>}
        {s.info.boarding && (isBoarding(s)
          ? <span className={[css.feat, css.featAsrama].join(' ')}><Icon name="home" size={14} stroke={1.9} />Asrama</span>
          : <span className={[css.feat, css.featMuted].join(' ')}><Icon name="home" size={14} stroke={1.9} />Non-asrama</span>)}
        {cost && <span className={[css.feat, cost === 'Gratis' ? css.featGratis : css.featMuted].join(' ')}><Icon name="spark" size={14} stroke={1.9} />{cost}</span>}
        {kur && <span className={[css.feat, css.featKur].join(' ')}><Icon name="cap" size={14} stroke={1.9} />{kur}</span>}
      </div>
      <div className={css.grow} />
      <PhotoTile school={s} className={css.photo} />
      <div className={css.foot}>
        <Link href={href} className={css.more} onClick={e => { e.stopPropagation(); if (preview) e.preventDefault(); }}>Pelajari lebih lanjut<Icon name="chevronRight" size={14} stroke={2.2} /></Link>
        <span className={css.likeWrap}>
        <button type="button" className={[css.heart, on ? css.heartOn : ''].join(' ')} aria-pressed={on} disabled={preview}
          title={on ? 'Batal simpan' : 'Simpan sekolah'} aria-label={(on ? 'Batal simpan ' : 'Simpan ') + s.short}
          onClick={e => { e.stopPropagation(); toggleSel(s.id); }}>
          <Icon name="heart" size={19} stroke={1.8} fill={on} />
        </button>
        </span>
      </div>
    </div>
  );
}
