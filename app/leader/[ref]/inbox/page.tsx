import { Shell, SignInFirst, NotAuthorized } from "@/components/Shell";
import { InboxList, inboxItems } from "@/components/Inbox";
import { viewer } from "@/lib/session";
import { live } from "@/lib/store";
import { personByRef } from "@/lib/synth";

export default async function LeaderInbox({ params }: { params: Promise<{ ref: string }> }) {
  const v = await viewer();
  if (!v) return <Shell viewer={null}><SignInFirst /></Shell>;
  const s = personByRef((await params).ref);
  // Same bytes for "not yours" and "does not exist".
  if (!s || !s.isSurgeon || s.directLeaderId !== v.id) return <Shell viewer={v}><NotAuthorized /></Shell>;
  const { ov } = await live();
  const items = inboxItems(s, ov, true);
  return (
    <Shell viewer={v} section="leader" crumbs={[{ href: "/leader", label: "Direct reports" }, { label: s.name }]}>
      <h1>{s.name}: patient feedback</h1>
      <p className="lede">
        You see each survey month 30 days after {s.name} does. Private notes are never shown to you. Nothing here is counted,
        compared, or rolled up.
      </p>
      <InboxList items={items} notes={[]} editable={false} />
    </Shell>
  );
}
