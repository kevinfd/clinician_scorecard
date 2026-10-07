import { cookies } from "next/headers";
import Link from "next/link";
import {
  ArrowRight, Building2, CalendarCheck, CircleCheck, ClipboardList, Gavel, HeartPulse, Inbox, MessageSquareQuote, PlayCircle, Scale, ShieldCheck, Stethoscope, TableProperties,
} from "lucide-react";
import { enterPasscode, signIn } from "./actions";
import { Shell } from "@/components/Shell";
import { btn, Card } from "@/components/ui";
import { department } from "@/lib/synth";
import { PASS_COOKIE, passToken, roleWords, viewer } from "@/lib/session";
import { buildTours, type TourDef } from "@/lib/tours";
import { monthName, LATEST_PUBLISHED } from "@/lib/periods";
import { cn } from "@/lib/cn";

const ICONS: Record<string, React.ReactNode> = {
  month: <Stethoscope className="size-5" strokeWidth={2} />,
  app: <HeartPulse className="size-5" strokeWidth={2} />,
  department: <Building2 className="size-5" strokeWidth={2} />,
  dispute: <Scale className="size-5" strokeWidth={2} />,
  feedback: <MessageSquareQuote className="size-5" strokeWidth={2} />,
  close: <ClipboardList className="size-5" strokeWidth={2} />,
};
const HIGHLIGHT_ICONS = [TableProperties, CircleCheck, ShieldCheck, CalendarCheck];
const HIGHLIGHT_ICONS_DISPUTE = [ClipboardList, Gavel, ShieldCheck, CircleCheck];
const HIGHLIGHT_ICONS_FEEDBACK = [TableProperties, ShieldCheck, Inbox, CalendarCheck];

