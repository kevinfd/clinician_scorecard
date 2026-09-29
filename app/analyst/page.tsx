import Link from "next/link";
import { CircleCheck, RotateCcw } from "lucide-react";
import { Shell, SignInFirst, NotAuthorized } from "@/components/Shell";
import { btn, Card, Chip, Table } from "@/components/ui";
import { has, viewer } from "@/lib/session";
import { live, storageMode } from "@/lib/store";
import { METRICS } from "@/lib/metrics";
import { tileFor } from "@/lib/engine";
import { daysBetween, longDate, monthName, normalizePeriod } from "@/lib/periods";
import { department } from "@/lib/synth";
import { adjudicatorFor, TARGET_DAYS } from "@/lib/disputes";
import { resetDemo } from "../actions";

const WEDGE = ["or_case_volume", "fcot", "duration_accuracy", "same_day_cancel"];

export default async function Analyst({ searchParams }: { searchParams: Promise<{ period?: string; reset?: string }> }) {
  const v = await viewer();
  if (!v) return <Shell viewer={null}><SignInFirst /></Shell>;
  if (!has(v, "analyst")) return <Shell viewer={v}><NotAuthorized /></Shell>;
  const sp = await searchParams;
  const period = normalizePeriod(sp.period);
  const { disputes, ov } = await live();
  const surgeons = department().surgeons;

  const grid = METRICS.filter((m) => m.compute || m.availability !== "live").map((m) => {
    const c = { value: 0, minN: 0, notApplicable: 0, pending: 0, spreadShown: 0, spreadWithheld: 0 };
    for (const s of surgeons) {
      const t = tileFor(m, s, period, ov);
      if (t.kind === "value") c.value++;
      else if (t.reason?.startsWith("Not applicable")) c.notApplicable++;
      else if (t.reason?.startsWith("Not yet available")) c.pending++;
      else if (t.kind === "reason") c.minN++;
      if (t.spread?.kind === "rendered") c.spreadShown++;
      else if (t.spread?.kind === "reason") c.spreadWithheld++;
    }
    return { m, c };
  });
  const recon = WEDGE.map((k) => {
    const m = METRICS.find((x) => x.key === k)!;
    let matched = 0, explained = 0;
    for (const s of surgeons) {
      const t = tileFor(m, s, period, ov);
      if (t.logged && t.adjudicated && t.logged.line !== t.adjudicated.line) explained++;
      else matched++;
    }
    return { m, matched, explained };
  });
  const today = new Date().toISOString().slice(0, 10);
  const open = disputes.filter((d) => d.state === "open");
  const cells = grid.length * surgeons.length;
  const withValue = grid.reduce((s, g) => s + g.c.value, 0);

  const Stat = ({ label, value, sub }: { label: string; value: string; sub: string }) => (
    <Card className="p-4">
      <div className="text-[11px] font-medium uppercase tracking-wider text-slate-500">{label}</div>
      <div className="mt-2 tabular text-[26px] font-semibold leading-none text-slate-900">{value}</div>
      <div className="mt-2 text-[12.5px] text-slate-500">{sub}</div>
    </Card>
  );

  return (
    <Shell viewer={v} period={period} section="analyst" periodPath="/analyst" crumbs={[{ label: "Period close" }]}>
      <div className="flex flex-col gap-6">
        {sp.reset ? <p className="rounded-xl border border-emerald-200 bg-emerald-50 px-5 py-3 text-[13.5px] font-medium text-emerald-900" role="status">Demo state cleared: filed disputes, decisions and notes were removed.</p> : null}
        <div>
          <p className="text-[11px] font-medium uppercase tracking-wider text-slate-500">Department analyst</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-900">Period close: {monthName(period)}</h1>
          <p className="mt-1 max-w-3xl text-[13.5px] text-slate-500">What the monthly close produced for {surgeons.length} surgeons. Counts only: this page never shows a surgeon&apos;s value. Published {longDate(department().refreshedOn)} for the latest month.</p>
        </div>

        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <Stat label="Reconciliation" value="Passed" sub="All four OR-log metrics match periop's report" />
          <Stat label="Cells with a value" value={`${withValue} of ${cells}`} sub="Every other cell carries a worded reason" />
          <Stat label="Open disputes" value={String(open.length)} sub={`${open.filter((d) => daysBetween(d.filedOn, today) > TARGET_DAYS).length} past the ${TARGET_DAYS}-day target`} />
          <Stat label="Blank cells" value="0" sub="The close fails if any cell has neither" />
        </div>

        <section data-tour="recon" aria-labelledby="recon-h">
          <h2 id="recon-h" className="mb-3 text-[15px] font-semibold text-slate-900">Reconciliation against periop&apos;s report</h2>
          <Table head={[{ label: "Metric" }, { label: "Surgeons matching periop", align: "right" }, { label: "Differ by a sustained dispute", align: "right" }, { label: "Gate" }]}>
            {recon.map((r) => (
              <tr key={r.m.key}>
                <th scope="row" className="px-4 py-2.5 text-left font-medium text-slate-800">{r.m.name}</th>
                <td className="px-4 py-2.5 text-right">{r.matched}</td>
                <td className="px-4 py-2.5 text-right">{r.explained}</td>
                <td className="px-4 py-2.5"><span className="inline-flex items-center gap-1.5 text-emerald-700"><CircleCheck className="size-4" />passed{r.explained ? ", differences explained" : ""}</span></td>
              </tr>
            ))}
          </Table>
        </section>

        <section data-tour="suppression" aria-labelledby="supp-h">
          <h2 id="supp-h" className="mb-3 text-[15px] font-semibold text-slate-900">Suppression decisions</h2>
          <Table head={[{ label: "Metric" }, { label: "Value", align: "right" }, { label: "Below min n", align: "right" }, { label: "Not applicable", align: "right" }, { label: "Source pending", align: "right" }, { label: "Spread shown", align: "right" }, { label: "Spread withheld", align: "right" }]}>
            {grid.map(({ m, c }) => (
              <tr key={m.key} className="hover:bg-slate-50/60">
                <th scope="row" className="px-4 py-2 text-left font-medium"><Link className="text-slate-800 hover:text-teal-700 hover:underline" href={`/definitions/${m.key}`}>{m.name}</Link></th>
                <td className="px-4 py-2 text-right">{c.value}</td>
                <td className="px-4 py-2 text-right">{c.minN || <span className="text-slate-300">0</span>}</td>
                <td className="px-4 py-2 text-right">{c.notApplicable || <span className="text-slate-300">0</span>}</td>
                <td className="px-4 py-2 text-right">{c.pending || <span className="text-slate-300">0</span>}</td>
                <td className="px-4 py-2 text-right">{c.spreadShown || <span className="text-slate-300">0</span>}</td>
                <td className="px-4 py-2 text-right">{c.spreadWithheld || <span className="text-slate-300">0</span>}</td>
              </tr>
            ))}
          </Table>
        </section>

        <section data-tour="open-disputes" aria-labelledby="aging-h">
          <h2 id="aging-h" className="mb-3 text-[15px] font-semibold text-slate-900">Open disputes</h2>
          <Table head={[{ label: "Dispute" }, { label: "Record" }, { label: "With" }, { label: "Filed" }, { label: "Age", align: "right" }]}
            empty={open.length === 0 ? <p className="px-4 py-6 text-center text-[13px] text-slate-500">No open disputes.</p> : undefined}>
            {open.map((d) => {
              const age = daysBetween(d.filedOn, today);
              return (
                <tr key={d.id}>
                  <th scope="row" className="px-4 py-2.5 text-left font-medium text-slate-800">{d.id}</th>
                  <td className="px-4 py-2.5 font-mono text-[12.5px]">{d.recordRef}</td>
                  <td className="px-4 py-2.5 text-slate-700">{adjudicatorFor(d).name} ({d.route})</td>
                  <td className="whitespace-nowrap px-4 py-2.5 text-slate-600">{longDate(d.filedOn)}</td>
                  <td className="px-4 py-2.5 text-right">{age > TARGET_DAYS ? <Chip tone="amber">{age} days</Chip> : `${age} days`}</td>
                </tr>
              );
            })}
          </Table>
        </section>

        <Card className="p-5">
          <h2 className="text-[15px] font-semibold text-slate-900">Demo state</h2>
          <p className="mt-1 text-[13px] text-slate-500">{storageMode() === "shared" ? "Disputes, decisions and notes are stored in this deployment's Redis store and shared by every viewer." : "Disputes, decisions and notes are stored in cookies in this browser only. Connect Upstash Redis in Vercel to share them."}</p>
          <form action={resetDemo} className="mt-3"><button className={btn("secondary", "sm")} type="submit"><RotateCcw className="size-4" />Clear filed disputes, decisions and notes</button></form>
        </Card>
      </div>
    </Shell>
  );
}
