import Link from "next/link";
import { Shell, SignInFirst, NotAuthorized } from "@/components/Shell";
import { isAdjudicator, viewer } from "@/lib/session";
import { live } from "@/lib/store";
import { adjudicatorFor, FIELD_LABELS, stateLine, TARGET_DAYS } from "@/lib/disputes";
import { daysBetween, longDate, monthName } from "@/lib/periods";
import { findRecord } from "@/lib/records";

export default async function Queue({ searchParams }: { searchParams: Promise<{ decided?: string }> }) {
  const v = await viewer();
  if (!v) return <Shell viewer={null}><SignInFirst /></Shell>;
  if (!isAdjudicator(v)) return <Shell viewer={v}><NotAuthorized /></Shell>;
  const { decided } = await searchParams;
  const { disputes, ov } = await live();
  const today = new Date().toISOString().slice(0, 10);
  const mine = disputes.filter((d) => adjudicatorFor(d).id === v.id && d.filedById !== v.id);
  const open = mine.filter((d) => d.state === "open").sort((a, b) => (a.filedOn < b.filedOn ? -1 : 1));
  const closed = mine.filter((d) => d.state !== "open").sort((a, b) => ((a.decidedOn ?? "") < (b.decidedOn ?? "") ? 1 : -1));
  const justDecided = decided ? mine.find((d) => d.id === decided) : undefined;

  return (
    <Shell viewer={v} section="queue">
      {justDecided && (
        <p className="value" role="status">
          Decision recorded {longDate(justDecided.decidedOn!)}. The surgeon&apos;s numbers were recomputed with the adjudicated record.
        </p>
      )}
      <h1>Dispute queue</h1>
      <p className="lede">
        Disputes routed to you as {v.roles.includes("chair") ? "chair (the division chief is involved in each)" : "division chief"}, oldest first.
        You decide on the record, not on anyone&apos;s score: no surgeon&apos;s value appears here. The target is {TARGET_DAYS} days.
      </p>
      <div className="table-wrap">
        <table>
          <caption>Open disputes: {open.length} {open.length === 1 ? "row" : "rows"}</caption>
          <thead><tr><th scope="col">Record</th><th scope="col">What is disputed</th><th scope="col">Period</th><th scope="col">Filed</th><th scope="col" className="num">Age in days</th><th scope="col">Why it came to you</th></tr></thead>
          <tbody>
            {open.length === 0 && <tr><td colSpan={6}>No open disputes routed to you.</td></tr>}
            {open.map((d) => {
              const age = daysBetween(d.filedOn, today);
              const rec = findRecord(d.recordRef, ov);
              return (
                <tr key={d.id}>
                  <th scope="row" className="case-id"><Link href={`/disputes/${d.id}`}>{d.recordRef}</Link></th>
                  <td>{FIELD_LABELS[d.field]}</td>
                  <td>{rec ? monthName(rec.period) : ""}</td>
                  <td>{longDate(d.filedOn)}</td>
                  <td className="num">{age}{age > TARGET_DAYS ? ", past 14" : ""}</td>
                  <td>{d.routingReason}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div className="table-wrap">
        <table>
          <caption>Decided and withdrawn: {closed.length} {closed.length === 1 ? "row" : "rows"}</caption>
          <thead><tr><th scope="col">Record</th><th scope="col">Outcome</th></tr></thead>
          <tbody>
            {closed.length === 0 && <tr><td colSpan={2}>Nothing decided yet.</td></tr>}
            {closed.map((d) => (
              <tr key={d.id}>
                <th scope="row" className="case-id"><Link href={`/disputes/${d.id}`}>{d.recordRef}</Link></th>
                <td>{stateLine(d).replace("your division chief", "you").replace("the chair", "you").replace("Withdrawn by you", "Withdrawn by the surgeon")}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Shell>
  );
}
