// Department and site views for the chair and the division chief. Everything here is
// pooled across clinicians: no individual is named, ranked, or shown with a score.
// OR turnover time, PACU boarding and room-ready delays live only here (brief:
// "A surgeon cannot move these alone, so they appear only on division and site views").

import { department, rng, type Site } from "./synth";
import { metric, surveyValue, MGB_AVERAGE } from "./metrics";
import { mmView, windowFor } from "./engine";
import { addMonths, cmp, fyStart, lastQuarterEnd, publishedPeriods, quarterLabel, quarterMonths, range, shortMonth, type Period } from "./periods";

const NONE = new Map();
const LOGGED = { basis: "logged" as const, ov: NONE };
export const SITES: Site[] = ["Main campus", "Harbor campus"];

const median = (xs: number[]) => {
  if (!xs.length) return null;
  const s = [...xs].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
};

function people(site?: Site) {
  const d = department();
  return {
    surgeons: d.surgeons.filter((s) => !site || s.site === site),
    clinicians: d.clinicians.filter((s) => !site || s.site === site),
  };
}

/** Pool a rate metric (numerator over denominator) across clinicians. */
function pooled(key: string, months: Period[], site?: Site, all = false) {
  const def = metric(key)!;
  const { surgeons, clinicians } = people(site);
  let num = 0;
  let den = 0;
  for (const s of all ? clinicians : surgeons) {
    const c = def.compute!(s.id, months, LOGGED);
    num += c.num ?? 0;
    den += c.den;
  }
  return { num, den, value: den ? Math.round((100 * num) / den) : null };
}

function total(key: string, months: Period[], site?: Site, all = false) {
  const def = metric(key)!;
  const { surgeons, clinicians } = people(site);
  return (all ? clinicians : surgeons).reduce((sum, s) => sum + (def.compute!(s.id, months, LOGGED).value ?? 0), 0);
}

function thirdNext(months: Period[], site?: Site) {
  const ids = new Set(people(site).clinicians.map((c) => c.id));
  return median(department().samples.filter((x) => ids.has(x.clinicianId) && months.includes(x.period)).map((x) => x.days));
}

// ---------- division and site measures (synthetic, deterministic) ----------

export interface SiteOps { turnover: number; pacuBoarding: number; roomReady: number; roomReadyOf: number }

export function siteOps(site: Site, p: Period): SiteOps {
  const r = rng(`ops:${site}:${p}`);
  const base = site === "Main campus" ? { t: 39, b: 13 } : { t: 33, b: 8 };
  const firsts = department().cases.filter((c) => c.site === site && c.period === p && c.firstCase && !c.cancelled);
  return {
    turnover: Math.round(r.normal(base.t, 3)),
    pacuBoarding: Math.max(2, Math.round(r.normal(base.b, 2.5))),
    roomReady: firsts.filter((c) => c.delay === "room_not_ready").length,
    roomReadyOf: firsts.length,
  };
}

// ---------- the overview ----------

export interface Kpi {
  key: string;
  label: string;
  value: string;
  sub: string;
  spark: (number | null)[];
  delta?: string;
  reference?: string;
  href?: string;
}

export function departmentKpis(p: Period): Kpi[] {
  const months = publishedPeriods().filter((x) => cmp(x, p) <= 0).slice(-12);
  const prev = addMonths(p, -1);
  const hasPrev = months.includes(prev);
  const d = department();

  const fcot = pooled("fcot", [p]);
  const fcotPrev = hasPrev ? pooled("fcot", [prev]).value : null;
  const dur = pooled("duration_accuracy", [p]);
  const notes = pooled("notes_72h", [p], undefined, true);
  const vol = total("or_case_volume", [p]);
  const volPrev = hasPrev ? total("or_case_volume", [prev]) : null;
  const npv = total("new_patient_visits", [p], undefined, true);
  const tna = thirdNext([p]);
  const fy = range(fyStart(p), p);
  const allIds = new Set(d.clinicians.map((c) => c.id));
  const nps = surveyValue("nps", d.surveys.filter((s) => allIds.has(s.clinicianId) && fy.includes(s.period)));
  const pp = (n: number | null, m: number | null, unit = "") => (n === null || m === null ? undefined : `${n - m >= 0 ? "+" : ""}${n - m}${unit} vs ${shortMonth(prev)}`);

  return [
    { key: "or_case_volume", label: "OR cases", value: vol.toLocaleString("en-US"), sub: `${d.surgeons.length} surgeons, primary surgeon in the OR log`, spark: months.map((m) => total("or_case_volume", [m])), delta: pp(vol, volPrev) },
    { key: "fcot", label: "First-case on-time start", value: `${fcot.value}%`, sub: `${fcot.num} of ${fcot.den} first cases on time, no grace window`, spark: months.map((m) => pooled("fcot", [m]).value), delta: pp(fcot.value, fcotPrev, " pts") },
    { key: "duration_accuracy", label: "Duration estimate accuracy", value: `${dur.value}%`, sub: `${dur.num} of ${dur.den} cases within the booked time`, spark: months.map((m) => pooled("duration_accuracy", [m]).value) },
    { key: "notes_72h", label: "Clinic notes closed in 72 hours", value: `${notes.value}%`, sub: `${notes.num.toLocaleString("en-US")} of ${notes.den.toLocaleString("en-US")} visits, all clinicians`, spark: months.map((m) => pooled("notes_72h", [m], undefined, true).value) },
    { key: "new_patient_visits", label: "New patient visits", value: npv.toLocaleString("en-US"), sub: `${d.clinicians.length} clinicians, surgeons and advanced practice providers`, spark: months.map((m) => total("new_patient_visits", [m], undefined, true)) },
    { key: "third_next", label: "Third-next-available appointment", value: tna === null ? "—" : `${tna} days`, sub: "Median of weekly samples, all clinicians. Lower is better.", spark: months.map((m) => thirdNext([m])) },
    { key: "nps", label: "Net promoter score", value: nps.value === null ? "—" : String(nps.value), sub: `Fiscal year to date, ${d.surveys.filter((s) => allIds.has(s.clinicianId) && fy.includes(s.period)).length.toLocaleString("en-US")} responses`, spark: months.map((m) => surveyValue("nps", d.surveys.filter((s) => allIds.has(s.clinicianId) && s.period === m)).value), reference: `MGB average ${MGB_AVERAGE.nps}` },
  ];
}

