'use client';

import { useEffect, useId, useState } from 'react';
import Link from 'next/link';
import type { Requirement, School } from '@/data/types';
import { P, fmt } from '@/lib/dates';
import { agoLabel, costText, daftarLabel, highlightsOf, locationLabel, profileRows, sc, stars } from '@/lib/murid';
import { REQUIREMENT_GROUPS, isWebUrl, requirementGroup } from '@/lib/school-form';
import { useStore } from '@/lib/store';
import Icon from './Icon';
import CekSyaratModal from './murid/CekSyaratModal';
import ForumModal from './murid/ForumModal';
import PhotoTile from './murid/PhotoTile';
import css from './murid/detail.module.css';

const BAR = ['#2D6327', '#2E7CB8', '#9A6B00', '#ACAAAA'];
const TABS = [['tentang', 'Tentang'], ['fasilitas', 'Fasilitas'], ['alumni', 'Alumni & Prestasi'], ['ulasan', 'Ulasan']] as const;
type TabKey = (typeof TABS)[number][0];
const initialsOf = (n: string) => n.split(' ').filter(Boolean).map(w => w[0]).join('').slice(0, 2).toUpperCase();
const yearOf = (a: { t: string; yr: string }) => Math.max(0, ...(`${a.yr} ${a.t}`.match(/20\d\d/g) || []).map(Number));

function Accordion({ title, badge, open, onToggle, children }: {
  title: string; badge?: { text: string; ok: boolean }; open: boolean; onToggle: () => void; children: React.ReactNode;
}) {
  return (
    <div className={css.acc}>
      <button type="button" className={css.accBtn} aria-expanded={open} onClick={onToggle}>
        <span className={css.accTitle}>{title}{badge && <span className={[css.accBadge, badge.ok ? css.badgeOk : css.badgeAmb].join(' ')}>{badge.text}</span>}</span>
        <Icon name="chevronDown" size={16} stroke={2} className={[css.accChev, open ? css.accChevOn : ''].join(' ')} />
      </button>
      {open && <div className={css.accBody}>{children}</div>}
    </div>
  );
}

