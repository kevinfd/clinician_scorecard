// One record, as the dispute form and the adjudicator's provenance panel see it.

import { CANCEL_LABELS, DELAY_LABELS, SURGEON_CANCELS, SURGEON_DELAYS, department, person } from "./synth";
import type { DisputeField, OverrideMap, RecordType } from "./disputes";
import { longDate, monthName } from "./periods";

export interface RecordView {
  ref: string;
  type: RecordType;
  loggedOwnerId: string;
  ownerId: string; // adjudicated
  period: string;
  facts: [string, string][]; // label, value (no patient identifiers)
  fields: DisputeField[];
  feeds: string[];
  source: string;
  attributionRule: string;
  participants: string[];
}

export function findRecord(ref: string, ov: OverrideMap): RecordView | null {
  const d = department();
  const o = ov.get(ref) ?? {};
  const c = d.cases.find((x) => x.ref === ref);
  if (c) {
    const owner = o.primary_surgeon ?? c.primaryId;
    const late = !!c.wheelsIn && c.wheelsIn > c.scheduledStart && !o.on_time;
    const fields: DisputeField[] = [];
    if (c.firstCase && late && c.delay && SURGEON_DELAYS.includes(c.delay) && !o.delay_attribution) fields.push("delay_attribution");
    if (c.firstCase && late) fields.push("on_time");
    if (c.cancelled && SURGEON_CANCELS.includes(c.cancelled) && !o.cancel_attribution) fields.push("cancel_attribution");
    if (!c.cancelled) fields.push("primary_surgeon");
    const feeds = ["OR case volume"];
    if (c.cancelled) feeds.splice(0, 1, "Same-day cancellations you could have prevented");
    else {
      if (c.firstCase) feeds.push("First-case on-time start (FCOT)");
      feeds.push("Duration estimate accuracy", "Same-day cancellations you could have prevented", "Unplanned return to the OR within 30 days", "Surgical site infection", "VTE within 30 days");
      if (c.category !== "other") feeds.push("CSF leak requiring intervention (neurosurgery only)");
    }
    const facts: [string, string][] = [
      ["Case id", c.ref],
      ["Date", longDate(c.date)],
      ["Room", c.room],
      ["Procedure", c.procedure],
      ["Primary surgeon (OR log)", person(c.primaryId)?.name ?? ""],
    ];
    if (c.shared) facts.push(["Shared", "Another surgeon is also recorded on this case"]);
    if (c.cancelled) facts.push(["Cancelled same day", CANCEL_LABELS[c.cancelled]]);
    else {
      facts.push(["Scheduled start", c.scheduledStart], ["Wheels in", c.wheelsIn ?? ""]);
      if (c.delay) facts.push(["Delay reason (OR log)", DELAY_LABELS[c.delay]]);
      facts.push(["Booked minutes", String(c.bookedMin)], ["Actual minutes", String(c.actualMin ?? "")]);
    }
    return {
      ref, type: "case", loggedOwnerId: c.primaryId, ownerId: owner, period: c.period, facts, fields, feeds,
      source: `Periop OR log extract for ${monthName(c.period)}, loaded ${longDate(d.refreshedOn)}`,
      attributionRule: "Surgical cases go to the primary surgeon in the OR log.",
      participants: [c.primaryId, ...(c.cosurgeonId ? [c.cosurgeonId] : [])],
    };
  }
  const a = d.admissions.find((x) => x.ref === ref);
  if (a) {
    const ic = d.cases.find((x) => x.ref === a.caseRef)!;
    return {
      ref, type: "admission", loggedOwnerId: a.indexSurgeonId, ownerId: o.index_surgeon ?? a.indexSurgeonId, period: a.period,
      facts: [
        ["Admission id", a.ref], ["Admitted", longDate(a.admitDate)], ["Index operation", `${ic.procedure} (${ic.ref})`],
        ["Index surgeon", person(a.indexSurgeonId)?.name ?? ""], ["Discharging surgeon", person(a.dischargingId)?.name ?? ""],
        ["Length of stay", `${a.losDays} days (expected ${a.expectedLos.toFixed(1)})`],
      ],
      fields: ["index_surgeon"],
      feeds: ["Case mix index", "Length of stay (O/E)", "30-day readmission (O/E)", "In-hospital mortality (O/E)"],
      source: `Vizient clinical data base extract, joined to the OR log index operation, loaded ${longDate(d.refreshedOn)}`,
      attributionRule: "Admissions go to the surgeon who did the index operation, even if a different attending discharged the patient.",
      participants: [a.indexSurgeonId, a.dischargingId],
    };
  }
  const s = d.surveys.find((x) => x.ref === ref);
  if (s) {
    return {
      ref, type: "survey", loggedOwnerId: s.clinicianId, ownerId: o.provider_named ? "none" : s.clinicianId, period: s.period,
      facts: [["Response id", s.ref], ["Survey month", monthName(s.period)], ["Returned", longDate(s.returnedOn)], ["Provider named", person(s.clinicianId)?.name ?? ""]],
      fields: o.provider_named ? [] : ["provider_named"],
      feeds: ["Net promoter score", "\"Provider explained things in a way I could understand\"", "\"Provider listened carefully\"", "\"Provider showed respect\"", "Patient feedback inbox"],
      source: "MGB patient survey vendor extract",
      attributionRule: "Surveys go to the provider named on the survey.",
      participants: [s.clinicianId],
    };
  }
  const [sessionRef, clinicianId] = ref.split(":");
  const session = d.sessions.find((x) => x.ref === sessionRef);
  const att = session && d.attendance.find((x) => x.sessionRef === sessionRef && x.clinicianId === clinicianId);
  if (session && att) {
    const attended = att.status === "attended" || !!o.attendance;
    return {
      ref, type: "attendance", loggedOwnerId: clinicianId, ownerId: clinicianId, period: session.period,
      facts: [["Session", `${longDate(session.date)}: ${session.topic}`], ["Recorded", attended ? "attended" : att.status === "leave" ? "approved leave" : "not recorded as attended"]],
      fields: !attended && att.status !== "leave" ? ["attendance"] : [],
      feeds: ["M&M attendance"],
      source: "QR-code attendance system",
      attributionRule: "Attendance goes to the person whose badge was scanned.",
      participants: [clinicianId],
    };
  }
  return null;
}

/** Surgeons a case could be re-credited to: the same site, not the filer. */
export function recreditOptions(filerId: string) {
  const filer = person(filerId);
  return department().surgeons.filter((s) => s.id !== filerId && s.site === filer?.site);
}
