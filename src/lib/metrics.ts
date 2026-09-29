// Metric definitions as code (brief v0.2 wording, version 1) and their computations.
// Each definition carries the brief's text verbatim, its cadence, minimum n, peer group and
// the "to be confirmed" assumptions as named parameters with their status.

import { DELAY_LABELS, CANCEL_LABELS, SURGEON_CANCELS, SURGEON_DELAYS, department, type Case, type Person } from "./synth";
import type { DisputeField, OverrideMap, RecordType } from "./disputes";
import { type Period } from "./periods";

export type Cadence = "month" | "quarter" | "rolling12" | "fytd" | "survey" | "inbox" | "fy" | "none";
export type PeerRule = "subspecialty_site" | "site" | "subspecialty_system" | "system" | "none";
export type Better = "higher" | "lower" | "none";

export interface Ctx {
  basis: "logged" | "adjudicated";
  ov: OverrideMap;
}

export interface Computed {
  value: number | null;
  den: number;
  num?: number;
  line: string;
  interval?: [number, number];
  extra?: string[];
}

export interface Column {
  key: string;
  label: string;
  numeric?: boolean;
}

export interface RecordRow {
  ref: string;
  type: RecordType;
  date: string;
  cells: Record<string, string>;
  counted: string;
  disputable: DisputeField[];
  sortKey: string;
}

export interface Param {
  name: string;
  value: string;
  status: "assumed" | "confirmed";
  note: string;
}

export interface MetricDef {
  key: string;
  name: string;
  bucket: 1 | 2 | 3 | 4 | 5 | 6;
  what: string;
  counted: string;
  comparedTo: string;
  shownAs?: string;
  movedBy: string;
  source: string;
  cadence: Cadence;
  minN?: number;
  unit: string; // plural noun for min-n sentences
  unitOne: string;
  peer: PeerRule;
  better: Better;
  availability: "live" | "pending_source";
  params?: Param[];
  riskAdjusted?: boolean; // O/E
  unadjusted?: boolean;
  version: string;
  compute?: (id: string, months: Period[], ctx: Ctx) => Computed;
  columns?: Column[];
  records?: (id: string, months: Period[], ctx: Ctx) => RecordRow[];
}

// ---------- indexes ----------

let byPeriodCache: Map<Period, Case[]> | null = null;
function casesIn(months: Period[]): Case[] {
  if (!byPeriodCache) {
    byPeriodCache = new Map();
    for (const c of department().cases) {
      const list = byPeriodCache.get(c.period) ?? [];
      list.push(c);
      byPeriodCache.set(c.period, list);
    }
  }
  return months.flatMap((m) => byPeriodCache!.get(m) ?? []);
}

const adj = (ctx: Ctx, ref: string, f: DisputeField) => (ctx.basis === "adjudicated" ? ctx.ov.get(ref)?.[f] : undefined);

export function primaryOf(c: Case, ctx: Ctx): string {
  return adj(ctx, c.ref, "primary_surgeon") ?? c.primaryId;
}
function credited(id: string, months: Period[], ctx: Ctx): Case[] {
  return casesIn(months).filter((c) => primaryOf(c, ctx) === id);
}
/** Rows the surgeon sees: credited on either basis (a re-credited row stays visible, marked). */
function visibleCases(id: string, months: Period[], ctx: Ctx): Case[] {
  return casesIn(months).filter((c) => c.primaryId === id || primaryOf(c, ctx) === id);
}
function recreditedAway(c: Case, id: string, ctx: Ctx): boolean {
  return c.primaryId === id && primaryOf(c, ctx) !== id;
}
function onTime(c: Case, ctx: Ctx): boolean {
  if (!c.wheelsIn) return false;
  if (adj(ctx, c.ref, "on_time")) return true;
  return c.wheelsIn <= c.scheduledStart; // no grace window (assumption, param grace_minutes = 0)
}
function ownDelay(c: Case, ctx: Ctx): boolean {
  return !!c.delay && SURGEON_DELAYS.includes(c.delay) && !adj(ctx, c.ref, "delay_attribution");
}
function cancelAttributable(c: Case, ctx: Ctx): boolean {
  return !!c.cancelled && SURGEON_CANCELS.includes(c.cancelled) && !adj(ctx, c.ref, "cancel_attribution");
}
function withinTolerance(c: Case): boolean {
  if (c.actualMin === undefined) return false;
  const tol = Math.max(0.2 * c.bookedMin, 30);
  return Math.abs(c.actualMin - c.bookedMin) <= tol;
}
function indexOf(a: { ref: string; indexSurgeonId: string }, ctx: Ctx): string {
  return adj(ctx, a.ref, "index_surgeon") ?? a.indexSurgeonId;
}

// ---------- number formatting ----------

export const pct = (n: number, d: number) => (d === 0 ? 0 : Math.round((100 * n) / d));
const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;
const fix2 = (x: number) => x.toFixed(2);
const median = (xs: number[]) => {
  const s = [...xs].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
};

