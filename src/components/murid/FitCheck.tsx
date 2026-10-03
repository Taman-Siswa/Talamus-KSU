'use client';

import { useState } from 'react';
import type { School } from '@/data/types';
import { useCurrentUser } from '@/lib/auth';
import { useStore } from '@/lib/store';
import Icon from '../Icon';
import css from './checklist.module.css';
import ui from './murid.module.css';
import { FIT_LETTERS, STORY_LINES, scoreReading } from './fit';

// Only called from event handlers.
const stamp = () => Date.now();
const esc = (x: unknown) => String(x ?? '').replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' })[c]!);

/** TAMAN Fit Check and the "Ceritaku" paragraph for one school. Answers save as the student types. */
export default function FitCheck({ school: S }: { school: School }) {
  const fit = useStore(s => s.fit[S.id]) ?? {};
  const { setFit } = useStore.getState();
  const me = useCurrentUser();
  const [sent, setSent] = useState(false);
  const scores = FIT_LETTERS.map((_, i) => fit.me?.[i] ?? 0);
  const qual = FIT_LETTERS.map((_, i) => fit.qual?.[i] ?? '');
  const story = fit.story ?? {};
  const read = scoreReading(scores);
  const lowestOther = scores.some((v, i) => v === 1 && i !== 1);
  const rules: { k: string; t: string }[] = [];
  if (scores[1] && scores[1] <= 2) rules.push({ k: 'Aturan 1:', t: 'Skor Akademik rendah belum berarti nggak cocok. Itu gap — dan gap bisa dikejar.' });
  if (lowestOther) rules.push({ k: 'Aturan 2:', t: 'Ada skor 1 di huruf lain? Baca lagi jawabanmu di huruf itu dan diskusikan sebelum lanjut.' });

  const setScore = (i: number, v: number) => { const n = scores.slice(); n[i] = n[i] === v ? 0 : v; setFit(S.id, { me: n }); };
  const setQual = (i: number, v: string) => { const n = qual.slice(); n[i] = v; setFit(S.id, { qual: n }); };
  const setStory = (k: string, v: string) => setFit(S.id, { story: { ...story, [k]: v } });

  const submit = () => {
    setFit(S.id, { savedAt: stamp() });
    setSent(true);
    setTimeout(() => setSent(false), 1800);
  };

  const print = () => {
    const rows = FIT_LETTERS.map((l, i) => `<h3 style="margin:18px 0 4px;font-size:12pt">${l.L} · ${l.name} <span class="muted">— skor ${scores[i] || '–'}/5</span></h3><p>${esc(qual[i] || '–')}</p>`).join('');
    const lines = STORY_LINES(S.short).map(l => `${l.pre} ${story[l.k1] || '____'}${l.mid ? l.mid + ' ' + (story[l.k2!] || '____') : ''}`);
    const html = `<!doctype html><html><head><meta charset="utf-8"><title>TAMAN Fit Check – ${esc(S.short)}</title><style>body{font-family:Red Hat Text,system-ui,sans-serif;color:#333;margin:40px;font-size:12pt}h1{font-size:20pt;margin:0 0 4px}h2{font-size:13pt;color:#2D6327;margin:24px 0 8px}p{margin:6px 0;line-height:1.5}.muted{color:#777}</style></head><body><h1>TAMAN Fit Check</h1><div class="muted">${esc(S.name)} · ${esc(me?.name || '')}</div><h2>Jawaban per huruf</h2>${rows}<p><b>Total skor: ${read.total} / 25</b></p><h2>Ceritaku</h2>${lines.map(x => `<p>${esc(x)}</p>`).join('')}<p class="muted" style="margin-top:32px">tamanSchool</p></body></html>`;
    const w = window.open('', '_blank');
    if (!w) return;
    w.document.write(html); w.document.close(); w.focus();
    setTimeout(() => w.print(), 300);
  };

  const readCls = { ok: css.readOk, amb: css.readAmb, warn: css.readWarn, none: css.readNone }[read.tone];
  return (
    <div>
      <div className={css.card}>
        <div className={css.fitEyebrow}>01 · TAMAN FIT CHECK</div>
        <div className={css.fitTitle}>Seberapa cocok {S.short} buat kamu?</div>
        <div className={css.fitSub}>Untuk tiap huruf: jawab pertanyaannya dengan jujur, lalu kasih skor 1–5 (1 = nggak banget, 5 = cocok banget).</div>
        <div>
          {FIT_LETTERS.map((l, i) => (
            <div key={i} className={css.letter}>
              <span className={css.letterMark}>{l.L}</span>
              <div className={css.letterBody}>
                <div className={css.letterName}>{l.name}</div>
                <label className={css.guide}>
                  <span className={css.guideText}>{[l.q, ...l.more].join(' ')}</span>
                  <textarea className={css.area} rows={4} value={qual[i]} placeholder="Tulis jawabanmu di sini…" onChange={e => setQual(i, e.target.value)} />
                </label>
                <div className={css.scoreRow}>
                  <span className={css.scoreLabel}>SKOR</span>
                  <div className={css.scores} role="group" aria-label={'Skor ' + l.name}>
                    {[1, 2, 3, 4, 5].map(v => (
                      <button key={v} type="button" className={[css.score, scores[i] === v ? css.scoreOn : ''].join(' ')} aria-pressed={scores[i] === v} onClick={() => setScore(i, v)}>{v}</button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}
          <div className={css.total}>
            <span className={css.totalL}>Total skor</span>
            <span className={css.totalV}>{read.total || '__'} <small>/ 25</small></span>
          </div>
        </div>
        <div className={[css.read, readCls].join(' ')}>
          <span className={css.readRange}>{read.range}</span>
          <div><div className={css.readT}>{read.title}</div><div className={css.readS}>{read.sub}</div></div>
        </div>
        {rules.map(r => <div key={r.k} className={css.rule}><strong>{r.k}</strong> {r.t}</div>)}
      </div>

      <div className={[css.card, css.cardGap].join(' ')}>
        <div className={css.fitEyebrow}>02 · PENUTUP</div>
        <div className={css.fitTitle}>Ceritaku: satu paragraf</div>
        <div className={css.fitSub}>Lengkapi kalimatnya — ini bekal wawancara seleksi.</div>
        <div className={css.storyRows}>
          {STORY_LINES(S.short).map(l => (
            <div key={l.k1} className={css.storyLine}>
              <span>{l.pre}</span>
              <input className={css.blank} value={story[l.k1] || ''} placeholder="…" aria-label={l.pre} onChange={e => setStory(l.k1, e.target.value)} />
              {l.mid && l.k2 && <>
                <span>{l.mid}</span>
                <input className={css.blank} value={story[l.k2] || ''} placeholder="…" aria-label={l.mid} onChange={e => setStory(l.k2!, e.target.value)} />
              </>}
              {l.tag && <span className={css.storyHint}>{l.tag}</span>}
            </div>
          ))}
        </div>
      </div>

      <div className={css.actions}>
        <span className={css.saved}>
          {fit.savedAt ? 'Tersimpan ' + new Date(fit.savedAt).toLocaleString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : 'Jawabanmu tersimpan otomatis di perangkat ini.'}
        </span>
        <button type="button" className={ui.ghostBtn} onClick={print}><Icon name="print" size={17} stroke={1.8} />Print PDF</button>
        <button type="button" className={ui.pillBtn} onClick={submit}><Icon name="check" size={17} stroke={1.8} />{sent ? 'Terkirim' : 'Submit'}</button>
      </div>
    </div>
  );
}