export interface QualityRow { label: string; value: string; interval: string; detail: string; reading: string }

export function departmentQuality(p: Period): { window: string; rows: QualityRow[] } {
  const d = department();
  const q = lastQuarterEnd(p);
  const months = quarterMonths(q);
  const rolling = range(addMonths(q, -11), q);
  const adm = (ms: Period[]) => d.admissions.filter((a) => ms.includes(a.period));
  const kept = adm(months).filter((a) => a.losDays <= 30);
  const losO = kept.reduce((s, a) => s + a.losDays, 0);
  const losE = kept.reduce((s, a) => s + a.expectedLos, 0);
  const oe = (o: number, e: number) => {
    const v = o / e;
    const lo = o === 0 ? 0 : (o * Math.pow(1 - 1 / (9 * o) - 1.96 / (3 * Math.sqrt(o)), 3)) / e;
    const o1 = o + 1;
    const hi = (o1 * Math.pow(1 - 1 / (9 * o1) + 1.96 / (3 * Math.sqrt(o1)), 3)) / e;
    return { v, lo, hi };
  };
  const reading = (lo: number, hi: number) => (hi < 1 ? "Better than expected" : lo > 1 ? "Higher than expected" : "As expected");
  const ra = adm(months);
  const readm = oe(ra.filter((a) => a.readmit30).length, ra.reduce((s, a) => s + a.expectedReadmit, 0));
  const ma = adm(rolling);
  const mort = oe(ma.filter((a) => a.died).length, ma.reduce((s, a) => s + a.expectedDeath, 0));
  const cases = d.cases.filter((c) => months.includes(c.period) && !c.cancelled);
  const rate = (k: number, n: number) => {
    const z = 1.96, ph = k / n, den = 1 + (z * z) / n;
    const c = (ph + (z * z) / (2 * n)) / den;
    const h = (z * Math.sqrt((ph * (1 - ph)) / n + (z * z) / (4 * n * n))) / den;
    return { v: 100 * ph, lo: 100 * Math.max(0, c - h), hi: 100 * Math.min(1, c + h) };
  };
  const f2 = (x: number) => x.toFixed(2);
  const f1 = (x: number) => `${x.toFixed(1)}%`;
  const ssi = rate(cases.filter((c) => c.ssi).length, cases.length);
  const ret = rate(cases.filter((c) => c.returnOr).length, cases.length);
  const vte = rate(cases.filter((c) => c.vte).length, cases.length);
  // LOS interval from ratio dispersion
  const ratios = kept.map((a) => a.losDays / a.expectedLos);
  const mean = ratios.reduce((s, x) => s + x, 0) / Math.max(1, ratios.length);
  const sd = Math.sqrt(ratios.reduce((s, x) => s + (x - mean) ** 2, 0) / Math.max(1, ratios.length - 1));
  const losV = losO / losE;
  const se = sd / mean / Math.sqrt(Math.max(1, kept.length));
  const los = { v: losV, lo: losV * Math.exp(-1.96 * se), hi: losV * Math.exp(1.96 * se) };
  return {
    window: quarterLabel(q),
    rows: [
      { label: "Length of stay (O/E)", value: f2(los.v), interval: `${f2(los.lo)} to ${f2(los.hi)}`, detail: `${losO.toLocaleString("en-US")} days observed, ${Math.round(losE).toLocaleString("en-US")} expected, ${kept.length} admissions`, reading: reading(los.lo, los.hi) },
      { label: "30-day readmission (O/E)", value: f2(readm.v), interval: `${f2(readm.lo)} to ${f2(readm.hi)}`, detail: `${ra.filter((a) => a.readmit30).length} readmissions, ${ra.length} admissions`, reading: reading(readm.lo, readm.hi) },
      { label: "In-hospital mortality (O/E), rolling 12 months", value: f2(mort.v), interval: `${f2(mort.lo)} to ${f2(mort.hi)}`, detail: `${ma.filter((a) => a.died).length} deaths, ${ma.length} admissions`, reading: reading(mort.lo, mort.hi) },
      { label: "Unplanned return to the OR within 30 days", value: f1(ret.v), interval: `${f1(ret.lo)} to ${f1(ret.hi)}`, detail: `${cases.filter((c) => c.returnOr).length} of ${cases.length} cases, unadjusted`, reading: "Unadjusted" },
      { label: "Surgical site infection", value: f1(ssi.v), interval: `${f1(ssi.lo)} to ${f1(ssi.hi)}`, detail: `${cases.filter((c) => c.ssi).length} of ${cases.length} cases, unadjusted`, reading: "Unadjusted" },
      { label: "VTE within 30 days", value: f1(vte.v), interval: `${f1(vte.lo)} to ${f1(vte.hi)}`, detail: `${cases.filter((c) => c.vte).length} of ${cases.length} cases, unadjusted`, reading: "Unadjusted" },
    ],
  };
}

