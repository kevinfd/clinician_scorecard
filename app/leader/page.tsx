import Link from "next/link";
import { Shell, SignInFirst, NotAuthorized } from "@/components/Shell";
import { reportsOf, viewer } from "@/lib/session";

export default async function Leader() {
  const v = await viewer();
  if (!v) return <Shell viewer={null}><SignInFirst /></Shell>;
  const reports = reportsOf(v);
  if (!v.roles.includes("leader")) return <Shell viewer={v}><NotAuthorized /></Shell>;
  return (
    <Shell viewer={v} section="leader">
      <h1>Direct reports</h1>
      <p className="lede">
        As direct leader of record you can read each surgeon&apos;s patient feedback inbox, 30 days after each survey month reaches the
        surgeon. You do not see their scorecard numbers or their private notes.
      </p>
      {reports.length === 0 ? (
        <p className="value">You are not the direct leader of record for any surgeon as of today.</p>
      ) : (
        <div className="table-wrap">
          <table>
            <caption>Surgeons you lead: {reports.length} rows</caption>
            <thead><tr><th scope="col">Surgeon</th><th scope="col">Site</th><th scope="col">Inbox</th></tr></thead>
            <tbody>
              {reports.map((s) => (
                <tr key={s.id}>
                  <th scope="row">{s.name}</th>
                  <td>{s.site}</td>
                  <td><Link href={`/leader/${s.ref}/inbox`}>Read {s.name}&apos;s patient feedback</Link></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Shell>
  );
}
