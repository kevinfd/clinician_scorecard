import Link from "next/link";
import { Shell, SignInFirst, NotAuthorized } from "@/components/Shell";
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

  // Suppression grid: counts only, never a surgeon's value.
  const grid = METRICS.filter((m) => m.compute || m.availability !== "live").map((m) => {
    const counts = { value: 0, minN: 0, notApplicable: 0, pending: 0, spreadShown: 0, spreadWithheld: 0 };
    for (const s of surgeons) {
      const t = tileFor(m, s, period, ov);
      if (t.kind === "value") counts.value++;
      else if (t.reason?.startsWith("Not applicable")) counts.notApplicable++;
      else if (t.reason?.startsWith("Not yet available")) counts.pending++;
      else if (t.kind === "reason") counts.minN++;
      if (t.spread?.kind === "rendered") counts.spreadShown++;
      else if (t.spread?.kind === "reason") counts.spreadWithheld++;
    }
    return { m, counts };
  });

  // Reconciliation: the logged basis against the periop report (synthetic: the same extract).
  const recon = WEDGE.map((k) => {
    const m = METRICS.find((x) => x.key === k)!;
    let matched = 0;
    let explained = 0;
    for (const s of surgeons) {
      const t = tileFor(m, s, period, ov);
      if (t.logged && t.adjudicated && t.logged.line !== t.adjudicated.line) explained++;
      else matched++;
    }
    return { m, matched, explained };
  });

  const today = new Date().toISOString().slice(0, 10);
  const open = disputes.filter((d) => d.state === "open");

  return (
    <Shell viewer={v} period={period} section="analyst" periodPath="/analyst">
      {sp.reset && <p className="value" role="status">Demo state cleared: every dispute filed in the app, every decision and every note was removed.</p>}
      <h1>Period close: {monthName(period)}</h1>
      <p className="lede">
        What the monthly close produced for {surgeons.length} surgeons. Counts only: this page never shows a surgeon&apos;s value. Published{" "}
        {longDate(department().refreshedOn)} for the most recent period.
      </p>

      <section className="section" aria-labelledby="recon">
        <h2 id="recon">Reconciliation against periop&apos;s report</h2>
        <p>Every wedge number must equal periop&apos;s own report before anything publishes, or carry a written explanation.</p>
        <div className="table-wrap">
          <table>
            <caption>Wedge metrics, {monthName(period)}: {recon.length} rows</caption>
            <thead><tr><th scope="col">Metric</th><th scope="col" className="num">Surgeons matching periop</th><th scope="col" className="num">Differ by a sustained dispute</th><th scope="col">Gate</th></tr></thead>
            <tbody>
              {recon.map((r) => (
                <tr key={r.m.key}>
                  <th scope="row">{r.m.name}</th>
                  <td className="num">{r.matched}</td>
                  <td className="num">{r.explained}</td>
                  <td>passed{r.explained ? "; differences explained by dispute decisions" : ""}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="section" aria-labelledby="supp">
        <h2 id="supp">Suppression decisions</h2>
        <p>Every cell carries either a value or a worded reason; none is blank.</p>
        <div className="table-wrap">
          <table>
            <caption>Cells by outcome, {monthName(period)}: {grid.length} metrics × {surgeons.length} surgeons</caption>
            <thead>
              <tr>
                <th scope="col">Metric</th>
                <th scope="col" className="num">Value shown</th>
                <th scope="col" className="num">Below minimum n</th>
                <th scope="col" className="num">Not applicable</th>
                <th scope="col" className="num">Source pending</th>
                <th scope="col" className="num">Spread shown</th>
                <th scope="col" className="num">Spread withheld</th>
              </tr>
            </thead>
            <tbody>
              {grid.map(({ m, counts }) => (
                <tr key={m.key}>
                  <th scope="row"><Link href={`/definitions/${m.key}`}>{m.name}</Link></th>
                  <td className="num">{counts.value}</td>
                  <td className="num">{counts.minN}</td>
                  <td className="num">{counts.notApplicable}</td>
                  <td className="num">{counts.pending}</td>
                  <td className="num">{counts.spreadShown}</td>
                  <td className="num">{counts.spreadWithheld}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="section" aria-labelledby="aging">
        <h2 id="aging">Open disputes</h2>
        <div className="table-wrap">
          <table>
            <caption>Open disputes: {open.length} {open.length === 1 ? "row" : "rows"}</caption>
            <thead><tr><th scope="col">Dispute</th><th scope="col">Record</th><th scope="col">With</th><th scope="col">Filed</th><th scope="col" className="num">Age in days</th></tr></thead>
            <tbody>
              {open.length === 0 && <tr><td colSpan={5}>No open disputes.</td></tr>}
              {open.map((d) => {
                const age = daysBetween(d.filedOn, today);
                return (
                  <tr key={d.id}>
                    <th scope="row">{d.id}</th>
                    <td className="case-id">{d.recordRef}</td>
                    <td>{adjudicatorFor(d).name} ({d.route})</td>
                    <td>{longDate(d.filedOn)}</td>
                    <td className="num">{age}{age > TARGET_DAYS ? ", past 14" : ""}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      <section className="section" aria-labelledby="demo">
        <h2 id="demo">Demo state</h2>
        <p>
          {storageMode() === "shared"
            ? "Disputes, decisions and notes are stored in this deployment's Redis store and are shared by every viewer."
            : "Disputes, decisions and notes are stored in cookies in this browser only. Connect an Upstash Redis store in Vercel to share them."}
        </p>
        <form action={resetDemo}>
          <button className="btn" type="submit">Clear filed disputes, decisions and notes</button>
        </form>
      </section>
    </Shell>
  );
}
