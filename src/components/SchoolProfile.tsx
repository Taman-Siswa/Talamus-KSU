'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { School } from '@/data/types';
import { P, fmtR, startOfToday } from '@/lib/dates';
import { hasInAppHistory } from '@/lib/nav';
import DocsCard from './DocsCard';
import { REQUIREMENT_GROUPS, requirementGroup } from '@/lib/school-form';
import Icon from './Icon';
import { StatusPills } from './SchoolChips';
import TargetButton from './TargetButton';
import css from './ui.module.css';

export default function SchoolProfile({ school: S, preview = false }: { school: School; preview?: boolean }) {
  const router = useRouter();
  const today = startOfToday();

  // After choosing a target, return to the KSU page the student came from; if they opened this page directly, go to the Katalog.
  const goBack = () => (hasInAppHistory() ? router.back() : router.push('/katalog'));
  const resmi = S.status === 'resmi';
  // Keep the profile readable for both legacy records and the spreadsheet fields.
  const info = [
    { k: 'Negeri/Swasta', v: S.info.kind },
    { k: 'Tahun berdiri', v: S.info.founded },
    { k: 'Provinsi', v: S.info.province },
    { k: 'Kabupaten/kota', v: S.info.city },
    { k: 'Lokasi kampus', v: S.info.address },
    { k: 'Periode penerimaan', v: S.info.admissionYear },
    { k: 'Sistem penerimaan', v: S.info.admissionSystem },
    { k: 'Kurikulum', v: S.info.curriculum.join(' · ') },
    { k: 'Asrama', v: S.info.boarding },
    { k: 'Pembiayaan', v: S.info.funding.join(' · ') },
    { k: 'Kuota per angkatan', v: S.info.quotas?.length ? S.info.quotas.map(q => `${q.year}: ${q.seats} siswa`).join(' · ') : S.info.quota },
    { k: 'Telepon', v: S.info.phone },
    { k: 'Email', v: S.info.email },
    { k: 'Website', v: S.info.website },
    { k: 'Kontak sekolah', v: S.info.contact },
  ].filter(r => r.v);
  return (
    <div data-school={S.id}>
      {!preview && <Link href="/katalog" className={css.back}>
        <Icon name="arrowLeft" size={15} stroke={2} />
        <span>Katalog SMA Unggulan</span>
      </Link>}
      <div className={css.pills}><StatusPills school={S} large /></div>
      <h1 className={[css.h1, css.h1School].join(' ')}>{S.name}</h1>
      <p className={css.tag}>{S.tag}</p>
      <div className={css.facts}>
        {S.facts.map(f => (
          <span key={f} className={css.fact}><span className={css.factDot} />{f}</span>
        ))}
      </div>

      <div className={[css.banner, resmi ? css.ok : css.amb].join(' ')}>
        <Icon name="info" stroke={1.7} style={{ marginTop: 2 }} />
        <span>{S.banner}</span>
      </div>

      {info.length > 0 && (
        <div className={css.card}>
          <div className={css.cardTitle} style={{ marginBottom: 14 }}>Info sekolah</div>
          <div className={css.col}>
            {info.map(r => (
              <div key={r.k} className={css.req}>
                <span className={css.reqK}>{r.k}</span>
                <span className={css.reqV}>{r.v}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {REQUIREMENT_GROUPS.map(group => {
        const reqs = S.reqs.filter(r => requirementGroup(r) === group.value);
        return reqs.length ? <div className={css.card} key={group.value}>
          <div className={css.cardTitle} style={{ marginBottom: 14 }}>{group.label}</div>
          <div className={css.col}>{reqs.map((r, i) => <div key={i} className={css.req}>
            <span className={css.reqK}>{r.k}</span><span className={css.reqV} style={{ whiteSpace: 'pre-line' }}>{r.v}</span>
          </div>)}</div>
        </div> : null;
      })}

      <div className={css.card}>
        <div className={css.cardTitle} style={{ marginBottom: 16 }}>Tahapan &amp; jadwal</div>
        <div className={css.col}>
          {S.phases.map(p => {
            const end = p.e || p.s;
            const past = !!p.s && P(end) < today, now = !!p.s && P(p.s) <= today && today <= P(end);
            return (
              <div key={p.l} className={css.phase}>
                <div className={css.phaseRail}>
                  <span className={[css.phaseDot, past ? css.phaseDotPast : now ? css.phaseDotNow : ''].join(' ')} />
                  <span className={css.phaseLine} />
                </div>
                <div className={css.phaseBody}>
                  <div className={css.phaseText}>
                    <div className={[css.phaseLabel, past ? css.phasePast : ''].join(' ')}>{p.l}</div>
                    <div className={css.phaseRange}>{p.s ? fmtR(p.s, end) + (p.est ? ' · perkiraan' : ' · resmi') : 'Tanggal belum ditentukan'}</div>
                  {[p.group, p.mode, p.location].some(Boolean) && <p className={css.rowNote}>{[p.group, p.mode, p.location].filter(Boolean).join(' · ')}</p>}
                  {p.details && <p className={css.rowNote} style={{ whiteSpace: 'pre-line' }}>{p.details}</p>}
                  </div>
                  <span className={[css.pill, now ? css.ok : ''].join(' ')}>{past ? 'Selesai' : now ? 'Berlangsung' : 'Akan datang'}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <DocsCard school={S} />

      {!preview && <div className={css.targetBar}>
        <div className={css.targetText}>
          <div className={css.targetTitle}>Jadikan {S.short} target kamu</div>
        </div>
        <TargetButton school={S} className={css.targetBtn} onSelected={goBack} />
      </div>}
    </div>
  );
}