function wilson(k: number, n: number): [number, number] {
  if (n === 0) return [0, 0];
  const z = 1.96;
  const p = k / n;
  const den = 1 + (z * z) / n;
  const centre = (p + (z * z) / (2 * n)) / den;
  const half = (z * Math.sqrt((p * (1 - p)) / n + (z * z) / (4 * n * n))) / den;
  return [Math.max(0, centre - half), Math.min(1, centre + half)];
}

/** Exact-ish Poisson interval for an observed count (Byar's approximation), divided by expected. */
function poissonOE(o: number, e: number): [number, number] {
  const lo = o === 0 ? 0 : o * Math.pow(1 - 1 / (9 * o) - 1.96 / (3 * Math.sqrt(o)), 3);
  const o1 = o + 1;
  const hi = o1 * Math.pow(1 - 1 / (9 * o1) + 1.96 / (3 * Math.sqrt(o1)), 3);
  return [lo / e, hi / e];
}

// ---------- shared column sets ----------

const CASE_COLS: Column[] = [
  { key: "date", label: "Date" },
  { key: "room", label: "Room" },
  { key: "procedure", label: "Procedure" },
];

function caseCells(c: Case): Record<string, string> {
  return { date: c.date, room: c.room, procedure: c.procedure };
}

// ---------- definitions ----------

const d = () => department();

