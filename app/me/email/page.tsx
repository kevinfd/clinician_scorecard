import { Shell, SignInFirst, NotAuthorized } from "@/components/Shell";
import { viewer, ANALYST_MAILBOX } from "@/lib/session";
import { live } from "@/lib/store";
import { METRICS } from "@/lib/metrics";
import { tileFor, trendFor, fmtValue } from "@/lib/engine";
import { FIRST_PUBLISHED, longDate, monthName, normalizePeriod, publishDate } from "@/lib/periods";

const WEDGE = ["or_case_volume", "fcot", "duration_accuracy", "same_day_cancel"];

// The M1 plain-text email, rendered as it would be sent: stamp, value lines or reasons, records line, trend as text.
export default async function EmailPreview({ searchParams }: { searchParams: Promise<{ period?: string }> }) {
  const v = await viewer();
  if (!v) return <Shell viewer={null}><SignInFirst /></Shell>;
  if (!v.isSurgeon) return <Shell viewer={v}><NotAuthorized /></Shell>;
  const period = normalizePeriod((await searchParams).period);
  const { ov } = await live();
  const lines: string[] = [];
  lines.push(`Subject: Your ${monthName(period)} OR numbers and case list`);
  lines.push(`From: Department scorecard <${ANALYST_MAILBOX}>`);
  lines.push("");
  lines.push(`Clinician Scorecard · ${v.name}`);
  lines.push(`${monthName(period)} at ${v.site}`);
  lines.push(`Last refreshed ${longDate(publishDate(period))}`);
  lines.push("");
  if (period === FIRST_PUBLISHED) {
    lines.push(`First monthly email. Four numbers from periop's OR log for ${monthName(period)}, and your own case list.`);
    lines.push("Only you receive this email; your chief or chair sees one of your rows only when you dispute it.");
    lines.push("");
  }
  for (const key of WEDGE) {
    const def = METRICS.find((m) => m.key === key)!;
    const t = tileFor(def, v, period, ov);
    lines.push(def.name.toUpperCase());
    lines.push("");
    if (t.kind === "reason") lines.push(`${t.win.label}: ${t.reason}`);
    else {
      lines.push(`${t.win.label}: ${t.adjudicated!.line}.`);
      for (const x of t.adjudicated!.extra ?? []) lines.push(x);
    }
    const rows = def.records!(v.id, t.win.months, { basis: "adjudicated", ov }).length;
    lines.push(`Records: ${rows} ${rows === 1 ? "row" : "rows"} in the attachment under ${def.name}.`);
    if (t.comparator) lines.push(t.comparator + ".");
    if (t.spread?.kind === "rendered") {
      lines.push(`You: ${fmtValue(def, t.spread.you)}`);
      lines.push(`Peers: ${t.spread.values.map((x) => fmtValue(def, x)).join(", ")}`);
    } else if (t.spread?.kind === "reason") lines.push(t.spread.text);
    const tr = trendFor(def, v, period, ov).slice(-6);
    if (tr.length > 1) lines.push(`Trend: ${tr.map((p) => `${p.label} ${p.value === null ? "not shown" : fmtValue(def, p.value)}`).join(" | ")}`);
    lines.push("");
  }
  lines.push("TO DISPUTE A ROW");
  lines.push("");
  lines.push("Reply to this email with the case id (the first column of the attachment) and what is wrong.");
  lines.push("Your division chief decides, or the chair if the chief is involved. The target is 14 days.");
  lines.push("");
  lines.push("WHAT THIS IS NOT");
  lines.push("");
  lines.push("No composite score, no rank, no target. Peer comparisons are anonymous.");
  lines.push("Attachment: scorecard-" + period + ".csv (your own rows; case ids only, no patient identifiers)");

  return (
    <Shell viewer={v} period={period} section="scorecard" periodPath="/me/email" wide={false} crumbs={[{ href: `/me?period=${period}`, label: "Scorecard" }, { label: "Monthly email" }]}>
      <div className="flex flex-col gap-5">
        <div>
          <p className="text-[11px] font-medium uppercase tracking-wider text-slate-500">Months one to three</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-900">Your monthly email, as sent</h1>
          <p className="mt-1 max-w-3xl text-[13.5px] text-slate-500">Before the hosted pages, the scorecard arrives as this plain-text email with a CSV of your own rows. The pages carry the same numbers.</p>
        </div>
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm" data-tour="email">
          <div className="flex items-center gap-1.5 border-b border-slate-100 bg-slate-50 px-4 py-2.5">
            <span className="size-2.5 rounded-full bg-slate-300" /><span className="size-2.5 rounded-full bg-slate-300" /><span className="size-2.5 rounded-full bg-slate-300" />
            <span className="ml-2 text-[12px] text-slate-500">Mail · plain text</span>
          </div>
          <pre className="overflow-x-auto whitespace-pre-wrap px-5 py-5 font-mono text-[12.5px] leading-relaxed text-slate-800">{lines.join("\n")}</pre>
        </div>
      </div>
    </Shell>
  );
}
