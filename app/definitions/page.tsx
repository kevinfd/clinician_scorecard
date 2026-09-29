import Link from "next/link";
import { Shell } from "@/components/Shell";
import { viewer } from "@/lib/session";
import { BUCKETS, METRICS, DIVISION_ONLY } from "@/lib/metrics";

export default async function Definitions() {
  const v = await viewer();
  return (
    <Shell viewer={v} section="definitions">
      <h1>Metric definitions</h1>
      <p className="lede">
        Version 0.2 of the department&apos;s metric definitions, as code. Each definition is versioned; an assumption still to be
        confirmed is named on its page with its current value.
      </p>
      {[1, 2, 3, 4, 5, 6].map((b) => (
        <section key={b} className="bucket" aria-labelledby={`d${b}`}>
          <h2 id={`d${b}`}>Bucket {b}: {BUCKETS[b].name}</h2>
          <dl className="tiles">
            {METRICS.filter((m) => m.bucket === b).map((m) => (
              <div className="tile" key={m.key}>
                <dt><Link href={`/definitions/${m.key}`}>{m.name}</Link></dt>
                <dd>{m.what}</dd>
              </div>
            ))}
          </dl>
          {b === 2 && <p className="dead">Division and site views only: {DIVISION_ONLY.join(", ")}.</p>}
        </section>
      ))}
    </Shell>
  );
}
