import { DISPUTES_ENABLED } from "@/lib/features";
import { notFound } from "next/navigation";
import { CalendarClock, CircleCheck, Route as RouteIcon, UserRound } from "lucide-react";
import { Shell, SignInFirst, NotAuthorized } from "@/components/Shell";
import { DecideForm } from "@/components/DecideForm";
import { btn, Card, CardBody, CardHeader, LinkButton, StatePill } from "@/components/ui";
import { viewer } from "@/lib/session";
import { live } from "@/lib/store";
import { findRecord } from "@/lib/records";
import { acknowledgement, adjudicatorFor, dueDate, FIELD_LABELS, recordParticipants, stateLine, stateTone } from "@/lib/disputes";
import { daysBetween, longDate } from "@/lib/periods";
import { person } from "@/lib/synth";
import { withdrawDispute } from "../../actions";

export default async function DisputeDetail({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ filed?: string }> }) {
  if (!DISPUTES_ENABLED) notFound();
  const v = await viewer();
  if (!v) return <Shell viewer={null}><SignInFirst /></Shell>;
  const { id } = await params;
  const { filed } = await searchParams;
  const { disputes, ov } = await live();
  const d = disputes.find((x) => x.id === id);
  const adjudicator = d ? adjudicatorFor(d) : null;
  const isFiler = !!d && d.filedById === v.id;
  const isReceiver = !!d && d.proposedClinicianId === v.id;
  const isAdj = !!d && adjudicator?.id === v.id;
  if (!d || !(isFiler || isReceiver || isAdj)) return <Shell viewer={v}><NotAuthorized /></Shell>;
  const rec = findRecord(d.recordRef, new Map());
  const recNow = findRecord(d.recordRef, ov);
  const filer = person(d.filedById)!;
  const prior = disputes.filter((x) => x.recordRef === d.recordRef && x.id !== d.id);
  const pastDue = d.state === "open" && daysBetween(dueDate(d), new Date().toISOString()) > 0;

  return (
    <Shell viewer={v} section={isAdj ? "queue" : "disputes"} wide={false} crumbs={[isAdj ? { href: "/queue", label: "Dispute queue" } : { href: "/disputes", label: "My disputes" }, { label: d.recordRef }]}>
      <div className="flex flex-col gap-6">
        {isFiler && filed && d.state === "open" ? (
          <div className="animate-rise flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-5 py-4" role="status">
            <CircleCheck className="mt-0.5 size-5 shrink-0 text-emerald-600" strokeWidth={2} />
            <p className="text-[14px] font-medium text-emerald-900">{acknowledgement(d)}</p>
          </div>
        ) : null}

        <Card className="p-5 sm:p-6" data-tour="dispute-status">
          <p className="text-[11px] font-medium uppercase tracking-wider text-slate-500">Dispute {d.id}</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-900">Record <span className="font-mono">{d.recordRef}</span></h1>
          <div className="mt-3"><StatePill tone={stateTone(d)}>{stateLine(d)}</StatePill></div>
          <div className="mt-5 grid grid-cols-1 gap-4 border-t border-slate-100 pt-4 text-[13px] sm:grid-cols-3">
            <Fact icon={<UserRound className="size-4" />} label="Decides">{d.route === "chair" ? "The chair" : "The division chief"}{adjudicator ? ` (${adjudicator.name})` : ""}</Fact>
            <Fact icon={<CalendarClock className="size-4" />} label={d.state === "open" ? "Decision due" : "Decided"}>{d.state === "open" ? `${longDate(dueDate(d))}${pastDue ? ", past the 14-day target" : ""}` : longDate(d.decidedOn ?? d.filedOn)}</Fact>
            <Fact icon={<RouteIcon className="size-4" />} label="Why it went there">{d.routingReason}</Fact>
          </div>
          {isReceiver && !isFiler ? (
            <p className="mt-4 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-[13px] text-slate-700">A colleague disputed this record and asks that it be credited to you. {d.state === "open" ? "If sustained, it counts toward your numbers." : ""} You may dispute it in turn from your record list.</p>
          ) : null}
        </Card>

        <Card>
          <CardHeader title="The claim" />
          <CardBody>
            <dl className="grid grid-cols-1 gap-x-6 gap-y-3 text-[13.5px] sm:grid-cols-[10rem_1fr]">
              <dt className="text-slate-500">Filed by</dt><dd className="text-slate-900">{isAdj || isFiler ? filer.name : "A colleague"}, {longDate(d.filedOn)}</dd>
              <dt className="text-slate-500">What is wrong</dt><dd className="text-slate-900">{FIELD_LABELS[d.field]}</dd>
              {d.proposedClinicianId ? <><dt className="text-slate-500">Credit to</dt><dd className="text-slate-900">{person(d.proposedClinicianId)?.name}</dd></> : null}
              <dt className="text-slate-500">What happened</dt><dd className="max-w-prose whitespace-pre-wrap text-slate-900">{isAdj || isFiler ? d.claim : "Visible to the surgeon who filed and the decider."}</dd>
            </dl>
          </CardBody>
        </Card>

        {isAdj && rec ? (
          <Card className="border-violet-200" data-tour="provenance">
            <CardHeader title="Provenance" sub="Decide on the record, not the score: no surgeon's value appears here." />
            <CardBody>
              <dl className="grid grid-cols-1 gap-x-6 gap-y-2 text-[13px] sm:grid-cols-[12rem_1fr]">
                {rec.facts.map(([k, val]) => <div key={k} className="contents"><dt className="text-slate-500">{k}</dt><dd className="text-slate-900">{val}</dd></div>)}
                <dt className="text-slate-500">Source</dt><dd className="text-slate-900">{rec.source}</dd>
                <dt className="text-slate-500">Attribution rule</dt><dd className="text-slate-900">{rec.attributionRule}</dd>
                <dt className="text-slate-500">Definition</dt><dd className="text-slate-900">Metric definitions v0.2, version 1</dd>
                <dt className="text-slate-500">Feeds</dt><dd className="text-slate-900">{rec.feeds.join("; ")}</dd>
                <dt className="text-slate-500">People on the record</dt><dd className="text-slate-900">{recordParticipants(d.recordRef, d.recordType).map((pid) => person(pid)?.name).join(", ")}</dd>
                <dt className="text-slate-500">Prior disputes</dt><dd className="text-slate-900">{prior.length ? prior.map((p) => `${p.id}: ${stateLine(p)}`).join(" ") : "None"}</dd>
              </dl>
            </CardBody>
          </Card>
        ) : null}

        {isAdj && d.state === "open" ? (
          <Card data-tour="decide-form">
            <CardHeader title="Decision" />
            <CardBody><DecideForm id={d.id} /></CardBody>
          </Card>
        ) : null}

        {!isAdj && recNow ? (
          <Card>
            <CardHeader title="The record" />
            <CardBody>
              <dl className="grid grid-cols-1 gap-x-6 gap-y-2 text-[13px] sm:grid-cols-[12rem_1fr]">
                {recNow.facts.map(([k, val]) => <div key={k} className="contents"><dt className="text-slate-500">{k}</dt><dd className="text-slate-900">{val}</dd></div>)}
              </dl>
              {d.state === "not_sustained" ? <p className="mt-4 text-[13px] text-slate-600">You may file once more on this record with new evidence.</p> : null}
              {(d.state === "sustained_annotated" || d.state === "sustained_source_corrected") ? <p className="mt-4 text-[13px] text-slate-600">The reason you gave and the decision stay on this row. Periop is asked to correct its record; until it does, both values show.</p> : null}
            </CardBody>
          </Card>
        ) : null}

        <div className="flex flex-wrap gap-3">
          {isFiler && d.state === "open" ? (
            <form action={withdrawDispute}><input type="hidden" name="id" value={d.id} /><button className={btn("secondary")} type="submit">Withdraw this dispute</button></form>
          ) : null}
          <LinkButton href={isAdj ? "/queue" : "/disputes"} variant="ghost">{isAdj ? "Back to the queue" : "All my disputes"}</LinkButton>
        </div>
      </div>
    </Shell>
  );
}

function Fact({ icon, label, children }: { icon: React.ReactNode; label: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-2.5">
      <span className="mt-0.5 text-slate-400">{icon}</span>
      <div><div className="text-[11px] font-medium uppercase tracking-wider text-slate-400">{label}</div><div className="text-slate-800">{children}</div></div>
    </div>
  );
}
