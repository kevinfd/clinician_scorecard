import Link from "next/link";
import { Shell, SignInFirst, NotAuthorized } from "@/components/Shell";
import { DisputeForm } from "@/components/DisputeForm";
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
  const back = sp.metric && metric(sp.metric) ? `/me/metric/${sp.metric}/records?period=${sp.period ?? ""}` : "/me";
  const open = disputes.find((d) => d.recordRef === ref && d.filedById === v.id && d.state === "open");
  const route = routeFor({ filedById: v.id, recordRef: ref, recordType: rec.type });

  return (
    <Shell viewer={v} section="scorecard" crumbs={[{ href: "/me", label: "Scorecard" }, { href: back, label: "Records" }, { label: rec.ref }]}>
      <h1>Dispute on {rec.type === "attendance" ? "this M&M session" : rec.ref}</h1>
      {rec.fields.length === 0 ? (
        <p className="banner">Nothing on this record can be disputed now. <Link href={back}>Back to the records</Link></p>
      ) : (
        <>
          <dl className="facts">
            {rec.facts.map(([k, val]) => (
              <div key={k} style={{ display: "contents" }}><dt>{k}</dt><dd className={k.endsWith("id") ? "case-id" : undefined}>{val}</dd></div>
            ))}
          </dl>
          <p>Feeds: {rec.feeds.join("; ")}.</p>
          <p>
            This dispute goes to {routeWords(route.route)}. {route.route === "chair" ? route.reason : ""}
          </p>
          <DisputeForm
            recordRef={rec.ref}
            fields={rec.fields}
            labels={FIELD_LABELS}
            options={recreditOptions(v.id).map((s) => ({ id: s.id, name: s.name }))}
            openNotice={open ? `A dispute on this record is already open (filed ${longDate(open.filedOn)}). If you choose the same field, what you write here is added to it.` : undefined}
            effect="A sustained dispute does not edit the OR log or any source system: it adds an adjudicated value beside the logged one, and both show until the source is corrected. It does change which records count toward your numbers, and your numbers are recomputed the same day."
          />
          <p className="label" style={{ marginTop: 24, maxWidth: "72ch" }}>{DISPUTE_HOW}</p>
        </>
      )}
    </Shell>
  );
}
