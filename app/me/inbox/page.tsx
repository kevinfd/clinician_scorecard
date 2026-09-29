import { Shell, SignInFirst, NotAuthorized } from "@/components/Shell";
import { InboxList, inboxItems, LEADER_GATE_DAYS } from "@/components/Inbox";
import { viewer } from "@/lib/session";
import { live } from "@/lib/store";
import { person } from "@/lib/synth";

export default async function MyInbox({ searchParams }: { searchParams: Promise<{ saved?: string; deleted?: string; error?: string; on?: string }> }) {
  const v = await viewer();
  if (!v) return <Shell viewer={null}><SignInFirst /></Shell>;
  if (!v.isSurgeon) return <Shell viewer={v}><NotAuthorized /></Shell>;
  const flash = await searchParams;
  const { state, ov } = await live();
  const items = inboxItems(v, ov, false);
  const leader = v.directLeaderId ? person(v.directLeaderId) : undefined;
  return (
    <Shell viewer={v} section="inbox">
      <h1>Patient feedback</h1>
      <p className="lede">
        Every de-identified comment patients wrote about you, newest first, with the scores from the same survey. Comments are never
        counted, compared, or rolled up into anything.
      </p>
      <p className="lede">
        {leader
          ? `Your direct leader (${leader.name}) can read this inbox, without your notes, ${LEADER_GATE_DAYS} days after each survey month is published to you.`
          : "No direct leader of record is set for you, so only you can read this inbox."}
      </p>
      <InboxList items={items} notes={state.notes.filter((n) => n.authorId === v.id)} editable flash={flash} />
    </Shell>
  );
}
