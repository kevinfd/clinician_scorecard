import Link from "next/link";
import { Shell, SignInFirst, NotAuthorized } from "@/components/Shell";
import { StatePill, Table } from "@/components/ui";
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
    <Shell viewer={v} section="disputes" crumbs={[{ label: "My disputes" }]}>
      <div className="flex flex-col gap-5">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">My disputes</h1>
          <p className="mt-1 max-w-3xl text-[13.5px] text-slate-500">{DISPUTE_HOW}</p>
        </div>
        <Table head={[{ label: "Record" }, { label: "What" }, { label: "Filed" }, { label: "Due" }, { label: "State" }]}
          empty={mine.length === 0 ? <p className="px-4 py-6 text-center text-[13px] text-slate-500">You have not disputed any record. Every record list has a Dispute button on each row.</p> : undefined}>
          {mine.map((d) => (
            <tr key={d.id} className="align-top hover:bg-slate-50/60">
              <th scope="row" className="whitespace-nowrap px-4 py-3 text-left"><Link className="font-mono text-[12.5px] font-medium text-teal-700 hover:underline" href={`/disputes/${d.id}`}>{d.recordRef}</Link></th>
              <td className="px-4 py-3 text-slate-700">{d.filedById === v.id ? FIELD_LABELS[d.field] : "A colleague's dispute credits this record to you"}</td>
              <td className="whitespace-nowrap px-4 py-3 text-slate-600">{longDate(d.filedOn)}</td>
              <td className="whitespace-nowrap px-4 py-3 text-slate-600">{d.state === "open" ? longDate(dueDate(d)) : ""}</td>
              <td className="px-4 py-3"><StatePill tone={stateTone(d)}>{stateLine(d)}</StatePill></td>
            </tr>
          ))}
        </Table>
      </div>
    </Shell>
  );
}