/** A school's page: gallery, highlights, tabs (Tentang, Fasilitas, Alumni & Prestasi, Ulasan) and the registration panel. */
export default function SchoolProfile({ school: S, preview = false }: { school: School; preview?: boolean }) {
  const uid = useId().replace(/:/g, '');
  const secId = (k: string) => `sec-${uid}-${k}`;
  const on = useStore(s => !!s.sel[S.id]);
  const rvLike = useStore(s => s.rvLike);
  const { toggleSel, toggleRvLike } = useStore.getState();
  const [tab, setTab] = useState<TabKey>('tentang');
  const [acc, setAcc] = useState<Record<string, boolean>>({});
  const [tip, setTip] = useState(false);
  const [modal, setModal] = useState<null | 'cek' | 'forum'>(null);
  const [rvSort, setRvSort] = useState<'pop' | 'new'>('pop');
  const [rvOpen, setRvOpen] = useState<Record<string, boolean>>({});
  const [alOpen, setAlOpen] = useState<Record<number, boolean>>({});

  // The tab bar follows the scroll position: the last section whose top has passed the bar is the current one.
  useEffect(() => {
    if (preview) return;
    const spy = () => {
      let cur: TabKey | null = null;
      TABS.forEach(([k]) => { const el = document.getElementById(secId(k)); if (el && el.getBoundingClientRect().top < 160) cur = k; });
      if (cur) setTab(cur);
    };
    window.addEventListener('scroll', spy, { passive: true });
    return () => window.removeEventListener('scroll', spy);
  });

  const goTab = (k: TabKey) => {
    setTab(k);
    const el = document.getElementById(secId(k));
    if (el) window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - 120, behavior: 'smooth' });
  };

  const resmi = S.status === 'resmi';
  const hls = highlightsOf(S);
  const about = S.about || S.tag;
  const profile = profileRows(S).filter(r => !['KURIKULUM', 'PEMINATAN'].includes(r.k.toUpperCase()));
  const kurs = S.curriculumCards?.length ? S.curriculumCards : S.info.curriculum.map(t => ({ t, d: '' }));
  const alumni = S.alumni ?? [];
  const achievements = (S.achievements ?? []).slice().sort((a, b) => yearOf(b) - yearOf(a));
  const reviews = (S.reviews ?? []).map((r, i) => ({ r, i })).sort((a, b) => (rvSort === 'new' ? a.r.ago - b.r.ago : b.r.likes - a.r.likes));
  const someEst = S.phases.some(p => p.est), allEst = S.phases.length > 0 && S.phases.every(p => p.est);
  const tlBadge = !someEst ? { text: 'Data terbaru', ok: true } : { text: allEst ? 'Pakai data tahun lalu' : 'Sebagian estimasi', ok: false };
  const statusLabel = resmi ? 'Info resmi sudah rilis' : 'Info belum rilis — pakai data tahun lalu';
  const bannerPts = (S.banner || '').split(/\.\s+/).map(x => x.trim()).filter(Boolean).map(x => (/[.!?]$/.test(x) ? x : x + '.'));
  const cost = costText(S);
  const toggle = (k: string) => setAcc(a => ({ ...a, [k]: !a[k] }));
  const grouped = REQUIREMENT_GROUPS.map(g => ({ g, rows: S.reqs.filter((r: Requirement) => requirementGroup(r) === g.value) })).filter(x => x.rows.length);

  return (
    <div className={css.page} {...sc(S)}>
      <div className={css.top}>
        {!preview && <Link href="/katalog" className={css.back} title="Kembali ke Katalog" aria-label="Kembali ke Katalog"><Icon name="arrowLeft" size={16} stroke={2} /></Link>}
        <div className={css.grow} />
        <button type="button" className={[css.like, on ? css.likeOn : ''].join(' ')} disabled={preview} aria-pressed={on} onClick={() => toggleSel(S.id)}>
          <Icon name="heart" size={17} stroke={1.8} fill={on} />{on ? 'Disukai' : 'Suka'}
        </button>
      </div>

      <div className={css.gallery}>
        <div className={css.galMain}><PhotoTile school={S} index={0} size={30} /></div>
        <div className={css.galGrid}>{[1, 2, 3, 4].map(i => <PhotoTile key={i} school={S} index={i} size={30} />)}</div>
      </div>

      <div className={css.cols}>
        <div className={css.main}>
          <h1 className={css.h1}>{S.name}</h1>
          {locationLabel(S) && <div className={css.meta}>{locationLabel(S)}</div>}
          {hls.length > 0 && (
            <>
              <div className={css.rule} />
              <div className={css.hls}>
                {hls.map((h, i) => (
                  <div key={i} className={css.hl}>
                    <span className={[css.hlIcon, css['hl' + (i % 4)]].join(' ')}><Icon name={h.icon} size={22} stroke={1.7} /></span>
                    <div><div className={css.hlT}>{h.t}</div>{h.d && <div className={css.hlD}>{h.d}</div>}</div>
                  </div>
                ))}
              </div>
            </>
          )}

          <div className={css.tabs} role="tablist">
            {TABS.map(([k, label]) => (
              <button key={k} type="button" role="tab" aria-selected={tab === k} className={[css.tab, tab === k ? css.tabOn : ''].join(' ')} onClick={() => goTab(k)}>{label}</button>
            ))}
          </div>

          <section id={secId('tentang')} className={css.sec}>
            <h3 className={css.secTitle}>Tentang sekolah</h3>
            {about ? <p className={css.about}>{about}</p> : <p className={css.empty}>Belum ada deskripsi sekolah.</p>}
            {profile.length > 0 && (
              <div className={css.profile}>
                {profile.map(r => <div key={r.k}><div className={css.pk}>{r.k}</div><div className={css.pv}>{r.v}</div></div>)}
              </div>
            )}
            {kurs.length > 0 && (
              <>
                <div className={css.sub}>Kurikulum</div>
                <div className={css.kurs}>
                  {kurs.map(k => (
                    <div key={k.t} className={css.kur}>
                      <span className={css.kurIcon}><Icon name="cap" size={18} stroke={1.7} /></span>
                      <div style={{ minWidth: 0 }}><div className={css.kurT}>{k.t}</div>{k.d && <div className={css.kurD}>{k.d}</div>}</div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </section>

          <section id={secId('fasilitas')} className={css.sec}>
            <h3 className={css.secTitle}>Fasilitas sekolah</h3>
            {S.facilities?.length
              ? <div className={css.fasil}>{S.facilities.map(f => <div key={f.t} className={css.fas}><Icon name={f.icon} size={24} stroke={1.5} />{f.t}</div>)}</div>
              : <p className={css.empty}>Belum ada data fasilitas.</p>}
          </section>

          <section id={secId('alumni')} className={css.sec}>
            <h3 className={css.secTitle}>Alumni &amp; prestasi</h3>
            {!alumni.length && !achievements.length && <p className={css.empty}>Belum ada data alumni dan prestasi.</p>}
            {alumni.length > 0 && (
              <>
                <div className={css.lineHead}>
                  <span className={css.lineLabel}>SEBARAN LULUSAN</span>
                  {S.alumniYear && <span className={css.lineChip}>{S.alumniYear}</span>}
                </div>
                <div className={css.bars}>
                  {alumni.map((a, i) => {
                    const has = !!a.campuses?.length, open = !!alOpen[i] && has;
                    const Row = has ? 'button' : 'div';
                    return (
                      <div key={a.k}>
                        <Row className={[css.barRow, has ? css.barRowBtn : ''].join(' ')} {...(has ? { type: 'button' as const, 'aria-expanded': open, onClick: () => setAlOpen(o => ({ ...o, [i]: !open })) } : {})}>
                          <span className={css.barK}>{a.k}</span>
                          <span className={css.barTrack}><span className={css.barFill} style={{ display: 'block', width: Math.min(100, a.v) + '%', background: BAR[i % 4] }} /></span>
                          <span className={css.barV}>{a.v}%</span>
                          <span className={css.barChev} style={{ opacity: has ? 1 : 0, transform: open ? 'rotate(180deg)' : 'none' }}><Icon name="chevronDown" size={16} stroke={2} /></span>
                        </Row>
                        {open && <div className={css.kampus}>{a.campuses!.map(c => <span key={c.n} className={css.kp}>{c.n}<b>{c.c}</b></span>)}</div>}
                      </div>
                    );
                  })}
                </div>
              </>
            )}
            {achievements.length > 0 && (
              <>
                <div className={css.lineHead} style={{ margin: alumni.length ? '24px 0 6px' : '0 0 6px' }}>
                  <span className={css.lineLabel}>PRESTASI</span>
                  {S.achievementsUpdated && <span className={css.lineNote}>Terakhir diperbarui {S.achievementsUpdated}</span>}
                </div>
                <div className={css.pres}>
                  {achievements.map((a, i) => (
                    <div key={i} className={css.presRow}>
                      <span className={css.presIcon}><Icon name="star" size={16} stroke={1.8} /></span>
                      <span className={css.presT}>{a.t}</span>
                      <span className={css.presYr}>{a.yr || '—'}</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </section>

          <section id={secId('ulasan')} className={css.sec}>
            <div className={css.rvHead}>
              <div className={css.rvTitle}>Ulasan alumni</div>
              {reviews.length > 1 && (
                <div className={css.rvSorts}>
                  <button type="button" className={[css.rvSort, rvSort === 'pop' ? css.rvSortOn : ''].join(' ')} onClick={() => setRvSort('pop')}>POPULER</button>
                  <button type="button" className={[css.rvSort, rvSort === 'new' ? css.rvSortOn : ''].join(' ')} onClick={() => setRvSort('new')}>TERBARU</button>
                </div>
              )}
            </div>
            {reviews.length === 0 && <p className={css.empty} style={{ paddingTop: 16 }}>Belum ada ulasan alumni.</p>}
            {reviews.map(({ r, i }) => {
              const key = S.id + '.' + i, open = !!rvOpen[key], liked = !preview && !!rvLike[key];
              const paras = r.text.split(/\n{2,}/).filter(Boolean);
              return (
                <article key={key} className={css.rv}>
                  <span className={[css.rvAv, css['av' + (i % 4)]].join(' ')}>{initialsOf(r.name)}</span>
                  <div style={{ minWidth: 0 }}>
                    <div className={css.rvBy}><span>Ulasan oleh <strong>{r.name}</strong></span><span className={css.rvStars}>{stars(r.rating)}</span></div>
                    <div className={css.rvMeta}>{r.role} · {agoLabel(r.ago)}</div>
                    <div className={css.rvName}>{r.title}</div>
                    {(open ? paras : paras.slice(0, 1)).map((p, k) => <p key={k} className={css.rvP}>{p}</p>)}
                    <div className={css.rvAct}>
                      {paras.length > 1 && <button type="button" className={css.rvMore} onClick={() => setRvOpen(o => ({ ...o, [key]: !open }))}>{open ? 'Tutup' : 'Baca selengkapnya'}</button>}
                      <button type="button" className={[css.rvLike, liked ? css.rvLikeOn : ''].join(' ')} disabled={preview} aria-pressed={liked} onClick={() => toggleRvLike(key)}>
                        <Icon name="heart" size={15} stroke={1.8} fill={liked} />{r.likes + (liked ? 1 : 0)} suka
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </section>
        </div>

        <aside className={css.aside}>
          <div className={css.panel}>
            <div className={css.panelScroll}>
              <div className={css.panelHead}>
                <div className={css.panelLabel}>PENDAFTARAN</div>
                <div className={css.infoWrap} onMouseEnter={() => setTip(true)} onMouseLeave={() => setTip(false)}>
                  <button type="button" className={[css.infoBtn, resmi ? css.infoOk : css.infoAmb].join(' ')} aria-label="Status informasi" aria-expanded={tip} onClick={() => setTip(t => !t)}>i</button>
                  {tip && (
                    <div className={css.tip} role="tooltip">
                      <div className={[css.tipHead, resmi ? css.infoOk : css.infoAmb].join(' ')}><span className={css.tipDot} /><span>{statusLabel}</span></div>
                      {bannerPts.length > 0 && <ul className={css.tipList}>{bannerPts.map((b, i) => <li key={i}>{b}</li>)}</ul>}
                    </div>
                  )}
                </div>
              </div>
              <div className={css.panelName}>{S.name}</div>
              <div className={css.panelDaftar}>{daftarLabel(S)}</div>

              <Accordion title="Biaya" open={!!acc.biaya} onToggle={() => toggle('biaya')}>
                {cost ? <p className={css.accText}>{cost}</p> : <p className={css.empty}>Belum ada keterangan biaya.</p>}
              </Accordion>
              <Accordion title="Syarat" open={!!acc.syarat} onToggle={() => toggle('syarat')}>
                {grouped.length === 0 && <p className={css.empty}>Belum ada syarat.</p>}
                {grouped.map(({ g, rows }) => (
                  <div key={g.value}>
                    {grouped.length > 1 && <div className={css.grpLabel}>{g.label}</div>}
                    {rows.map((r, i) => <div key={i} className={css.req}><div className={css.reqK}>{r.k}</div><div className={css.reqV}>{r.v}</div></div>)}
                  </div>
                ))}
              </Accordion>
              <Accordion title="Timeline Pendaftaran" badge={S.phases.length ? tlBadge : undefined} open={!!acc.alur} onToggle={() => toggle('alur')}>
                {S.phases.length === 0 && <p className={css.empty}>Jadwal belum diumumkan.</p>}
                {S.phases.map((p, i) => (
                  <div key={i} className={css.step}>
                    <div className={css.stepRail}><span className={css.stepN}>{i + 1}</span><span className={css.stepLine} /></div>
                    <div className={css.stepBody}>
                      <div className={css.stepL}>{p.l}</div>
                      <div className={css.stepD}>
                        <span>{p.s ? fmt(P(p.s)) + (!p.e || p.s === p.e ? '' : ' – ' + fmt(P(p.e))) : 'Tanggal belum ditentukan'}</span>
                        {p.est && <span className={css.est}>Estimasi</span>}
                      </div>
                      {[p.group, p.mode, p.location].some(Boolean) && <div className={css.stepNote}>{[p.group, p.mode, p.location].filter(Boolean).join(' · ')}</div>}
                      {p.details && <div className={css.stepNote}>{p.details}</div>}
                    </div>
                  </div>
                ))}
              </Accordion>
              <Accordion title="Dokumen resmi & arsip" open={!!acc.dok} onToggle={() => toggle('dok')}>
                {S.docs.length === 0 && <p className={css.empty}>Belum ada dokumen.</p>}
                {S.docs.map((d, i) => (
                  <div key={i} className={css.doc}>
                    <div className={css.docMain}><div className={css.docL}>{d.l}</div><div className={css.docM}>{d.m}</div></div>
                    <span className={[css.docSt, d.arsip ? css.badgeAmb : css.badgeOk].join(' ')}>{d.arsip ? 'Arsip tahun lalu' : 'Resmi'}</span>
                    {isWebUrl(d.h) ? <a href={d.h} target="_blank" rel="noopener noreferrer" className={css.docOpen}>Buka</a> : <span className={css.docM}>Tautan belum valid</span>}
                  </div>
                ))}
              </Accordion>
            </div>
            <div className={css.ctas}>
              <button type="button" className={[css.cta, css.ctaBlue].join(' ')} disabled={preview} onClick={() => setModal('cek')}>
                <Icon name="calc" size={17} stroke={1.8} />Cek Syarat
              </button>
              <button type="button" className={[css.cta, css.ctaGold].join(' ')} disabled={preview} onClick={() => setModal('forum')}>
                <Icon name="chats" size={17} stroke={1.8} />Forum
              </button>
              <button type="button" className={[css.cta, on ? css.ctaHeartOn : css.ctaHeart].join(' ')} disabled={preview} aria-pressed={on} onClick={() => toggleSel(S.id)}>
                <Icon name="heart" size={17} stroke={1.8} fill={on} />{on ? 'Disimpan' : 'Simpan'}
              </button>
            </div>
          </div>
        </aside>
      </div>

      {modal === 'cek' && <CekSyaratModal school={S} onClose={() => setModal(null)} />}
      {modal === 'forum' && <ForumModal school={S} onClose={() => setModal(null)} />}
    </div>
  );
}
