import Link from "next/link";
import { Shell, SignInFirst, NotAuthorized } from "@/components/Shell";
import { viewer } from "@/lib/session";
import { live } from "@/lib/store";
import { metric, BUCKETS } from "@/lib/metrics";
import { disputesOnRecord, tileFor } from "@/lib/engine";
import { normalizePeriod } from "@/lib/periods";
import { stateLine, stateTone } from "@/lib/disputes";

export default async function Records({ params, searchParams }: { params: Promise<{ key: string }>; searchParams: Promise<{ period?: string }> }) {
  const v = await viewer();
  if (!v) return <Shell viewer={null}><SignInFirst /></Shell>;
  const { key } = await params;
  const def = metric(key);
  if (!v.isSurgeon || !def || !def.records || !def.columns) return <Shell viewer={v}><NotAuthorized /></Shell>;
  const period = normalizePeriod((await searchParams).period);
  const { disputes, ov } = await live();
  const tile = tileFor(def, v, period, ov);
  const rows = def.records(v.id, tile.win.months, { basis: "adjudicated", ov }).sort((a, b) => (a.sortKey < b.sortKey ? -1 : 1));
  const cols = def.columns;
  const heading = tile.kind === "reason" && !tile.muted ? ` (${tile.reason})` : "";
  const disputedCount = rows.filter((r) => disputesOnRecord(disputes, r.ref, v.id).some((d) => d.state === "open")).length;

  return (
    <Shell
      viewer={v}
      period={period}
      section="scorecard"
      periodPath={`/me/metric/${def.key}/records`}
      crumbs={[
        { href: `/me?period=${period}`, label: "Scorecard" },
        { label: `Bucket ${def.bucket}: ${BUCKETS[def.bucket].name}` },
        { href: `/me/metric/${def.key}?period=${period}`, label: def.name },
      ]}
    >
      <h1>Records behind {def.name}</h1>
      <p className="lede">
        Every record credited to you for {tile.win.label}, as logged in the source and as adjudicated after any sustained dispute.
        A record you think is wrong can be disputed; your division chief decides, or the chair if the chief is involved.{" "}
        <a href={`/me/records.csv?metric=${def.key}&period=${period}`} download>Download these rows (CSV)</a>
      </p>
      <div className="table-wrap">
        <table>
          <caption>
            {def.name}, {tile.win.label}: {rows.length} {rows.length === 1 ? "row" : "rows"}
            {disputedCount ? ` (${disputedCount} disputed)` : ""}
            {heading}
          </caption>
          <thead>
            <tr>
              <th scope="col">Record</th>
              {cols.map((c) => (
                <th scope="col" key={c.key} className={c.numeric ? "num" : undefined}>{c.label}</th>
              ))}
              <th scope="col">Counted</th>
              <th scope="col">Dispute</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr><td colSpan={cols.length + 3}>0 rows. The {tile.win.label} data loaded with no records of this kind credited to you.</td></tr>
            )}
            {rows.map((r) => {
              const ds = disputesOnRecord(disputes, r.ref, v.id);
              return (
                <tr key={r.ref}>
                  <th scope="row" className="case-id">{r.ref}</th>
                  {cols.map((c) => (
                    <td key={c.key} className={c.numeric ? "num" : c.key === "procedure" ? "proc" : undefined}>{r.cells[c.key]}</td>
                  ))}
                  <td>{r.counted}</td>
                  <td>
                    {ds.map((d) => (
                      <p key={d.id} style={{ margin: "0 0 4px" }}>
                        <Link href={`/disputes/${d.id}`} className={`state ${stateTone(d)}`}>{stateLine(d)}</Link>
                      </p>
                    ))}
                    {r.disputable.length > 0 && !ds.some((d) => d.state === "open") && (
                      <Link className="btn small" href={`/records/${encodeURIComponent(r.ref)}/dispute?metric=${def.key}&period=${period}`} aria-label={`Dispute this record ${r.ref}`}>
                        Dispute this record
                      </Link>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </Shell>
  );
}