export default async function Home({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;
  const v = await viewer();
  const d = department();
  const list = Object.values(buildTours()).filter((t): t is TourDef => !!t);
  const cast = d.people.filter((p) => p.featured);
  const locked = !!process.env.DEMO_PASSCODE && (await cookies()).get(PASS_COOKIE)?.value !== passToken();

  return (
    <Shell viewer={v} section="home">
      <div className="mx-auto flex max-w-6xl flex-col gap-10 py-4">
        <section className="text-center">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1 text-[11px] font-medium uppercase tracking-wider text-slate-500">
            <span className="size-1.5 rounded-full bg-teal-500" />Neurosurgery · synthetic demo
          </span>
          <h1 className="mt-4 text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
            Every number a clinician can trust,
            <br className="hidden sm:block" /> because every record can be checked
          </h1>
          <p className="mx-auto mt-3 max-w-2xl text-[15px] leading-relaxed text-slate-500">
            Volume, efficiency, access, outcomes, patient experience and citizenship for each surgeon and advanced
            practice provider, with the records behind every number, anonymous peer comparison, and a pooled view for
            the chair. Take a guided tour, or enter as one of the people below.
          </p>
        </section>

        {locked ? (
          <Card className="mx-auto w-full max-w-md p-6">
            <form action={enterPasscode} className="flex flex-col gap-3">
              <label htmlFor="passcode" className="text-[13px] font-semibold text-slate-900">Demo passcode</label>
              <input id="passcode" name="passcode" type="password" autoComplete="off" required aria-describedby="pc-help"
                className="min-h-11 rounded-lg border border-slate-300 px-3 text-[14px]" />
              <p id="pc-help" className="text-[12px] text-slate-500">Whoever shared this link has the passcode.</p>
              {error === "passcode" ? <p role="alert" className="text-[13px] font-medium text-amber-800">Passcode not accepted. Type it again.</p> : null}
              <button type="submit" className={btn("primary")}>Continue</button>
            </form>
          </Card>
        ) : (
          <>
            <section id="tours" aria-labelledby="tours-h" className="scroll-mt-24">
              <h2 id="tours-h" className="sr-only">Guided tours</h2>
              <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                {list.map((t, i) => (
                  <div key={t.id} className={cn("flex", list.length % 2 === 1 && i === list.length - 1 && "md:col-span-2")}>
                    <JourneyCard tour={t} />
                  </div>
                ))}
              </div>
            </section>

            <section aria-labelledby="people-h">
              <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
                <div>
                  <h2 id="people-h" className="text-[15px] font-semibold text-slate-900">Or enter as one of the demo cast</h2>
                  <p className="mt-0.5 text-[13px] text-slate-500">
                    Each person sees exactly what their role allows. The rest of the department appears only as anonymous peers.
                  </p>
                </div>
              </div>
              <Card className="divide-y divide-slate-100">
                <div className="grid grid-cols-1 divide-y divide-slate-100 sm:grid-cols-2 sm:divide-y-0">
                  {[cast.filter((p) => p.isClinician && !p.roles.includes("chief")), cast.filter((p) => !p.isClinician || p.roles.includes("chief"))].map((col, ci) => (
                    <div key={ci} className={cn("divide-y divide-slate-100", ci === 1 && "sm:border-l sm:border-slate-100")}>
                      {col.map((p) => (
                        <form key={p.id} action={signIn} className="flex items-center justify-between gap-3 px-4 py-2.5">
                          <input type="hidden" name="id" value={p.id} />
                          <div className="min-w-0">
                            <div className="truncate text-[13px] font-medium text-slate-900">{p.name}</div>
                            <div className="truncate text-[12px] text-slate-500">{roleWords(p)}</div>
                          </div>
                          <button type="submit" className={btn("secondary", "sm")} aria-label={`Continue as ${p.name}`}>
                            Enter<ArrowRight className="size-3.5" strokeWidth={2} />
                          </button>
                        </form>
                      ))}
                    </div>
                  ))}
                </div>
              </Card>
            </section>
          </>
        )}

        <p className="text-center text-[12px] text-slate-400">
          All data is synthetic: {d.surgeons.length} neurosurgeons and {d.apps.length} advanced practice providers at two sites, {d.cases.length.toLocaleString("en-US")} cases,
          data through {monthName(LATEST_PUBLISHED)}. Not for clinical use. Switch identity any time from the top-right.
        </p>
      </div>
    </Shell>
  );
}

function JourneyCard({ tour }: { tour: TourDef }) {
  const accent = {
    teal: { ring: "bg-teal-50 text-teal-700", btn: "primary" as const },
    violet: { ring: "bg-violet-50 text-violet-700", btn: "violet" as const },
    amber: { ring: "bg-amber-50 text-amber-800", btn: "primary" as const },
    slate: { ring: "bg-slate-100 text-slate-700", btn: "primary" as const },
  }[tour.accent];
  const icons = tour.id === "dispute" ? HIGHLIGHT_ICONS_DISPUTE : tour.id === "feedback" ? HIGHLIGHT_ICONS_FEEDBACK : HIGHLIGHT_ICONS;
  const who = department().people.find((p) => p.id === tour.enterAs)!;
  return (
    <div className="flex w-full flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md">
      <div className="flex items-center gap-3">
        <span className={cn("flex size-10 items-center justify-center rounded-xl", accent.ring)}>{ICONS[tour.id]}</span>
        <div>
          <p className="text-[11px] font-medium text-slate-400">{tour.persona}</p>
          <h3 className="text-lg font-semibold text-slate-900">{tour.label}</h3>
        </div>
      </div>
      <p className="text-[13px] leading-relaxed text-slate-500">{tour.blurb}</p>
      <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {tour.highlights.map((h, i) => {
          const I = icons[i % icons.length];
          return (
            <li key={h} className="flex items-center gap-2.5 text-[13px] text-slate-700">
              <I className="size-4 shrink-0 text-slate-400" strokeWidth={1.75} />{h}
            </li>
          );
        })}
      </ul>
      <div className="mt-auto flex flex-col gap-2 pt-1 sm:flex-row">
        <a href={`/tour/go?tour=${tour.id}&step=0`} className={cn(btn(accent.btn), "flex-1")}>
          <PlayCircle className="size-4" strokeWidth={2} />Take the tour · {tour.steps.length} steps
        </a>
        <form action={signIn} className="flex-1">
          <input type="hidden" name="id" value={who.id} />
          <button type="submit" className={cn(btn("secondary"), "w-full")}>Enter as {who.name.replace(/^Dr\. /, "Dr. ")}<ArrowRight className="size-4" strokeWidth={2} /></button>
        </form>
      </div>
    </div>
  );
}
