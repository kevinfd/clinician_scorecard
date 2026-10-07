// Mutable state: disputes filed in the app, decision events, private notes, first-visit markers.
// Backend: Upstash Redis over REST when KV_REST_API_URL/KV_REST_API_TOKEN (or UPSTASH_REDIS_REST_*) are set,
// otherwise chunked cookies in the viewer's browser (demo mode: state is per browser).

import { cookies } from "next/headers";
import { applyEvents, overridesFrom, seededDisputes, type Dispute, type DisputeEvent, type OverrideMap } from "./disputes";
import { DISPUTES_ENABLED } from "./features";

export interface Note {
  id: string;
  surveyRef: string;
  authorId: string;
  text: string;
  savedAt: string;
  deleted?: boolean;
}

export interface AppState {
  disputes: Dispute[];
  events: DisputeEvent[];
  notes: Note[];
  visited: string[]; // viewer ids who have opened the hosted view
}

const EMPTY: AppState = { disputes: [], events: [], notes: [], visited: [] };
const KEY = "clinician-scorecard:state:v1";
const COOKIE = "cs_state";
const CHUNK = 3800;
const MAX_CHUNKS = 8;

function kv(): { url: string; token: string } | null {
  const url = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
  return url && token ? { url: url.replace(/\/$/, ""), token } : null;
}

export function storageMode(): "shared" | "browser" {
  return kv() ? "shared" : "browser";
}

function sanitize(raw: unknown): AppState {
  if (!raw || typeof raw !== "object") return { ...EMPTY };
  const s = raw as Partial<AppState>;
  return {
    disputes: Array.isArray(s.disputes) ? s.disputes : [],
    events: Array.isArray(s.events) ? s.events : [],
    notes: Array.isArray(s.notes) ? s.notes : [],
    visited: Array.isArray(s.visited) ? s.visited : [],
  };
}

export async function loadState(): Promise<AppState> {
  const k = kv();
  if (k) {
    try {
      const res = await fetch(`${k.url}/get/${encodeURIComponent(KEY)}`, {
        headers: { Authorization: `Bearer ${k.token}` },
        cache: "no-store",
      });
      if (!res.ok) return { ...EMPTY };
      const body = (await res.json()) as { result: string | null };
      return sanitize(body.result ? JSON.parse(body.result) : null);
    } catch {
      return { ...EMPTY };
    }
  }
  const jar = await cookies();
  let joined = "";
  for (let i = 0; i < MAX_CHUNKS; i++) {
    const part = jar.get(`${COOKIE}${i}`)?.value;
    if (!part) break;
    joined += part;
  }
  if (!joined) return { ...EMPTY };
  try {
    return sanitize(JSON.parse(Buffer.from(joined, "base64url").toString("utf8")));
  } catch {
    return { ...EMPTY };
  }
}

export class StateTooLarge extends Error {}

/** Only callable from a server action or route handler. */
export async function saveState(state: AppState): Promise<void> {
  const k = kv();
  if (k) {
    const res = await fetch(`${k.url}/set/${encodeURIComponent(KEY)}`, {
      method: "POST",
      headers: { Authorization: `Bearer ${k.token}` },
      body: JSON.stringify(state),
      cache: "no-store",
    });
    if (!res.ok) throw new Error(`State store refused the write (${res.status}).`);
    return;
  }
  const encoded = Buffer.from(JSON.stringify(state), "utf8").toString("base64url");
  const chunks = Math.ceil(encoded.length / CHUNK);
  if (chunks > MAX_CHUNKS) throw new StateTooLarge("Browser storage is full.");
  const jar = await cookies();
  for (let i = 0; i < MAX_CHUNKS; i++) {
    const name = `${COOKIE}${i}`;
    if (i < chunks) {
      jar.set(name, encoded.slice(i * CHUNK, (i + 1) * CHUNK), {
        httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", maxAge: 60 * 60 * 24 * 30,
      });
    } else if (jar.get(name)) {
      jar.delete(name);
    }
  }
}

export async function resetState(): Promise<void> {
  await saveState({ ...EMPTY });
}

export interface Live {
  state: AppState;
  disputes: Dispute[];
  ov: OverrideMap;
}

/** Seeded plus filed disputes, with decisions applied, and the overrides they produce. */
export async function live(): Promise<Live> {
  const state = await loadState();
  // With disputes switched off, no dispute exists and no adjudicated value applies: every number is as logged.
  if (!DISPUTES_ENABLED) return { state, disputes: [], ov: new Map() };
  const seeded = seededDisputes();
  const seededIds = new Set(seeded.map((d) => d.id));
  const all = [...seeded, ...state.disputes.filter((d) => !seededIds.has(d.id))];
  const disputes = applyEvents(all, state.events);
  return { state, disputes, ov: overridesFrom(disputes) };
}