export const METRICS: MetricDef[] = [
  // Bucket 1: Volume and mix
  {
    key: "or_case_volume", name: "OR case volume", bucket: 1, version: "v1",
    what: "The number of operations where you were the primary surgeon.",
    counted: "Monthly.", comparedTo: "Surgeons in your subspecialty at your site.", shownAs: "A count with a trend line.",
    movedBy: "Block use, converting clinic to OR, scheduling practices.",
    source: "Periop OR log", cadence: "month", unit: "operations", unitOne: "operation",
    peer: "subspecialty_site", better: "none", availability: "live",
    compute: (id, months, ctx) => {
      const n = credited(id, months, ctx).filter((c) => !c.cancelled).length;
      return { value: n, den: n, line: plural(n, "operation", "operations") };
    },
    columns: [...CASE_COLS, { key: "shared", label: "Shared" }],
    records: (id, months, ctx) =>
      visibleCases(id, months, ctx).map((c) => ({
        ref: c.ref, type: "case", date: c.date, sortKey: c.date + c.scheduledStart,
        cells: { ...caseCells(c), shared: c.shared ? "shared" : "" },
        counted: recreditedAway(c, id, ctx) ? "not counted (re-credited)" : c.cancelled ? "not counted (cancelled)" : "counted",
        disputable: c.cancelled ? [] : ["primary_surgeon"],
      })),
  },
  {
    key: "case_mix_index", name: "Case mix index", bucket: 1, version: "v1",
    what: "How complex your inpatient cases are, on average, using Vizient's relative weight for each admission.",
    counted: "Quarterly; needs at least 10 admissions to display.",
    comparedTo: "Surgeons in your subspecialty across the system, and Vizient.",
    shownAs: "Your value against the anonymous peer spread, with trend.",
    movedBy: "Referral development and case selection.",
    source: "Vizient clinical data base, joined to the index operation in the OR log", cadence: "quarter", minN: 10,
    unit: "admissions", unitOne: "admission", peer: "subspecialty_system", better: "none", availability: "live",
    compute: (id, months, ctx) => {
      const adm = d().admissions.filter((a) => months.includes(a.period) && indexOf(a, ctx) === id);
      const v = adm.length ? adm.reduce((s, a) => s + a.relativeWeight, 0) / adm.length : null;
      return {
        value: v === null ? null : Math.round(v * 100) / 100, den: adm.length,
        line: v === null ? "" : `${fix2(v)} (average of ${plural(adm.length, "admission", "admissions")})`,
        extra: ["Vizient comparison: not yet available; the Vizient reference value has not been provided."],
      };
    },
    columns: [{ key: "date", label: "Admitted" }, { key: "procedure", label: "Index operation" }, { key: "rw", label: "Relative weight", numeric: true }],
    records: (id, months, ctx) => admissionRows(id, months, ctx, (a) => ({ rw: fix2(a.relativeWeight) })),
  },
  {
    key: "new_patient_visits", name: "New patient visits", bucket: 1, version: "v1",
    what: "Completed new-patient clinic visits.", counted: "Monthly.", comparedTo: "Subspecialty peers at your site.",
    shownAs: "A count with a trend line.", movedBy: "Clinic template design, access, referral relationships.",
    source: "Clinic scheduling", cadence: "month", unit: "visits", unitOne: "visit", peer: "subspecialty_site",
    better: "none", availability: "live",
    compute: (id, months) => {
      const n = d().visits.filter((v) => v.clinicianId === id && months.includes(v.period) && v.newPatient).length;
      return { value: n, den: n, line: plural(n, "new-patient visit", "new-patient visits") };
    },
    columns: [{ key: "date", label: "Date" }, { key: "kind", label: "Visit type" }],
    records: (id, months) =>
      d().visits.filter((v) => v.clinicianId === id && months.includes(v.period) && v.newPatient).map((v) => ({
        ref: v.ref, type: "case", date: v.date, sortKey: v.date, cells: { date: v.date, kind: "New patient" },
        counted: "counted", disputable: [],
      })),
  },
  {
    key: "work_rvus", name: "Work RVUs — live tracker", bucket: 1, version: "v1",
    what: "Your billed wRVUs, fiscal year to date and by month.",
    counted: "Fiscal year to date and by month.",
    comparedTo: "Yourself last year only. No peer comparison and no target.",
    shownAs: "Year-to-date against the same point last year, plus monthly bars with last year's bars ghosted behind them. The as-of date reflects billing lag.",
    movedBy: "Documentation, coding accuracy, volume.",
    source: "Professional billing", cadence: "fytd", unit: "months", unitOne: "month", peer: "none", better: "none",
    availability: "live",
    params: [{ name: "Fiscal year start", value: "October", status: "assumed", note: "Fiscal year start month to be confirmed by the comp office." }],
  },

  // Bucket 2: Efficiency
  {
    key: "fcot", name: "First-case on-time start (FCOT)", bucket: 2, version: "v1",
    what: "Of your first cases of the day, the share where the patient was wheeled into the room at or before the scheduled start time. No grace window (assumption — to be confirmed against the institutional definition).",
    counted: "Monthly; needs at least 4 first cases.", comparedTo: "Neurosurgeons at your site.",
    movedBy: "Arriving on time; consent, marking, and H&P done before the day.",
    source: "Periop OR log", cadence: "month", minN: 4, unit: "first cases", unitOne: "first case",
    peer: "site", better: "higher", availability: "live",
    params: [{ name: "Grace window", value: "0 minutes", status: "assumed", note: "To be confirmed against the institutional definition." }],
    compute: (id, months, ctx) => {
      const firsts = credited(id, months, ctx).filter((c) => c.firstCase && !c.cancelled && c.wheelsIn);
      const on = firsts.filter((c) => onTime(c, ctx)).length;
      const late = firsts.filter((c) => !onTime(c, ctx));
      const mine = late.filter((c) => ownDelay(c, ctx)).length;
      const notRec = late.filter((c) => c.delay === "not_recorded").length;
      const notMine = late.length - mine - notRec;
      const decomposition =
        late.length === 0
          ? "No late first cases."
          : `Of the ${late.length} late: ${mine} your delay, ${notMine} not your delay${notRec ? `, ${notRec} reason not recorded` : ""} (all ${late.length} counted under the definition).`;
      return {
        value: firsts.length ? pct(on, firsts.length) : null, num: on, den: firsts.length,
        line: `${on} of ${plural(firsts.length, "first case", "first cases")} on time (${pct(on, firsts.length)}%)`,
        extra: [decomposition],
      };
    },
    columns: [...CASE_COLS, { key: "scheduled", label: "Scheduled" }, { key: "wheels", label: "Wheels in" }, { key: "ontime", label: "On time" }, { key: "delay", label: "Delay reason" }],
    records: (id, months, ctx) =>
      visibleCases(id, months, ctx).filter((c) => c.firstCase && !c.cancelled).map((c) => ({
        ref: c.ref, type: "case", date: c.date, sortKey: c.date,
        cells: {
          ...caseCells(c), scheduled: c.scheduledStart, wheels: c.wheelsIn ?? "",
          ontime: onTime(c, ctx) ? "yes" : "no",
          delay: c.delay ? `${DELAY_LABELS[c.delay]}${SURGEON_DELAYS.includes(c.delay) ? ownDelay(c, ctx) ? " (your delay)" : " (not your delay, as adjudicated)" : c.delay === "not_recorded" ? "" : " (not your delay)"}` : "",
        },
        counted: recreditedAway(c, id, ctx) ? "not counted (re-credited)" : "counted",
        disputable: onTime(c, ctx) ? ["primary_surgeon"] : ["delay_attribution", "on_time", "primary_surgeon"],
      })),
  },
  {
    key: "duration_accuracy", name: "Duration estimate accuracy", bucket: 2, version: "v1",
    what: "The share of your cases where actual in-room time was within 20% of what was booked (or within 30 minutes, whichever is more forgiving).",
    counted: "Monthly; needs at least 5 cases.", comparedTo: "Subspecialty peers at your site.",
    movedBy: "Booking realistic times and updating your default durations.",
    source: "Periop OR log", cadence: "month", minN: 5, unit: "cases", unitOne: "case", peer: "subspecialty_site",
    better: "higher", availability: "live",
    compute: (id, months, ctx) => {
      const cs = credited(id, months, ctx).filter((c) => !c.cancelled);
      const k = cs.filter(withinTolerance).length;
      return {
        value: cs.length ? pct(k, cs.length) : null, num: k, den: cs.length,
        line: `${k} of ${plural(cs.length, "case", "cases")} within the booked time (${pct(k, cs.length)}%)`,
      };
    },
    columns: [...CASE_COLS, { key: "booked", label: "Booked min", numeric: true }, { key: "actual", label: "Actual min", numeric: true }, { key: "within", label: "Within tolerance" }],
    records: (id, months, ctx) =>
      visibleCases(id, months, ctx).filter((c) => !c.cancelled).map((c) => ({
        ref: c.ref, type: "case", date: c.date, sortKey: c.date + c.scheduledStart,
        cells: { ...caseCells(c), booked: String(c.bookedMin), actual: String(c.actualMin ?? ""), within: withinTolerance(c) ? "yes" : "no" },
        counted: recreditedAway(c, id, ctx) ? "not counted (re-credited)" : "counted",
        disputable: ["primary_surgeon"],
      })),
  },
  {
    key: "block_utilization", name: "Block utilization (only if you have allocated block)", bucket: 2, version: "v1",
    what: "Minutes you used in your own block as a share of minutes allocated, after removing any block you released.",
    counted: "Monthly.", comparedTo: "Neurosurgeons at your site.", movedBy: "Filling the block or releasing it early.",
    source: "Block allocation and release schedule", cadence: "month", unit: "block days", unitOne: "block day",
    peer: "site", better: "higher", availability: "live",
    compute: (id, months) => {
      const bs = d().blocks.filter((b) => b.clinicianId === id && months.includes(b.period));
      const avail = bs.reduce((s, b) => s + b.allocatedMin - b.releasedMin, 0);
      const used = bs.reduce((s, b) => s + b.usedMin, 0);
      return {
        value: avail ? pct(used, avail) : null, num: used, den: bs.length,
        line: `${used.toLocaleString("en-US")} of ${avail.toLocaleString("en-US")} minutes used (${pct(used, avail)}%)`,
      };
    },
    columns: [{ key: "date", label: "Block day" }, { key: "alloc", label: "Allocated min", numeric: true }, { key: "released", label: "Released min", numeric: true }, { key: "used", label: "Used min", numeric: true }],
    records: (id, months) =>
      d().blocks.filter((b) => b.clinicianId === id && months.includes(b.period)).map((b) => ({
        ref: b.ref, type: "case", date: b.date, sortKey: b.date,
        cells: { date: b.date, alloc: String(b.allocatedMin), released: String(b.releasedMin), used: String(b.usedMin) },
        counted: b.releasedMin === b.allocatedMin ? "released in full" : "counted", disputable: [],
      })),
  },
  {
    key: "same_day_cancel", name: "Same-day cancellations you could have prevented", bucket: 2, version: "v1",
    what: "Same-day cancellations whose reason code is in the surgeon-attributable set, as a share of your scheduled cases. Cancellations for reasons outside your control are not counted against you.",
    counted: "Quarterly; needs at least 10 cases.", comparedTo: "Neurosurgeons at your site.",
    movedBy: "Pre-op readiness and clearance workflow.",
    source: "Periop OR log cancellation reason codes", cadence: "quarter", minN: 10, unit: "scheduled cases", unitOne: "scheduled case",
    peer: "site", better: "lower", availability: "live",
    params: [{ name: "Surgeon-attributable set", value: "Pre-op clearance incomplete; Surgeon unavailable; Consent not obtained", status: "assumed", note: "Set to be signed by periop leadership." }],
    compute: (id, months, ctx) => {
      const cs = credited(id, months, ctx);
      const cancelled = cs.filter((c) => c.cancelled);
      const k = cancelled.filter((c) => cancelAttributable(c, ctx)).length;
      return {
        value: cs.length ? pct(k, cs.length) : null, num: k, den: cs.length,
        line: `${k} of ${plural(cs.length, "scheduled case", "scheduled cases")} (${pct(k, cs.length)}%)`,
        extra: [`${plural(cancelled.length, "same-day cancellation", "same-day cancellations")}; ${k} in the surgeon-attributable set.`],
      };
    },
    columns: [...CASE_COLS, { key: "reason", label: "Cancellation reason" }],
    records: (id, months, ctx) =>
      visibleCases(id, months, ctx).filter((c) => c.cancelled).map((c) => ({
        ref: c.ref, type: "case", date: c.date, sortKey: c.date,
        cells: { ...caseCells(c), reason: `${CANCEL_LABELS[c.cancelled!]}${cancelAttributable(c, ctx) ? " (surgeon-attributable)" : SURGEON_CANCELS.includes(c.cancelled!) ? " (not attributable, as adjudicated)" : ""}` },
        counted: recreditedAway(c, id, ctx) ? "not counted (re-credited)" : cancelAttributable(c, ctx) ? "counted against you" : "not counted (outside your control)",
        disputable: cancelAttributable(c, ctx) ? ["cancel_attribution", "primary_surgeon"] : ["primary_surgeon"],
      })),
  },
  {
    key: "notes_72h", name: "Clinic notes closed within 72 hours", bucket: 2, version: "v1",
    what: "The share of your clinic visits with the note signed within 72 hours.",
    counted: "Monthly; needs at least 10 visits.", comparedTo: "Neurosurgeons at your site.", movedBy: "Closing notes the same day.",
    source: "Clinic system note timestamps", cadence: "month", minN: 10, unit: "visits", unitOne: "visit", peer: "site",
    better: "higher", availability: "live",
    compute: (id, months) => {
      const vs = d().visits.filter((v) => v.clinicianId === id && months.includes(v.period));
      const k = vs.filter((v) => v.noteSignedHours <= 72).length;
      return { value: vs.length ? pct(k, vs.length) : null, num: k, den: vs.length, line: `${k} of ${plural(vs.length, "visit", "visits")} signed within 72 hours (${pct(k, vs.length)}%)` };
    },
    columns: [{ key: "date", label: "Visit date" }, { key: "hours", label: "Hours to signature", numeric: true }, { key: "within", label: "Within 72 hours" }],
    records: (id, months) =>
      d().visits.filter((v) => v.clinicianId === id && months.includes(v.period)).map((v) => ({
        ref: v.ref, type: "case", date: v.date, sortKey: v.date,
        cells: { date: v.date, hours: String(v.noteSignedHours), within: v.noteSignedHours <= 72 ? "yes" : "no" },
        counted: "counted", disputable: [],
      })),
  },

  // Bucket 3: Access
  {
    key: "third_next", name: "Third-next-available appointment", bucket: 3, version: "v1",
    what: "The number of days until your third next open new-patient slot, sampled regularly and reported as the median. (Third, not first, because the first open slot is usually a cancellation.)",
    counted: "Monthly; needs at least 2 samples.", comparedTo: "Subspecialty peers at your site. Lower is better.",
    movedBy: "Template capacity, hold slots, waitlist management.",
    source: "Clinic scheduling, weekly sample", cadence: "month", minN: 2, unit: "samples", unitOne: "sample",
    peer: "subspecialty_site", better: "lower", availability: "live",
    compute: (id, months) => {
      const ss = d().samples.filter((s) => s.clinicianId === id && months.includes(s.period));
      const m = ss.length ? median(ss.map((s) => s.days)) : null;
      return { value: m, den: ss.length, line: m === null ? "" : `${m} days (median of ${plural(ss.length, "sample", "samples")})` };
    },
    columns: [{ key: "date", label: "Sampled" }, { key: "days", label: "Days to third-next slot", numeric: true }],
    records: (id, months) =>
      d().samples.filter((s) => s.clinicianId === id && months.includes(s.period)).map((s) => ({
        ref: s.ref, type: "case", date: s.date, sortKey: s.date, cells: { date: s.date, days: String(s.days) }, counted: "counted", disputable: [],
      })),
  },
  {
    key: "referral_to_visit", name: "Referral-to-visit days (pending confirmation of data source)", bucket: 3, version: "v1",
    what: "Median days from when a referral is received to when the patient is seen.",
    counted: "Quarterly; needs at least 10 visits.", comparedTo: "Subspecialty peers at your site. Lower is better.",
    movedBy: "Triage speed and overbook policy.", source: "Referral work queue (pending confirmation)",
    cadence: "quarter", minN: 10, unit: "visits", unitOne: "visit", peer: "subspecialty_site", better: "lower", availability: "pending_source",
  },

  // Bucket 4: Quality and outcomes
  {
    key: "los_oe", name: "Length of stay (O/E)", bucket: 4, version: "v1", riskAdjusted: true,
    what: "Total days your surgical patients stayed, divided by the total days Vizient expected given their diagnoses and risk. Patients who became \"super-long boarders\" are left out (assumed to mean more than 30 days until the institutional definition is confirmed); the screen shows how many were excluded.",
    counted: "Quarterly; needs at least 10 admissions.", comparedTo: "Subspecialty peers across the system, and Vizient.",
    movedBy: "Pathway adherence, early discharge planning, timely PT/OT orders.",
    source: "Vizient clinical data base; OR log for the index operation", cadence: "quarter", minN: 10, unit: "admissions", unitOne: "admission",
    peer: "subspecialty_system", better: "lower", availability: "live",
    params: [{ name: "Super-long boarder threshold", value: "more than 30 days", status: "assumed", note: "Until the institutional definition is confirmed." }],
    compute: (id, months, ctx) => {
      const all = d().admissions.filter((a) => months.includes(a.period) && indexOf(a, ctx) === id);
      const kept = all.filter((a) => a.losDays <= 30);
      const excluded = all.length - kept.length;
      const o = kept.reduce((s, a) => s + a.losDays, 0);
      const e = kept.reduce((s, a) => s + a.expectedLos, 0);
      const ratios = kept.map((a) => a.losDays / a.expectedLos);
      const mean = ratios.reduce((s, x) => s + x, 0) / Math.max(1, ratios.length);
      const sd = Math.sqrt(ratios.reduce((s, x) => s + (x - mean) ** 2, 0) / Math.max(1, ratios.length - 1));
      const v = e ? o / e : null;
      const se = kept.length ? sd / mean / Math.sqrt(kept.length) : 0;
      const interval: [number, number] | undefined = v ? [v * Math.exp(-1.96 * se), v * Math.exp(1.96 * se)] : undefined;
      return {
        value: v === null ? null : Math.round(v * 100) / 100, den: kept.length, interval,
        line: v === null ? "" : `${fix2(v)} (95% interval ${fix2(interval![0])} to ${fix2(interval![1])}): ${o} observed days, ${e.toFixed(1)} expected`,
        extra: [`${plural(excluded, "super-long boarder", "super-long boarders")} excluded (stays over 30 days).`],
      };
    },
    columns: [{ key: "date", label: "Admitted" }, { key: "procedure", label: "Index operation" }, { key: "los", label: "Days", numeric: true }, { key: "exp", label: "Expected", numeric: true }, { key: "discharging", label: "Discharging surgeon" }],
    records: (id, months, ctx) => admissionRows(id, months, ctx, (a) => ({ los: String(a.losDays), exp: a.expectedLos.toFixed(1) }), (a) => (a.losDays > 30 ? "excluded (super-long boarder)" : null)),
  },
  {
    key: "readmit_oe", name: "30-day readmission (O/E)", bucket: 4, version: "v1", riskAdjusted: true,
    what: "Readmissions within 30 days to any MGB hospital, any service, divided by Vizient's expected number.",
    counted: "Quarterly; needs at least 10 admissions.", comparedTo: "Subspecialty peers across the system, and Vizient.",
    movedBy: "Discharge instructions, early follow-up, wound-care teaching.",
    source: "Vizient clinical data base", cadence: "quarter", minN: 10, unit: "admissions", unitOne: "admission",
    peer: "subspecialty_system", better: "lower", availability: "live",
    compute: (id, months, ctx) => oeCount(id, months, ctx, (a) => a.readmit30, (a) => a.expectedReadmit, "readmissions"),
    columns: [{ key: "date", label: "Admitted" }, { key: "procedure", label: "Index operation" }, { key: "event", label: "Readmitted within 30 days" }, { key: "discharging", label: "Discharging surgeon" }],
    records: (id, months, ctx) => admissionRows(id, months, ctx, (a) => ({ event: a.readmit30 ? "yes" : "no" })),
  },
  {
    key: "mortality_oe", name: "In-hospital mortality (O/E)", bucket: 4, version: "v1", riskAdjusted: true,
    what: "Deaths during the surgical admission divided by Vizient's expected number.",
    counted: "Rolling 12 months only, because counts are small; needs at least 30 admissions.",
    comparedTo: "Neurosurgeons across the system, and Vizient.", movedBy: "Case selection and rescue.",
    source: "Vizient clinical data base; department QI database", cadence: "rolling12", minN: 30, unit: "admissions", unitOne: "admission",
    peer: "system", better: "lower", availability: "live",
    compute: (id, months, ctx) => oeCount(id, months, ctx, (a) => a.died, (a) => a.expectedDeath, "deaths"),
    columns: [{ key: "date", label: "Admitted" }, { key: "procedure", label: "Index operation" }, { key: "event", label: "Died in hospital" }, { key: "discharging", label: "Discharging surgeon" }],
    records: (id, months, ctx) => admissionRows(id, months, ctx, (a) => ({ event: a.died ? "yes" : "no" })),
  },
  qiRate("return_or", "Unplanned return to the OR within 30 days",
    "The share of your cases that needed an unplanned reoperation within 30 days, by any surgeon, as recorded in the QI database.",
    "Quarterly; needs at least 10 cases.", "Subspecialty peers across the system. Lower is better.",
    "Technique, hemostasis, closure, patient selection.", 10, "subspecialty_system", (c) => c.returnOr, () => true, "Unplanned return"),
  qiRate("ssi", "Surgical site infection",
    "Infections within 30 days (90 days with an implant), per the QI database, as a share of your cases.",
    "Quarterly; needs at least 20 cases.", "Neurosurgeons across the system. Lower is better.",
    "Prep, antibiotic timing, closure, wound care.", 20, "system", (c) => c.ssi, () => true, "Infection (30 days; 90 with implant)"),
  qiRate("vte", "VTE within 30 days",
    "DVT or PE within 30 days of surgery, per the QI database, as a share of your cases.",
    "Quarterly; needs at least 20 cases.", "Neurosurgeons across the system. Lower is better.",
    "Prophylaxis ordering and early mobilization.", 20, "system", (c) => c.vte, () => true, "DVT or PE"),
  qiRate("csf_leak", "CSF leak requiring intervention (neurosurgery only)",
    "Cranial or spinal cases with a CSF leak that needed reoperation, a lumbar drain, or readmission within 30 days, per the QI database, as a share of eligible cases.",
    "Quarterly; needs at least 10 cases.", "Subspecialty peers across the system. Lower is better.",
    "Closure technique.", 10, "subspecialty_system", (c) => c.csfLeak, (c) => c.category !== "other", "CSF leak with intervention"),
  {
    key: "icu_return", name: "Unplanned return to ICU (pending confirmation of data source)", bucket: 4, version: "v1", unadjusted: true,
    what: "The share of your ICU patients who were transferred back to the ICU unexpectedly after stepping down.",
    counted: "Quarterly; needs at least 10 admissions.", comparedTo: "Neurosurgeons across the system. Lower is better.",
    movedBy: "Step-down criteria and handoff quality.", source: "ADT unit transfers (pending confirmation)",
    cadence: "quarter", minN: 10, unit: "admissions", unitOne: "admission", peer: "system", better: "lower", availability: "pending_source",
  },

  // Bucket 5: Patient experience
  surveyMetric("nps", "Net promoter score", "On the \"would you recommend this provider\" question, the percentage of promoters minus the percentage of detractors.", "Communication, expectation setting, follow-through."),
  surveyMetric("explained", "\"Provider explained things in a way I could understand\"", "The share of responses giving the top score.", "Plain-language explanations and teach-back."),
  surveyMetric("listened", "\"Provider listened carefully\"", "The share of responses giving the top score.", "Sitting down, not interrupting, confirming concerns."),
  surveyMetric("respect", "\"Provider showed respect\"", "The share of responses giving the top score.", "Courtesy, introductions, acknowledging family."),
  {
    key: "feedback_inbox", name: "Patient feedback inbox", bucket: 5, version: "v1",
    what: "Every de-identified free-text comment about you, newest first, with the scores from the same survey, in one place.",
    counted: "As comments arrive.", comparedTo: "Nothing. Comments are never counted, compared, or rolled up into anything.",
    movedBy: "Read, reflect, and add private notes.", source: "MGB patient survey", cadence: "inbox", unit: "comments", unitOne: "comment",
    peer: "none", better: "none", availability: "live",
  },

  // Bucket 6: Citizenship
  {
    key: "mm_attendance", name: "M&M attendance", bucket: 6, version: "v1",
    what: "Sessions attended out of sessions held while you were on faculty and not on approved leave, logged by the new attendance system (QR-code scan).",
    counted: "Per fiscal year. Target: 8 of 12 per fiscal year, per the comp plan.",
    comparedTo: "The comp plan target only. No peer comparison.",
    shownAs: "Attended so far, sessions remaining, on pace or off pace, and a clear flag when 8 can no longer be reached this year.",
    movedBy: "Attending.", source: "QR-code attendance system; HR leave", cadence: "fy", unit: "sessions", unitOne: "session",
    peer: "none", better: "none", availability: "live",
    params: [{ name: "Leave scaling", value: "Target scales down in proportion to sessions removed by approved leave, rounded up", status: "assumed", note: "To be confirmed." }],
  },
];

