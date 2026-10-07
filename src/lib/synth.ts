// Deterministic synthetic department. Every person, case and comment here is invented.
// No real patient, clinician or institutional record is used anywhere in this app.

import { addDays, addMonths, DATA_START, fyEnd, LATEST_PUBLISHED, lastDayOfMonth, parse, range, type Period } from "./periods";

// ---------- deterministic randomness ----------

function hashString(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function rng(seed: string) {
  let a = hashString(seed);
  const next = () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  return {
    next,
    int: (lo: number, hi: number) => lo + Math.floor(next() * (hi - lo + 1)),
    chance: (p: number) => next() < p,
    pick: <T,>(xs: readonly T[]): T => xs[Math.floor(next() * xs.length)],
    normal: (mu: number, sd: number) => {
      const u = Math.max(next(), 1e-9);
      const v = next();
      return mu + sd * Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
    },
  };
}

const B32 = "23456789ABCDEFGHJKMNPQRSTUVWXYZ";
/** Opaque, type-prefixed reference (C-7K3Q9M). Stable for a given natural key. */
export function opaqueRef(prefix: string, naturalKey: string): string {
  let h = hashString(`${prefix}:${naturalKey}`);
  let out = "";
  for (let i = 0; i < 6; i++) {
    out += B32[h % B32.length];
    h = Math.floor(h / B32.length) ^ hashString(out + naturalKey);
    h >>>= 0;
  }
  return `${prefix}-${out}`;
}

// ---------- roster ----------

export type Site = "Main campus" | "Harbor campus";
export type Subspecialty = "Spine" | "Cranial and tumor" | "Vascular" | "Functional" | "Pediatric";
export type Role = "surgeon" | "app" | "chief" | "chair" | "leader" | "analyst";
export type Kind = "surgeon" | "app" | "staff";

export interface Person {
  id: string;
  ref: string; // opaque URL token
  name: string;
  roles: Role[];
  site?: Site;
  subspecialty?: Subspecialty;
  kind: Kind;
  isSurgeon: boolean;
  isClinician: boolean; // surgeons and advanced practice providers have a scorecard
  credential?: "NP" | "PA-C";
  featured: boolean; // shown in the demo identity list
  hasBlock: boolean;
  directLeaderId?: string;
  optedOutOn?: string; // peer-spread opt-out date (F-35)
  stepZeroAttended: boolean;
  facultyStart: string;
  profile: {
    volume: number; // mean cases per month
    onTime: number; // probability first case on time
    ownDelayShare: number; // share of late starts that are surgeon-attributable
    booking: number; // probability booked time within tolerance
    notes72: number;
    access: number; // median days to third-next
    los: number; // LOS O/E tendency
    comp: number; // complication multiplier
    survey: number; // survey tendency 0..1
    mmAttend: number;
    wrvu: number; // monthly wRVU base
    visits: number; // clinic visits per month
    newShare: number; // share of visits that are new patients
  };
}

interface Seed {
  name: string;
  site: Site;
  sub: Subspecialty;
  block: boolean;
  profile: Partial<Person["profile"]>;
  extra?: Partial<Person>;
}

const SEEDS: Seed[] = [
  // Main campus: 9 neurosurgeons
  { name: "Dr. Imani Okafor", site: "Main campus", sub: "Spine", block: true, profile: { volume: 24, onTime: 0.78 } },
  { name: "Dr. Tomas Lindqvist", site: "Main campus", sub: "Spine", block: true, profile: { volume: 27, onTime: 0.62, ownDelayShare: 0.6 } },
  { name: "Dr. Priya Raman", site: "Main campus", sub: "Spine", block: false, profile: { volume: 18, onTime: 0.84 } },
  { name: "Dr. Samuel Achterberg", site: "Main campus", sub: "Cranial and tumor", block: true, profile: { volume: 16, onTime: 0.7, los: 1.08 } },
  { name: "Dr. Hana Mizrahi", site: "Main campus", sub: "Cranial and tumor", block: true, profile: { volume: 14, onTime: 0.88, survey: 0.8 } },
  { name: "Dr. Kwame Boateng", site: "Main campus", sub: "Cranial and tumor", block: false, profile: { volume: 12, onTime: 0.74, comp: 1.3 } },
  { name: "Dr. Elena Vasquez-Hart", site: "Main campus", sub: "Vascular", block: true, profile: { volume: 11, onTime: 0.8 } },
  { name: "Dr. Oren Feldstein", site: "Main campus", sub: "Vascular", block: false, profile: { volume: 9, onTime: 0.66 } },
  { name: "Dr. Mei-Ling Chao", site: "Main campus", sub: "Functional", block: false, profile: { volume: 10, onTime: 0.9, survey: 0.85 } },
  // Harbor campus: 5 neurosurgeons
  { name: "Dr. Rafael Duarte", site: "Harbor campus", sub: "Spine", block: true, profile: { volume: 22, onTime: 0.72 } },
  { name: "Dr. Aisling Byrne", site: "Harbor campus", sub: "Spine", block: false, profile: { volume: 19, onTime: 0.81, mmAttend: 0.45 } },
  { name: "Dr. Victor Nwosu", site: "Harbor campus", sub: "Spine", block: true, profile: { volume: 21, onTime: 0.69 } },
  { name: "Dr. Sofia Marchetti", site: "Harbor campus", sub: "Cranial and tumor", block: false, profile: { volume: 13, onTime: 0.77 } },
  { name: "Dr. Daniel Ha", site: "Harbor campus", sub: "Pediatric", block: false, profile: { volume: 8, onTime: 0.86, survey: 0.9 } },
];

const DEFAULT_PROFILE: Person["profile"] = {
  volume: 15, onTime: 0.75, ownDelayShare: 0.35, booking: 0.68, notes72: 0.82, access: 24,
  los: 0.97, comp: 1, survey: 0.65, mmAttend: 0.8, wrvu: 620, visits: 28, newShare: 0.4,
};

function buildRoster(): Person[] {
  const r = rng("roster");
  const people: Person[] = SEEDS.map((s, i) => {
    const id = `S${String(i + 1).padStart(2, "0")}`;
    const profile = { ...DEFAULT_PROFILE, ...s.profile };
    profile.booking = Math.min(0.92, Math.max(0.45, r.normal(profile.booking, 0.1)));
    profile.notes72 = Math.min(0.99, Math.max(0.55, r.normal(profile.notes72, 0.1)));
    profile.access = Math.max(6, Math.round(r.normal(profile.access, 8)));
    profile.wrvu = Math.round(profile.volume * 30 + r.normal(120, 60));
    return {
      id,
      ref: opaqueRef("K", id),
      name: s.name,
      roles: ["surgeon"],
      site: s.site,
      subspecialty: s.sub,
      kind: "surgeon",
      isSurgeon: true,
      isClinician: true,
      featured: false,
      hasBlock: s.block,
      stepZeroAttended: true,
      facultyStart: "2015-07-01",
      profile,
    };
  });
  // Division chief: Dr. Okafor (a surgeon on the roster). Harbor site lead: Dr. Duarte.
  const chief = people[0];
  chief.roles.push("chief", "leader");
  const harborLead = people[9];
  harborLead.roles.push("leader");
  for (const p of people) {
    if (p.id === chief.id) continue;
    p.directLeaderId = p.site === "Harbor campus" && p.id !== harborLead.id ? harborLead.id : chief.id;
  }
  chief.directLeaderId = undefined; // chair leads the chief; chair inbox access is not in the brief
  // Peer-spread opt-out and a surgeon who missed step zero (F-35).
  people[8].optedOutOn = "2025-10-06";
  people[12].stepZeroAttended = false;
  // A surgeon who joined mid-year (faculty dates; M&M denominator).
  people[13].facultyStart = "2025-12-01";

  // Advanced practice providers: nurse practitioners and physician assistants who run
  // neurosurgery clinics. They have a clinic scorecard and are compared only with each other.
  const appSeeds: { name: string; credential: "NP" | "PA-C"; site: Site; sub: Subspecialty; profile: Partial<Person["profile"]> }[] = [
    { name: "Alicia Moreno", credential: "NP", site: "Main campus", sub: "Spine", profile: { notes72: 0.9, access: 12, survey: 0.82 } },
    { name: "Grace Whitfield", credential: "PA-C", site: "Main campus", sub: "Cranial and tumor", profile: { notes72: 0.78, access: 16 } },
    { name: "Owen Castellanos", credential: "NP", site: "Main campus", sub: "Spine", profile: { notes72: 0.85, access: 10 } },
    { name: "Priya Natarajan", credential: "PA-C", site: "Main campus", sub: "Functional", profile: { notes72: 0.7, access: 19 } },
    { name: "Ben Albright", credential: "NP", site: "Harbor campus", sub: "Spine", profile: { notes72: 0.88, access: 14 } },
    { name: "Leah Okonjo", credential: "PA-C", site: "Harbor campus", sub: "Pediatric", profile: { notes72: 0.8, access: 21 } },
  ];
  const apps: Person[] = appSeeds.map((a, i) => {
    const id = `A${String(i + 1).padStart(2, "0")}`;
    const profile = { ...DEFAULT_PROFILE, volume: 0, visits: 52, newShare: 0.5, wrvu: Math.round(255 + r.normal(0, 25)), ...a.profile };
    return {
      id, ref: opaqueRef("K", id), name: `${a.name}, ${a.credential}`, roles: ["app"], kind: "app", isSurgeon: false, isClinician: true,
      credential: a.credential, featured: false, site: a.site, subspecialty: a.sub, hasBlock: false, stepZeroAttended: true,
      facultyStart: "2019-07-01", directLeaderId: chief.id, profile,
    } satisfies Person;
  });

  const staff = (id: string, name: string, roles: Role[], since: string): Person => ({
    id, ref: opaqueRef("K", id), name, roles, kind: "staff", isSurgeon: false, isClinician: false, featured: true,
    hasBlock: false, stepZeroAttended: true, facultyStart: since, profile: DEFAULT_PROFILE,
  });
  const chair = staff("P01", "Dr. Margaret Ellison", ["chair"], "2010-01-01");
  const analyst = staff("P02", "Jordan Pike", ["analyst"], "2020-01-01");

  // The demo cast: everyone else exists only as an anonymous peer.
  for (const id of ["S01", "S02", "S05"]) people.find((x) => x.id === id)!.featured = true;
  apps[0].featured = true;
  return [...people, ...apps, chair, analyst];
}

// ---------- record types ----------

export type DelayCode =
  | "surgeon_late" | "consent_incomplete" | "site_marking" | "hp_incomplete"
  | "anesthesia" | "room_not_ready" | "equipment" | "patient_late" | "transport" | "not_recorded";

export const DELAY_LABELS: Record<DelayCode, string> = {
  surgeon_late: "Surgeon arrived late",
  consent_incomplete: "Consent not complete",
  site_marking: "Site marking not done",
  hp_incomplete: "H&P not complete",
  anesthesia: "Anesthesia not ready",
  room_not_ready: "Room not ready",
  equipment: "Equipment or tray delay",
  patient_late: "Patient arrived late",
  transport: "Transport delay",
  not_recorded: "Reason not recorded",
};

export const SURGEON_DELAYS: DelayCode[] = ["surgeon_late", "consent_incomplete", "site_marking", "hp_incomplete"];
const OTHER_DELAYS: DelayCode[] = ["anesthesia", "room_not_ready", "equipment", "patient_late", "transport"];

export type CancelCode = "clearance_incomplete" | "surgeon_unavailable" | "consent_withdrawn" | "patient_ill" | "no_bed" | "or_time" | "patient_no_show";
export const CANCEL_LABELS: Record<CancelCode, string> = {
  clearance_incomplete: "Pre-op clearance incomplete",
  surgeon_unavailable: "Surgeon unavailable",
  consent_withdrawn: "Consent not obtained",
  patient_ill: "Patient acutely ill",
  no_bed: "No inpatient bed",
  or_time: "OR time ran out",
  patient_no_show: "Patient did not arrive",
};
export const SURGEON_CANCELS: CancelCode[] = ["clearance_incomplete", "surgeon_unavailable", "consent_withdrawn"];

export interface Case {
  ref: string;
  date: string;
  period: Period;
  site: Site;
  room: string;
  procedure: string;
  category: "cranial" | "spinal" | "other";
  implant: boolean;
  primaryId: string; // as logged in the OR log
  cosurgeonId?: string;
  shared: boolean;
  firstCase: boolean;
  scheduledStart: string; // "07:30"
  wheelsIn?: string; // "07:34"; undefined when cancelled
  delay?: DelayCode;
  bookedMin: number;
  actualMin?: number;
  cancelled?: CancelCode;
  inpatient: boolean;
  // QI database outcomes (never hand-entered)
  returnOr: boolean;
  ssi: boolean;
  vte: boolean;
  csfLeak: boolean;
}

export interface Admission {
  ref: string;
  caseRef: string;
  indexSurgeonId: string; // surgeon of the index operation (attribution rule)
  dischargingId: string;
  admitDate: string;
  period: Period;
  losDays: number;
  expectedLos: number;
  readmit30: boolean;
  expectedReadmit: number;
  died: boolean;
  expectedDeath: number;
  relativeWeight: number;
  icu: boolean;
}

export interface Visit {
  ref: string;
  clinicianId: string;
  date: string;
  period: Period;
  newPatient: boolean;
  noteSignedHours: number;
}

export interface AccessSample {
  ref: string;
  clinicianId: string;
  date: string;
  period: Period;
  days: number;
}

export interface SurveyResponse {
  ref: string;
  clinicianId: string; // provider named on the survey
  period: Period;
  returnedOn: string;
  recommend: number; // 0..10
  explained: number; // 1..5
  listened: number;
  respect: number;
  comment?: string;
}

export interface MMSession {
  ref: string;
  date: string;
  period: Period;
  topic: string;
}

export interface Attendance {
  sessionRef: string;
  clinicianId: string;
  status: "attended" | "absent" | "leave";
}

export interface WrvuMonth {
  clinicianId: string;
  period: Period;
  wrvu: number;
  asOf: string;
  priorSnapshot?: number; // for the two most recent months, billing lag
}

export interface BlockDay {
  ref: string;
  clinicianId: string;
  date: string;
  period: Period;
  allocatedMin: number;
  releasedMin: number;
  usedMin: number;
}

const PROCEDURES: { name: string; cat: Case["category"]; sub: Subspecialty[]; implant: boolean; min: number }[] = [
  { name: "Lumbar microdiscectomy", cat: "spinal", sub: ["Spine"], implant: false, min: 95 },
  { name: "Anterior cervical discectomy and fusion, one level", cat: "spinal", sub: ["Spine"], implant: true, min: 150 },
  { name: "Posterior lumbar interbody fusion L4-L5", cat: "spinal", sub: ["Spine"], implant: true, min: 240 },
  { name: "Lumbar laminectomy, two levels", cat: "spinal", sub: ["Spine"], implant: false, min: 140 },
  { name: "Minimally invasive transforaminal lumbar interbody fusion with navigation", cat: "spinal", sub: ["Spine"], implant: true, min: 260 },
  { name: "Cervical laminoplasty C3-C6", cat: "spinal", sub: ["Spine"], implant: true, min: 210 },
  { name: "Craniotomy for tumor resection", cat: "cranial", sub: ["Cranial and tumor"], implant: false, min: 300 },
  { name: "Stereotactic brain biopsy", cat: "cranial", sub: ["Cranial and tumor", "Functional"], implant: false, min: 110 },
  { name: "Endoscopic endonasal transsphenoidal resection of pituitary adenoma", cat: "cranial", sub: ["Cranial and tumor"], implant: false, min: 280 },
  { name: "Suboccipital craniectomy for Chiari decompression", cat: "cranial", sub: ["Cranial and tumor", "Pediatric"], implant: false, min: 180 },
  { name: "Craniotomy for aneurysm clipping", cat: "cranial", sub: ["Vascular"], implant: true, min: 330 },
  { name: "Arteriovenous malformation resection", cat: "cranial", sub: ["Vascular"], implant: false, min: 360 },
  { name: "Carotid endarterectomy", cat: "other", sub: ["Vascular"], implant: false, min: 150 },
  { name: "Deep brain stimulation lead placement, bilateral", cat: "cranial", sub: ["Functional"], implant: true, min: 270 },
  { name: "Implantable pulse generator placement", cat: "other", sub: ["Functional"], implant: true, min: 70 },
  { name: "Ventriculoperitoneal shunt placement", cat: "cranial", sub: ["Pediatric", "Cranial and tumor", "Functional"], implant: true, min: 90 },
  { name: "Endoscopic third ventriculostomy", cat: "cranial", sub: ["Pediatric"], implant: false, min: 120 },
  { name: "Tethered spinal cord release", cat: "spinal", sub: ["Pediatric"], implant: false, min: 200 },
  { name: "Carpal tunnel release", cat: "other", sub: ["Spine", "Functional"], implant: false, min: 40 },
];

const COMMENTS_POSITIVE = [
  "Took the time to draw out the surgery on the whiteboard. I finally understood why the fusion was needed.",
  "Sat down, looked at me, and answered every question my daughter had.",
  "Called me herself the evening after surgery. I did not expect that.",
  "Explained the risks without scaring us. We felt we had a real choice.",
  "Remembered details from my first visit months earlier.",
  "Clear about what recovery would look like week by week, and it went exactly that way.",
  "The whole team was kind, and the doctor made sure my husband was included in every conversation.",
];
const COMMENTS_MIXED = [
  "Good surgeon but the visit felt rushed. I left with questions I wrote down beforehand and never got to ask.",
  "Waited almost two hours past my appointment time with no update from anyone.",
  "Used a lot of terms I did not understand. The nurse explained afterwards.",
  "I was told three different discharge dates. Not sure who was deciding.",
  "Very skilled, but I wish the follow-up plan had been written down for me.",
  "Hard to reach the office after surgery; the portal message went unanswered for four days.",
];

// ---------- generation ----------

export interface Department {
  people: Person[];
  surgeons: Person[];
  apps: Person[];
  clinicians: Person[];
  cases: Case[];
  admissions: Admission[];
  visits: Visit[];
  samples: AccessSample[];
  surveys: SurveyResponse[];
  sessions: MMSession[];
  attendance: Attendance[];
  wrvu: WrvuMonth[];
  blocks: BlockDay[];
  refreshedOn: string;
}

function hhmm(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

function workdays(p: Period): string[] {
  const days: string[] = [];
  const last = Number(lastDayOfMonth(p).slice(8));
  for (let d = 1; d <= last; d++) {
    const iso = `${p}-${String(d).padStart(2, "0")}`;
    const dow = new Date(`${iso}T00:00:00Z`).getUTCDay();
    if (dow !== 0 && dow !== 6) days.push(iso);
  }
  return days;
}

function build(): Department {
  const people = buildRoster();
  const surgeons = people.filter((p) => p.kind === "surgeon");
  const apps = people.filter((p) => p.kind === "app");
  const clinicians = [...surgeons, ...apps];
  const months = range(DATA_START, LATEST_PUBLISHED);
  const cases: Case[] = [];
  const admissions: Admission[] = [];
  const visits: Visit[] = [];
  const samples: AccessSample[] = [];
  const surveys: SurveyResponse[] = [];
  const blocks: BlockDay[] = [];
  const wrvu: WrvuMonth[] = [];

  for (const s of clinicians) {
    const pr = s.profile;
    for (const p of months) {
      if (p < s.facultyStart.slice(0, 7)) continue;
      const r = rng(`${s.id}:${p}`);
      const days = workdays(p);
      if (s.kind === "surgeon") {
      const n = Math.max(3, Math.round(r.normal(pr.volume, pr.volume * 0.15)));
      const orDays = new Set<string>();
      const procs = PROCEDURES.filter((x) => x.sub.includes(s.subspecialty!));
      for (let i = 0; i < n; i++) {
        const date = r.pick(days);
        const firstCase = !orDays.has(date);
        orDays.add(date);
        const proc = r.pick(procs);
        const room = `OR ${r.int(1, 14)}`;
        const sched = firstCase ? 7 * 60 + 30 : r.int(9, 14) * 60 + r.pick([0, 15, 30, 45]);
        const cancelled = r.chance(0.035);
        let cancelCode: CancelCode | undefined;
        if (cancelled) {
          cancelCode = r.chance(0.4)
            ? r.pick(SURGEON_CANCELS)
            : r.pick(["patient_ill", "no_bed", "or_time", "patient_no_show"] as CancelCode[]);
        }
        let wheelsIn: string | undefined;
        let delay: DelayCode | undefined;
        if (!cancelled) {
          const onTime = r.chance(firstCase ? pr.onTime : 0.6);
          const offset = onTime ? -r.int(0, 6) : r.int(3, 48);
          wheelsIn = hhmm(sched + offset);
          if (!onTime) {
            delay = r.chance(0.06)
              ? "not_recorded"
              : r.chance(pr.ownDelayShare)
                ? r.pick(SURGEON_DELAYS)
                : r.pick(OTHER_DELAYS);
          }
        }
        const booked = Math.round(proc.min / 15) * 15;
        const within = r.chance(pr.booking);
        const actual = cancelled
          ? undefined
          : Math.max(25, Math.round(booked * (within ? r.normal(1, 0.08) : r.chance(0.7) ? r.normal(1.45, 0.12) : r.normal(0.62, 0.06))));
        const shared = r.chance(0.02);
        const cosurgeon = shared ? r.pick(surgeons.filter((o) => o.id !== s.id && o.site === s.site)).id : undefined;
        const ref = opaqueRef("C", `${s.id}:${p}:${i}`);
        const inpatient = !cancelled && proc.min >= 120 && r.chance(0.85);
        const comp = pr.comp;
        const c: Case = {
          ref, date, period: p, site: s.site!, room, procedure: proc.name, category: proc.cat, implant: proc.implant,
          primaryId: s.id, cosurgeonId: cosurgeon, shared, firstCase,
          scheduledStart: hhmm(sched), wheelsIn, delay, bookedMin: booked, actualMin: actual, cancelled: cancelCode,
          inpatient,
          returnOr: !cancelled && r.chance(0.035 * comp),
          ssi: !cancelled && r.chance((proc.implant ? 0.028 : 0.018) * comp),
          vte: !cancelled && r.chance(0.02 * comp),
          csfLeak: !cancelled && proc.cat !== "other" && r.chance(0.025 * comp),
        };
        cases.push(c);
        if (inpatient) {
          const exp = Math.max(1.5, proc.min / 60 + r.normal(0.8, 0.6));
          const boarder = r.chance(0.008);
          const los = boarder ? r.int(34, 70) : Math.max(1, Math.round(exp * r.normal(pr.los, 0.25)));
          const expDeath = proc.cat === "cranial" ? 0.018 : 0.004;
          const chiefDischarges = s.id !== "S01" && s.site === "Main campus" && r.chance(0.05);
          admissions.push({
            ref: opaqueRef("A", ref),
            caseRef: ref,
            indexSurgeonId: s.id,
            dischargingId: chiefDischarges ? "S01" : r.chance(0.12) ? r.pick(surgeons.filter((o) => o.site === s.site)).id : s.id,
            admitDate: date,
            period: p,
            losDays: los,
            expectedLos: Math.round(exp * 10) / 10,
            readmit30: r.chance(0.07 * comp),
            expectedReadmit: 0.07,
            died: r.chance(expDeath * comp),
            expectedDeath: expDeath,
            relativeWeight: Math.round((proc.min / 110 + r.normal(0.4, 0.3)) * 100) / 100,
            icu: proc.cat === "cranial" || r.chance(0.2),
          });
        }
      }
      }
      // Clinic visits
      const nv = Math.max(4, Math.round(r.normal(pr.visits, 5)));
      for (let i = 0; i < nv; i++) {
        const date = r.pick(days);
        const late = !r.chance(pr.notes72);
        visits.push({
          ref: opaqueRef("V", `${s.id}:${p}:${i}`),
          clinicianId: s.id,
          date,
          period: p,
          newPatient: r.chance(pr.newShare),
          noteSignedHours: late ? r.int(73, 240) : r.int(1, 70),
        });
      }
      // Third-next-available samples: weekly
      for (let w = 0; w < 4; w++) {
        const date = days[Math.min(days.length - 1, w * 5)];
        samples.push({
          ref: opaqueRef("T", `${s.id}:${p}:${w}`),
          clinicianId: s.id,
          date,
          period: p,
          days: Math.max(2, Math.round(r.normal(pr.access, 6))),
        });
      }
      // Survey responses (some months fall under 10)
      const nr = Math.max(3, Math.round(r.normal(13, 4)));
      for (let i = 0; i < nr; i++) {
        const t = pr.survey;
        const top = (bias: number) => (r.chance(Math.min(0.97, t + bias)) ? 5 : r.int(2, 4));
        const rec = r.chance(t + 0.1) ? r.int(9, 10) : r.chance(0.6) ? r.int(7, 8) : r.int(3, 6);
        const commentRoll = r.next();
        surveys.push({
          ref: opaqueRef("R", `${s.id}:${p}:${i}`),
          clinicianId: s.id,
          period: p,
          returnedOn: addDays(`${p}-01`, r.int(18, 40)),
          recommend: rec,
          explained: top(0),
          listened: top(0.05),
          respect: top(0.12),
          comment: commentRoll < 0.3 ? (rec >= 9 ? r.pick(COMMENTS_POSITIVE) : r.pick(COMMENTS_MIXED)) : undefined,
        });
      }
      // Block schedule
      if (s.hasBlock) {
        const blockDays = days.filter((_, i) => i % 5 === (Number(s.id.slice(1)) % 5)).slice(0, 4);
        for (const d of blockDays) {
          const released = r.chance(0.15) ? 600 : r.chance(0.2) ? 240 : 0;
          const allocated = 600;
          const avail = allocated - released;
          blocks.push({
            ref: opaqueRef("B", `${s.id}:${d}`),
            clinicianId: s.id,
            date: d,
            period: p,
            allocatedMin: allocated,
            releasedMin: released,
            usedMin: avail === 0 ? 0 : Math.min(avail, Math.round(avail * r.normal(0.8, 0.12))),
          });
        }
      }
      // wRVU
      const base = pr.wrvu * (parse(p).y === 2026 || parse(p).m >= 10 && parse(p).y === 2025 ? 1.04 : 1);
      wrvu.push({
        clinicianId: s.id,
        period: p,
        wrvu: Math.round(r.normal(base, base * 0.08)),
        asOf: "2026-09-04",
      });
    }
  }

  // Billing lag: the two most recent months are still accruing.
  for (const w of wrvu) {
    if (w.period === LATEST_PUBLISHED) {
      w.priorSnapshot = Math.round(w.wrvu * 0.82);
      w.wrvu = Math.round(w.wrvu * 0.88);
    } else if (w.period === addMonths(LATEST_PUBLISHED, -1)) {
      w.priorSnapshot = Math.round(w.wrvu * 0.95);
      w.wrvu = Math.round(w.wrvu * 0.97);
    }
  }

  // M&M sessions: one per month, second Wednesday.
  const sessions: MMSession[] = [];
  const attendance: Attendance[] = [];
  const topics = [
    "Postoperative epidural hematoma after lumbar fusion", "Delayed diagnosis of shunt failure",
    "Wrong-level exposure caught at localization", "CSF leak after endonasal approach",
    "Vasospasm management after clipping", "Retained sponge count discrepancy",
    "Airway loss after anterior cervical surgery", "DBS lead misplacement",
    "Pediatric fluid management", "VTE despite prophylaxis", "Unplanned ICU return after tumor resection",
    "Consent and site-marking near miss",
  ];
  // The whole fiscal year is scheduled in advance; attendance exists only for sessions already held.
  for (const p of range(DATA_START, fyEnd(LATEST_PUBLISHED))) {
    const days = workdays(p).filter((d) => new Date(`${d}T00:00:00Z`).getUTCDay() === 3);
    const date = days[1] ?? days[0];
    const ref = opaqueRef("M", p);
    sessions.push({ ref, date, period: p, topic: topics[parse(p).m - 1] });
    if (p > LATEST_PUBLISHED) continue;
    for (const s of surgeons) {
      if (date < s.facultyStart) continue;
      const r = rng(`mm:${s.id}:${p}`);
      const leave = s.id === "S05" && (p === "2026-02" || p === "2026-03");
      attendance.push({
        sessionRef: ref,
        clinicianId: s.id,
        status: leave ? "leave" : r.chance(s.profile.mmAttend) ? "attended" : "absent",
      });
    }
  }

  return {
    people, surgeons, apps, clinicians, cases, admissions, visits, samples, surveys, sessions, attendance, wrvu, blocks,
    refreshedOn: "2026-09-10",
  };
}

let cached: Department | null = null;
export function department(): Department {
  if (!cached) cached = build();
  return cached;
}

export function person(id: string): Person | undefined {
  return department().people.find((p) => p.id === id);
}

export function personByRef(ref: string): Person | undefined {
  return department().people.find((p) => p.ref === ref);
}
