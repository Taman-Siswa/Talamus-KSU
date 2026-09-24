import { useMemo } from 'react';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { SCHOOLS } from '@/data/schools';
import type { PhaseType, ReqCategory, Requirement, School, SchoolId, SchoolInfo } from '@/data/types';

// School data the admin edits. Unlike student data this key is NOT per-account: one browser has
// one set of school data, so an admin's edits are what students on that browser read.
// MOCK ONLY — with a real backend this becomes a table every client fetches.
export const SCHOOLS_KEY = 'tsprep-schools-v1';

interface SchoolsState {
  /** only schools the admin has edited; the rest fall through to the bundled data */
  overrides: Partial<Record<SchoolId, School>>;
  /** schools the admin created; the bundled ones live in data/schools.ts */
  added: School[];
  /**
   * Unfinished work, kept apart from what students read. A draft of an existing school leaves the
   * published version untouched; a draft with an id no school has yet is a school still being written.
   */
  drafts: Partial<Record<SchoolId, School>>;
  hydrated: boolean;
  /** publishes the school and drops its draft */
  save: (school: School) => void;
  saveDraft: (school: School) => void;
  discardDraft: (id: SchoolId) => void;
  reset: (id: SchoolId) => void;
  /** Only schools the admin created can be removed; the 5 bundled ones are baked into the app. */
  remove: (id: SchoolId) => void;
}

export const isBundledSchool = (id: SchoolId) => SCHOOLS.some(s => s.id === id);

/** A fresh id for a school the admin adds. */
export const newSchoolId = () => 'sekolah-' + Math.random().toString(36).slice(2, 8);

export const blankInfo = (): SchoolInfo => ({
  kind: '', founded: '', province: '', curriculum: [], boarding: '', funding: [], quota: '', contact: '',
});

/** Empty school the editor starts from; every list is empty so students see nothing until it is filled in. */
export const blankSchool = (): School => ({
  id: '', mono: '', short: '', name: '', pill: '', info: blankInfo(), tag: '', status: 'est', banner: '',
  facts: [], reqs: [], calc: null, calcNote: '', phases: [], checklist: [], docs: [], faq: [],
});

// Schools saved before `info` existed have none: fill it from the bundled record, else leave it blank.
const normalize = (s: School): School => ({
  ...s,
  info: { ...blankInfo(), ...SCHOOLS.find(b => b.id === s.id)?.info, ...s.info },
});

const merge = (overrides: SchoolsState['overrides'], added: School[]): School[] => [
  ...SCHOOLS.map(s => normalize(overrides[s.id] ?? s)),
  ...added.map(normalize),
];

const lowerFirst = (l: string) => (/^[A-Z][a-z]/.test(l) ? l.charAt(0).toLowerCase() + l.slice(1) : l);

/**
 * The deadline list, derived from the stages so the admin enters each date once.
 * A registration stage gives two dates (opens, closes); any other stage gives its start date.
 */
export const keyDatesOf = (s: School): { d: string; l: string }[] =>
  s.phases
    .filter(p => p.s)
    .flatMap(p => {
      const label = (l: string) => (p.est ? 'Perkiraan ' + lowerFirst(l) : l);
      if (p.t === 'daftar' && p.e && p.e !== p.s) {
        return [{ d: p.s, l: label('Buka ' + lowerFirst(p.l)) }, { d: p.e, l: label('Batas akhir ' + lowerFirst(p.l)) }];
      }
      return [{ d: p.s, l: label(p.l) }];
    })
    .sort((a, b) => a.d.localeCompare(b.d));