// ---------- helpers used by the definitions ----------

function admissionRows(
  id: string,
  months: Period[],
  ctx: Ctx,
  cells: (a: (ReturnType<typeof department>)["admissions"][number]) => Record<string, string>,
  excluded?: (a: (ReturnType<typeof department>)["admissions"][number]) => string | null,
): RecordRow[] {
  const people = department().people;
  const nm = (pid: string) => people.find((p) => p.id === pid)?.name ?? "";
  return department()
    .admissions.filter((a) => months.includes(a.period) && (a.indexSurgeonId === id || indexOf(a, ctx) === id))
    .map((a) => {
      const c = department().cases.find((x) => x.ref === a.caseRef)!;
      const away = a.indexSurgeonId === id && indexOf(a, ctx) !== id;
      return {
        ref: a.ref, type: "admission" as const, date: a.admitDate, sortKey: a.admitDate,
        cells: { date: a.admitDate, procedure: c.procedure, discharging: a.dischargingId === id ? "you" : nm(a.dischargingId), ...cells(a) },
        counted: away ? "not counted (re-credited)" : excluded?.(a) ?? "counted",
        disputable: ["index_surgeon"] as DisputeField[],
      };
    });
}

function oeCount(
  id: string,
  months: Period[],
  ctx: Ctx,
  event: (a: (ReturnType<typeof department>)["admissions"][number]) => boolean,
  expected: (a: (ReturnType<typeof department>)["admissions"][number]) => number,
  noun: string,
): Computed {
  const adm = department().admissions.filter((a) => months.includes(a.period) && indexOf(a, ctx) === id);
  const o = adm.filter(event).length;
  const e = adm.reduce((s, a) => s + expected(a), 0);
  if (!adm.length || e === 0) return { value: null, den: adm.length, line: "" };
  const v = o / e;
  const iv = poissonOE(o, e);
  return {
    value: Math.round(v * 100) / 100, den: adm.length, num: o, interval: iv,
    line: `${fix2(v)} (95% interval ${fix2(iv[0])} to ${fix2(iv[1])}): ${o} observed ${noun}, ${e.toFixed(1)} expected, ${plural(adm.length, "admission", "admissions")}`,
  };
}

