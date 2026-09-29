import Link from "next/link";
import type { Tile } from "@/lib/engine";
import type { Person } from "@/lib/synth";
import type { Period } from "@/lib/periods";
import type { OverrideMap } from "@/lib/disputes";

export function TileRow({ tile, viewer, period, ov, extra }: { tile: Tile; viewer: Person; period: Period; ov: OverrideMap; extra?: React.ReactNode }) {
  const def = tile.def;
  const href = `/me/metric/${def.key}?period=${period}`;
  const rows = def.records?.(viewer.id, tile.win.months, { basis: "adjudicated", ov }).length;
  const window = def.cadence === "month" ? null : tile.win.label;
  return (
    <div className="tile">
      <dt>
        <Link href={href}>{def.name}</Link>
      </dt>
      <dd>
        {tile.kind === "reason" ? (
          <p className={`value reason${tile.muted ? " muted-reason" : ""}`}>{tile.reason}</p>
        ) : tile.kind === "value" && tile.adjudicated ? (
          tile.bothBases ? (
            <p className="value">
              As logged: {tile.logged!.line}. As adjudicated: {tile.adjudicated.line}.
            </p>
          ) : (
            <p className="value">{tile.adjudicated.line}</p>
          )
        ) : null}
        {extra}
      </dd>
      <div className="under">
        <p className="label">
          {[
            window ? `Period: ${window}` : null,
            rows !== undefined && def.availability === "live" && !tile.muted ? `Records: ${rows} ${rows === 1 ? "row" : "rows"}` : null,
            tile.muted ? null : tile.comparator,
          ]
            .filter(Boolean)
            .join(" · ")}
        </p>
        {tile.win.interim && tile.kind !== "reason" && <p className="label">{tile.win.interim}</p>}
      </div>
    </div>
  );
}
