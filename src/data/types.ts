/** Bundled schools use short codes ('tn', 'mht', …); schools the admin adds get 'sekolah-<random>'. */
export type SchoolId = string;

export type PhaseType = 'daftar' | 'tes' | 'umum';

export interface Calc {
  subjects: string[];
  sems: string[];
  minAvg: number;
  minSem: number | null;
}

export interface ChecklistItem {
  id: string;
  l: string;
  /** deadline label shown in the pill */
  d: string;
  /** deadline ISO date, used for overdue detection */
  dl: string;
  note?: string;
  f?: { k: string; p: string }[];
  up?: boolean;
}

/** Mirrors the properties of a school page in the marketing team's Notion catalog, under the same names. */
export interface SchoolInfo {
  kind: '' | 'Negeri' | 'Swasta';
  founded: string;
  province: string;
  curriculum: string[];
  /** Notion's "Asrama/Tidak" */
  boarding: string;
  /** Notion's "Pembiayaan": Beasiswa and/or Berbayar */
  funding: string[];
  /** Notion's "Kuota/angkatan" */
  quota: string;
  contact: string;
}

export interface School {
  id: SchoolId;
  mono: string;
  short: string;
  name: string;
  /** label on cards; the editor composes it from info.kind / boarding / province */
  pill: string;
  info: SchoolInfo;
  tag: string;
  /** 'resmi' = official info released, 'est' = estimated from last year (Notion: Resmi / Perkiraan) */
  status: 'resmi' | 'est';
  /** info-freshness note */
  banner: string;
  facts: string[];
  reqs: { k: string; v: string }[];
  calc: Calc | null;
  calcNote: string;
  passNote?: string;
  failNote?: string;
  noGradeNote?: string;
  bodyNote?: string;
  /** Notion's "Alur Pendaftaran": Gantt bars, the stage list, and (via keyDatesOf) the deadline list; est = date is a prediction */
  phases: { l: string; s: string; e: string; t: PhaseType; est?: boolean }[];
  checklist: ChecklistItem[];
  docs: { l: string; m: string; h: string; arsip: boolean }[];
  faq: { q: string; a: string }[];
}
