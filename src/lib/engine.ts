// The metric engine: windows, suppression with reasons (GR3), anonymous peer spread (GR4),
// logged vs adjudicated basis, trends (GR6), and the views with their own display contracts.

import {
  addMonths, cmp, FIRST_PUBLISHED, fyStart, fyEnd, isQuarterEnd, lastDayOfMonth, lastQuarterEnd, longDate,
  monthName, monthOnly, publishedPeriods, quarterLabel, quarterMonths, range, shortMonth, type Period,
} from "./periods";
import { department, type Person } from "./synth";
import { METRICS, MGB_AVERAGE, surveyValue, type Computed, type Ctx, type MetricDef, type PeerRule } from "./metrics";
import type { Dispute, OverrideMap } from "./disputes";

export const MIN_PEERS = 5;

// ---------- windows ----------

export interface Window {
  months: Period[];
  label: string; // "August 2026", "April to June 2026"
  phrase: string; // "this month", "this quarter"
  interim?: string;
}

export function windowFor(def: MetricDef, p: Period): Window {
  switch (def.cadence) {
    case "quarter": {
      const q = lastQuarterEnd(p);
      const interim = isQuarterEnd(p)
        ? undefined
        : `Counted quarterly; the quarter closes ${longDate(lastDayOfMonth(addMonths(q, 3)))}. This shows ${quarterLabel(q)}.`;
      return { months: quarterMonths(q), label: quarterLabel(q), phrase: "this quarter", interim };
    }
    case "rolling12": {
      const q = lastQuarterEnd(p);
      return { months: range(addMonths(q, -11), q), label: `the 12 months ending ${monthName(q)}`, phrase: "in these 12 months" };
    }
    case "fytd":
    case "fy":
    case "survey":
      return { months: range(fyStart(p), p), label: `fiscal year ${fyEnd(p).slice(0, 4)} to date`, phrase: "this fiscal year" };
    default:
      return { months: [p], label: monthName(p), phrase: "this month" };
  }
}

// ---------- peer groups ----------

export interface PeerGroup {
  members: Person[]; // excludes the viewer and anyone opted out
  size: number; // everyone in the group, viewer included
  words: string; // "neurosurgeons at Main campus"
  scopeWords: string; // for the comparator line
}

export function peerGroup(viewer: Person, rule: PeerRule): PeerGroup {
  // Like is compared with like: advanced practice providers form their own peer group.
  if (viewer.kind === "app") {
    const all = department().apps;
    const words = "advanced practice providers in neurosurgery";
    return { members: all.filter((s) => s.id !== viewer.id && !s.optedOutOn), size: all.length, words, scopeWords: words };
  }
  const all = department().surgeons.filter((s) => {
    switch (rule) {
      case "subspecialty_site": return s.site === viewer.site && s.subspecialty === viewer.subspecialty;
      case "site": return s.site === viewer.site;
      case "subspecialty_system": return s.subspecialty === viewer.subspecialty;
      case "system": return true;
      default: return false;
    }
  });
  const sub = viewer.subspecialty?.toLowerCase() ?? "";
  const words =
    rule === "subspecialty_site" ? `${sub} surgeons at ${viewer.site}`
      : rule === "site" ? `neurosurgeons at ${viewer.site}`
        : rule === "subspecialty_system" ? `${sub} surgeons across the system`
          : "neurosurgeons across the system";
  return {
    members: all.filter((s) => s.id !== viewer.id && !s.optedOutOn),
    size: all.length,
    words,
    scopeWords: words,
  };
}

// ---------- spread ----------

export type Spread =
  | { kind: "rendered"; values: number[]; you: number; peers: number; sentence: string; unit: string }
  | { kind: "reason"; text: string };

function fmtValue(def: MetricDef, v: number): string {
  if (def.riskAdjusted) return v.toFixed(2);
  if (def.key === "case_mix_index") return v.toFixed(2);
  if (def.bucket === 4) return `${v.toFixed(1)}%`;
  if (["fcot", "duration_accuracy", "block_utilization", "same_day_cancel", "notes_72h", "explained", "listened", "respect"].includes(def.key)) return `${v}%`;
  if (def.key === "third_next") return `${v} days`;
  return String(v);
}
export { fmtValue };

