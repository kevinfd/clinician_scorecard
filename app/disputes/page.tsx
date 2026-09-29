import Link from "next/link";
import { Shell, SignInFirst, NotAuthorized } from "@/components/Shell";
import { viewer } from "@/lib/session";
import { live } from "@/lib/store";
import { DISPUTE_HOW, dueDate, FIELD_LABELS, stateLine, stateTone } from "@/lib/disputes";
import { longDate } from "@/lib/periods";

export default async function MyDisputes() {
  const v = await viewer();
  if (!v) return <Shell viewer={null}><SignInFirst /></Shell>;
  if (!v.isSurgeon) return <Shell viewer={v}><NotAuthorized /></Shell>;
  const { disputes } = await live();
  const mine = disputes.filter((d) => d.filedById === v.id || d.proposedClinicianId === v.id).sort((a, b) => (a.filedOn < b.filedOn ? 1 : -1));
  return (
    <Shell viewer={v} section="disputes">
      <h1>My disputes</h1>
      <p className="lede">{DISPUTE_HOW}</p>
      <div className="table-wrap">
        <table>
          <caption>Disputes you filed or that credit a record to you: {mine.length} {mine.length === 1 ? "row" : "rows"}</caption>
          <thead><tr><th scope="col">Record</th><th scope="col">What</th><th scope="col">Filed</th><th scope="col">Due</th><th scope="col">State</th></tr></thead>
          <tbody>
            {mine.length === 0 && <tr><td colSpan={5}>You have not disputed any record. Every record list has a dispute button on each row.</td></tr>}
            {mine.map((d) => (
              <tr key={d.id}>
                <th scope="row" className="case-id"><Link href={`/disputes/${d.id}`}>{d.recordRef}</Link></th>
                <td>{d.filedById === v.id ? FIELD_LABELS[d.field] : "A colleague's dispute credits this record to you"}</td>
                <td>{longDate(d.filedOn)}</td>
                <td>{d.state === "open" ? longDate(dueDate(d)) : ""}</td>
                <td><span className={`state ${stateTone(d)}`}>{stateLine(d)}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Shell>
  );
}
