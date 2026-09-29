// Inline SVG charts drawn per DESIGN.md: Rule strokes at 1.5px, hollow circles for peers,
// a filled square for the surgeon labelled "You" in Pen, and a text table beneath every chart.

import type { ReactNode } from "react";
import type { TrendPoint } from "@/lib/engine";


function scale(min: number, max: number, a: number, b: number) {
  const span = max - min || 1;
  return (v: number) => a + ((v - min) / span) * (b - a);
}

export function StripPlot({
  values, you, fmt, title, betterWord, W = 640,
}: { values: number[]; you: number; fmt: (v: number) => string; title: string; betterWord?: string; W?: number }) {
  const lo = Math.min(...values, you);
  const hi = Math.max(...values, you);
  const pad = (hi - lo) * 0.08 || 1;
  const x = scale(lo - pad, hi + pad, 24, W - 24);
  const H = 96;
  const axisY = 58;
  const stacks = new Map<number, number>();
  return (
    <svg className="chart" viewBox={`0 0 ${W} ${H}`} role="img" aria-label={title}>
      <title>{title}</title>
      <line className="axis" x1={16} x2={W - 16} y1={axisY} y2={axisY} />
      {values.map((v, i) => {
        const k = Math.round(x(v));
        const n = stacks.get(k) ?? 0;
        stacks.set(k, n + 1);
        return <circle key={i} className="peer" cx={k} cy={axisY - 12 - Math.min(n, 3) * 13} r={6} />;
      })}
      <rect className="you" x={x(you) - 6} y={axisY + 6} width={12} height={12} />
      <text className="you-label" x={x(you)} y={axisY + 34} textAnchor="middle" fontSize={14}>You {fmt(you)}</text>
      <text className="tick" x={x(values[0])} y={axisY - 44} textAnchor="start">{fmt(values[0])}</text>
      <text className="tick" x={x(values[values.length - 1])} y={axisY - 44} textAnchor="end">{fmt(values[values.length - 1])}</text>
      {betterWord && <text className="tick" x={W - 16} y={H - 4} textAnchor="end">{betterWord}</text>}
    </svg>
  );
}

export function TrendChart({ points, fmt, title, W = 640 }: { points: TrendPoint[]; fmt: (v: number) => string; title: string; W?: number }) {
  const vals = points.filter((p) => p.value !== null).map((p) => p.value as number);
  if (vals.length < 2) return null;
  const H = 150;
  const lo = Math.min(...vals);
  const hi = Math.max(...vals);
  const pad = (hi - lo) * 0.15 || Math.max(1, hi * 0.1);
  const y = scale(lo - pad, hi + pad, H - 28, 12);
  const x = scale(0, Math.max(1, points.length - 1), 40, W - 16);
  const segs: string[] = [];
  let cur = "";
  points.forEach((p, i) => {
    if (p.value === null) {
      if (cur) segs.push(cur);
      cur = "";
      return;
    }
    cur += `${cur ? "L" : "M"}${x(i).toFixed(1)},${y(p.value).toFixed(1)}`;
  });
  if (cur) segs.push(cur);
  return (
    <svg className="chart" viewBox={`0 0 ${W} ${H}`} role="img" aria-label={title}>
      <title>{title}</title>
      <line className="grid" x1={40} x2={W - 16} y1={y(hi)} y2={y(hi)} />
      <line className="grid" x1={40} x2={W - 16} y1={y(lo)} y2={y(lo)} />
      <text className="tick" x={34} y={y(hi) + 4} textAnchor="end">{fmt(hi)}</text>
      <text className="tick" x={34} y={y(lo) + 4} textAnchor="end">{fmt(lo)}</text>
      {segs.map((d, i) => <path key={i} className="line" d={d} />)}
      {points.map((p, i) =>
        p.value === null ? null : p.restated ? (
          <path key={i} className="pt" d={`M${x(i)},${y(p.value) - 5} l5,5 l-5,5 l-5,-5 z`} />
        ) : (
          <rect key={i} className="pt" x={x(i) - 3} y={y(p.value) - 3} width={6} height={6} />
        ),
      )}
      {points.map((p, i) =>
        i === 0 || i === points.length - 1 || points.length <= 6 ? (
          <text key={`l${i}`} className="tick" x={x(i)} y={H - 6} textAnchor="middle">{p.label}</text>
        ) : null,
      )}
    </svg>
  );
}

