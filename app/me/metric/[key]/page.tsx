import Link from "next/link";
import { redirect } from "next/navigation";
import { Shell, SignInFirst, NotAuthorized } from "@/components/Shell";
import { StripPlot, TrendChart, GhostBars, BarSpread, Responsive } from "@/components/Charts";
import { viewer } from "@/lib/session";
import { live } from "@/lib/store";
import { metric, BUCKETS } from "@/lib/metrics";
import { fmtValue, mmView, surveyView, tileFor, trendFor, wrvuView } from "@/lib/engine";
import { longDate, monthName, normalizePeriod } from "@/lib/periods";
import { department } from "@/lib/synth";
import { disputesOnRecord } from "@/lib/engine";
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

  const crumbs = [{ href: `/me?period=${period}`, label: "Scorecard" }, { label: `Bucket ${def.bucket}: ${BUCKETS[def.bucket].name}` }];

  return (
    <Shell viewer={v} period={period} section="scorecard" periodPath={`/me/metric/${def.key}`} crumbs={crumbs}>
      <h1>{def.name}</h1>

      <section className="object lines" aria-label="This period">
        {def.cadence !== "month" && def.bucket !== 5 && def.key !== "work_rvus" && def.key !== "mm_attendance" && (
          <p className="label">Period: {tile.win.label}</p>
        )}
        {tile.kind === "reason" && <p className={`value${tile.muted ? " muted-reason" : ""}`}>{tile.reason}</p>}
        {tile.kind === "value" && tile.adjudicated && (
          tile.bothBases ? (
            <>
              <p className="value">As adjudicated: {tile.adjudicated.line}</p>
              <p>As logged: {tile.logged!.line}. The two differ because a dispute on one of your records was sustained; the OR log still carries the original until periop corrects it.</p>
            </>
          ) : (
            <p className="value">{tile.adjudicated.line}</p>
          )
        )}
        {tile.kind === "value" && tile.adjudicated?.extra?.map((x, i) => <p key={i}>{x}</p>)}
        {tile.kind === "reason" && tile.adjudicated?.extra && def.key === "los_oe" && <p>{tile.adjudicated.extra[0]}</p>}
        {def.riskAdjusted && <p>1.0 means exactly as expected; below 1.0 is better.</p>}
        {tile.win.interim && <p>{tile.win.interim}</p>}
        {rowCount !== undefined && def.availability === "live" && (
          <p><Link href={rowsHref}>Records: {rowCount} {rowCount === 1 ? "row" : "rows"}</Link></p>
        )}
        {tile.comparator && <p className="label">{tile.comparator}</p>}
        <p className="label">
          Definition: <Link href={`/definitions/${def.key}`}>version {def.version.slice(1)}, metric definitions v0.2</Link>
          {def.params?.some((p) => p.status === "assumed") ? " (includes an assumption to be confirmed)" : ""}
        </p>
        <p className="label">Source: {def.source} · as of {longDate(department().refreshedOn)}</p>
      </section>

      {def.key === "work_rvus" && <WrvuSection />}
      {def.key === "mm_attendance" && <MMSection />}
      {def.bucket === 5 && <SurveySection />}

      {tile.spread && def.bucket !== 5 && (
        <section className="section" aria-labelledby="spread">
          <h2 id="spread">Where you sit among peers</h2>
          {tile.spread.kind === "reason" ? (
            <p className="value">{tile.spread.text}</p>
          ) : (
            <>
              <Responsive render={(W) => (
                <StripPlot W={W} values={(tile.spread as { values: number[] }).values} you={(tile.spread as { you: number }).you} fmt={fmt} title={(tile.spread as { sentence: string }).sentence}
                  betterWord={def.better === "lower" ? "Lower is better" : def.better === "higher" ? "Higher is better" : undefined} />
              )} />
              <p>{tile.spread.sentence}</p>
              <p className="tnum">Peers: {tile.spread.values.map(fmt).join(", ")}</p>
              <p className="tnum">You: {fmt(tile.spread.you)}</p>
              <p className="label">Anonymous: no peer is named, and the values are sorted, not listed in any member order.</p>
            </>
          )}
        </section>
      )}

      <TrendSection />

      <section className="section read" aria-labelledby="move">
        <h2 id="move">You can move it by</h2>
        <p>{def.movedBy}</p>
      </section>
    </Shell>
  );

  function TrendSection() {
    const pts = trendFor(def!, v!, period, ov);
    if (!pts.length) return null;
    return (
      <section className="section" aria-labelledby="trend">
        <h2 id="trend">Trend</h2>
        <Responsive render={(W) => <TrendChart W={W} points={pts} fmt={fmt} title={`${def!.name}: ${pts.filter((p) => p.value !== null).map((p) => `${fmt(p.value!)} in ${p.label}`).join(", ")}`} />} />
        <div className="table-wrap">
          <table>
            <caption>{def!.name}, {pts.length} {def!.cadence === "month" ? "months" : "periods"}</caption>
            <thead><tr><th scope="col">Period</th><th scope="col">Value</th><th scope="col">Detail</th></tr></thead>
            <tbody>
              {pts.slice().reverse().map((p) => (
                <tr key={p.period}>
                  <th scope="row">{p.label}</th>
                  <td>{p.value === null ? "not shown" : fmt(p.value)}</td>
                  <td>{p.text}{p.restated ? ". Restated after a sustained dispute." : ""}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    );
  }

  function WrvuSection() {
    const w = wrvuView(v!, period);
    const diff = w.ytd - w.lastYtd;
    return (
      <section className="section" aria-labelledby="wrvu">
        <h2 id="wrvu">Fiscal year to date</h2>
        <p className="value">{w.ytd.toLocaleString("en-US")} wRVUs; same point last year {w.lastYtd.toLocaleString("en-US")} ({diff >= 0 ? "+" : ""}{diff.toLocaleString("en-US")}).</p>
        <p>No peer comparison. No target. As of {longDate(w.asOf)}: billing lags, so the two most recent months may still increase.</p>
        <Responsive render={(W) => <GhostBars W={W} months={w.months} title="Monthly wRVUs this fiscal year, with last year's months hatched behind them." />} />
        <p className="label">Solid bars: this year. Hatched bars: last year (ghosted).</p>
        <div className="table-wrap">
          <table>
            <caption>Work RVUs by month</caption>
            <thead><tr><th scope="col">Month</th><th scope="col" className="num">This year</th><th scope="col" className="num">Last year</th><th scope="col">Note</th></tr></thead>
            <tbody>
              {w.months.map((m) => (
                <tr key={m.period}>
                  <th scope="row">{monthName(m.period)}</th>
                  <td className="num">{m.value.toLocaleString("en-US")}</td>
                  <td className="num">{m.last.toLocaleString("en-US")}</td>
                  <td>{m.prior !== undefined ? `As of ${longDate(w.asOf)}, may increase (prior snapshot ${m.prior.toLocaleString("en-US")}, +${m.value - m.prior})` : ""}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    );
  }

  function MMSection() {
    const mm = mmView(v!, period, ov);
    return (
      <section className="section" aria-labelledby="mm">
        <h2 id="mm">Fiscal year {mm.fy}</h2>
        <p className="value">{mm.line}</p>
        <p className={mm.unreachable ? "value" : undefined}>{mm.pace}</p>
        <p>{mm.remaining} {mm.remaining === 1 ? "session" : "sessions"} remaining this fiscal year. No peer comparison.</p>
        <div className="table-wrap">
          <table>
            <caption>M&amp;M sessions, fiscal year {mm.fy}: {mm.sessions.length} rows</caption>
            <thead><tr><th scope="col">Date</th><th scope="col">Topic</th><th scope="col">Recorded</th><th scope="col">Dispute</th></tr></thead>
            <tbody>
              {mm.sessions.map((s) => {
                const ds = disputesOnRecord(disputes, s.ref, v!.id);
                return (
                  <tr key={s.ref}>
                    <th scope="row">{s.date}</th>
                    <td>{s.topic}</td>
                    <td>{s.status}</td>
                    <td>
                      {ds[0] ? <span className={`state ${stateTone(ds[0])}`}>{stateLine(ds[0])}</span>
                        : s.status === "not recorded as attended" ? <Link className="btn small" href={`/records/${encodeURIComponent(s.ref)}/dispute?metric=mm_attendance&period=${period}`} aria-label={`Dispute this record, session ${s.date}`}>Dispute this record</Link> : null}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    );
  }

  function SurveySection() {
    const s = surveyView(def!, v!, period, ov);
    const unit = def!.key === "nps" ? "" : "%";
    return (
      <section className="section" aria-labelledby="survey">
        <h2 id="survey">As shown at faculty meeting</h2>
        <div className="table-wrap">
          <table>
            <caption>{def!.name}</caption>
            <thead><tr><th scope="col">Period</th><th scope="col">Value</th><th scope="col">Responses</th></tr></thead>
            <tbody>
              <tr><th scope="row">Your year average ({tile.win.label})</th><td>{s.yearAverage.value === null ? "no responses" : `${s.yearAverage.value}${unit}`}</td><td>{s.yearAverage.n}</td></tr>
              {s.months.map((m) => (
                <tr key={m.period}><th scope="row">{m.label}</th><td>{m.hidden ? m.line : `${m.value}${unit}`}</td><td>{m.n}</td></tr>
              ))}
              <tr><th scope="row">MGB average</th><td>{s.mgb}{unit}</td><td></td></tr>
            </tbody>
          </table>
        </div>
        <h3>Everyone in your peer group</h3>
        {s.bars && "reason" in s.bars ? (
          <p className="value">{s.bars.reason}</p>
        ) : s.bars ? (
          <>
            <Responsive render={(W) => { const b = s.bars as { values: number[]; you: number; sentence: string }; return <BarSpread W={W} values={b.values} you={b.you} title={b.sentence} />; }} />
            <p>{s.bars.sentence} Your bar is hatched and labelled; no other bar is labelled.</p>
          </>
        ) : null}
        <p><Link href="/me/inbox">Read the comments in your patient feedback inbox</Link></p>
      </section>
    );
  }
}