function qiRate(
  key: string, name: string, what: string, counted: string, comparedTo: string, movedBy: string,
  minN: number, peer: PeerRule, event: (c: Case) => boolean, eligible: (c: Case) => boolean, eventLabel: string,
): MetricDef {
  return {
    key, name, bucket: 4, version: "v1", what, counted, comparedTo, movedBy, unadjusted: true,
    source: "Department QI database (never entered by hand)", cadence: "quarter", minN, unit: "cases", unitOne: "case",
    peer, better: "lower", availability: "live",
    compute: (id, months, ctx) => {
      const cs = credited(id, months, ctx).filter((c) => !c.cancelled && eligible(c));
      const k = cs.filter(event).length;
      const iv = wilson(k, cs.length);
      return {
        value: cs.length ? Math.round((1000 * k) / cs.length) / 10 : null, num: k, den: cs.length,
        interval: [iv[0] * 100, iv[1] * 100],
        line: `${k} of ${plural(cs.length, "case", "cases")} (${cs.length ? ((100 * k) / cs.length).toFixed(1) : "0"}%; 95% interval ${(iv[0] * 100).toFixed(1)}% to ${(iv[1] * 100).toFixed(1)}%), unadjusted`,
      };
    },
    columns: [...CASE_COLS, { key: "event", label: eventLabel }],
    records: (id, months, ctx) =>
      visibleCases(id, months, ctx).filter((c) => !c.cancelled && eligible(c)).map((c) => ({
        ref: c.ref, type: "case" as const, date: c.date, sortKey: c.date,
        cells: { ...caseCells(c), event: event(c) ? "yes" : "no" },
        counted: recreditedAway(c, id, ctx) ? "not counted (re-credited)" : "counted",
        disputable: ["primary_surgeon"] as DisputeField[],
      })),
  };
}