export function spreadFor(def: MetricDef, viewer: Person, win: Window, p: Period, ctx: Ctx, own: Computed | null): Spread | undefined {
  if (def.peer === "none") return undefined;
  if (viewer.optedOutOn)
    return { kind: "reason", text: `Peer comparison not shown: you opted out of the peer spread (recorded ${longDate(viewer.optedOutOn)}). Ask the department analyst to opt back in.` };
  if (!viewer.stepZeroAttended)
    return { kind: "reason", text: "Peer comparison not shown: it starts after you have seen the definitions and ground rules presented at faculty meeting. Ask the department analyst for the recording." };
  if (def.cadence === "month" && p === FIRST_PUBLISHED)
    return { kind: "reason", text: "Peer comparison starts with the second monthly scorecard." };
  if (!own || own.value === null) return undefined;
  const g = peerGroup(viewer, def.peer);
  if (g.members.length === 0) return { kind: "reason", text: `Peer comparison not shown: you are the only one of the ${g.words}.` };
  const clearing: number[] = [];
  for (const m of g.members) {
    if (def.key === "block_utilization" && !m.hasBlock) continue;
    const c = def.compute!(m.id, win.months, ctx);
    if (c.value === null) continue;
    if (def.minN !== undefined && c.den < def.minN) continue;
    clearing.push(c.value);
  }
  if (clearing.length < MIN_PEERS) {
    const need = def.minN !== undefined ? ` had ${def.minN} or more ${def.unit} ${win.phrase}` : "";
    return {
      kind: "reason",
      text: `Peer comparison not shown: only ${clearing.length} other ${g.words}${need}; ${MIN_PEERS} are needed for a comparison.`,
    };
  }
  const values = clearing.sort((a, b) => a - b);
  return {
    kind: "rendered", values, you: own.value, peers: values.length, unit: def.unit,
    sentence: `Your value ${fmtValue(def, own.value)} among ${values.length} peers ranging from ${fmtValue(def, values[0])} to ${fmtValue(def, values[values.length - 1])}.`,
  };
}

// ---------- tiles ----------

export interface Tile {
  def: MetricDef;
  win: Window;
  kind: "value" | "reason" | "special";
  reason?: string;
  muted?: boolean;
  logged?: Computed;
  adjudicated?: Computed;
  bothBases: boolean;
  comparator?: string;
  spread?: Spread;
}

export function ownReason(def: MetricDef, viewer: Person, win: Window, c: Computed | null): { text: string; muted: boolean } | null {
  if (def.availability === "pending_source") return { text: "Not yet available: the data source has not been confirmed.", muted: true };
  if (def.key === "block_utilization" && !viewer.hasBlock) return { text: "Not applicable: no allocated block this month.", muted: true };
  if (!c) return null;
  if (def.minN !== undefined && c.den < def.minN) {
    if (c.den === 0)
      return { text: `Not shown: no ${def.unit} were credited to you in ${win.label}; needs at least ${def.minN}.`, muted: false };
    return { text: `Not shown: ${c.den} ${c.den === 1 ? def.unitOne : def.unit} ${win.phrase}; needs at least ${def.minN}.`, muted: false };
  }
  if (c.value === null) return { text: `Not shown: no ${def.unit} were credited to you in ${win.label}.`, muted: false };
  return null;
}

export function comparatorLine(def: MetricDef, viewer: Person): string | undefined {
  if (def.peer === "none") return undefined;
  const g = peerGroup(viewer, def.peer);
  const others = g.size - 1;
  const noun = viewer.kind === "app" ? "providers" : "surgeons";
  const count = others === 0 ? `no other ${noun}` : `${g.size} ${noun}`;
  const extra = def.comparedTo.includes("Vizient") ? ", and Vizient" : "";
  return `Compared to: ${g.words} (${count})${extra}`;
}

export function tileFor(def: MetricDef, viewer: Person, p: Period, ov: OverrideMap): Tile {
  const win = windowFor(def, p);
  if (!def.compute) {
    const r = ownReason(def, viewer, win, null);
    return { def, win, kind: r ? "reason" : "special", reason: r?.text, muted: r?.muted, bothBases: false };
  }
  const logged = def.compute(viewer.id, win.months, { basis: "logged", ov });
  const adjudicated = def.compute(viewer.id, win.months, { basis: "adjudicated", ov });
  const r = ownReason(def, viewer, win, adjudicated);
  const bothBases = logged.line !== adjudicated.line;
  if (r) return { def, win, kind: "reason", reason: r.text, muted: r.muted, logged, adjudicated, bothBases: false, comparator: comparatorLine(def, viewer) };
  return {
    def, win, kind: "value", logged, adjudicated, bothBases,
    comparator: comparatorLine(def, viewer),
    spread: spreadFor(def, viewer, win, p, { basis: "adjudicated", ov }, adjudicated),
  };
}

