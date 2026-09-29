// Dispute model, routing predicates (GR2) and overrides.
// A sustained dispute never edits a source row: it adds an override that the adjudicated basis reads.

import { addDays, longDate } from "./periods";
import { department, opaqueRef, person, type Person } from "./synth";

export type RecordType = "case" | "admission" | "survey" | "attendance";

export type DisputeField =
  | "delay_attribution" // late first case: the delay was not mine
  | "on_time" // wheels-in was at or before the scheduled start
  | "primary_surgeon" // not my case: credit it to another surgeon
  | "cancel_attribution" // same-day cancellation was not surgeon-attributable
  | "index_surgeon" // admission: I did not do the index operation
  | "provider_named" // survey: I was not this patient's provider
  | "attendance"; // M&M: I attended but the scan did not record it

export const FIELD_LABELS: Record<DisputeField, string> = {
  delay_attribution: "The delay reason: the delay was not mine",
  on_time: "On time: the patient was in the room at or before the scheduled start",
  primary_surgeon: "Not my case: it should be credited to another surgeon",
  cancel_attribution: "The cancellation reason: it was not within my control",
  index_surgeon: "Not my admission: I did not do the index operation",
  provider_named: "Not my patient: I was not the provider for this visit",
  attendance: "I attended: the scan did not record me",
};

export type DisputeState =
  | "open"
  | "sustained_annotated"
  | "sustained_source_corrected"
  | "not_sustained"
  | "definition_question"
  | "withdrawn";

export type Route = "chief" | "chair";

export interface Dispute {
  id: string; // D-0014
  recordRef: string;
  recordType: RecordType;
  field: DisputeField;
  proposedClinicianId?: string; // for re-credit fields
  claim: string;
  filedById: string;
  filedOn: string;
  route: Route;
  routingReason: string;
  state: DisputeState;
  decidedById?: string;
  decidedOn?: string;
  note?: string;
  seeded?: boolean;
}

export interface DisputeEvent {
  disputeId: string;
  kind: "decided" | "withdrawn";
  state: DisputeState;
  byId: string;
  on: string;
  note?: string;
}

export const CLAIM_LIMIT = 1000;
export const TARGET_DAYS = 14;

// ---------- routing (GR2): chief, or chair if the chief is involved ----------

export function chiefOf(_p: Person): Person {
  return department().people.find((x) => x.roles.includes("chief"))!;
}

export function chair(): Person {
  return department().people.find((x) => x.roles.includes("chair"))!;
}

/** Everyone who appears on the record: used by routing test (c). */
export function recordParticipants(recordRef: string, recordType: RecordType): string[] {
  const d = department();
  if (recordType === "case") {
    const c = d.cases.find((x) => x.ref === recordRef);
    return c ? [c.primaryId, ...(c.cosurgeonId ? [c.cosurgeonId] : [])] : [];
  }
  if (recordType === "admission") {
    const a = d.admissions.find((x) => x.ref === recordRef);
    return a ? [a.indexSurgeonId, a.dischargingId] : [];
  }
  if (recordType === "survey") {
    const s = d.surveys.find((x) => x.ref === recordRef);
    return s ? [s.clinicianId] : [];
  }
  return [];
}

export function routeFor(input: {
  filedById: string;
  recordRef: string;
  recordType: RecordType;
  proposedClinicianId?: string;
}): { route: Route; reason: string } {
  const filer = person(input.filedById)!;
  const chief = chiefOf(filer);
  if (chief.id === input.filedById) return { route: "chair", reason: "The division chief filed this dispute." };
  if (input.proposedClinicianId === chief.id)
    return { route: "chair", reason: "The record would be credited to the division chief." };
  if (recordParticipants(input.recordRef, input.recordType).includes(chief.id))
    return { route: "chair", reason: "The division chief is on this record." };
  return { route: "chief", reason: "Disputes go to the division chief." };
}

export function routeWords(route: Route): string {
  return route === "chair" ? "the chair" : "your division chief";
}

export function adjudicatorFor(d: Dispute): Person {
  return d.route === "chair" ? chair() : chiefOf(person(d.filedById)!);
}

export function dueDate(d: Dispute): string {
  return addDays(d.filedOn, TARGET_DAYS);
}

export function isOpen(d: Dispute): boolean {
  return d.state === "open";
}

export function isSustained(d: Dispute): boolean {
  return d.state === "sustained_annotated" || d.state === "sustained_source_corrected";
}

export function nextDisputeId(existing: Dispute[]): string {
  const max = existing.reduce((m, d) => Math.max(m, Number(d.id.slice(2)) || 0), 0);
  return `D-${String(max + 1).padStart(4, "0")}`;
}

export function applyEvents(disputes: Dispute[], events: DisputeEvent[]): Dispute[] {
  const byId = new Map(disputes.map((d) => [d.id, { ...d }]));
  for (const e of events) {
    const d = byId.get(e.disputeId);
    if (!d || d.state !== "open") continue;
    d.state = e.state;
    d.decidedById = e.byId;
    d.decidedOn = e.on;
    d.note = e.note;
  }
  return [...byId.values()];
}

// ---------- overrides: what the adjudicated basis reads ----------

export type OverrideMap = Map<string, Partial<Record<DisputeField, string>>>;

