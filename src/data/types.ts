/** Schools the admin adds get 'sekolah-<random>' identifiers. */
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
  /** deadline date; the pill shows it formatted (see `dlLabel` in lib/dates.ts), also used for overdue detection */
  dl: string;
  /** true when `dl` is inferred from last year's cycle rather than officially announced — the pill gets a "±" */
  est?: boolean;
  note?: string;
  /** Present for a required document; absent for an ordinary preparation task. */
  document?: {
    required: boolean;
    rules: { format: string; maxMB: string }[];
    template: string;
  };
  f?: { k: string; p: string }[];
}

/** School profile; spreadsheet additions are optional so existing saved records still load. */
export interface SchoolInfo {
  kind: '' | 'Negeri' | 'Swasta';
  /** older records only; the form writes these into the Tentang table (`profile`) instead */
  founded?: string;
  province: string;
  curriculum: string[];
  /** Notion's "Asrama/Tidak" */
  boarding: string;
  /** Notion's "Pembiayaan": Beasiswa and/or Berbayar */
  funding: string[];
  quota?: string;
  contact?: string;
  city?: string;
  /** number of campuses; above 1 the Katalog card says "6 kampus" and the school also shows under Lokasi: Multi-kampus */
  campusCount?: number;
  address?: string;
  phone?: string;
  email?: string;
  website?: string;
  admissionSystem?: string;
  admissionYear?: string;
  quotas?: { year: string; seats: string }[];
}

export type ReqCategory = 'Akademik' | 'Kesehatan' | 'Administrasi' | 'Domisili' | 'Usia' | 'Prestasi' | 'Lainnya';

/**
 * One line of "Persyaratan". `cat` is optional so older records still load; the editor guesses it from the name
 * until the admin picks one. `det` holds the optional detail fields some categories have (tes akademik, pemeriksaan).
 */
export interface Requirement {
  /** title; the form derives it from the first line of `v` */
  k: string;
  v: string;
  group?: 'utama' | 'akademis' | 'fisik';
  /** older records only */
  cat?: ReqCategory | '';
  /** older records only: detail fields, now folded into `v` */
  det?: Record<string, string>;
  /** 'nilai' = the row behind `School.calc`, 'usia' = the row behind `eligibility.dob`; both texts follow their fields */
  kind?: 'nilai' | 'usia';
  /** the student can answer this requirement yes/no in Cek syarat; `id` keys the answer */
  check?: boolean;
  id?: string;
}

/** The five identity colors of the student design; an admin may pick one, otherwise it follows the school id. */
export type SchoolColor = 'merah' | 'kuning' | 'biru' | 'hijau' | 'ungu';
export const SCHOOL_COLORS: SchoolColor[] = ['hijau', 'biru', 'kuning', 'merah', 'ungu'];

/** Icons the admin can pick for highlights and facilities (see ICONS in components/Icon.tsx). */
export type IconKey = 'spark' | 'shield' | 'home' | 'cap' | 'book' | 'lab' | 'pc' | 'trophy' | 'heart' | 'globe' | 'wave' | 'users';

export interface Review {
  name: string;
  /** e.g. "Alumni 2022 · kini di UI" */
  role: string;
  title: string;
  /** paragraphs separated by a blank line */
  text: string;
  rating: number;
  /** month written, "2026-08" */
  date?: string;
}

/**
 * Content for the student's school page (tabs Tentang / Fasilitas / Alumni & prestasi / Ulasan, the Katalog card
 * and the registration panel). Every field is optional: the page falls back to what the school already has and
 * shows an empty note for what is missing.
 */
export interface SchoolContent {
  color?: SchoolColor;
  /** older records only: the card line now is `tag` */
  sub?: string;
  /** line under the title on the detail page; falls back to city + province */
  location?: string;
  /** up to five photos: references to what the admin uploaded ("ksu-photo:<id>", see lib/photos.ts) or web links; empty = placeholder tile */
  photos?: string[];
  highlights?: { icon: IconKey; t: string; d: string }[];
  about?: string;
  profile?: { k: string; v: string }[];
  curriculumCards?: { t: string; d: string }[];
  facilities?: { icon: IconKey; t: string }[];
  alumni?: { k: string; v: number; campuses?: { n: string; c: number }[] }[];
  alumniYear?: string;
  achievements?: { t: string; yr: string }[];
  achievementsUpdated?: string;
  reviews?: Review[];
  /** `long` is the text in the Biaya panel; `free` is from older records (Gratis now follows Pembiayaan) */
  cost?: { long?: string; free?: boolean };
  /** the "Cek syarat" questions beyond report-card grades */
  eligibility?: { dob?: { max: number; at: string; q: string }; items: { id: string; q: string }[] };
}

export interface School extends SchoolContent {
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
  /** older records only: one-line highlights, now `highlights` */
  facts?: string[];
  reqs: Requirement[];
  calc: Calc | null;
  calcNote: string;
  passNote?: string;
  failNote?: string;
  noGradeNote?: string;
  bodyNote?: string;
  /** Notion's "Alur Pendaftaran": Gantt bars, the stage list, and (via keyDatesOf) the deadline list; est = date is a prediction */
  phases: { l: string; s: string; e: string; t: PhaseType; est?: boolean; group?: string; mode?: string; location?: string; details?: string }[];
  checklist: ChecklistItem[];
  docs: { l: string; m: string; h: string; arsip: boolean }[];
  faq: { q: string; a: string }[];
}