export const MGB_AVERAGE: Record<string, number> = { nps: 79, explained: 84, listened: 86, respect: 89 };

function surveyMetric(key: string, name: string, what: string, movedBy: string): MetricDef {
  return {
    key, name, bucket: 5, version: "v1", what, movedBy,
    counted: "By survey month; a month with fewer than 10 responses is hidden for that month only.",
    comparedTo: "Neurosurgeons across the system, and the MGB average.",
    shownAs: "Your year average, each of the past three months separately, and the MGB average, plus the anonymous bar chart of everyone in your peer group with your own bar highlighted.",
    source: "MGB patient survey", cadence: "survey", minN: 10, unit: "responses", unitOne: "response",
    peer: "system", better: "higher", availability: "live",
    compute: (id, months, ctx) => {
      const rs = department().surveys.filter(
        (s) => s.clinicianId === id && months.includes(s.period) && !(ctx.basis === "adjudicated" && ctx.ov.get(s.ref)?.provider_named),
      );
      return { ...surveyValue(key, rs), den: rs.length };
    },
    columns: [{ key: "month", label: "Survey month" }, { key: "returned", label: "Returned" }, { key: "score", label: "Score" }],
    records: (id, months, ctx) =>
      department().surveys.filter((s) => s.clinicianId === id && months.includes(s.period)).map((s) => ({
        ref: s.ref, type: "survey" as const, date: s.returnedOn, sortKey: s.returnedOn,
        cells: { month: s.period, returned: s.returnedOn, score: key === "nps" ? `${s.recommend} of 10` : `${(s as unknown as Record<string, number>)[key]} of 5` },
        counted: ctx.ov.get(s.ref)?.provider_named ? "not counted (not your patient, as adjudicated)" : "counted",
        disputable: ["provider_named"] as DisputeField[],
      })),
  };
}