// ---------- trend ----------

export interface TrendPoint {
  label: string;
  period: Period;
  value: number | null;
  text: string;
  restated: boolean;
}

export function trendWindows(def: MetricDef, p: Period): Period[] {
  if (def.cadence === "month") return publishedPeriods().filter((x) => cmp(x, p) <= 0).slice(-12);
  if (def.cadence === "quarter" || def.cadence === "rolling12") {
    const last = lastQuarterEnd(p);
    const out: Period[] = [];
    for (let q = "2025-09"; cmp(q, last) <= 0; q = addMonths(q, 3)) out.push(q);
    return out;
  }
  return [];
}

export function trendFor(def: MetricDef, viewer: Person, p: Period, ov: OverrideMap): TrendPoint[] {
  if (!def.compute || def.availability !== "live") return [];
  return trendWindows(def, p).map((w) => {
    const win = windowFor(def, w);
    const logged = def.compute!(viewer.id, win.months, { basis: "logged", ov });
    const adj = def.compute!(viewer.id, win.months, { basis: "adjudicated", ov });
    const r = ownReason(def, viewer, win, adj);
    const label = def.cadence === "month" ? shortMonth(w) : `${shortMonth(addMonths(w, def.cadence === "rolling12" ? -11 : -2))} to ${shortMonth(w)}`;
    return {
      label, period: w,
      value: r ? null : adj.value,
      text: r ? r.text : adj.line,
      restated: !r && logged.value !== adj.value,
    };
  });
}

// ---------- views with their own display contracts ----------

export interface WrvuView {
  asOf: string;
  ytd: number;
  lastYtd: number;
  months: { period: Period; label: string; value: number; last: number; prior?: number }[];
}

export function wrvuView(viewer: Person, p: Period): WrvuView {
  const months = range(fyStart(p), p);
  const w = department().wrvu.filter((x) => x.clinicianId === viewer.id);
  const get = (m: Period) => w.find((x) => x.period === m);
  const rows = months.map((m) => ({
    period: m,
    label: monthOnly(m).slice(0, 3),
    value: get(m)?.wrvu ?? 0,
    last: get(addMonths(m, -12))?.wrvu ?? 0,
    prior: get(m)?.priorSnapshot,
  }));
  return {
    asOf: w[0]?.asOf ?? department().refreshedOn,
    ytd: rows.reduce((s, r) => s + r.value, 0),
    lastYtd: rows.reduce((s, r) => s + r.last, 0),
    months: rows,
  };
}

export interface MMView {
  fy: string;
  attended: number;
  heldEligible: number;
  remaining: number;
  target: number;
  scaled: boolean;
  line: string;
  pace: string;
  unreachable: boolean;
  sessions: { ref: string; date: string; topic: string; status: string; period: Period }[];
}

export function mmView(viewer: Person, p: Period, ov: OverrideMap): MMView {
  const d = department();
  const fyMonths = range(fyStart(p), fyEnd(p));
  const sessions = d.sessions.filter((s) => fyMonths.includes(s.period));
  const rows = sessions.map((s) => {
    const a = d.attendance.find((x) => x.sessionRef === s.ref && x.clinicianId === viewer.id);
    const future = cmp(s.period, p) > 0;
    const beforeFaculty = s.date < viewer.facultyStart;
    let status: string;
    if (beforeFaculty) status = "not on faculty";
    else if (future) status = "upcoming";
    else if (a?.status === "leave") status = "approved leave";
    else if (a?.status === "attended" || ov.get(`${s.ref}:${viewer.id}`)?.attendance) status = "attended";
    else status = "not recorded as attended";
    return { ref: `${s.ref}:${viewer.id}`, date: s.date, topic: s.topic, status, period: s.period };
  });
  const eligibleTotal = rows.filter((r) => r.status !== "not on faculty" && r.status !== "approved leave").length;
  const target = Math.ceil((8 * eligibleTotal) / 12);
  const attended = rows.filter((r) => r.status === "attended").length;
  const heldEligible = rows.filter((r) => r.status === "attended" || r.status === "not recorded as attended").length;
  const remaining = rows.filter((r) => r.status === "upcoming").length;
  const needed = target - attended;
  const targetWords = target === 8 && eligibleTotal === 12 ? "8 of 12" : `${target} of ${eligibleTotal} (8 of 12 scaled for approved leave or faculty start)`;
  let pace: string;
  let unreachable = false;
  if (needed <= 0) pace = `Target reached: ${targetWords}.`;
  else if (needed > remaining) {
    unreachable = true;
    pace = `${targetWords} cannot be reached this year: ${remaining} ${remaining === 1 ? "session remains" : "sessions remain"} and ${needed} ${needed === 1 ? "is" : "are"} needed.`;
  } else if (needed / Math.max(1, remaining) <= target / Math.max(1, eligibleTotal)) pace = `On pace: ${needed} more of the ${remaining} remaining sessions reaches ${targetWords}.`;
  else pace = `Off pace: ${needed} of the ${remaining} remaining sessions are needed to reach ${targetWords}.`;
  return {
    fy: fyEnd(p).slice(0, 4), attended, heldEligible, remaining, target, scaled: targetWords !== "8 of 12", unreachable,
    line: `Attended ${attended} of ${heldEligible} sessions held while on faculty and not on approved leave.`,
    pace,
    sessions: rows,
  };
}

