'use client';

import type { ChangeEvent } from 'react';
import type { School } from '@/data/types';
import { P, startOfToday } from '@/lib/dates';
import { downloadFile, fileSize, removeFile, saveFile } from '@/lib/files';
import { useStore } from '@/lib/store';
import Icon from './Icon';
import css from './ui.module.css';

export default function ChecklistCard({ school: S }: { school: School }) {
  const checks = useStore(s => s.checks);
  const forms = useStore(s => s.forms);
  const files = useStore(s => s.files);
  const { toggleCheck, setForm, setFile, clearFile } = useStore.getState();
  const today = startOfToday();

  const total = S.checklist.length;
  const done = S.checklist.filter(c => checks[S.id + '.' + c.id]).length;

  const attach = (key: string) => async (e: ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(key, { n: f.name, s: fileSize(f.size) });
    try { await saveFile(key, f); } catch {}
  };

  return (
    <div className={css.card} data-school={S.id}>
      <div className={css.cardHead}>
        <div className={css.cardTitle}>Checklist persiapan</div>
        <span className={css.progPill}>{done} dari {total} selesai</span>
      </div>
      <div className={css.track}>
        <div className={css.trackFill} style={{ width: total ? Math.round((done / total) * 100) : 0 + '%' }} />
      </div>
      <div className={css.col}>
        {S.checklist.map(c => {
          const key = S.id + '.' + c.id;
          const isDone = !!checks[key];
          const overdue = !!c.dl && P(c.dl) < today && !isDone;
          const fl = files[key];
          return (
            <div key={c.id} className={css.row}>
              <button className={[css.box, isDone ? css.boxOn : ''].join(' ')} onClick={() => toggleCheck(key)}
                role="checkbox" aria-checked={isDone} aria-label={c.l}>
                {isDone && <Icon name="check" size={13} stroke={3} color="var(--check-ink)" />}
              </button>
              <div className={css.rowBody}>
                <div className={[css.rowLabel, isDone ? css.rowDone : ''].join(' ')}>{c.l}</div>
                {c.note && <div className={css.rowNote}>{c.note}</div>}
                {c.f && c.f.length > 0 && (
                  <div className={css.fields}>
                    {c.f.map(fd => (
                      <input key={fd.k} className={css.input} placeholder={fd.p} autoComplete="off"
                        value={forms[key + '.' + fd.k] || ''} onChange={e => setForm(key + '.' + fd.k, e.target.value)} />
                    ))}
                  </div>
                )}
                {c.up && (
                  <div className={css.fileRow}>
                    {fl ? (
                      <>
                        <button className={css.fileOn} title="Unduh berkas" onClick={() => downloadFile(key, fl.n)}>
                          <Icon name="check" size={13} stroke={2.2} />
                          {fl.n} · {fl.s}
                        </button>
                        <button className={css.fileClear} onClick={() => { clearFile(key); removeFile(key).catch(() => {}); }}>Hapus</button>
                      </>
                    ) : (
                      <label className={css.fileAdd}>
                        <Icon name="clip" size={13} stroke={1.8} />
                        <span>Lampirkan berkas</span>
                        <input type="file" onChange={attach(key)} />
                      </label>
                    )}
                  </div>
                )}
              </div>
              <span className={[css.pill, overdue ? css.warn : ''].join(' ')}>{c.d}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
