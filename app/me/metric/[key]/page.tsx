import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight, BookOpen, Database, FileText, Lightbulb } from "lucide-react";
import { Shell, SignInFirst, NotAuthorized } from "@/components/Shell";
import { StripPlot, TrendChart, GhostBars, BarSpread, Responsive } from "@/components/Charts";
import { Card, CardBody, CardHeader, Chip, LinkButton, StatePill, Table } from "@/components/ui";
import { viewer } from "@/lib/session";
import { live } from "@/lib/store";
import { metric, BUCKETS } from "@/lib/metrics";
import { disputesOnRecord, fmtValue, mmView, surveyView, tileFor, trendFor, wrvuView } from "@/lib/engine";
import { longDate, monthName, normalizePeriod } from "@/lib/periods";
import { department } from "@/lib/synth";
import { stateLine, stateTone } from "@/lib/disputes";

export default async function MetricPage({ params, searchParams }: { params: Promise<{ key: string }>; searchParams: Promise<{ period?: string }> }) {
  const v = await viewer();
  if (!v) return <Shell viewer={null}><SignInFirst /></Shell>;
  const { key } = await params;
  const def = metric(key);
  if (!v.isSurgeon || !def) return <Shell viewer={v}><NotAuthorized /></Shell>;
  if (def.key === "feedback_inbox") redirect("/me/inbox");
  const period = normalizePeriod((await searchParams).period);
  const { disputes, ov } = await live();
  const tile = tileFor(def, v, period, ov);
  const fmt = (x: number) => fmtValue(def, x);
  const rowsHref = `/me/metric/${def.key}/records?period=${period}`;
  const rowCount = def.records?.(v.id, tile.win.months, { basis: "adjudicated", ov }).length;
  const special = def.key === "work_rvus" || def.key === "mm_attendance" || def.bucket === 5;
  const assumed = def.params?.filter((p) => p.status === "assumed") ?? [];

  return (
    <Shell viewer={v} period={period} section="scorecard" periodPath={`/me/metric/${def.key}`}
      crumbs={[{ href: `/me?period=${period}`, label: "Scorecard" }, { href: `/me?period=${period}#sec-${def.bucket}`, label: BUCKETS[def.bucket].name }, { label: def.name }]}>
      <div className="flex flex-col gap-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-[11px] font-medium uppercase tracking-wider text-slate-500">{BUCKETS[def.bucket].name}</p>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-900">{def.name}</h1>
            <p className="mt-1 text-[13px] text-slate-500">{v.name} · {def.cadence === "month" ? monthName(period) : tile.win.label}</p>
          </div>
          {rowCount !== undefined && def.availability === "live" && !tile.muted ? (
            <LinkButton href={rowsHref} variant="primary"><FileText className="size-4" strokeWidth={2} />See the {rowCount} {rowCount === 1 ? "record" : "records"} behind it</LinkButton>
          ) : null}
        </div>

        <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-3">
          <Card className="lg:col-span-2" data-tour="metric-value">
            <CardHeader title="This period" sub={def.what} />
            <CardBody>
              {tile.kind === "reason" ? (
                <p className={`text-[17px] font-medium leading-snug ${tile.muted ? "text-slate-500" : "text-slate-900"}`}>{tile.reason}</p>
              ) : tile.kind === "value" && tile.adjudicated ? (
                <div className="flex flex-col gap-2">
                  <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
                    <span className="tabular text-4xl font-semibold tracking-tight text-slate-900">{tile.adjudicated.value === null ? "—" : fmt(tile.adjudicated.value)}</span>
                    <span className="tabular text-[15px] text-slate-600">{tile.adjudicated.line}</span>
                  </div>
                  {tile.bothBases ? (
                    <p className="text-[13px] text-slate-600"><Chip tone="emerald" className="mr-2">As adjudicated</Chip>As logged in the source: {tile.logged!.line}. A sustained dispute changed which records count; the source keeps its original until it is corrected.</p>
                  ) : null}
                  {tile.adjudicated.extra?.map((x, i) => <p key={i} className="text-[14px] text-slate-700">{x}</p>)}
                </div>
              ) : null}
              {def.riskAdjusted ? <p className="mt-3 text-[13px] text-slate-500">Observed divided by expected: 1.0 means exactly as expected; below 1.0 is better.</p> : null}
              {def.unadjusted ? <p className="mt-3 text-[13px] text-slate-500">Unadjusted: there is no risk model for this measure. From the department QI database.</p> : null}
              {tile.win.interim ? <p className="mt-3 text-[13px] text-slate-500">{tile.win.interim}</p> : null}
              {special ? <SpecialSection /> : null}
            </CardBody>
          </Card>

          <Card data-tour="metric-definition">
            <CardHeader title="Definition and source" />
            <CardBody className="flex flex-col gap-3 text-[13px]">
              <Row icon={<BookOpen className="size-4" />} label="Definition">
                <Link className="font-medium text-teal-700 hover:underline" href={`/definitions/${def.key}`}>Version {def.version.slice(1)}, metric definitions v0.2</Link>
              </Row>
              <Row icon={<Lightbulb className="size-4" />} label="Counted">{def.counted}</Row>
              <Row icon={<Database className="size-4" />} label="Source">{def.source}, as of {longDate(department().refreshedOn)}</Row>
              {tile.comparator ? <Row icon={<ArrowRight className="size-4" />} label="Compared to">{tile.comparator.replace(/^Compared to: /, "")}</Row> : null}
              {assumed.length ? (
                <div className="rounded-lg border border-amber-200 bg-amber-50/70 px-3 py-2 text-[12.5px] text-amber-900">
                  To be confirmed: {assumed.map((p) => `${p.name.toLowerCase()} = ${p.value}`).join("; ")}.
                </div>
              ) : null}
              <div className="rounded-lg bg-slate-50 px-3 py-2 text-[12.5px] text-slate-600"><span className="font-medium text-slate-800">You can move it by: </span>{def.movedBy}</div>
            </CardBody>
          </Card>
        </div>

        {tile.spread && def.bucket !== 5 ? (
          <Card data-tour="metric-spread">
            <CardHeader title="Where you sit among peers" sub={tile.comparator?.replace(/^Compared to: /, "Anonymous: ")} />
            <CardBody>
              {tile.spread.kind === "reason" ? (
                <p className="text-[15px] font-medium text-slate-800">{tile.spread.text}</p>
              ) : (
                <div className="flex flex-col gap-3">
                  <Responsive render={(W) => (
                    <StripPlot W={W} values={(tile.spread as { values: number[] }).values} you={(tile.spread as { you: number }).you} fmt={fmt}
                      title={(tile.spread as { sentence: string }).sentence}
                      betterWord={def.better === "lower" ? "Lower is better" : def.better === "higher" ? "Higher is better" : undefined} />
                  )} />
                  <p className="text-[13.5px] text-slate-700">{tile.spread.sentence}</p>
                  <p className="tabular text-[12.5px] text-slate-500">Peers, sorted: {tile.spread.values.map(fmt).join(", ")}. No peer is named, and the order carries no identity.</p>
                </div>
              )}
            </CardBody>
          </Card>
        ) : null}

        <TrendSection />
      </div>
    </Shell>
  );

  function Row({ icon, label, children }: { icon: React.ReactNode; label: string; children: React.ReactNode }) {
    return (
      <div className="flex gap-2.5">
        <span className="mt-0.5 text-slate-400">{icon}</span>
        <div><div className="text-[11px] font-medium uppercase tracking-wider text-slate-400">{label}</div><div className="text-slate-700">{children}</div></div>
      </div>
    );
  }

  function TrendSection() {
    const pts = trendFor(def!, v!, period, ov);
    if (!pts.length) return null;
    return (
      <Card data-tour="metric-trend">
        <CardHeader title="Trend" sub={`${pts.length} ${def!.cadence === "month" ? "months" : "periods"}. A diamond marks a value restated after a sustained dispute.`} />
        <CardBody className="flex flex-col gap-4">
          <Responsive render={(W) => <TrendChart W={W} points={pts} fmt={fmt} title={`${def!.name}: ${pts.filter((p) => p.value !== null).map((p) => `${fmt(p.value!)} in ${p.label}`).join(", ")}`} />} />
          <details className="group rounded-lg border border-slate-200">
            <summary className="flex min-h-11 cursor-pointer items-center px-4 text-[13px] font-medium text-slate-700">Show the trend as a table</summary>
            <div className="overflow-x-auto border-t border-slate-100">
              <table className="w-full text-[13px]">
                <thead className="bg-slate-50 text-[11px] uppercase tracking-wider text-slate-500"><tr><th className="px-4 py-2 text-left font-medium">Period</th><th className="px-4 py-2 text-right font-medium">Value</th><th className="px-4 py-2 text-left font-medium">Detail</th></tr></thead>
                <tbody className="divide-y divide-slate-100">
                  {pts.slice().reverse().map((p) => (
                    <tr key={p.period}><th scope="row" className="px-4 py-2 text-left font-medium text-slate-800">{p.label}</th><td className="px-4 py-2 text-right">{p.value === null ? "not shown" : fmt(p.value)}</td><td className="px-4 py-2 text-slate-600">{p.text}{p.restated ? ". Restated after a sustained dispute." : ""}</td></tr>
                  ))}
                </tbody>
              </table>
            </div>
          </details>
        </CardBody>
      </Card>
    );
  }

  function SpecialSection() {
    if (def!.key === "work_rvus") {
      const w = wrvuView(v!, period);
      const diff = w.ytd - w.lastYtd;
      return (
        <div className="flex flex-col gap-3">
          <div className="flex flex-wrap items-baseline gap-x-4">
            <span className="tabular text-4xl font-semibold tracking-tight text-slate-900">{w.ytd.toLocaleString("en-US")}</span>
            <span className="tabular text-[15px] text-slate-600">wRVUs fiscal year to date · same point last year {w.lastYtd.toLocaleString("en-US")} ({diff >= 0 ? "+" : ""}{diff.toLocaleString("en-US")})</span>
          </div>
          <p className="text-[13px] text-slate-500">No peer comparison. No target. As of {longDate(w.asOf)}: billing lags, so the two most recent months may still increase.</p>
          <Responsive render={(W) => <GhostBars W={W} months={w.months} title="Monthly wRVUs this fiscal year, last year's month beside each." />} />
          <div className="flex gap-4 text-[12px] text-slate-500"><span className="inline-flex items-center gap-1.5"><span className="size-2.5 rounded-sm bg-teal-600" />This year</span><span className="inline-flex items-center gap-1.5"><span className="size-2.5 rounded-sm bg-slate-200" />Last year</span></div>
          <Table head={[{ label: "Month" }, { label: "This year", align: "right" }, { label: "Last year", align: "right" }, { label: "Note" }]}>
            {w.months.map((m) => (
              <tr key={m.period}><th scope="row" className="px-4 py-2 text-left font-medium text-slate-800">{monthName(m.period)}</th><td className="px-4 py-2 text-right">{m.value.toLocaleString("en-US")}</td><td className="px-4 py-2 text-right text-slate-500">{m.last.toLocaleString("en-US")}</td><td className="px-4 py-2 text-slate-500">{m.prior !== undefined ? `May increase (prior snapshot ${m.prior.toLocaleString("en-US")}, +${m.value - m.prior})` : ""}</td></tr>
            ))}
          </Table>
        </div>
      );
    }
    if (def!.key === "mm_attendance") {
      const mm = mmView(v!, period, ov);
      return (
        <div className="flex flex-col gap-3">
          <div className="flex flex-wrap items-baseline gap-x-4">
            <span className="tabular text-4xl font-semibold tracking-tight text-slate-900">{mm.attended} of {mm.heldEligible}</span>
            <span className="text-[15px] text-slate-600">{mm.line}</span>
          </div>
          <p className={mm.unreachable ? "rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-[14px] font-medium text-amber-900" : "text-[14px] text-slate-700"}>{mm.pace}</p>
          <p className="text-[13px] text-slate-500">{mm.remaining} {mm.remaining === 1 ? "session" : "sessions"} remaining in fiscal year {mm.fy}. No peer comparison.</p>
          <Table head={[{ label: "Date" }, { label: "Topic" }, { label: "Recorded" }, { label: "Dispute" }]}>
            {mm.sessions.map((s) => {
              const ds = disputesOnRecord(disputes, s.ref, v!.id);
              return (
                <tr key={s.ref}>
                  <th scope="row" className="whitespace-nowrap px-4 py-2 text-left font-medium text-slate-800">{longDate(s.date)}</th>
                  <td className="px-4 py-2 text-slate-600">{s.topic}</td>
                  <td className="px-4 py-2 text-slate-700">{s.status}</td>
                  <td className="px-4 py-2">
                    {ds[0] ? <StatePill tone={stateTone(ds[0])}>{stateLine(ds[0])}</StatePill>
                      : s.status === "not recorded as attended" ? <LinkButton size="sm" href={`/records/${encodeURIComponent(s.ref)}/dispute?metric=mm_attendance&period=${period}`} aria-label={`Dispute this record, session ${s.date}`}>Dispute</LinkButton> : null}
                  </td>
                </tr>
              );
            })}
          </Table>
        </div>
      );
    }
    const s = surveyView(def!, v!, period, ov);
    const unit = def!.key === "nps" ? "" : "%";
    return (
      <div className="mt-2 flex flex-col gap-5">
        <div data-tour="survey-table">
          <Table caption="As shown at faculty meeting" head={[{ label: "Period" }, { label: "Value", align: "right" }, { label: "Responses", align: "right" }]}>
            <tr className="bg-teal-50/40"><th scope="row" className="px-4 py-2 text-left font-medium text-slate-900">Your year average ({tile.win.label})</th><td className="px-4 py-2 text-right font-semibold text-slate-900">{s.yearAverage.value === null ? "no responses" : `${s.yearAverage.value}${unit}`}</td><td className="px-4 py-2 text-right text-slate-500">{s.yearAverage.n}</td></tr>
            {s.months.map((m) => (
              <tr key={m.period}><th scope="row" className="px-4 py-2 text-left font-medium text-slate-800">{m.label}</th><td className={`px-4 py-2 text-right ${m.hidden ? "text-slate-500" : ""}`}>{m.hidden ? m.line : `${m.value}${unit}`}</td><td className="px-4 py-2 text-right text-slate-500">{m.n}</td></tr>
            ))}
            <tr><th scope="row" className="px-4 py-2 text-left font-medium text-violet-800">MGB average</th><td className="px-4 py-2 text-right text-violet-800">{s.mgb}{unit}</td><td /></tr>
          </Table>
        </div>
        <div data-tour="survey-bars">
          <h3 className="mb-2 text-[14px] font-semibold text-slate-900">Everyone in your peer group</h3>
          {s.bars && "reason" in s.bars ? (
            <p className="text-[15px] font-medium text-slate-800">{s.bars.reason}</p>
          ) : s.bars ? (
            <>
              <Responsive render={(W) => { const b = s.bars as { values: number[]; you: number; sentence: string }; return <BarSpread W={W} values={b.values} you={b.you} title={b.sentence} reference={s.mgb} />; }} />
              <p className="mt-2 text-[13px] text-slate-600">{s.bars.sentence} Only your bar is labelled.</p>
            </>
          ) : null}
        </div>
        <Link href="/me/inbox" className="inline-flex items-center gap-1.5 text-[13px] font-medium text-teal-700 hover:underline">Read the comments in your patient feedback inbox<ArrowRight className="size-4" /></Link>
      </div>
    );
  }
}
