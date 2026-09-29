import { Shell, NotAuthorized } from "@/components/Shell";
import { viewer } from "@/lib/session";
import { BUCKETS, metric } from "@/lib/metrics";

export default async function Definition({ params }: { params: Promise<{ key: string }> }) {
  const v = await viewer();
  const def = metric((await params).key);
  if (!def) return <Shell viewer={v}><NotAuthorized /></Shell>;
  return (
    <Shell viewer={v} section="definitions" crumbs={[{ href: "/definitions", label: "Definitions" }, { label: `Bucket ${def.bucket}: ${BUCKETS[def.bucket].name}` }]}>
      <article className="read">
        <h1>{def.name}</h1>
        <p className="label">Version {def.version.slice(1)} in force, from metric definitions v0.2 (9 September 2026).</p>
        <div className="verbatim"><p style={{ margin: 0 }}>{def.what}</p></div>
        <h3>Counted</h3>
        <p>{def.counted}</p>
        <h3>Compared to</h3>
        <p>{def.comparedTo}</p>
        {def.shownAs && (<><h3>Shown as</h3><p>{def.shownAs}</p></>)}
        <h3>You can move it by</h3>
        <p>{def.movedBy}</p>
        <h3>Source and attribution</h3>
        <p>{def.source}. {def.availability === "pending_source" ? "The data source is pending confirmation; the number is not shown until it is confirmed." : ""}</p>
        {def.minN !== undefined && (<><h3>Minimum n</h3><p>{def.minN} {def.unit}. Below that, the screen says why instead of showing a number. A peer comparison also needs at least 5 other surgeons who each clear the minimum.</p></>)}
        {def.riskAdjusted && <p>Shown as observed divided by expected (O/E) from the Vizient risk model, with a 95% interval: 1.0 means exactly as expected; below 1.0 is better.</p>}
        {def.unadjusted && <p>Labeled &ldquo;unadjusted&rdquo;: there is no risk model for this measure. Complications come from the department&apos;s QI database, never entered by hand.</p>}
        <h3>Assumptions to be confirmed</h3>
        {def.params?.length ? (
          <div className="table-wrap">
            <table>
              <caption>Parameters of version {def.version.slice(1)}</caption>
              <thead><tr><th scope="col">Parameter</th><th scope="col">Value in force</th><th scope="col">Status</th><th scope="col">Note</th></tr></thead>
              <tbody>
                {def.params.map((p) => (
                  <tr key={p.name}><th scope="row">{p.name}</th><td>{p.value}</td><td>{p.status === "assumed" ? "assumed, to be confirmed" : "confirmed"}</td><td>{p.note}</td></tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p>None recorded for this version.</p>
        )}
        <h3>Version history</h3>
        <div className="table-wrap">
          <table>
            <caption>Versions of {def.name}</caption>
            <thead><tr><th scope="col">Version</th><th scope="col">In force from</th><th scope="col">Change</th></tr></thead>
            <tbody><tr><th scope="row">1</th><td>October 2025</td><td>First version, from metric definitions v0.2.</td></tr></tbody>
          </table>
        </div>
      </article>
    </Shell>
  );
}