export interface SurveyMonth {
  period: Period;
  label: string;
  n: number;
  value: number | null;
  hidden: boolean;
  line: string;
}

export interface SurveyView {
  yearAverage: { value: number | null; line: string; n: number };
  months: SurveyMonth[];
  mgb: number;
  bars?: { values: number[]; you: number; sentence: string } | { reason: string };
}

export function surveyView(def: MetricDef, viewer: Person, p: Period, ov: OverrideMap): SurveyView {
  const d = department();
  const mine = (id: string, months: Period[]) =>
    d.surveys.filter((s) => s.clinicianId === id && months.includes(s.period) && !ov.get(s.ref)?.provider_named);
  const year = range(fyStart(p), p);
  const ya = surveyValue(def.key, mine(viewer.id, year));
  const months = [addMonths(p, -2), addMonths(p, -1), p].map((m) => {
    const rs = mine(viewer.id, [m]);
    const v = surveyValue(def.key, rs);
    const hidden = rs.length < 10;
    return {
      period: m, label: monthName(m), n: rs.length, value: hidden ? null : v.value, hidden,
      line: hidden ? `Hidden: ${rs.length} ${rs.length === 1 ? "response" : "responses"} this month; needs at least 10.` : v.line,
    };
  });
  let bars: SurveyView["bars"];
  const peers = (viewer.kind === "app" ? d.apps : d.surgeons).filter((s) => !s.optedOutOn && s.id !== viewer.id);
  const groupWords = viewer.kind === "app" ? "advanced practice providers" : "neurosurgeons";
  if (viewer.optedOutOn) bars = { reason: `Peer comparison not shown: you opted out of the peer spread (recorded ${longDate(viewer.optedOutOn)}).` };
  else if (!viewer.stepZeroAttended) bars = { reason: "Peer comparison not shown: it starts after you have seen the definitions and ground rules presented at faculty meeting." };
  else if (ya.value !== null) {
    const vals = peers.map((s) => surveyValue(def.key, mine(s.id, year)).value).filter((v): v is number => v !== null);
    if (vals.length < MIN_PEERS) bars = { reason: `Peer comparison not shown: only ${vals.length} other ${groupWords} had responses; 5 are needed for a comparison.` };
    else {
      const all = [...vals].sort((a, b) => a - b);
      bars = { values: all, you: ya.value, sentence: `Your year average ${ya.value} among ${all.length} ${groupWords} ranging from ${all[0]} to ${all[all.length - 1]}.` };
    }
  }
  return { yearAverage: { ...ya, n: mine(viewer.id, year).length }, months, mgb: MGB_AVERAGE[def.key], bars };
}

// ---------- disputes visible to a viewer on a record ----------

export function disputesOnRecord(disputes: Dispute[], recordRef: string, viewerId: string): Dispute[] {
  return disputes
    .filter((d) => d.recordRef === recordRef && (d.filedById === viewerId || d.proposedClinicianId === viewerId))
    .sort((a, b) => (a.filedOn < b.filedOn ? 1 : -1));
}

export function liveMetrics(): MetricDef[] {
  return METRICS;
}
