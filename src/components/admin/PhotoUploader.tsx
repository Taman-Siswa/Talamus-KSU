'use client';

import { useRef, useState } from 'react';
import { MAX_PHOTOS, savePhoto, usePhotoUrl } from '@/lib/photos';
import Icon from '../Icon';
import css from './admin.module.css';

function Thumb({ photo, first, last, onLeft, onRight, onRemove, single }: {
  single?: boolean; photo: string; first: boolean; last: boolean; onLeft: () => void; onRight: () => void; onRemove: () => void;
}) {
  const url = usePhotoUrl(photo);
  return (
    <div className={css.thumb}>
      <div className={css.thumbImg} style={url ? { backgroundImage: `url("${url}")` } : undefined}>{!url && <Icon name="eye" size={18} />}</div>
      {first && !single && <span className={css.thumbMain}>Utama</span>}
      <div className={css.thumbTools}>
        {!single && <><button type="button" className={css.rowBtn} onClick={onLeft} disabled={first} aria-label="Geser ke kiri" title="Geser ke kiri"><Icon name="chevronLeft" size={14} stroke={1.8} /></button>
        <button type="button" className={css.rowBtn} onClick={onRight} disabled={last} aria-label="Geser ke kanan" title="Geser ke kanan"><Icon name="chevronRight" size={14} stroke={1.8} /></button></>}
        <button type="button" className={[css.rowBtn, css.rowBtnDanger].join(' ')} onClick={onRemove} aria-label="Hapus foto" title="Hapus foto"><Icon name="x" size={14} stroke={1.8} /></button>
      </div>
    </div>
  );
}

/** Upload up to five photos of a school; the first is the main one. Click or drop images on the box. */
export default function PhotoUploader({ photos, onChange, single = false }: { photos: string[]; onChange: (photos: string[]) => void; single?: boolean }) {
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [over, setOver] = useState(false);
  const room = single ? 1 : MAX_PHOTOS - photos.length;

  const add = async (files: FileList | File[]) => {
    if (busy) return;
    const list = Array.from(files);
    if (!list.length) return;
    setError(''); setBusy(true);
    const refs: string[] = [], errors: string[] = [];
    for (const f of list.slice(0, room)) {
      try { refs.push(await savePhoto(f)); } catch (e) { errors.push((e as Error).message); }
    }
    if (list.length > room) errors.push(`Maksimal ${single ? 1 : MAX_PHOTOS} foto; sisanya tidak ditambahkan.`);
    if (refs.length) onChange(single ? [refs[0], ...photos.slice(1)] : [...photos, ...refs]);
    setError(errors.join(' '));
    setBusy(false);
  };
  const move = (i: number, to: number) => { const n = photos.slice(); [n[i], n[to]] = [n[to], n[i]]; onChange(n); };

  return (
    <div>
      {photos.length > 0 && (
        <div className={css.thumbs}>
          {(single ? photos.slice(0, 1) : photos).map((p, i) => (
            <Thumb key={p} photo={p} single={single} first={i === 0} last={i === photos.length - 1}
              onLeft={() => move(i, i - 1)} onRight={() => move(i, i + 1)} onRemove={() => onChange(photos.filter((_, j) => j !== i))} />
          ))}
        </div>
      )}
      {room > 0 && (
        <button type="button" className={[css.drop, over ? css.dropOver : ''].join(' ')} disabled={busy}
          onClick={() => input.current?.click()}
          onDragOver={e => { e.preventDefault(); setOver(true); }} onDragLeave={() => setOver(false)}
          onDrop={e => { e.preventDefault(); setOver(false); add(e.dataTransfer.files); }}>
          <Icon name="plus" size={16} stroke={2} />{busy ? 'Mengunggah…' : single ? (photos.length ? 'Ganti gambar' : 'Unggah gambar') : photos.length ? 'Tambah foto' : 'Unggah foto sekolah'}
          <span>{single ? '1 gambar' : `${MAX_PHOTOS - photos.length} slot tersisa`} · JPG, PNG, WebP</span>
        </button>
      )}
      <input ref={input} type="file" accept="image/*" multiple={!single} hidden onChange={e => { add(e.target.files || []); e.target.value = ''; }} />
      {error && <p className={css.fieldError} role="alert">{error}</p>}
    </div>
  );
}
