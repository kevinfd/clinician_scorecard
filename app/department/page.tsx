import { Building2, CircleCheck, EyeOff, Users } from "lucide-react";
import { Shell, SignInFirst, NotAuthorized } from "@/components/Shell";
import { DistributionPlot, Responsive } from "@/components/Charts";
import { Card, CardBody, CardHeader, Chip, SectionHeader, Sparkline, Table } from "@/components/ui";
import { has, viewer } from "@/lib/session";
import { department } from "@/lib/synth";
import { departmentKpis, departmentQuality, distributions, experienceRows, mmSummary, siteRows } from "@/lib/dept";
import { longDate, monthName, normalizePeriod, fyEnd } from "@/lib/periods";
import { cn } from "@/lib/cn";

export default async function DepartmentPage({ searchParams }: { searchParams: Promise<{ period?: string }> }) {
  const v = await viewer();
  if (!v) return <Shell viewer={null}><SignInFirst /></Shell>;
  if (!has(v, "chair") && !has(v, "chief")) return <Shell viewer={v}><NotAuthorized /></Shell>;
  const period = normalizePeriod((await searchParams).period);
  const d = department();
  const kpis = departmentKpis(period);
  const quality = departmentQuality(period);
  const sites = siteRows(period);
  const dists = distributions(period);
  const mm = mmSummary(period);
  const exp = experienceRows(period);
  const isChair = has(v, "chair");

  return (
    <Shell viewer={v} period={period} section="department" periodPath="/department" crumbs={[{ label: "Department" }]}>
      <div className="flex flex-col gap-8">
        <Card className="p-5 sm:p-6" data-tour="dept-header">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex items-start gap-4">
              <span className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-50 to-slate-100 text-violet-700 ring-1 ring-slate-200">
                <Building2 className="size-6" strokeWidth={1.75} />
              </span>
              <div>
                <p className="text-[11px] font-medium uppercase tracking-wider text-slate-500">{isChair ? "Department chair view" : "Division chief view"}</p>
                <h1 className="mt-0.5 text-2xl font-semibold tracking-tight text-slate-900">Department of Neurosurgery</h1>
                <p className="mt-1 text-[14px] text-slate-600">{d.surgeons.length} surgeons and {d.apps.length} advanced practice providers at {sites.length} sites</p>
                <p className="mt-1 text-[12.5px] text-slate-400">{monthName(period)} · last refreshed {longDate(d.refreshedOn)}</p>
              </div>
            </div>
            <div className="flex max-w-sm flex-col gap-2 text-[12.5px]">
              <span className="inline-flex items-start gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-slate-600">
                <EyeOff className="mt-0.5 size-4 shrink-0 text-slate-400" />
                Pooled across the department. No clinician is named or ranked here; each clinician sees their own numbers on their own scorecard.
              </span>
            </div>
          </div>
        </Card>

        <section aria-labelledby="kpi-h" data-tour="dept-kpis">
          <SectionHeader id="kpi-h" title="This month across the department" sub={`${monthName(period)}, with the last 12 months as a trend`} />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {kpis.map((k) => (
              <div key={k.key} className="flex flex-col gap-2.5 rounded-xl border border-slate-200 bg-white p-4">
                <div className="text-[12.5px] font-medium text-slate-600">{k.label}</div>
                <div className="flex items-end justify-between gap-3">
                  <div className="tabular text-[26px] font-semibold leading-none tracking-tight text-slate-900">{k.value}</div>
                  <Sparkline values={k.spark} />
                </div>
                <div className="text-[12.5px] leading-snug text-slate-500 tabular">{k.sub}</div>
                {k.reference ? <div className="flex items-center gap-1.5 text-[11.5px] text-violet-700"><span className="size-1.5 rounded-full bg-violet-500" />{k.reference}</div> : null}
                {k.delta ? <div className="mt-auto border-t border-slate-100 pt-2.5 text-[11.5px] text-slate-400 tabular">{k.delta}</div> : null}
              </div>
            ))}
            <div className="flex flex-col gap-2.5 rounded-xl border border-slate-200 bg-white p-4">
              <div className="text-[12.5px] font-medium text-slate-600">M&amp;M attendance, FY{fyEnd(period).slice(0, 4)}</div>
              <div className="tabular text-[26px] font-semibold leading-none tracking-tight text-slate-900">{mm.reached + mm.onPace} of {mm.total}</div>
              <div className="text-[12.5px] leading-snug text-slate-500">surgeons have reached the 8-of-12 target or are on pace</div>
              <div className="mt-auto flex flex-wrap gap-1.5 border-t border-slate-100 pt-2.5">
                <Chip tone="emerald">{mm.reached} reached</Chip>{mm.onPace ? <Chip tone="teal">{mm.onPace} on pace</Chip> : null}
                {mm.off ? <Chip tone="neutral">{mm.off} off pace</Chip> : null}
                {mm.unreachable ? <Chip tone="amber">{mm.unreachable} cannot reach 8</Chip> : null}
              </div>
            </div>
          </div>
        </section>

        <section aria-labelledby="ops-h" data-tour="dept-sites">
          <SectionHeader id="ops-h" title="Sites, and the measures a surgeon cannot move alone" sub="OR turnover time, PACU boarding and room-ready delays appear only here, on the division and site views, never on an individual scorecard." />
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {sites.map((s) => (
              <Card key={s.site}>
                <CardHeader title={s.site} sub={`${s.surgeons} surgeons · ${s.apps} advanced practice providers · ${s.cases} OR cases in ${monthName(period)}`} />
                <CardBody>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                    <OpsTile label="OR turnover time" value={`${s.ops.turnover} min`} sub="Median, wheels out to wheels in" spark={s.opsTrend.map((o) => o.turnover)} />
                    <OpsTile label="PACU boarding" value={`${s.ops.pacuBoarding}%`} sub="Of PACU patients waiting over 60 minutes for a bed" spark={s.opsTrend.map((o) => o.pacuBoarding)} />
                    <OpsTile label="Room-ready delays" value={String(s.ops.roomReady)} sub={`Of ${s.ops.roomReadyOf} first cases, late because the room was not ready`} spark={s.opsTrend.map((o) => o.roomReady)} />
                  </div>
                  <dl className="mt-4 grid grid-cols-2 gap-x-6 gap-y-2 border-t border-slate-100 pt-4 text-[13px] sm:grid-cols-4">
                    <Stat label="First-case on time" value={s.fcot} />
                    <Stat label="Duration accuracy" value={s.duration} />
                    <Stat label="Notes in 72 hours" value={s.notes} />
                    <Stat label="Third-next available" value={s.thirdNext} />
                  </dl>
                </CardBody>
              </Card>
            ))}
          </div>
        </section>

        <section aria-labelledby="spread-h" data-tour="dept-spread">
          <SectionHeader id="spread-h" title="Spread of practice" sub="Each dot is one clinician's own value, unnamed and in no particular order. Clinicians below the minimum number of cases are left out, never shown as zero." />
          <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
            {dists.map((x) => {
              const fmt = (n: number) => (x.fmt === "pct" ? `${n}%` : `${n} days`);
              return (
                <Card key={x.key}>
                  <CardHeader title={x.label} sub={`${x.shown} of ${x.total} ${x.unit} shown${x.total - x.shown ? `; ${x.total - x.shown} below the minimum` : ""}`} />
                  <CardBody>
                    <Responsive render={(W) => <DistributionPlot W={Math.min(W, 520)} values={x.values} median={x.median} fmt={fmt} title={`${x.label}: ${x.shown} clinicians from ${fmt(x.values[0])} to ${fmt(x.values[x.values.length - 1])}, median ${x.median === null ? "none" : fmt(x.median)}.`} />} />
                  </CardBody>
                </Card>
              );
            })}
          </div>
        </section>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-5">
          <section aria-labelledby="q-h" className="xl:col-span-3" data-tour="dept-quality">
            <SectionHeader id="q-h" title="Quality and outcomes" sub={`${quality.window}. Observed divided by expected where Vizient has a risk model; 1.0 means exactly as expected.`} />
            <Table head={[{ label: "Measure" }, { label: "Value", align: "right" }, { label: "95% interval" }, { label: "Reading" }]}>
              {quality.rows.map((r) => (
                <tr key={r.label} className="align-top">
                  <th scope="row" className="px-4 py-3 text-left font-medium text-slate-800">{r.label}<div className="mt-0.5 text-[12px] font-normal text-slate-500 tabular">{r.detail}</div></th>
                  <td className="px-4 py-3 text-right text-[15px] font-semibold text-slate-900">{r.value}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-slate-600">{r.interval}</td>
                  <td className="px-4 py-3"><Chip tone={r.reading === "Better than expected" ? "teal" : r.reading === "Higher than expected" ? "amber" : "neutral"}>{r.reading}</Chip></td>
                </tr>
              ))}
            </Table>
          </section>

          <section aria-labelledby="pe-h" className="xl:col-span-2" data-tour="dept-experience">
            <SectionHeader id="pe-h" title="Patient experience" sub="Fiscal year to date, by clinician group, against the MGB average" />
            <Table head={[{ label: "Measure" }, { label: "Surgeons", align: "right" }, { label: "APPs", align: "right" }, { label: "MGB", align: "right" }]}>
              {exp.map((r) => {
                const u = r.key === "nps" ? "" : "%";
                return (
                  <tr key={r.key}>
                    <th scope="row" className="px-4 py-3 text-left font-medium text-slate-800">{r.label}</th>
                    <td className="px-4 py-3 text-right font-semibold text-slate-900">{r.surgeons ?? "—"}{u}</td>
                    <td className="px-4 py-3 text-right font-semibold text-slate-900">{r.apps ?? "—"}{u}</td>
                    <td className="px-4 py-3 text-right text-violet-700">{r.mgb}{u}</td>
                  </tr>
                );
              })}
            </Table>
            <p className="mt-3 flex items-start gap-2 text-[12.5px] text-slate-500"><Users className="mt-0.5 size-4 shrink-0 text-slate-400" />Comments stay in each clinician&apos;s own inbox and their direct leader&apos;s view. They are never counted or rolled up here.</p>
          </section>
        </div>

        <Card className="p-5" data-tour="dept-publish">
          <div className="flex flex-wrap items-center gap-3">
            <CircleCheck className="size-5 text-emerald-600" />
            <p className="text-[13.5px] text-slate-700">
              {d.clinicians.length} scorecards published for {monthName(period)}: {d.surgeons.length} surgeons and {d.apps.length} advanced practice providers. Every number on every scorecard carries a value or a reason; none is blank.
            </p>
          </div>
        </Card>
      </div>
    </Shell>
  );
}

function OpsTile({ label, value, sub, spark }: { label: string; value: string; sub: string; spark: number[] }) {
  return (
    <div className="flex flex-col gap-1.5 rounded-lg bg-slate-50 p-3">
      <div className="text-[11px] font-medium uppercase tracking-wider text-slate-500">{label}</div>
      <div className="flex items-end justify-between gap-2">
        <span className="tabular text-[22px] font-semibold leading-none text-slate-900">{value}</span>
        <Sparkline values={spark} width={64} height={22} />
      </div>
      <div className="text-[11.5px] leading-snug text-slate-500">{sub}</div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-[11px] font-medium uppercase tracking-wider text-slate-400">{label}</dt>
      <dd className={cn("mt-0.5 tabular text-slate-800")}>{value}</dd>
    </div>
  );
}
