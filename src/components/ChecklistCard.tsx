'use client';

import Link from 'next/link';
import type { School } from '@/data/types';
import { P, dlLabel, startOfToday } from '@/lib/dates';
import { daftarLabel, progressOf, statusLabel } from '@/lib/murid';
import { checklistOf, type ChecklistGroup } from '@/lib/schools';
import { isWebUrl } from '@/lib/school-form';
import { useStore } from '@/lib/store';
import Icon from './Icon';
import css from './murid/checklist.module.css';

// Students only tick items and fill in data here; documents themselves go to the school's own portal, never to KSU.
export default function ChecklistCard({ school: S, preview = false, group = 'berkas' }: { school: School; preview?: boolean; group?: ChecklistGroup }) {
  const checks = useStore(s => s.checks);
  const forms = useStore(s => s.forms);
  const { toggleCheck, setForm } = useStore.getState();
  const today = startOfToday();
  const list = checklistOf(S, group);
  const { total, done, pct } = preview ? { total: list.length, done: 0, pct: 0 } : progressOf(S, checks, group);
  const resmi = S.status === 'resmi';

  return (
    <div className={[css.card, preview ? css.preview : ''].join(' ')}>
      <div className={css.cardTop}>
        <div className={css.cardMain}>
          <div className={css.cardTitle}>{S.name}</div>
          <div className={css.cardSub}>{[S.pill, daftarLabel(S)].filter(Boolean).join(' · ')}</div>
        </div>
        <span className={[css.status, resmi ? css.stOk : css.stAmb].join(' ')}>{statusLabel(S)}</span>
        {!preview && <Link href={'/katalog/' + S.id} className={css.profil}>Lihat profil</Link>}
      </div>
      {!preview && <p className={css.rowNote}>{group === 'berkas' ? 'Kesiapan berkas — centang saat dokumen sudah siap. Pengunggahan dilacak di tab Pendaftaran.' : 'Tahapan pendaftaran & seleksi — centang setelah langkah selesai dilakukan.'}</p>}
      <div className={css.prog}>
        <div className={css.progBar}><div className={css.progFill} style={{ width: pct + '%' }} /></div>
        <span className={css.progLabel}>{done} dari {total} selesai</span>
      </div>
      {!preview && list.length === 0 && <div className={css.none}>Belum ada {group === 'berkas' ? 'berkas' : 'tahapan pendaftaran'} untuk sekolah ini.</div>}
      <div>
        {list.map(c => {
          const key = S.id + '.' + c.id;
          const isDone = !preview && !!checks[key];
          const overdue = !!c.dl && P(c.dl) < today && !isDone;
          return (
            <div key={c.id} className={css.row}>
              <button type="button" className={[css.box, isDone ? css.boxOn : ''].join(' ')} disabled={preview} onClick={() => toggleCheck(key)}
                role="checkbox" aria-checked={isDone} aria-label={c.l}>
                {isDone && <Icon name="check" size={13} stroke={3} color="#FFFFFF" />}
              </button>
              <div className={css.rowBody}>
                <div className={[css.rowLabel, isDone ? css.rowDone : ''].join(' ')}>{c.l}</div>
                {c.document && <div className={css.rowNote}>
                  <strong>{c.document.category?.trim() || 'Administrasi umum'}</strong>
                  <span> · {c.document.required ? 'Wajib' : 'Opsional'}{c.document.category?.trim() && !/^administrasi umum$/i.test(c.document.category.trim()) ? ' untuk kategori ini' : ''}</span>
                  {c.document.rules.length > 0 && <span> · {c.document.rules.map(r => `${r.format} maks. ${r.maxMB} MB`).join(' atau ')}</span>}
                  {isWebUrl(c.document.template) && <> · <a href={c.document.template} target="_blank" rel="noopener noreferrer">Unduh template</a></>}
                </div>}
                {c.note && <div className={css.rowNote}>{c.note}</div>}
                {c.f && c.f.length > 0 && (
                  <div className={css.fields}>
                    {c.f.map(fd => (
                      <input key={fd.k} className={css.input} placeholder={fd.p} autoComplete="off" aria-label={fd.p}
                        readOnly={preview} value={preview ? '' : forms[key + '.' + fd.k] || ''} onChange={e => setForm(key + '.' + fd.k, e.target.value)} />
                    ))}
                  </div>
                )}
              </div>
              <span className={[css.dl, overdue ? css.dlWarn : ''].join(' ')}>{c.dl ? dlLabel(c.dl, c.est) : 'Tenggat belum ditentukan'}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
