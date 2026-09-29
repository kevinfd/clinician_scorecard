import { viewer } from "@/lib/session";
import { live } from "@/lib/store";
import { metric } from "@/lib/metrics";
import { windowFor } from "@/lib/engine";
import { normalizePeriod } from "@/lib/periods";

const esc = (s: string) => (/[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s);

// The surgeon's own rows for one metric and period. Case ids only; no patient identifiers exist in this dataset.
export async function GET(req: Request) {
  const v = await viewer();
  const url = new URL(req.url);
  const def = metric(url.searchParams.get("metric") ?? "");
  if (!v?.isSurgeon || !def?.records || !def.columns) return new Response("This page is not available to you.", { status: 403 });
  const period = normalizePeriod(url.searchParams.get("period"));
  const { ov } = await live();
  const win = windowFor(def, period);
  const rows = def.records(v.id, win.months, { basis: "adjudicated", ov });
  const header = ["metric", "record", ...def.columns.map((c) => c.label), "counted"];
  const lines = [header.map(esc).join(",")];
  for (const r of rows) lines.push([def.name, r.ref, ...def.columns.map((c) => r.cells[c.key] ?? ""), r.counted].map(esc).join(","));
  return new Response(lines.join("\n") + "\n", {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="scorecard-${def.key}-${period}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
