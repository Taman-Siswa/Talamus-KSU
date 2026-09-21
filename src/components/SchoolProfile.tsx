'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { School } from '@/data/types';
import { P, fmtR, startOfToday } from '@/lib/dates';
import { hasInAppHistory } from '@/lib/nav';
import DocsCard from './DocsCard';
import Icon from './Icon';
import { StatusPills } from './SchoolChips';
import TargetButton from './TargetButton';
import css from './ui.module.css';

export default function SchoolProfile({ school: S }: { school: School }) {
  const router = useRouter();
  const today = startOfToday();

  // After choosing a target, return to the KSU page the student came from; if they opened this page directly, go to the Katalog.
  const goBack = () => (hasInAppHistory() ? router.back() : router.push('/katalog'));
  const resmi = S.status === 'resmi';
  // Same names and order as the school's page in the Notion catalog; empty ones are skipped.
  const info = [
    { k: 'Negeri/Swasta', v: S.info.kind },
    { k: 'Tahun berdiri', v: S.info.founded },
    { k: 'Provinsi', v: S.info.province },
    { k: 'Kurikulum', v: S.info.curriculum.join(' · ') },
    { k: 'Asrama', v: S.info.boarding },
    { k: 'Pembiayaan', v: S.info.funding.join(' · ') },
    { k: 'Kuota per angkatan', v: S.info.quota },
    { k: 'Kontak sekolah', v: S.info.contact },
  ].filter(r => r.v);
  return (
    <div data-school={S.id}>
      <Link href="/katalog" className={css.back}>
        <Icon name="arrowLeft" size={15} stroke={2} />
        <span>Katalog SMA Unggulan</span>
      </Link>
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

      <div className={css.card}>
        <div className={css.cardTitle} style={{ marginBottom: 14 }}>Syarat utama</div>
        <div className={css.col}>
          {S.reqs.map(r => (
            <div key={r.k} className={css.req}>
              <span className={css.reqK}>{r.k}</span>
              <span className={css.reqV}>{r.v}</span>
            </div>
          ))}
        </div>
      </div>

      <div className={css.card}>
        <div className={css.cardTitle} style={{ marginBottom: 16 }}>Tahapan &amp; jadwal</div>
        <div className={css.col}>
          {S.phases.map(p => {
            const past = P(p.e) < today, now = P(p.s) <= today && today <= P(p.e);
            return (
              <div key={p.l} className={css.phase}>
                <div className={css.phaseRail}>
                  <span className={[css.phaseDot, past ? css.phaseDotPast : now ? css.phaseDotNow : ''].join(' ')} />
                  <span className={css.phaseLine} />
                </div>
                <div className={css.phaseBody}>
                  <div className={css.phaseText}>
                    <div className={[css.phaseLabel, past ? css.phasePast : ''].join(' ')}>{p.l}</div>
                    <div className={css.phaseRange}>{fmtR(p.s, p.e) + (p.est ? ' · perkiraan' : ' · resmi')}</div>
                  </div>
                  <span className={[css.pill, now ? css.ok : ''].join(' ')}>{past ? 'Selesai' : now ? 'Berlangsung' : 'Akan datang'}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <DocsCard school={S} />

      <div className={css.targetBar}>
        <div className={css.targetText}>
          <div className={css.targetTitle}>Jadikan {S.short} target kamu</div>
        </div>
        <TargetButton school={S} className={css.targetBtn} onSelected={goBack} />
      </div>
    </div>
  );
}