export function surveyValue(key: string, rs: { recommend: number; explained: number; listened: number; respect: number }[]): { value: number | null; line: string } {
  if (!rs.length) return { value: null, line: "" };
  if (key === "nps") {
    const pro = rs.filter((r) => r.recommend >= 9).length;
    const det = rs.filter((r) => r.recommend <= 6).length;
    const v = Math.round((100 * (pro - det)) / rs.length);
    return { value: v, line: `${v} (${pct(pro, rs.length)}% promoters, ${pct(det, rs.length)}% detractors, ${rs.length} responses)` };
  }
  const k = rs.filter((r) => (r as unknown as Record<string, number>)[key] === 5).length;
  return { value: pct(k, rs.length), line: `${k} of ${rs.length} responses gave the top score (${pct(k, rs.length)}%)` };
}

export function metric(key: string): MetricDef | undefined {
  return METRICS.find((m) => m.key === key);
}

export const BUCKETS: Record<number, { name: string; intro: string }> = {
  1: { name: "Volume and mix", intro: "How much you do and what kind." },
  2: { name: "Efficiency", intro: "How smoothly your OR and clinic days run." },
  3: { name: "Access", intro: "How quickly new patients can get to you." },
  4: { name: "Quality and outcomes", intro: "How your patients do. Where Vizient has a risk model the metric is observed divided by expected (O/E): 1.0 means exactly as expected; below 1.0 is better. Where there is no risk model the number is labeled \"unadjusted.\"" },
  5: { name: "Patient experience", intro: "What your patients say, from the MGB patient survey." },
  6: { name: "Citizenship", intro: "Objectively logged obligations tied to the compensation plan." },
};

export const DIVISION_ONLY = ["OR turnover time", "PACU boarding", "Room-ready delays"];

export type { Person };
