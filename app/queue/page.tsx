import { DISPUTES_ENABLED } from "@/lib/features";
import { notFound } from "next/navigation";
import Link from "next/link";
import { CircleCheck } from "lucide-react";
import { Shell, SignInFirst, NotAuthorized } from "@/components/Shell";
import { Card, Chip, StatePill, Table } from "@/components/ui";
import { isAdjudicator, viewer } from "@/lib/session";
import { live } from "@/lib/store";
import { adjudicatorFor, FIELD_LABELS, stateLine, stateTone, TARGET_DAYS } from "@/lib/disputes";
import { daysBetween, longDate, monthName } from "@/lib/periods";
import { findRecord } from "@/lib/records";
import { person } from "@/lib/synth";

export default async function Queue({ searchParams }: { searchParams: Promise<{ decided?: string }> }) {
  if (!DISPUTES_ENABLED) notFound();
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
  const pastDue = open.filter((d) => daysBetween(d.filedOn, today) > TARGET_DAYS).length;

  return (
    <Shell viewer={v} section="queue" crumbs={[{ label: "Dispute queue" }]}>
      <div className="flex flex-col gap-6">
        {justDecided ? (
          <div className="animate-rise flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-5 py-4" role="status">
            <CircleCheck className="mt-0.5 size-5 shrink-0 text-emerald-600" strokeWidth={2} />
            <p className="text-[14px] font-medium text-emerald-900">Decision recorded {longDate(justDecided.decidedOn!)}. The surgeon&apos;s numbers were recomputed with the adjudicated record.</p>
          </div>
        ) : null}
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Dispute queue</h1>
            <p className="mt-1 max-w-3xl text-[13.5px] text-slate-500">
              Routed to you as {v.roles.includes("chair") ? "chair: the division chief is involved in each of these" : "division chief"}. Oldest first. You decide on the record, not anyone&apos;s score: no surgeon&apos;s value appears here.
            </p>
          </div>
          <div className="flex gap-2">
            <Chip tone="teal" dot>{open.length} open</Chip>
            <Chip tone={pastDue ? "amber" : "neutral"} dot>{pastDue} past {TARGET_DAYS} days</Chip>
          </div>
        </div>

        <div data-tour="queue-table">
          <Table head={[{ label: "Record" }, { label: "What is disputed" }, { label: "Filed by" }, { label: "Period" }, { label: "Age", align: "right" }, { label: "Why it came to you" }]}
            empty={open.length === 0 ? <p className="px-4 py-6 text-center text-[13px] text-slate-500">No open disputes routed to you.</p> : undefined}>
            {open.map((d) => {
              const age = daysBetween(d.filedOn, today);
              const rec = findRecord(d.recordRef, ov);
              return (
                <tr key={d.id} className="align-top hover:bg-slate-50/60">
                  <th scope="row" className="whitespace-nowrap px-4 py-3 text-left"><Link className="font-mono text-[12.5px] font-medium text-teal-700 hover:underline" href={`/disputes/${d.id}`}>{d.recordRef}</Link></th>
                  <td className="px-4 py-3 text-slate-700">{FIELD_LABELS[d.field]}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-slate-700">{person(d.filedById)?.name}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-slate-600">{rec ? monthName(rec.period) : ""}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-right">{age > TARGET_DAYS ? <Chip tone="amber">{age} days</Chip> : <span className="text-slate-700">{age} days</span>}</td>
                  <td className="px-4 py-3 text-slate-500">{d.routingReason}</td>
                </tr>
              );
            })}
          </Table>
        </div>

        <Card>
          <div className="border-b border-slate-100 px-5 py-3 text-[13px] font-semibold text-slate-900">Decided and withdrawn · {closed.length}</div>
          {closed.length === 0 ? <p className="px-5 py-5 text-[13px] text-slate-500">Nothing decided yet.</p> : (
            <ul className="divide-y divide-slate-100">
              {closed.map((d) => (
                <li key={d.id} className="flex flex-wrap items-center gap-3 px-5 py-3">
                  <Link className="font-mono text-[12.5px] font-medium text-teal-700 hover:underline" href={`/disputes/${d.id}`}>{d.recordRef}</Link>
                  <StatePill tone={stateTone(d)}>{stateLine(d).replace("your division chief", "you").replace("the chair", "you").replace("Withdrawn by you", "Withdrawn by the surgeon")}</StatePill>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </Shell>
  );
}