export function overridesFrom(disputes: Dispute[]): OverrideMap {
  const m: OverrideMap = new Map();
  for (const d of disputes) {
    if (!isSustained(d)) continue;
    const o = m.get(d.recordRef) ?? {};
    switch (d.field) {
      case "primary_surgeon":
      case "index_surgeon":
        o[d.field] = d.proposedClinicianId ?? "none";
        break;
      case "provider_named":
        o[d.field] = "none";
        break;
      default:
        o[d.field] = "yes";
    }
    m.set(d.recordRef, o);
  }
  return m;
}

// ---------- surgeon-facing wording ----------

export function stateLine(d: Dispute): string {
  const who = d.route === "chair" ? "the chair" : "your division chief";
  const whoShort = d.route === "chair" ? "chair" : "chief";
  switch (d.state) {
    case "open":
      return `Disputed - with ${whoShort}, filed ${longDate(d.filedOn)}`;
    case "sustained_annotated":
      return `Dispute sustained by ${who} on ${longDate(d.decidedOn!)}: ${d.note}`;
    case "sustained_source_corrected":
      return `Dispute sustained by ${who} on ${longDate(d.decidedOn!)}: ${d.note} Periop asked to correct its record on ${longDate(d.decidedOn!)}.`;
    case "not_sustained":
      return `Dispute not sustained by ${who} on ${longDate(d.decidedOn!)}: ${d.note}`;
    case "definition_question":
      return `Referred as a definition question by ${who} on ${longDate(d.decidedOn!)}: ${d.note}`;
    case "withdrawn":
      return `Withdrawn by you on ${longDate(d.decidedOn!)}.`;
  }
}

export function stateTone(d: Dispute): "disputed" | "sustained" | "muted" {
  if (d.state === "open" || d.state === "not_sustained" || d.state === "definition_question") return "disputed";
  if (isSustained(d)) return "sustained";
  return "muted";
}

export function acknowledgement(d: Dispute): string {
  return `Dispute received on ${d.recordRef}, filed ${longDate(d.filedOn)}. ${
    d.route === "chair" ? "The chair decides" : "Your division chief decides"
  }; decision due ${longDate(dueDate(d))}.`;
}

export const DISPUTE_HOW =
  "Your division chief decides, or the chair if the chief is involved. The target is 14 days. The decision is one of: sustained, not sustained, or a definition question. A sustained decision corrects the row or credits the case to the right surgeon; the reason you gave and the decision stay on the row. Periop is asked to correct its record; until it does, both values show.";

// ---------- seeded disputes (part of the synthetic department) ----------

export function seededDisputes(): Dispute[] {
  const d = department();
  const pick = (surgeonId: string, pred: (c: (typeof d.cases)[number]) => boolean) =>
    d.cases.filter((c) => c.primaryId === surgeonId && pred(c)).at(-1);
  const out: Dispute[] = [];
  const late = pick("S02", (c) => c.firstCase && !!c.delay && c.period === "2026-08" && ["surgeon_late", "consent_incomplete", "site_marking", "hp_incomplete"].includes(c.delay));
  if (late) {
    const r = routeFor({ filedById: "S02", recordRef: late.ref, recordType: "case" });
    out.push({
      id: "D-0011", recordRef: late.ref, recordType: "case", field: "delay_attribution",
      claim: "Anesthesia was still with the prior patient in pre-op when I arrived at 07:20. The consent was signed the day before; the delay code is wrong.",
      filedById: "S02", filedOn: "2026-09-14", route: r.route, routingReason: r.reason, state: "open", seeded: true,
    });
  }
  const shared = pick("S04", (c) => c.period === "2026-07" && !c.cancelled && !c.firstCase);
  if (shared) {
    const r = routeFor({ filedById: "S04", recordRef: shared.ref, recordType: "case", proposedClinicianId: "S01" });
    out.push({
      id: "D-0012", recordRef: shared.ref, recordType: "case", field: "primary_surgeon", proposedClinicianId: "S01",
      claim: "I assisted on this case. Dr. Okafor was the primary surgeon and dictated the operative note.",
      filedById: "S04", filedOn: "2026-08-20", route: r.route, routingReason: r.reason, state: "open", seeded: true,
    });
  }
  const cancel = d.cases.filter((c) => c.primaryId === "S10" && c.cancelled && ["clearance_incomplete", "surgeon_unavailable", "consent_withdrawn"].includes(c.cancelled)).at(-1);
  if (cancel) {
    const r = routeFor({ filedById: "S10", recordRef: cancel.ref, recordType: "case" });
    out.push({
      id: "D-0010", recordRef: cancel.ref, recordType: "case", field: "cancel_attribution",
      claim: "The cardiology clearance was requested three weeks ahead and cardiology did not return it. That is not a surgeon-attributable reason.",
      filedById: "S10", filedOn: "2026-07-02", route: r.route, routingReason: r.reason,
      state: "sustained_annotated", decidedById: r.route === "chair" ? "P01" : "S01", decidedOn: "2026-07-11",
      note: "Clearance was ordered on time; the cancellation reason is changed to not surgeon-attributable.",
      seeded: true,
    });
  }
  return out;
}

export function newDisputeRefSeed(n: number): string {
  return opaqueRef("D", String(n));
}