export interface SiteRow { site: Site; surgeons: number; apps: number; cases: number; fcot: string; duration: string; notes: string; thirdNext: string; ops: SiteOps; opsTrend: SiteOps[] }

export function siteRows(p: Period): SiteRow[] {
  const months = publishedPeriods().filter((x) => cmp(x, p) <= 0).slice(-12);
  return SITES.map((site) => {
    const { surgeons, clinicians } = people(site);
    const f = pooled("fcot", [p], site);
    const du = pooled("duration_accuracy", [p], site);
    const n = pooled("notes_72h", [p], site, true);
    const t = thirdNext([p], site);
    return {
      site,
      surgeons: surgeons.length,
      apps: clinicians.length - surgeons.length,
      cases: total("or_case_volume", [p], site),
      fcot: `${f.value}% (${f.num} of ${f.den})`,
      duration: `${du.value}%`,
      notes: `${n.value}%`,
      thirdNext: t === null ? "—" : `${t} days`,
      ops: siteOps(site, p),
      opsTrend: months.map((m) => siteOps(site, m)),
    };
  });
}

export interface Distribution { key: string; label: string; unit: string; values: number[]; shown: number; total: number; median: number | null; fmt: "pct" | "days" }

/** Every clinician's own value, unnamed and sorted, for the spread of practice across the department. */
export function distributions(p: Period): Distribution[] {
  const d = department();
  const out: Distribution[] = [];
  const add = (key: string, label: string, pool: typeof d.surgeons, fmt: "pct" | "days", unit: string) => {
    const def = metric(key)!;
    const win = windowFor(def, p);
    const vals: number[] = [];
    for (const s of pool) {
      const c = def.compute!(s.id, win.months, LOGGED);
      if (c.value === null || (def.minN !== undefined && c.den < def.minN)) continue;
      vals.push(c.value);
    }
    vals.sort((a, b) => a - b);
    out.push({ key, label, unit, values: vals, shown: vals.length, total: pool.length, median: median(vals), fmt });
  };
  add("fcot", "First-case on-time start, surgeons", d.surgeons, "pct", "surgeons");
  add("notes_72h", "Clinic notes closed in 72 hours, all clinicians", d.clinicians, "pct", "clinicians");
  add("third_next", "Third-next-available appointment, all clinicians", d.clinicians, "days", "clinicians");
  return out;
}

export function mmSummary(p: Period) {
  const d = department();
  let reached = 0, onPace = 0, off = 0, unreachable = 0;
  for (const s of d.surgeons) {
    const m = mmView(s, p, NONE);
    if (m.pace.startsWith("Target reached")) reached++;
    else if (m.unreachable) unreachable++;
    else if (m.pace.startsWith("On pace")) onPace++;
    else off++;
  }
  return { reached, onPace, off, unreachable, total: d.surgeons.length };
}

export function experienceRows(p: Period) {
  const d = department();
  const fy = range(fyStart(p), p);
  const ids = (k: "surgeon" | "app") => new Set(d.clinicians.filter((c) => c.kind === k).map((c) => c.id));
  const s = ids("surgeon"), a = ids("app");
  return (["nps", "explained", "listened", "respect"] as const).map((key) => {
    const def = metric(key)!;
    const pick = (set: Set<string>) => surveyValue(key, d.surveys.filter((r) => set.has(r.clinicianId) && fy.includes(r.period))).value;
    return { key, label: def.name, surgeons: pick(s), apps: pick(a), mgb: MGB_AVERAGE[key] };
  });
}
