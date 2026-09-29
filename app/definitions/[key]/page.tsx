import { Shell, NotAuthorized } from "@/components/Shell";
import { Card, CardBody, CardHeader, Chip, Table } from "@/components/ui";
import { viewer } from "@/lib/session";
import { BUCKETS, metric } from "@/lib/metrics";

export default async function Definition({ params }: { params: Promise<{ key: string }> }) {
  const v = await viewer();
  const def = metric((await params).key);
  if (!def) return <Shell viewer={v}><NotAuthorized /></Shell>;
  const Block = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <div className="border-t border-slate-100 py-4 first:border-0 first:pt-0">
      <div className="text-[11px] font-medium uppercase tracking-wider text-slate-500">{title}</div>
      <div className="mt-1 text-[14px] leading-relaxed text-slate-800">{children}</div>
    </div>
  );
  return (
    <Shell viewer={v} section="definitions" wide={false} crumbs={[{ href: "/definitions", label: "Definitions" }, { label: BUCKETS[def.bucket].name }, { label: def.name }]}>
      <div className="flex flex-col gap-6">
        <div>
          <p className="text-[11px] font-medium uppercase tracking-wider text-slate-500">{BUCKETS[def.bucket].name}</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-900">{def.name}</h1>
          <div className="mt-2 flex flex-wrap gap-1.5">
            <Chip tone="teal" dot>Version {def.version.slice(1)} in force</Chip>
            <Chip>Metric definitions v0.2 · 9 September 2026</Chip>
            {def.availability === "pending_source" ? <Chip tone="amber" dot>Data source pending confirmation</Chip> : null}
          </div>
        </div>
        <Card>
          <CardBody className="pt-5">
            <blockquote className="border-l-2 border-teal-500 pl-4 text-[15px] leading-relaxed text-slate-900">{def.what}</blockquote>
          </CardBody>
        </Card>
        <Card>
          <CardBody className="pt-5">
            <Block title="Counted">{def.counted}</Block>
            <Block title="Compared to">{def.comparedTo}</Block>
            {def.shownAs ? <Block title="Shown as">{def.shownAs}</Block> : null}
            <Block title="You can move it by">{def.movedBy}</Block>
            <Block title="Source and attribution">{def.source}.</Block>
            {def.minN !== undefined ? <Block title="Minimum n">{def.minN} {def.unit}. Below that the screen says why instead of showing a number. A peer comparison also needs at least 5 other surgeons who each clear the minimum.</Block> : null}
            {def.riskAdjusted ? <Block title="Risk adjustment">Observed divided by expected (O/E) from the Vizient risk model, with a 95% interval. 1.0 means exactly as expected; below 1.0 is better.</Block> : null}
            {def.unadjusted ? <Block title="Risk adjustment">Unadjusted: there is no risk model for this measure. Complications come from the department&apos;s QI database, never entered by hand.</Block> : null}
          </CardBody>
        </Card>
        <div data-tour="definition-params">
          <Card>
            <CardHeader title="Assumptions to be confirmed" sub="Parameters of this version. Confirming one issues a new version; earlier numbers keep theirs." />
            <CardBody>
              {def.params?.length ? (
                <Table head={[{ label: "Parameter" }, { label: "Value in force" }, { label: "Status" }, { label: "Note" }]}>
                  {def.params.map((p) => (
                    <tr key={p.name}>
                      <th scope="row" className="px-4 py-2.5 text-left font-medium text-slate-800">{p.name}</th>
                      <td className="px-4 py-2.5 text-slate-700">{p.value}</td>
                      <td className="px-4 py-2.5">{p.status === "assumed" ? <Chip tone="amber" dot>Assumed</Chip> : <Chip tone="emerald" dot>Confirmed</Chip>}</td>
                      <td className="px-4 py-2.5 text-slate-600">{p.note}</td>
                    </tr>
                  ))}
                </Table>
              ) : <p className="text-[13.5px] text-slate-600">None recorded for this version.</p>}
            </CardBody>
          </Card>
        </div>
        <Card>
          <CardHeader title="Version history" />
          <CardBody>
            <Table head={[{ label: "Version" }, { label: "In force from" }, { label: "Change" }]}>
              <tr><th scope="row" className="px-4 py-2.5 text-left font-medium text-slate-800">1</th><td className="px-4 py-2.5">October 2025</td><td className="px-4 py-2.5 text-slate-600">First version, from metric definitions v0.2.</td></tr>
            </Table>
          </CardBody>
        </Card>
      </div>
    </Shell>
  );
}
