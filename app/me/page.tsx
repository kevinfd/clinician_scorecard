import Link from "next/link";
import { Shell, SignInFirst, NotAuthorized } from "@/components/Shell";
import { TileRow } from "@/components/TileRow";
import { viewer } from "@/lib/session";
import { live } from "@/lib/store";
import { BUCKETS, METRICS, DIVISION_ONLY } from "@/lib/metrics";
import { mmView, surveyView, tileFor, wrvuView, type Tile } from "@/lib/engine";
import { addMonths, FIRST_PUBLISHED, longDate, monthName, monthOnly, normalizePeriod, publishDate } from "@/lib/periods";
import { stateLine } from "@/lib/disputes";

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
  const decided = disputes.filter(
    (d) => (d.filedById === v.id || d.proposedClinicianId === v.id) && d.decidedOn && d.decidedOn >= since && d.state !== "withdrawn",
  );
  const open = disputes.filter((d) => d.filedById === v.id && d.state === "open");

  return (
    <Shell viewer={v} period={period} section="scorecard" periodPath="/me">
      <h1>Your scorecard for {monthName(period)}</h1>
      <p className="lede">
        Every number links to its definition and the records behind it. <Link href={`/me/email?period=${period}`}>See this month as the plain-text email</Link>.
      </p>

      <aside className="aside" aria-labelledby="changed">
        {period === FIRST_PUBLISHED ? (
          <>
            <h2 id="changed">First monthly scorecard</h2>
            <p>
              Numbers from the OR log and the other department feeds for {monthName(period)}, with your own records behind each one.
              Only you see this page; your chief or chair sees one of your rows only when you dispute it. Peer comparison starts
              next month.
            </p>
          </>
        ) : (
          <>
            <h2 id="changed">What changed since {monthName(prev)}</h2>
            <ul>
              {prevTiles &&
                [...prevTiles.entries()].map(([k, pt]) => {
                  const t = tiles.get(k)!;
                  if (t.kind !== "value" || pt.kind !== "value") return null;
                  const now = t.adjudicated!.value;
                  const was = pt.adjudicated!.value;
                  if (now === was) return <li key={k}>{t.def.name}: unchanged from {monthOnly(prev)}.</li>;
                  const unit = k === "or_case_volume" ? "" : "%";
                  return <li key={k}>{t.def.name}: {now}{unit} in {monthOnly(period)}, {was}{unit} in {monthOnly(prev)}.</li>;
                })}
              {decided.map((d) => (
                <li key={d.id}>
                  <Link href={`/disputes/${d.id}`}>Record {d.recordRef}</Link>: {d.proposedClinicianId === v.id && d.filedById !== v.id ? "credited to you after a colleague's dispute. " : ""}{stateLine(d)}
                </li>
              ))}
              {open.map((d) => (
                <li key={d.id}>
                  <Link href={`/disputes/${d.id}`}>Record {d.recordRef}</Link>: {stateLine(d)}.
                </li>
              ))}
            </ul>
          </>
        )}
      </aside>

      {[1, 2, 3, 4, 5, 6].map((b) => (
        <section className="bucket" key={b} aria-labelledby={`b${b}`}>
          <h2 id={`b${b}`}>Bucket {b}: {BUCKETS[b].name}</h2>
          <p className="intro">{BUCKETS[b].intro}</p>
          <dl className="tiles">
            {METRICS.filter((m) => m.bucket === b).map((m) => {
              const t = tiles.get(m.key)!;
              if (m.key === "work_rvus") {
                const w = wrvuView(v, period);
                const diff = w.ytd - w.lastYtd;
                return (
                  <TileRow key={m.key} tile={t} viewer={v} period={period} ov={ov}
                    extra={
                      <>
                        <p className="value">{w.ytd.toLocaleString("en-US")} wRVUs fiscal year to date</p>
                        <p>Same point last year: {w.lastYtd.toLocaleString("en-US")} ({diff >= 0 ? "+" : ""}{diff.toLocaleString("en-US")}). As of {longDate(w.asOf)}; recent months may increase as billing closes.</p>
                      </>
                    }
                  />
                );
              }
              if (m.key === "mm_attendance") {
                const mm = mmView(v, period, ov);
                return (
                  <TileRow key={m.key} tile={t} viewer={v} period={period} ov={ov}
                    extra={
                      <>
                        <p className="value">{mm.line}</p>
                        <p className={mm.unreachable ? "value" : undefined}>{mm.pace}</p>
                      </>
                    }
                  />
                );
              }
              if (m.bucket === 5 && m.key !== "feedback_inbox") {
                const s = surveyView(m, v, period, ov);
                return (
                  <TileRow key={m.key} tile={{ ...t, kind: "special" }} viewer={v} period={period} ov={ov}
                    extra={
                      <>
                        <p className="value">Year average: {s.yearAverage.line || "no responses yet"}</p>
                        <p>MGB average: {s.mgb}{m.key === "nps" ? "" : "%"}.</p>
                      </>
                    }
                  />
                );
              }
              if (m.key === "feedback_inbox") {
                return (
                  <div className="tile" key={m.key}>
                    <dt><Link href="/me/inbox">{m.name}</Link></dt>
                    <dd><p>Every comment patients wrote about you, newest first, with the scores from the same survey. Visible to you and your direct leader only.</p></dd>
                  </div>
                );
              }
              return <TileRow key={m.key} tile={t} viewer={v} period={period} ov={ov} />;
            })}
          </dl>
          {b === 2 && (
            <p className="dead">
              Not on this page: {DIVISION_ONLY.join(", ").toLowerCase()}. A surgeon cannot move these alone, so they appear only on
              division and site views.
            </p>
          )}
        </section>
      ))}
    </Shell>
  );
}
