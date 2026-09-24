export const MO = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];

export const P = (iso: string) => new Date(iso + 'T00:00:00');

export const startOfToday = () => {
  const t = new Date();
  t.setHours(0, 0, 0, 0);
  return t;
};

export const fmt = (d: Date, y?: boolean) => d.getDate() + ' ' + MO[d.getMonth()] + (y ? ' ' + d.getFullYear() : '');

/**
 * A checklist item's deadline pill: one consistent "D Mon YYYY" format, "±" prefixed when `est` (inferred,
 * not confirmed). Blank until the admin actually picks a date — a new item has none yet.
 */
export const dlLabel = (dl: string, est?: boolean) => (dl ? (est ? '±' : '') + fmt(P(dl), true) : '');

export const fmtR = (a: string, b: string) => {
  const A = P(a), B = P(b);
  if (a === b) return fmt(A, true);
  if (A.getMonth() === B.getMonth() && A.getFullYear() === B.getFullYear()) return A.getDate() + '–' + fmt(B, true);
  return fmt(A, A.getFullYear() !== B.getFullYear()) + ' – ' + fmt(B, true);
};

// Gantt range: Sep 2026 – Apr 2027
export const R0 = P('2026-09-01');
export const R1 = P('2027-05-01');
export const SPAN = R1.valueOf() - R0.valueOf();
export const pct = (d: string) => Math.min(100, Math.max(0, ((P(d).valueOf() - R0.valueOf()) / SPAN) * 100));
