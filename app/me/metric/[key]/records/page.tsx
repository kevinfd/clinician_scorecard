import { Download } from "lucide-react";
import { Shell, SignInFirst, NotAuthorized } from "@/components/Shell";
import { LinkButton, StatePill } from "@/components/ui";
import { viewer } from "@/lib/session";
import { live } from "@/lib/store";
import { appliesTo, metric, BUCKETS } from "@/lib/metrics";
import { disputesOnRecord, tileFor } from "@/lib/engine";
import { normalizePeriod } from "@/lib/periods";
import { stateLine, stateTone } from "@/lib/disputes";
import { cn } from "@/lib/cn";
import { DISPUTES_ENABLED } from "@/lib/features";

export default async function Records({ params, searchParams }: { params: Promise<{ key: string }>; searchParams: Promise<{ period?: string }> }) {
  const v = await viewer();
  if (!v) return <Shell viewer={null}><SignInFirst /></Shell>;
  const { key } = await params;
  const def = metric(key);
  if (!v.isClinician || !def || !appliesTo(def, v) || !def.records || !def.columns) return <Shell viewer={v}><NotAuthorized /></Shell>;
  const period = normalizePeriod((await searchParams).period);
  const { disputes, ov } = await live();
  const tile = tileFor(def, v, period, ov);
  const rows = def.records(v.id, tile.win.months, { basis: "adjudicated", ov }).sort((a, b) => (a.sortKey < b.sortKey ? -1 : 1));
  const cols = def.columns;
  const disputedCount = rows.filter((r) => disputesOnRecord(disputes, r.ref, v.id).some((d) => d.state === "open")).length;
  let firstButton = true;

  return (
    <Shell viewer={v} period={period} section="scorecard" periodPath={`/me/metric/${def.key}/records`}
      crumbs={[{ href: `/me?period=${period}`, label: "Scorecard" }, { href: `/me?period=${period}#sec-${def.bucket}`, label: BUCKETS[def.bucket].name }, { href: `/me/metric/${def.key}?period=${period}`, label: def.name }, { label: "Records" }]}>
      <div className="flex flex-col gap-5">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-[11px] font-medium uppercase tracking-wider text-slate-500">Records · {tile.win.label}</p>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-900">{def.name}</h1>
            <p className="mt-1 max-w-3xl text-[13.5px] text-slate-500">
              {DISPUTES_ENABLED ? "Every record credited to you, as logged in the source and as adjudicated after any sustained dispute. If a row is wrong, dispute it: your division chief decides, or the chair if the chief is involved." : "Every record credited to you this period, as logged in the source system. This is the list behind the number, row by row."}
            </p>
          </div>
          <LinkButton href={`/me/records.csv?metric=${def.key}&period=${period}`} download><Download className="size-4" strokeWidth={2} />Download CSV</LinkButton>
        </div>

        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white" data-tour="records-table">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 px-4 py-3">
            <span className="text-[13px] font-semibold text-slate-900">{rows.length} {rows.length === 1 ? "record" : "records"}{disputedCount ? ` · ${disputedCount} disputed` : ""}</span>
            {tile.kind === "reason" && !tile.muted ? <span className="text-[12.5px] text-slate-500">{tile.reason}</span> : null}
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-[13px]">
              <thead className="bg-slate-50">
                <tr className="text-[11px] uppercase tracking-wider text-slate-500">
                  <th scope="col" className="whitespace-nowrap px-4 py-2.5 text-left font-medium">Record</th>
                  {cols.map((c) => <th scope="col" key={c.key} className={cn("whitespace-nowrap px-3 py-2.5 font-medium", c.numeric ? "text-right" : "text-left")}>{c.label}</th>)}
                  <th scope="col" className="whitespace-nowrap px-3 py-2.5 text-left font-medium">Counted</th>
                  {DISPUTES_ENABLED ? <th scope="col" className="whitespace-nowrap px-4 py-2.5 text-left font-medium">Dispute</th> : null}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rows.length === 0 && <tr><td colSpan={cols.length + (DISPUTES_ENABLED ? 3 : 2)} className="px-4 py-6 text-center text-slate-500">No records of this kind were credited to you for {tile.win.label}.</td></tr>}
                {rows.map((r) => {
                  const ds = disputesOnRecord(disputes, r.ref, v.id);
                  const canDispute = r.disputable.length > 0 && !ds.some((d) => d.state === "open");
                  const tourBtn = canDispute && firstButton;
                  if (tourBtn) firstButton = false;
                  const notCounted = r.counted.startsWith("not counted") || r.counted.startsWith("excluded");
                  return (
                    <tr key={r.ref} className={cn("align-top hover:bg-slate-50/60", ds.some((d) => d.state === "open") && "bg-amber-50/40")}>
                      <th scope="row" className="whitespace-nowrap px-4 py-2.5 text-left font-mono text-[12px] font-medium text-slate-800">{r.ref}</th>
                      {cols.map((c) => (
                        <td key={c.key} className={cn("px-3 py-2.5 text-slate-700", c.numeric && "text-right", c.key === "procedure" && "min-w-[16rem]", c.key === "date" && "whitespace-nowrap")}>{r.cells[c.key]}</td>
                      ))}
                      <td className={cn("px-3 py-2.5", notCounted ? "text-slate-400" : "text-slate-700")}>{r.counted}</td>
                      {DISPUTES_ENABLED ? <td className="px-4 py-2.5">
                        <div className="flex min-w-[12rem] flex-col items-start gap-1.5">
                          {ds.map((d) => <StatePill key={d.id} tone={stateTone(d)} href={`/disputes/${d.id}`}>{stateLine(d)}</StatePill>)}
                          {canDispute ? (
                            <span data-tour={tourBtn ? "dispute-button" : undefined}>
                              <LinkButton size="sm" href={`/records/${encodeURIComponent(r.ref)}/dispute?metric=${def.key}&period=${period}`} aria-label={`Dispute this record ${r.ref}`}>Dispute</LinkButton>
                            </span>
                          ) : null}
                        </div>
                      </td> : null}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </Shell>
  );
}
