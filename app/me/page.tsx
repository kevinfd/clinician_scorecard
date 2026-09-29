import Link from "next/link";
import { ArrowRight, Mail, MessageSquareQuote } from "lucide-react";
import { Shell, SignInFirst, NotAuthorized } from "@/components/Shell";
import { MetricCard } from "@/components/MetricCard";
import { Avatar, Callout, Card, SectionHeader, StatePill } from "@/components/ui";
import { viewer } from "@/lib/session";
import { live } from "@/lib/store";
import { BUCKETS, METRICS, SECTION_SLUG, type MetricDef } from "@/lib/metrics";
import { fmtValue, mmView, surveyView, tileFor, trendFor, wrvuView, type Tile } from "@/lib/engine";
import { addMonths, FIRST_PUBLISHED, longDate, monthName, monthOnly, normalizePeriod, publishDate } from "@/lib/periods";
import { department } from "@/lib/synth";
import { stateLine, stateTone } from "@/lib/disputes";
import type { OverrideMap } from "@/lib/disputes";
import type { Person } from "@/lib/synth";

export default async function Home({ searchParams }: { searchParams: Promise<{ period?: string }> }) {
  const v = await viewer();
  if (!v) return <Shell viewer={null}><SignInFirst /></Shell>;
  if (!v.isSurgeon) return <Shell viewer={v}><NotAuthorized /></Shell>;
  const period = normalizePeriod((await searchParams).period);
  const { disputes, ov } = await live();

  const tiles = new Map<string, Tile>(METRICS.map((m) => [m.key, tileFor(m, v, period, ov)]));
  const prev = addMonths(period, -1);
  const prevTiles = period === FIRST_PUBLISHED ? null : new Map(["or_case_volume", "fcot", "duration_accuracy"].map((k) => [k, tileFor(METRICS.find((m) => m.key === k)!, v, prev, ov)]));
  const since = publishDate(prev);
  const mine = disputes.filter((d) => d.filedById === v.id || d.proposedClinicianId === v.id);
  const decided = mine.filter((d) => d.decidedOn && d.decidedOn >= since && d.state !== "withdrawn");
  const open = mine.filter((d) => d.filedById === v.id && d.state === "open");

  return (
    <Shell viewer={v} period={period} section="scorecard" periodPath="/me" crumbs={[{ label: "Scorecard" }]}>
      <div className="flex flex-col gap-8">
        <Card className="p-5 sm:p-6" data-tour="me-header">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex items-start gap-4">
              <Avatar name={v.name} className="size-14" />
              <div>
                <p className="text-[11px] font-medium uppercase tracking-wider text-slate-500">Surgeon scorecard</p>
                <h1 className="mt-0.5 text-2xl font-semibold tracking-tight text-slate-900">{v.name}</h1>
                <p className="mt-1 text-[14px] text-slate-600">{v.subspecialty} · {v.site}</p>
                <p className="mt-1 text-[12.5px] text-slate-400">{monthName(period)} · published {longDate(publishDate(period))} · last refreshed {longDate(department().refreshedOn)}</p>
              </div>
            </div>
            <div className="flex flex-col items-start gap-2 sm:items-end">
              <span className="inline-flex items-center rounded-md border border-slate-200 bg-slate-50 px-2 py-1 text-[11px] font-medium text-slate-600">Only you see this page · peers are anonymous</span>
              <Link href={`/me/email?period=${period}`} className="inline-flex items-center gap-1.5 text-[13px] font-medium text-teal-700 hover:underline">
                <Mail className="size-4" strokeWidth={1.75} />See this month as the plain-text email
              </Link>
            </div>
          </div>
        </Card>

        <div data-tour="what-changed">
          {period === FIRST_PUBLISHED ? (
            <Callout tone="teal" title="Your first monthly scorecard">
              Numbers from the OR log and the other department feeds for {monthName(period)}, with your own records behind each one. Only you see this page; your chief or chair sees one of your rows only when you dispute it. Peer comparison starts next month.
            </Callout>
          ) : (
            <Callout tone="teal" title={`What changed since ${monthName(prev)}`}>
              <ul className="grid gap-1.5 sm:grid-cols-2">
                {prevTiles && [...prevTiles.entries()].map(([k, pt]) => {
                  const t = tiles.get(k)!;
                  if (t.kind !== "value" || pt.kind !== "value") return null;
                  const f = (x: number | null) => (x === null ? "" : fmtValue(t.def, x));
                  const now = t.adjudicated!.value, was = pt.adjudicated!.value;
                  return (
                    <li key={k} className="tabular"><span className="font-medium text-slate-900">{t.def.name}:</span> {now === was ? `unchanged at ${f(now)}` : `${f(now)} in ${monthOnly(period)}, ${f(was)} in ${monthOnly(prev)}`}</li>
                  );
                })}
              </ul>
              {(decided.length > 0 || open.length > 0) && (
                <ul className="mt-3 flex flex-col gap-1.5 border-t border-teal-200/70 pt-3">
                  {[...decided, ...open].map((d) => (
                    <li key={d.id} className="flex flex-wrap items-center gap-2">
                      <Link className="font-medium text-slate-900 underline decoration-slate-300 underline-offset-2 hover:decoration-slate-600 tabular" href={`/disputes/${d.id}`}>Record {d.recordRef}</Link>
                      {d.proposedClinicianId === v.id && d.filedById !== v.id ? <span className="text-slate-600">credited to you after a colleague&apos;s dispute:</span> : null}
                      <StatePill tone={stateTone(d)}>{stateLine(d)}</StatePill>
                    </li>
                  ))}
                </ul>
              )}
            </Callout>
          )}
        </div>

        {[1, 2, 3, 4, 5, 6].map((b) => (
          <section key={b} aria-labelledby={`sec-${b}`} data-tour={`section-${SECTION_SLUG[b]}`}>
            <SectionHeader id={`sec-${b}`} title={BUCKETS[b].name} sub={BUCKETS[b].intro} />
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {METRICS.filter((m) => m.bucket === b).map((m) => <Tile key={m.key} def={m} tile={tiles.get(m.key)!} v={v} period={period} ov={ov} />)}
            </div>
            {b === 2 && (
              <p className="mt-3 text-[12.5px] text-slate-500">
                Not on your scorecard: OR turnover time, PACU boarding and room-ready delays. A surgeon cannot move these alone, so they appear only on division and site views.
              </p>
            )}
          </section>
        ))}
      </div>
    </Shell>
  );
}

