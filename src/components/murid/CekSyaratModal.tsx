'use client';

import { useRef } from 'react';
import type { School } from '@/data/types';
import { evalEligibility } from '@/lib/murid';
import { useStore } from '@/lib/store';
import Icon from '../Icon';
import cek from './cek.module.css';
import css from './murid.module.css';

const MARK = { ok: ['✓', cek.markOk], x: ['✕', cek.markX], '?': ['?', cek.markQ] } as const;

/**
 * "Cek syarat": report-card averages against the school's threshold, age, and its other requirements.
 * `preview` shows the form without saving anything (the admin's preview).
 */
export default function CekSyaratModal({ school: S, onClose, preview = false }: { school: School; onClose: () => void; preview?: boolean }) {
  const quick = useStore(s => s.quick);
  const elig = useStore(s => s.elig);
  const done = useStore(s => !!s.eligDone[S.id]);
  const dob = useStore(s => s.dob);
  const { setQuick, setElig, submitElig, resetElig, setDob } = useStore.getState();
  const body = useRef<HTMLDivElement>(null);

  const min = S.calc?.minAvg;
  const subjects = S.calc?.subjects ?? [];
  const rule = S.eligibility?.dob;
  const items = S.eligibility?.items ?? [];
  const answers = elig[S.id] ?? {};
  const lines = evalEligibility(S, preview ? {} : quick, preview ? {} : answers, preview ? '' : dob);
  const nq = lines.filter(l => l.st === '?').length;
  const nx = lines.filter(l => l.st === 'x').length;
  const nothing = !min && !rule && !items.length;
  const no = (min ? 1 : 0) + (rule ? 1 : 0);

  return (
    <div className={css.modalBack} onClick={onClose}>
      <div className={css.modal} role="dialog" aria-label={'Cek syarat ' + S.short} onClick={e => e.stopPropagation()}>
        <div className={css.modalHead}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className={css.modalTitle}>Cek Syarat</div>
            <div className={css.modalSub}>{S.name} · jawab lalu lihat hasilnya</div>
          </div>
          <button type="button" className={css.modalClose} title="Tutup" aria-label="Tutup" onClick={onClose}><Icon name="x" size={16} stroke={2.2} /></button>
        </div>
        <div className={cek.body} ref={body}>
          {nothing && <div className={cek.nothing}>Sekolah ini belum punya syarat yang bisa dicek di sini. Lihat bagian Syarat di halaman sekolah.</div>}
          {!nothing && done && !preview && (
            <div className={[cek.result, nq ? cek.resAmb : nx ? cek.resWarn : cek.resOk].join(' ')}>
              <div className={cek.resTitle}>{nq ? 'Belum lengkap' : nx ? `${nx} syarat belum terpenuhi` : 'Memenuhi semua syarat'}</div>
              <div className={cek.resSub}>{nq ? `${nq} pertanyaan belum dijawab.` : nx ? 'Cek catatan di bawah dan siapkan yang kurang.' : 'Kamu bisa lanjut daftar — simpan sekolah ini agar checklist aktif.'}</div>
              <div className={cek.resList}>
                {lines.map(l => (
                  <div key={l.l} className={cek.resItem}>
                    <span className={[cek.mark, MARK[l.st][1]].join(' ')}>{MARK[l.st][0]}</span>
                    <div className={cek.resText}>
                      <div className={cek.resLabel}>{l.l}</div>
                      <div className={cek.resNote}>{l.note}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          {!!min && (
            <div className={cek.card}>
              <div className={cek.cardTitle}>1 · NILAI RAPOR</div>
              <div className={cek.hint}>Rata-rata rapor per mapel. Ambang: ≥ {min} tiap mapel.</div>
              <div className={cek.grid}>
                {subjects.map(sb => (
                  <label key={sb} className={cek.field}>
                    <span className={cek.fieldName}>{sb}</span>
                    <input className={cek.num} type="number" inputMode="decimal" placeholder="—" readOnly={preview}
                      value={preview ? '' : quick[S.id + '.' + sb] || ''} onChange={e => setQuick(S.id + '.' + sb, e.target.value)} />
                  </label>
                ))}
              </div>
            </div>
          )}
          {rule && (
            <div className={cek.card}>
              <div className={cek.cardTitle}>{min ? 2 : 1} · USIA</div>
              <div className={cek.dobRow}>
                <span className={cek.dobQ}>{rule.q}</span>
                <input className={cek.date} type="date" value={preview ? '' : dob} readOnly={preview} onChange={e => setDob(e.target.value)} />
              </div>
            </div>
          )}
          {items.length > 0 && (
            <div className={cek.card}>
              <div className={cek.cardTitle}>{no + 1} · PERSYARATAN LAIN</div>
              <div>
                {items.map(it => {
                  const a = preview ? undefined : answers[it.id];
                  return (
                    <div key={it.id} className={cek.item}>
                      <span className={cek.itemQ}>{it.q}</span>
                      <div className={cek.toggle}>
                        <button type="button" disabled={preview} className={a === 'ya' ? cek.yaOn : ''} aria-pressed={a === 'ya'} onClick={() => setElig(S.id, it.id, 'ya')}>Ya</button>
                        <button type="button" disabled={preview} className={a === 'tidak' ? cek.noOn : ''} aria-pressed={a === 'tidak'} onClick={() => setElig(S.id, it.id, 'tidak')}>Belum / tidak</button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
        {!nothing && (
          <div className={cek.foot}>
            <span className={cek.progress}>{lines.length - nq} dari {lines.length} syarat terisi</span>
            <button type="button" className={css.ghostBtn} disabled={preview} onClick={() => resetElig(S.id, subjects)}>Reset</button>
            <button type="button" className={css.pillBtn} disabled={preview}
              onClick={() => { submitElig(S.id); body.current?.scrollTo({ top: 0 }); }}>Lihat hasil</button>
          </div>
        )}
      </div>
    </div>
  );
}
