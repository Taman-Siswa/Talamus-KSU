'use client';

import type { School } from '@/data/types';
import { useStore } from '@/lib/store';
import css from './ui.module.css';

type Tone = 'ok' | 'warn' | 'chip';
const toneCls = (t: Tone) => (t === 'ok' ? css.ok : t === 'warn' ? css.warn : '');

export default function CalculatorCard({ school: S }: { school: School }) {
  const grades = useStore(s => s.grades[S.id]);
  const iqv = useStore(s => s.iq[S.id]) || '';
  const bd = useStore(s => s.body[S.id]) || {};
  const pres = !!useStore(s => s.prestasi[S.id]);
  const { setGrade, setIq, setBody, togglePrestasi } = useStore.getState();

  const cc = S.calc;
  const hasPrestasi = S.id === 'tn';
  const hasIq = S.id === 'pradita';
  const hasBody = S.id === 'tn' || S.id === 'ktb';

  // Taruna Nusantara's achievement track lowers both thresholds.
  const minAvg = cc ? (hasPrestasi && pres ? 80 : cc.minAvg) : 0;
  const minSem = cc ? (hasPrestasi && pres ? 75 : cc.minSem) : null;

  const rows = (cc?.subjects || []).map((sub, si) => {
    const row = grades?.[si] || [];
    const nums = row.filter(v => v !== '' && v != null).map(Number);
    const full = nums.length === cc!.sems.length;
    const avg = nums.length ? nums.reduce((a, b) => a + b, 0) / nums.length : null;
    const semOk = minSem == null || nums.every(n => n >= minSem);
    const pass = full && avg! >= minAvg && semOk;
    return {
      sub, row, full, pass, any: nums.length > 0,
      avgLabel: avg == null ? '–' : Math.round(avg * 10) / 10 + (full ? (pass ? ' · lolos' : ' · kurang') : ''),
      tone: (!full ? 'chip' : pass ? 'ok' : 'warn') as Tone,
    };
  });
  const anyFilled = rows.some(r => r.any);
  const allFilled = rows.every(r => r.full);
  const fails = rows.filter(r => r.full && !r.pass).map(r => r.sub);

  const iqOk = iqv !== '' && Number(iqv) >= 115;
  let bmi: number | null = null;
  if (bd.tb && bd.bb) bmi = Math.round((Number(bd.bb) / Math.pow(Number(bd.tb) / 100, 2)) * 10) / 10;
  const bmiOk = bmi != null && bmi >= 17 && bmi <= 25;

  let vt: string, vd: string | undefined, tone: Tone;
  if (!cc) { vt = 'Tidak ada ambang nilai rapor'; vd = S.noGradeNote; tone = 'ok'; }
  else if (!anyFilled) { vt = 'Isi nilai rapor untuk cek kelayakan'; vd = 'Masukkan nilai pengetahuan dari rapor — nilai tersimpan otomatis di perangkat ini.'; tone = 'chip'; }
  else if (!allFilled) { vt = 'Lengkapi semua nilai untuk hasil akhir'; vd = 'Sebagian semester belum terisi. Rata-rata di kanan dihitung dari nilai yang sudah ada.'; tone = 'chip'; }
  else if (fails.length === 0 && (!hasIq || iqOk)) { vt = 'Memenuhi syarat nilai'; vd = S.passNote; tone = 'ok'; }
  else if (fails.length === 0) { vt = 'Nilai rapor lolos — IQ belum'; vd = iqv === '' ? 'Isi skor tes IQ (syarat: ≥ 115 dari biro HIMPSI).' : 'Skor IQ di bawah 115. Tes bisa diulang di biro psikologi lain (maks. 6 bulan sebelum daftar).'; tone = 'warn'; }
  else { vt = 'Belum memenuhi syarat'; vd = 'Mapel di bawah ambang: ' + fails.join(', ') + '. ' + (S.failNote || ''); tone = 'warn'; }

  return (
    <div className={css.card} data-school={S.id}>
      <div className={css.cardTitle} style={{ marginBottom: 4 }}>Kalkulator kelayakan</div>
      <div className={css.cardSub} style={{ marginBottom: 16 }}>{S.calcNote}</div>

      {cc && (
        <div className={css.gradeWrap}>
          <div className={css.gradeGrid}>
            <div className={css.gradeHead}>
              <span className={css.thSubject}>MAPEL</span>
              {cc.sems.map(sl => <span key={sl} className={css.thSem}>{sl}</span>)}
              <span className={css.thAvg}>RATA-RATA</span>
            </div>
            {rows.map((r, si) => (
              <div key={r.sub} className={css.gradeRow}>
                <span className={css.subject}>{r.sub}</span>
                {cc.sems.map((sl, ci) => (
                  <input key={sl} className={css.cell} type="number" min={0} max={100} placeholder="–"
                    aria-label={r.sub + ' ' + sl} value={r.row[ci] || ''}
                    onChange={e => setGrade(S.id, si, ci, e.target.value)} />
                ))}
                <span className={css.avgSlot}>
                  <span className={[css.avg, toneCls(r.tone)].join(' ')}>{r.avgLabel}</span>
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {hasPrestasi && (
        <button className={css.extra} onClick={() => togglePrestasi(S.id)} role="switch" aria-checked={pres}>
          <span className={[css.switch, pres ? css.switchOn : ''].join(' ')}><span className={css.knob} /></span>
          <span className={css.extraText}>
            <span className={css.extraTitle}>Pakai jalur prestasi</span>
            <span className={css.extraNote}>Juara 1–3 min. kab/kota (OSN, O2SN, FLS2N) atau ketua OSIS — ambang turun jadi rata-rata ≥ 80, per semester ≥ 75.</span>
          </span>
        </button>
      )}

      {hasIq && (
        <div className={css.extra}>
          <span className={css.extraText}>
            <span className={css.extraTitle}>Skor tes IQ</span>
            <span className={css.extraNote}>Minimal 115, dari biro psikologi anggota HIMPSI (maks. 6 bulan).</span>
          </span>
          <input className={[css.numInput, css.numInputIq].join(' ')} type="number" min={0} max={200} placeholder="–"
            aria-label="Skor tes IQ" value={iqv} onChange={e => setIq(S.id, e.target.value)} />
          <span className={[css.statPill, iqv === '' ? '' : iqOk ? css.ok : css.warn].join(' ')}>
            {iqv === '' ? 'belum diisi' : iqOk ? 'memenuhi' : 'di bawah 115'}
          </span>
        </div>
      )}

      {hasBody && (
        <div className={css.extra}>
          <span className={css.extraText}>
            <span className={css.extraTitle}>Tinggi &amp; berat badan</span>
            <span className={css.extraNote}>{S.bodyNote || ''}</span>
          </span>
          <span className={css.bodyInputs}>
            <input className={css.numInput} type="number" min={0} max={230} placeholder="cm" aria-label="Tinggi badan (cm)"
              value={bd.tb || ''} onChange={e => setBody(S.id, 'tb', e.target.value)} />
            <input className={css.numInput} type="number" min={0} max={200} placeholder="kg" aria-label="Berat badan (kg)"
              value={bd.bb || ''} onChange={e => setBody(S.id, 'bb', e.target.value)} />
          </span>
          <span className={[css.statPill, bmi == null ? '' : bmiOk ? css.ok : css.amb].join(' ')}>
            {bmi == null ? 'IMT: –' : 'IMT ' + bmi + (bmiOk ? ' · sehat' : ' · perlu perhatian')}
          </span>
        </div>
      )}

      <div className={[css.verdict, tone === 'ok' ? css.verdictOk : tone === 'warn' ? css.verdictWarn : ''].join(' ')}>
        <div className={css.verdictTitle}>{vt}</div>
        <div className={css.verdictDesc}>{vd}</div>
      </div>
    </div>
  );
}
