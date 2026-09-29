// Period arithmetic. A period is a calendar month "YYYY-MM".
// Fiscal year starts in October (assumption pending OQ-59); FY2026 = Oct 2025 to Sep 2026.

export type Period = string; // "2026-08"

export const DATA_START: Period = "2024-10"; // synthetic history begins (prior fiscal year for wRVU)
export const FIRST_PUBLISHED: Period = "2025-10"; // month one of the scorecard
export const LATEST_PUBLISHED: Period = "2026-08"; // most recent closed and published month
export const FY_START_MONTH = 10;

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];
const MON = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export function parse(p: Period): { y: number; m: number } {
  const [y, m] = p.split("-").map(Number);
  return { y, m };
}

export function fmt(y: number, m: number): Period {
  return `${y}-${String(m).padStart(2, "0")}`;
}

export function addMonths(p: Period, n: number): Period {
  const { y, m } = parse(p);
  const idx = y * 12 + (m - 1) + n;
  return fmt(Math.floor(idx / 12), (idx % 12) + 1);
}

export function cmp(a: Period, b: Period): number {
  return a < b ? -1 : a > b ? 1 : 0;
}

export function range(from: Period, to: Period): Period[] {
  const out: Period[] = [];
  for (let p = from; cmp(p, to) <= 0; p = addMonths(p, 1)) out.push(p);
  return out;
}

export function monthName(p: Period): string {
  const { y, m } = parse(p);
  return `${MONTHS[m - 1]} ${y}`;
}

export function monthOnly(p: Period): string {
  return MONTHS[parse(p).m - 1];
}

export function shortMonth(p: Period): string {
  const { y, m } = parse(p);
  return `${MON[m - 1]} ${String(y).slice(2)}`;
}

export function publishedPeriods(): Period[] {
  return range(FIRST_PUBLISHED, LATEST_PUBLISHED);
}

export function isPublished(p: Period): boolean {
  return cmp(p, FIRST_PUBLISHED) >= 0 && cmp(p, LATEST_PUBLISHED) <= 0;
}

export function normalizePeriod(input: string | undefined | null): Period {
  if (input && /^\d{4}-\d{2}$/.test(input) && isPublished(input)) return input;
  return LATEST_PUBLISHED;
}

/** Publish date for a period: the 10th of the following month. */
export function publishDate(p: Period): string {
  const next = addMonths(p, 1);
  return `${next}-10`;
}

export function fiscalYear(p: Period): number {
  const { y, m } = parse(p);
  return m >= FY_START_MONTH ? y + 1 : y;
}

export function fyStart(p: Period): Period {
  return fmt(fiscalYear(p) - 1, FY_START_MONTH);
}

export function fyEnd(p: Period): Period {
  return fmt(fiscalYear(p), FY_START_MONTH - 1);
}

export function isQuarterEnd(p: Period): boolean {
  return parse(p).m % 3 === 0;
}

/** Most recent calendar-quarter-end month at or before p. */
export function lastQuarterEnd(p: Period): Period {
  let q = p;
  while (!isQuarterEnd(q)) q = addMonths(q, -1);
  return q;
}

export function quarterMonths(qEnd: Period): Period[] {
  return range(addMonths(qEnd, -2), qEnd);
}

export function quarterLabel(qEnd: Period): string {
  const start = addMonths(qEnd, -2);
  return `${monthOnly(start)} to ${monthName(qEnd)}`;
}

export function lastDayOfMonth(p: Period): string {
  const { y, m } = parse(p);
  const d = new Date(Date.UTC(y, m, 0)).getUTCDate();
  return `${p}-${String(d).padStart(2, "0")}`;
}

/** "12 September 2026" from "2026-09-12". */
export function longDate(iso: string): string {
  const [y, m, d] = iso.slice(0, 10).split("-").map(Number);
  return `${d} ${MONTHS[m - 1]} ${y}`;
}

/** "12 Sep 2026" from an ISO date. */
export function shortDate(iso: string): string {
  const [y, m, d] = iso.slice(0, 10).split("-").map(Number);
  return `${d} ${MON[m - 1]} ${y}`;
}

export function addDays(iso: string, n: number): string {
  const d = new Date(`${iso.slice(0, 10)}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

export function daysBetween(a: string, b: string): number {
  const da = Date.parse(`${a.slice(0, 10)}T00:00:00Z`);
  const db = Date.parse(`${b.slice(0, 10)}T00:00:00Z`);
  return Math.round((db - da) / 86400000);
}

export function periodOf(iso: string): Period {
  return iso.slice(0, 7);
}
