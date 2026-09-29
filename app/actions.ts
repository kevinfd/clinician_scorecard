"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { passToken, viewer, VIEWER_COOKIE, PASS_COOKIE, isAdjudicator } from "@/lib/session";
import { person } from "@/lib/synth";
import { live, saveState, StateTooLarge, resetState } from "@/lib/store";
import { findRecord } from "@/lib/records";
import {
  adjudicatorFor, CLAIM_LIMIT, nextDisputeId, routeFor, seededDisputes, FIELD_LABELS,
  type DisputeField, type DisputeState,
} from "@/lib/disputes";

const today = () => new Date().toISOString().slice(0, 10);

const MRN = /\b\d{7,10}\b/;
const DOB = /\b(0?[1-9]|1[0-2])[/-](0?[1-9]|[12]\d|3[01])[/-](19|20)\d{2}\b/;

function identifierIn(text: string): string | null {
  if (MRN.test(text)) return "a number that looks like a medical record number";
  if (DOB.test(text)) return "a date that looks like a date of birth";
  return null;
}

// ---------- sign-in ----------

export async function enterPasscode(formData: FormData) {
  const code = String(formData.get("passcode") ?? "");
  const jar = await cookies();
  if (!process.env.DEMO_PASSCODE || code !== process.env.DEMO_PASSCODE) redirect("/?error=passcode");
  jar.set(PASS_COOKIE, passToken(), { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", maxAge: 60 * 60 * 8 });
  redirect("/");
}

export async function signIn(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const p = person(id);
  const jar = await cookies();
  if (process.env.DEMO_PASSCODE && jar.get(PASS_COOKIE)?.value !== passToken()) redirect("/");
  if (!p) redirect("/");
  jar.set(VIEWER_COOKIE, p.id, { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", maxAge: 60 * 60 * 8 });
  if (p.isSurgeon) redirect("/me");
  if (p.roles.includes("chair")) redirect("/queue");
  redirect("/analyst");
}

export async function signOut() {
  const jar = await cookies();
  jar.delete(VIEWER_COOKIE);
  redirect("/");
}

export async function resetDemo() {
  const v = await viewer();
  if (!v?.roles.includes("analyst")) redirect("/");
  await resetState();
  revalidatePath("/", "layout");
  redirect("/analyst?reset=1");
}

// ---------- disputes ----------

export interface FormState {
  errors?: Partial<Record<"claim" | "field" | "proposed" | "note" | "decision" | "outcome" | "form", string>>;
  values?: Record<string, string>;
}

export async function fileDispute(_prev: FormState, formData: FormData): Promise<FormState> {
  const v = await viewer();
  if (!v?.isSurgeon) return { errors: { form: "This action is not available to you." } };
  const ref = String(formData.get("ref") ?? "");
  const field = String(formData.get("field") ?? "") as DisputeField;
  const proposed = String(formData.get("proposed") ?? "");
  const claim = String(formData.get("claim") ?? "").trim();
  const values = { field, proposed, claim };
  const { state, disputes, ov } = await live();
  const rec = findRecord(ref, ov);
  if (!rec || (rec.ownerId !== v.id && rec.loggedOwnerId !== v.id)) return { errors: { form: "This record is not credited to you." }, values };

  const errors: FormState["errors"] = {};
  if (!rec.fields.includes(field) || !FIELD_LABELS[field]) errors.field = "Choose what is wrong with this record.";
  if ((field === "primary_surgeon") && !person(proposed)?.isSurgeon) errors.proposed = "Choose the surgeon the case should be credited to.";
  if (!claim) errors.claim = "Write what happened before filing.";
  else if (claim.length > CLAIM_LIMIT) errors.claim = `Your claim is ${claim.length.toLocaleString("en-US")} characters; the limit is 1,000.`;
  else {
    const id = identifierIn(claim);
    if (id) errors.claim = `Your claim appears to contain ${id}. Describe the record by its case id and what happened, then file again.`;
  }
  if (Object.keys(errors).length) return { errors, values };

  // Idempotent on (record, field, filer): add to an open dispute instead of opening a second one.
  const open = disputes.find((d) => d.recordRef === ref && d.field === field && d.filedById === v.id && d.state === "open");
  if (open) {
    const stored = state.disputes.find((d) => d.id === open.id);
    if (stored) stored.claim = `${stored.claim}\n\nAdded ${today()}: ${claim}`.slice(0, CLAIM_LIMIT * 2);
    try { await saveState(state); } catch (e) { return storageError(e, values); }
    redirect(`/disputes/${open.id}?filed=1`);
  }

  const route = routeFor({ filedById: v.id, recordRef: ref, recordType: rec.type, proposedClinicianId: field === "primary_surgeon" ? proposed : undefined });
  const id = nextDisputeId([...seededDisputes(), ...state.disputes]);
  state.disputes.push({
    id, recordRef: ref, recordType: rec.type, field, proposedClinicianId: field === "primary_surgeon" ? proposed : undefined,
    claim, filedById: v.id, filedOn: today(), route: route.route, routingReason: route.reason, state: "open",
  });
  try { await saveState(state); } catch (e) { return storageError(e, values); }
  revalidatePath("/", "layout");
  redirect(`/disputes/${id}?filed=1`);
}

function storageError(e: unknown, values: Record<string, string>): FormState {
  if (e instanceof StateTooLarge)
    return { errors: { form: "This browser's demo storage is full. The department analyst can reset the demo from the period close page." }, values };
  return { errors: { form: "The dispute could not be saved. Your claim is kept below; try again." }, values };
}

export async function decideDispute(_prev: FormState, formData: FormData): Promise<FormState> {
  const v = await viewer();
  const id = String(formData.get("id") ?? "");
  const decision = String(formData.get("decision") ?? "");
  const outcome = String(formData.get("outcome") ?? "");
  const note = String(formData.get("note") ?? "").trim();
  const values = { decision, outcome, note };
  if (!isAdjudicator(v)) return { errors: { form: "This action is not available to you." }, values };
  const { state, disputes } = await live();
  const d = disputes.find((x) => x.id === id);
  if (!d || adjudicatorFor(d).id !== v!.id) return { errors: { form: "This dispute is not routed to you." }, values };
  if (d.state !== "open") return { errors: { form: "This dispute has already been decided." }, values };
  const errors: FormState["errors"] = {};
  if (!["sustained", "not_sustained", "definition_question"].includes(decision)) errors.decision = "Choose a decision.";
  if (decision === "sustained" && !["annotated", "source_corrected"].includes(outcome)) errors.outcome = "Choose what a sustained decision does to the record.";
  if (!note) errors.note = "Write the note the surgeon will read before recording the decision.";
  else if (note.length > CLAIM_LIMIT) errors.note = `Your note is ${note.length.toLocaleString("en-US")} characters; the limit is 1,000.`;
  else {
    const ident = identifierIn(note);
    if (ident) errors.note = `Your note appears to contain ${ident}. Refer to the record by its id.`;
  }
  if (Object.keys(errors).length) return { errors, values };
  const st: DisputeState = decision === "sustained" ? (outcome === "source_corrected" ? "sustained_source_corrected" : "sustained_annotated") : (decision as DisputeState);
  state.events.push({ disputeId: id, kind: "decided", state: st, byId: v!.id, on: today(), note });
  try { await saveState(state); } catch (e) { return storageError(e, values); }
  revalidatePath("/", "layout");
  redirect(`/queue?decided=${id}`);
}

export async function withdrawDispute(formData: FormData) {
  const v = await viewer();
  const id = String(formData.get("id") ?? "");
  const { state, disputes } = await live();
  const d = disputes.find((x) => x.id === id);
  if (!v || !d || d.filedById !== v.id || d.state !== "open") redirect(`/disputes/${id}`);
  state.events.push({ disputeId: id, kind: "withdrawn", state: "withdrawn", byId: v.id, on: today() });
  await saveState(state);
  revalidatePath("/", "layout");
  redirect(`/disputes/${id}`);
}

// ---------- private notes on inbox comments ----------

export async function saveNote(formData: FormData) {
  const v = await viewer();
  const surveyRef = String(formData.get("surveyRef") ?? "");
  const text = String(formData.get("text") ?? "").trim();
  if (!v?.isSurgeon) redirect("/me/inbox");
  if (!text) redirect(`/me/inbox?error=note-required&on=${surveyRef}#${surveyRef}`);
  const { state } = await live();
  state.notes = state.notes.filter((n) => !(n.surveyRef === surveyRef && n.authorId === v.id && n.deleted));
  const existing = state.notes.find((n) => n.surveyRef === surveyRef && n.authorId === v.id && !n.deleted);
  const savedAt = new Date().toISOString();
  if (existing) Object.assign(existing, { text: text.slice(0, 2000), savedAt });
  else state.notes.push({ id: `${surveyRef}:${v.id}`, surveyRef, authorId: v.id, text: text.slice(0, 2000), savedAt });
  await saveState(state);
  redirect(`/me/inbox?saved=${surveyRef}#${surveyRef}`);
}

export async function deleteNote(formData: FormData) {
  const v = await viewer();
  const surveyRef = String(formData.get("surveyRef") ?? "");
  if (!v) redirect("/");
  const { state } = await live();
  const n = state.notes.find((x) => x.surveyRef === surveyRef && x.authorId === v.id && !x.deleted);
  if (n) n.deleted = true;
  await saveState(state);
  redirect(`/me/inbox?deleted=${surveyRef}#${surveyRef}`);
}

export async function restoreNote(formData: FormData) {
  const v = await viewer();
  const surveyRef = String(formData.get("surveyRef") ?? "");
  if (!v) redirect("/");
  const { state } = await live();
  const n = state.notes.find((x) => x.surveyRef === surveyRef && x.authorId === v.id && x.deleted);
  if (n) n.deleted = false;
  await saveState(state);
  redirect(`/me/inbox?saved=${surveyRef}#${surveyRef}`);
}
