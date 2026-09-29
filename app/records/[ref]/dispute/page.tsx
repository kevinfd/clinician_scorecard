import { Shell, SignInFirst, NotAuthorized } from "@/components/Shell";
import { DisputeForm } from "@/components/DisputeForm";
import { Card, CardBody, CardHeader, LinkButton } from "@/components/ui";
import { viewer } from "@/lib/session";
import { live } from "@/lib/store";
import { findRecord, recreditOptions } from "@/lib/records";
import { DISPUTE_HOW, FIELD_LABELS, routeFor, routeWords } from "@/lib/disputes";
import { longDate } from "@/lib/periods";
import { metric } from "@/lib/metrics";

export default async function DisputePage({ params, searchParams }: { params: Promise<{ ref: string }>; searchParams: Promise<{ metric?: string; period?: string }> }) {
  const v = await viewer();
  if (!v) return <Shell viewer={null}><SignInFirst /></Shell>;
  const ref = decodeURIComponent((await params).ref);
  const sp = await searchParams;
  const { disputes, ov } = await live();
  const rec = findRecord(ref, ov);
  if (!v.isSurgeon || !rec || (rec.ownerId !== v.id && rec.loggedOwnerId !== v.id)) return <Shell viewer={v}><NotAuthorized /></Shell>;
  const m = sp.metric ? metric(sp.metric) : undefined;
  const back = m && m.key !== "feedback_inbox" ? `/me/metric/${m.key}/records?period=${sp.period ?? ""}` : sp.metric === "feedback_inbox" ? "/me/inbox" : "/me";
  const open = disputes.find((d) => d.recordRef === ref && d.filedById === v.id && d.state === "open");
  const route = routeFor({ filedById: v.id, recordRef: ref, recordType: rec.type });

  return (
    <Shell viewer={v} section="scorecard" wide={false} crumbs={[{ href: "/me", label: "Scorecard" }, { href: back, label: m && m.key !== "feedback_inbox" ? m.name : "Back" }, { label: `Dispute ${rec.type === "attendance" ? "attendance" : rec.ref}` }]}>
      <div className="flex flex-col gap-6">
        <div>
          <p className="text-[11px] font-medium uppercase tracking-wider text-slate-500">Dispute a record</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-900">{rec.type === "attendance" ? "M&M attendance record" : <span className="font-mono">{rec.ref}</span>}</h1>
          <p className="mt-1 text-[13.5px] text-slate-500">Goes to {routeWords(route.route)}. {route.route === "chair" ? route.reason : "The target for a decision is 14 days."}</p>
        </div>
        {rec.fields.length === 0 ? (
          <Card className="p-6"><p className="text-[14px] text-slate-700">Nothing on this record can be disputed now.</p><div className="mt-3"><LinkButton href={back}>Back to the records</LinkButton></div></Card>
        ) : (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
            <Card className="lg:col-span-2 self-start">
              <CardHeader title="The record" sub={`Feeds: ${rec.feeds.join("; ")}.`} />
              <CardBody>
                <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-[13px]">
                  {rec.facts.map(([k, val]) => (
                    <div key={k} className="contents"><dt className="text-slate-500">{k}</dt><dd className={k.endsWith("id") ? "font-mono text-slate-900" : "text-slate-900"}>{val}</dd></div>
                  ))}
                </dl>
              </CardBody>
            </Card>
            <Card className="lg:col-span-3" data-tour="dispute-form">
              <CardHeader title="Your dispute" />
              <CardBody>
                <DisputeForm
                  recordRef={rec.ref}
                  fields={rec.fields}
                  labels={FIELD_LABELS}
                  options={recreditOptions(v.id).map((s) => ({ id: s.id, name: s.name }))}
                  openNotice={open ? `A dispute on this record is already open (filed ${longDate(open.filedOn)}). Choosing the same field adds what you write to it.` : undefined}
                  effect="A sustained dispute never edits the OR log or any source system. It adds an adjudicated value beside the logged one, both show until the source is corrected, and your numbers are recomputed the same day."
                />
              </CardBody>
            </Card>
          </div>
        )}
        <p className="max-w-3xl text-[12.5px] leading-relaxed text-slate-500">{DISPUTE_HOW}</p>
      </div>
    </Shell>
  );
}
