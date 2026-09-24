'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';
import Link from 'next/link';
import type { School } from '@/data/types';
import { useSchools } from '@/lib/schools';
import { useStore } from '@/lib/store';
import Icon from './Icon';
import css from './ui.module.css';

/** Schools the student marked as targets in the Katalog. */
export const useTargetSchools = (): School[] => {
  const sel = useStore(s => s.sel);
  return useSchools().filter(s => sel[s.id]);
};

/** Active filter school — always one of the student's targets; null when none are marked. */
export const useFilterSchool = (): School | null => {
  const fSchool = useStore(s => s.fSchool);
  const targets = useTargetSchools();
  return targets.find(s => s.id === fSchool) || targets[0] || null;
};

export function StatusPills({ school, large }: { school: School; large?: boolean }) {
  const lg = large ? css.pillLg : '';
  const resmi = school.status === 'resmi';
  return (
    <>
      <span className={[css.pill, css.school, lg].join(' ')}>{school.pill}</span>
      <span className={[css.pill, resmi ? css.ok : css.amb, lg].join(' ')}>
        {resmi ? 'Info resmi 2027/28' : 'Perkiraan dari tahun lalu'}
      </span>
    </>
  );
}

export function EmptyTargets() {
  return (
    <div className={css.card} style={{ textAlign: 'center', padding: '38px 24px' }}>
      <div className={css.cardTitle} style={{ marginBottom: 6 }}>Belum ada sekolah target</div>
      <div className={css.cardSub} style={{ marginBottom: 16 }}>
        Pilih SMA tujuan di Katalog dulu.
      </div>
      <Link href="/katalog" className={css.ctaLink}>Buka Katalog SMA Unggulan</Link>
    </div>
  );
}

/** Closes on outside click and Escape, like the Talamus FE popover. */
function usePopover() {
  const [open, setOpen] = useState(false);
  const wrap = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const outside = (e: MouseEvent) => { if (wrap.current && !wrap.current.contains(e.target as Node)) setOpen(false); };
    const esc = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', outside);
    document.addEventListener('keydown', esc);
    return () => { document.removeEventListener('mousedown', outside); document.removeEventListener('keydown', esc); };
  }, [open]);
  return { open, setOpen, wrap };
}

/** Target-school dropdown: trigger pill + a list with the school's color dot and a check on the active one. */
function SchoolPicker({ schools, active, onPick }: { schools: School[]; active: School; onPick: (id: School['id']) => void }) {
  const { open, setOpen, wrap } = usePopover();
  return (
    <div className={css.pick} ref={wrap} data-school={active.id}>
      <button type="button" className={css.pickBtn} aria-haspopup="listbox" aria-expanded={open} onClick={() => setOpen(!open)}>
        <span className={css.chipDot} />
        <span>Sekolah tujuan</span>
        <span className={css.pickVal}>{active.short}</span>
        <Icon name="chevronDown" size={15} stroke={2} />
      </button>
      {open && (
        <div className={css.pop} role="listbox" aria-label="Sekolah tujuan">
          {schools.map(s => {
            const on = s.id === active.id;
            return (
              <button key={s.id} type="button" role="option" aria-selected={on} data-school={s.id}
                className={[css.popItem, on ? css.popItemOn : ''].join(' ')}
                onClick={() => { setOpen(false); if (!on) onPick(s.id); }}>
                <span className={css.chipDot} />
                <span className={css.popLabel}>{s.short}</span>
                {on && <Icon name="check" size={15} stroke={2.2} />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

/** The active school's full name, its pills and a link to its profile, under the dropdown. */
function SchoolLine({ school: S }: { school: School }) {
  return (
    <div className={css.schoolLine} data-school={S.id}>
      <span className={css.schoolLineName}>{S.name}</span>
      <StatusPills school={S} />
      <Link href={'/katalog/' + S.id} className={css.linkBtn}>Lihat profil sekolah</Link>
    </div>
  );
}

/**
 * Per-school filter dropdown, shared by Checklist / Kalkulator / FAQ.
 * Only lists the student's target schools; renders `children` for the active one.
 */
export default function SchoolChips({ children }: { children: (school: School) => ReactNode }) {
  const targets = useTargetSchools();
  const S = useFilterSchool();
  const setFSchool = useStore(s => s.setFSchool);
  if (!S) return <EmptyTargets />;
  return (
    <>
      <SchoolPicker schools={targets} active={S} onPick={setFSchool} />
      <SchoolLine school={S} />
      {children(S)}
    </>
  );
}