export function GhostBars({
  months, title, W = 640,
}: { months: { label: string; value: number; last: number }[]; title: string; W?: number }) {
  const H = 170;
  const max = Math.max(1, ...months.flatMap((m) => [m.value, m.last]));
  const y = scale(0, max * 1.1, H - 24, 8);
  const slot = (W - 48) / months.length;
  const bw = Math.min(34, slot * 0.5);
  return (
    <svg className="chart" viewBox={`0 0 ${W} ${H}`} role="img" aria-label={title}>
      <title>{title}</title>
      <defs>
        <pattern id={`hatch${W}`} width="3" height="3" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
          <line x1="0" y1="0" x2="0" y2="3" stroke="var(--ink-muted)" strokeWidth="1" />
        </pattern>
      </defs>
      <line className="axis" x1={32} x2={W - 8} y1={H - 24} y2={H - 24} />
      {months.map((m, i) => {
        const cx = 40 + slot * i + slot / 2;
        return (
          <g key={i}>
            <rect fill={`url(#hatch${W})`} x={cx - bw / 2 + 4} y={y(m.last)} width={bw} height={H - 24 - y(m.last)} />
            <rect className="bar" x={cx - bw / 2} y={y(m.value)} width={bw} height={H - 24 - y(m.value)} />
            <text className="tick" x={cx} y={H - 8} textAnchor="middle">{m.label}</text>
          </g>
        );
      })}
    </svg>
  );
}

export function BarSpread({ values, you, title, W = 640 }: { values: number[]; you: number; title: string; W?: number }) {
  const H = 130;
  const all = [...values, you].sort((a, b) => a - b);
  const youIdx = all.lastIndexOf(you);
  const lo = Math.min(0, ...all);
  const max = Math.max(...all, 1);
  const y = scale(lo, max * 1.05, H - 26, 8);
  const slot = (W - 32) / all.length;
  const bw = Math.min(28, slot * 0.7);
  return (
    <svg className="chart" viewBox={`0 0 ${W} ${H}`} role="img" aria-label={title}>
      <title>{title}</title>
      <defs>
        <pattern id={`youhatch${W}`} width="3" height="3" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
          <line x1="0" y1="0" x2="0" y2="3" stroke="var(--ink)" strokeWidth="1.2" />
        </pattern>
      </defs>
      <line className="axis" x1={12} x2={W - 12} y1={y(0)} y2={y(0)} />
      {all.map((v, i) => {
        const cx = 16 + slot * i + slot / 2;
        const top = Math.min(y(v), y(0));
        const h = Math.abs(y(0) - y(v));
        return i === youIdx ? (
          <g key={i}>
            <rect x={cx - bw / 2} y={top} width={bw} height={Math.max(1, h)} fill={`url(#youhatch${W})`} stroke="var(--ink)" strokeWidth={1} />
            <text className="you-label" x={cx} y={H - 6} textAnchor="middle" fontSize={13}>You</text>
          </g>
        ) : (
          <rect key={i} className="bar" x={cx - bw / 2} y={top} width={bw} height={Math.max(1, h)} />
        );
      })}
    </svg>
  );
}

/** Renders a chart at its desktop width and at phone width; CSS shows the one that fits, so labels stay at 12px or more. */
export function Responsive({ render }: { render: (W: number) => ReactNode }) {
  return (
    <>
      <div className="chart-wide">{render(720)}</div>
      <div className="chart-narrow">{render(360)}</div>
    </>
  );
}
