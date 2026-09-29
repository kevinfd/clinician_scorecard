import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { buildTours, isTourId, tourStepUrl } from "@/lib/tours";
import { PASS_COOKIE, passToken, VIEWER_COOKIE } from "@/lib/session";

// Switch to the step's synthetic identity, then land on the step's page with the tour running.
export async function GET(req: Request) {
  const url = new URL(req.url);
  const tour = url.searchParams.get("tour");
  const step = Number(url.searchParams.get("step") ?? "0");
  const base = `${url.protocol}//${url.host}`;
  if (!isTourId(tour)) return NextResponse.redirect(new URL("/", base));
  const def = buildTours()[tour];
  const s = def.steps[Math.max(0, Math.min(def.steps.length - 1, Number.isFinite(step) ? step : 0))];
  const jar = await cookies();
  if (process.env.DEMO_PASSCODE && jar.get(PASS_COOKIE)?.value !== passToken()) return NextResponse.redirect(new URL("/", base));
  jar.set(VIEWER_COOKIE, s.as, { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", maxAge: 60 * 60 * 8 });
  return NextResponse.redirect(new URL(tourStepUrl(s.route, tour, def.steps.indexOf(s)), base));
}
