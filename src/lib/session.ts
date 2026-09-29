// Demo sign-in and authorization. In production this is MGB SSO (technical design D-06);
// here a viewer picks a synthetic identity. Every page checks the matrix server-side.

import { cookies } from "next/headers";
import { department, person, type Person, type Role } from "./synth";

export const VIEWER_COOKIE = "cs_viewer";
export const PASS_COOKIE = "cs_pass";

export async function viewer(): Promise<Person | null> {
  const jar = await cookies();
  const id = jar.get(VIEWER_COOKIE)?.value;
  if (!id) return null;
  if (process.env.DEMO_PASSCODE && jar.get(PASS_COOKIE)?.value !== passToken()) return null;
  return person(id) ?? null;
}

export function passToken(): string {
  // Not a secret: proves only that the passcode was typed in this browser.
  const code = process.env.DEMO_PASSCODE ?? "";
  let h = 0;
  for (let i = 0; i < code.length; i++) h = (Math.imul(h, 31) + code.charCodeAt(i)) >>> 0;
  return `p${h.toString(36)}`;
}

export function has(p: Person | null, role: Role): boolean {
  return !!p && p.roles.includes(role);
}

export function isAdjudicator(p: Person | null): boolean {
  return has(p, "chief") || has(p, "chair");
}

/** Surgeons whose inbox this person may read as direct leader of record (GR: surgeon and direct leader only). */
export function reportsOf(p: Person | null): Person[] {
  if (!p) return [];
  return department().surgeons.filter((s) => s.directLeaderId === p.id);
}

export function roleWords(p: Person): string {
  const parts: string[] = [];
  if (p.isSurgeon) parts.push(`${p.subspecialty} surgeon, ${p.site}`);
  if (p.roles.includes("chief")) parts.push("division chief");
  if (p.roles.includes("leader") && !p.roles.includes("chief")) parts.push("site lead");
  if (p.roles.includes("chair")) parts.push("department chair");
  if (p.roles.includes("analyst")) parts.push("department analyst");
  return parts.join("; ");
}

export const ANALYST_MAILBOX = "scorecard-analyst@example.org";