function Tile({ def, tile, v, period, ov }: { def: MetricDef; tile: Tile; v: Person; period: string; ov: OverrideMap }) {
  const href = `/me/metric/${def.key}?period=${period}`;
  const rows = def.records?.(v.id, tile.win.months, { basis: "adjudicated", ov }).length;
  const footer = [
    rows !== undefined && def.availability === "live" && !tile.muted ? `${rows} ${rows === 1 ? "record" : "records"}` : null,
    tile.muted ? null : tile.comparator?.replace(/^Compared to: /, "vs "),
  ].filter(Boolean) as string[];
  const windowLabel = def.cadence === "quarter" || def.cadence === "rolling12" ? tile.win.label : undefined;

  if (def.key === "work_rvus") {
    const w = wrvuView(v, period);
    const diff = w.ytd - w.lastYtd;
    return (
      <MetricCard href={href} name={def.name} value={w.ytd.toLocaleString("en-US")} spark={w.months.map((m) => m.value)}
        sub={<>wRVUs, fiscal year to date · last year {w.lastYtd.toLocaleString("en-US")} ({diff >= 0 ? "+" : ""}{diff.toLocaleString("en-US")})</>}
        footer={[`As of ${longDate(w.asOf)}`, "No peers, no target"]} />
    );
  }
  if (def.key === "mm_attendance") {
    const mm = mmView(v, period, ov);
    return (
      <MetricCard href={href} name={def.name} value={`${mm.attended} of ${mm.heldEligible}`}
        sub={<><span className={mm.unreachable ? "font-medium text-slate-800" : undefined}>{mm.pace}</span></>}
        footer={[`FY${mm.fy}`, `${mm.remaining} remaining`, "No peer comparison"]} />
    );
  }
  if (def.key === "feedback_inbox") {
    return (
      <Link href="/me/inbox" className="group flex flex-col gap-2.5 rounded-xl border border-slate-200 bg-white p-4 transition-all hover:border-slate-300 hover:shadow-sm">
        <div className="flex items-center gap-2 text-[12.5px] font-medium text-slate-600"><MessageSquareQuote className="size-4 text-amber-600" strokeWidth={2} />{def.name}</div>
        <p className="text-[13.5px] leading-snug text-slate-700">Every comment patients wrote about you, newest first, with the scores from the same survey.</p>
        <div className="mt-auto flex items-center justify-between border-t border-slate-100 pt-2.5 text-[11.5px] text-slate-400">
          <span>You and your direct leader only</span><ArrowRight className="size-3.5 text-slate-300 group-hover:text-teal-600" />
        </div>
      </Link>
    );
  }
  if (def.bucket === 5) {
    const s = surveyView(def, v, period, ov);
    const unit = def.key === "nps" ? "" : "%";
    const trend = s.months.map((m) => m.value);
    return (
      <MetricCard href={href} name={def.name} value={s.yearAverage.value === null ? "—" : `${s.yearAverage.value}${unit}`} spark={trend}
        sub={<>Year average · {s.yearAverage.n} responses{s.months.some((m) => m.hidden) ? ` · ${s.months.filter((m) => m.hidden).length} recent month hidden (under 10)` : ""}</>}
        reference={`MGB average ${s.mgb}${unit}`} footer={["vs neurosurgeons across the system"]} />
    );
  }
  const spark = trendFor(def, v, period, ov).map((p) => p.value);
  if (tile.kind === "reason") {
    return <MetricCard href={href} name={def.name} reason={tile.reason} muted={tile.muted} period={windowLabel} footer={footer} />;
  }
  const c = tile.adjudicated!;
  const valueStr = c.value === null ? "—" : fmtValue(def, c.value);
  const quarterNote = tile.win.interim ? `quarter closes ${tile.win.interim.match(/closes ([^.]+)\./)?.[1] ?? ""}` : undefined;
  return (
    <MetricCard href={href} name={def.name} value={valueStr} spark={spark}
      sub={tile.bothBases ? <>As adjudicated: {detail(c.line, valueStr)} <span className="text-slate-400">(as logged: {tile.logged!.line})</span></> : detail(c.line, valueStr)}
      period={[windowLabel, quarterNote].filter(Boolean).join(", ") || undefined} footer={footer} />
  );
}

/** The value is already shown large; keep only what the line adds (count, interval, denominator). */
function detail(line: string, value: string): string | null {
  let d = line;
  if (d.startsWith(value)) d = d.slice(value.length).trim();
  d = d.replace(/^\((.*)\)$/, "$1").replace(/^\((.*?)\):\s*/, "$1 · ").replace(/^:\s*/, "");
  d = d.replace(new RegExp(`\\s*\\(${value.replace(/[.*+?^${}()|[\]\\%]/g, "\\$&")}\\)`), "");
  if (d.length && !/\d/.test(d)) d = `${d} this month`;
  return d.length ? d : null;
}