export const useSchoolsStore = create<SchoolsState>()(
  persist(
    (set, get) => ({
      overrides: {},
      added: [],
      drafts: {},
      hydrated: false,
      save: school => {
        const drafts = { ...get().drafts };
        delete drafts[school.id];
        if (isBundledSchool(school.id)) return set({ drafts, overrides: { ...get().overrides, [school.id]: school } });
        const added = get().added;
        set({ drafts, added: added.some(a => a.id === school.id) ? added.map(a => (a.id === school.id ? school : a)) : [...added, school] });
      },
      saveDraft: school => set({ drafts: { ...get().drafts, [school.id]: school } }),
      discardDraft: id => {
        const drafts = { ...get().drafts };
        delete drafts[id];
        set({ drafts });
      },
      reset: id => {
        const overrides = { ...get().overrides };
        delete overrides[id];
        set({ overrides });
      },
      remove: id => {
        if (isBundledSchool(id)) return;
        const drafts = { ...get().drafts };
        delete drafts[id];
        set({ drafts, added: get().added.filter(a => a.id !== id) });
      },
    }),
    {
      name: SCHOOLS_KEY,
      skipHydration: true,
      partialize: s => ({ overrides: s.overrides, added: s.added, drafts: s.drafts }),
      onRehydrateStorage: () => () => useSchoolsStore.setState({ hydrated: true }),
    },
  ),
);

/** All schools, with the admin's edits applied. Bundled schools first, then the ones the admin added. */
export function useSchools(): School[] {
  const overrides = useSchoolsStore(s => s.overrides);
  const added = useSchoolsStore(s => s.added);
  return useMemo(() => merge(overrides, added), [overrides, added]);
}

/** Same list without a hook, for store actions. */
export const getSchools = (): School[] => {
  const { overrides, added } = useSchoolsStore.getState();
  return merge(overrides, added);
};

export function useSchool(id: string): School | null {
  return useSchools().find(s => s.id === id) || null;
}

/** The admin's saved draft for this id, if any. Students never read drafts. */
export function useDraft(id: string): School | null {
  const draft = useSchoolsStore(s => s.drafts[id]);
  return useMemo(() => (draft ? normalize(draft) : null), [draft]);
}

/** Drafts of schools that are not published yet, for the admin list. */
export function useUnpublishedDrafts(): School[] {
  const drafts = useSchoolsStore(s => s.drafts);
  const schools = useSchools();
  return useMemo(
    () => Object.values(drafts).filter((d): d is School => !!d && !schools.some(s => s.id === d.id)).map(normalize),
    [drafts, schools],
  );
}

/** True when this school differs from the data shipped with the app. */
export const useIsEdited = (id: SchoolId) => useSchoolsStore(s => !!s.overrides[id]);

/**
 * Category for a requirement saved before categories existed, guessed from its name.
 * Same rules as the design (Design system v2); the admin can always pick another.
 */
export function guessReqCategory(name: string): ReqCategory | '' {
  const s = (name || '').toLowerCase();
  if (/sehat|kesehatan|fisik|postur|tinggi/.test(s)) return 'Kesehatan';
  if (/domisili|kk |wilayah/.test(s)) return 'Domisili';
  if (/usia|umur/.test(s)) return 'Usia';
  if (/prestasi/.test(s)) return 'Prestasi';
  if (/dokumen|berkas|ketentuan|administrasi/.test(s)) return 'Administrasi';
  if (/nilai|rapor|akademik|tes|seleksi|iq|jalur|tahapan|gelombang|try/.test(s)) return 'Akademik';
  return '';
}

export const reqCategory = (r: Requirement): ReqCategory | '' => (r.cat !== undefined ? r.cat : guessReqCategory(r.k));

/**
 * The editor no longer asks for a stage's kind, so it follows the stage name:
 * "Pendaftaran …" / "Registrasi …" / "… gelombang …" opens registration, "Pengumuman …" / "Sosialisasi …" is an
 * announcement, anything else is a test or selection step. "Daftar ulang" and "Seleksi & pengumuman …" stay tests.
 * The kind drives the Timeline bar style, the clash check (tests only) and the open/close deadlines.
 */
export function inferPhaseType(name: string): PhaseType {
  const s = name.trim().toLowerCase();
  if (/^(pengumuman|sosialisasi)/.test(s)) return 'umum';
  if (/^(pendaftaran|registrasi)|gelombang/.test(s)) return 'daftar';
  return 'tes';
}
