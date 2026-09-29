// Inline SVG charts. Teal marks "you", slate marks anonymous peers, violet marks
// an external reference. Every chart has a text equivalent on the page.

import type { ReactNode } from "react";
import type { TrendPoint } from "@/lib/engine";

const T = { teal: "#0d9488", tealSoft: "#ccfbf1", slate: "#94a3b8", grid: "#e2e8f0", axis: "#cbd5e1", text: "#64748b", ink: "#0f172a", violet: "#7c3aed" };

function scale(min: number, max: number, a: number, b: number) {
  const span = max - min || 1;
  return (v: number) => a + ((v - min) / span) * (b - a);
}

export function StripPlot({ values, you, fmt, title, betterWord, W = 720 }: { values: number[]; you: number; fmt: (v: number) => string; title: string; betterWord?: string; W?: number }) {
  const lo = Math.min(...values, you);
  const hi = Math.max(...values, you);
  const pad = (hi - lo) * 0.08 || 1;
  const x = scale(lo - pad, hi + pad, 28, W - 28);
  const H = 118;
  const axisY = 64;
  const stacks = new Map<number, number>();
  return (
    <svg className="block h-auto w-full overflow-visible" viewBox={`0 0 ${W} ${H}`} role="img" aria-label={title}>
      <title>{title}</title>
      <line x1={16} x2={W - 16} y1={axisY} y2={axisY} stroke={T.axis} strokeWidth={1.5} />
      {values.map((v, i) => {
        const k = Math.round(x(v));
        const n = stacks.get(k) ?? 0;
        stacks.set(k, n + 1);
        return <circle key={i} cx={k} cy={axisY - 14 - Math.min(n, 3) * 15} r={7} fill="white" stroke={T.slate} strokeWidth={1.75} />;
      })}
      <line x1={x(you)} x2={x(you)} y1={axisY - 52} y2={axisY + 4} stroke={T.teal} strokeWidth={1.5} strokeDasharray="3 3" />
      <rect x={x(you) - 7} y={axisY + 8} width={14} height={14} rx={3} fill={T.teal} />
      <text x={x(you)} y={axisY + 42} textAnchor="middle" fontSize={14} fontWeight={600} fill={T.teal}>You {fmt(you)}</text>
      <text x={x(values[0])} y={axisY - 60} textAnchor="start" fontSize={13} fill={T.text}>{fmt(values[0])}</text>
      <text x={x(values[values.length - 1])} y={axisY - 60} textAnchor="end" fontSize={13} fill={T.text}>{fmt(values[values.length - 1])}</text>
      {betterWord ? <text x={W - 16} y={H - 4} textAnchor="end" fontSize={13} fill={T.text}>{betterWord}</text> : null}
    </svg>
  );
}

export function TrendChart({ points, fmt, title, W = 720 }: { points: TrendPoint[]; fmt: (v: number) => string; title: string; W?: number }) {
  const vals = points.filter((p) => p.value !== null).map((p) => p.value as number);
  if (vals.length < 2) return null;
  const H = 190;
  const lo = Math.min(...vals);
  const hi = Math.max(...vals);
  const pad = (hi - lo) * 0.18 || Math.max(1, hi * 0.1);
  const y = scale(lo - pad, hi + pad, H - 30, 14);
  const x = scale(0, Math.max(1, points.length - 1), 48, W - 16);
  const segs: [number, number][][] = [];
  let cur: [number, number][] = [];
  points.forEach((p, i) => {
    if (p.value === null) { if (cur.length) segs.push(cur); cur = []; return; }
    cur.push([x(i), y(p.value)]);
  });
  if (cur.length) segs.push(cur);
  const every = W < 500 ? Math.ceil(points.length / 4) : 1;
  return (
    <svg className="block h-auto w-full overflow-visible" viewBox={`0 0 ${W} ${H}`} role="img" aria-label={title}>
      <title>{title}</title>
      <defs>
        <linearGradient id={`area${W}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={T.teal} stopOpacity="0.16" />
          <stop offset="1" stopColor={T.teal} stopOpacity="0" />
        </linearGradient>
      </defs>
      {[hi, (hi + lo) / 2, lo].map((g, i) => (
        <g key={i}>
          <line x1={48} x2={W - 16} y1={y(g)} y2={y(g)} stroke={T.grid} strokeDasharray={i === 1 ? "3 3" : undefined} />
          <text x={40} y={y(g) + 4} textAnchor="end" fontSize={12} fill={T.text}>{fmt(Math.round(g * 100) / 100)}</text>
        </g>
      ))}
      {segs.map((s, i) => (
        <g key={i}>
          {s.length > 1 ? <path d={`M${s[0][0]},${H - 30} ${s.map(([a, b]) => `L${a},${b}`).join(" ")} L${s[s.length - 1][0]},${H - 30} Z`} fill={`url(#area${W})`} /> : null}
          <path d={s.map(([a, b], j) => `${j ? "L" : "M"}${a.toFixed(1)},${b.toFixed(1)}`).join(" ")} fill="none" stroke={T.teal} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
        </g>
      ))}
      {points.map((p, i) => p.value === null ? null : p.restated ? (
        <path key={i} d={`M${x(i)},${y(p.value) - 6} l6,6 l-6,6 l-6,-6 z`} fill={T.violet} />
      ) : (
        <circle key={i} cx={x(i)} cy={y(p.value)} r={3.5} fill="white" stroke={T.teal} strokeWidth={2} />
      ))}
      {points.map((p, i) => (i % every === 0 || i === points.length - 1) ? (
        <text key={`l${i}`} x={x(i)} y={H - 8} textAnchor="middle" fontSize={12} fill={T.text}>{p.label}</text>
      ) : null)}
    </svg>
  );
}

export function GhostBars({ months, title, W = 720 }: { months: { label: string; value: number; last: number }[]; title: string; W?: number }) {
  const H = 200;
  const max = Math.max(1, ...months.flatMap((m) => [m.value, m.last]));
  const y = scale(0, max * 1.1, H - 26, 10);
  const slot = (W - 48) / months.length;
  const bw = Math.min(26, slot * 0.36);
  return (
    <svg className="block h-auto w-full overflow-visible" viewBox={`0 0 ${W} ${H}`} role="img" aria-label={title}>
      <title>{title}</title>
      <line x1={32} x2={W - 8} y1={H - 26} y2={H - 26} stroke={T.axis} />
      {months.map((m, i) => {
        const cx = 40 + slot * i + slot / 2;
        return (
          <g key={i}>
            <rect x={cx - bw - 1} y={y(m.last)} width={bw} height={H - 26 - y(m.last)} rx={3} fill="#e2e8f0" />
            <rect x={cx + 1} y={y(m.value)} width={bw} height={H - 26 - y(m.value)} rx={3} fill={T.teal} />
            <text x={cx} y={H - 8} textAnchor="middle" fontSize={12} fill={T.text}>{m.label}</text>
          </g>
        );
      })}
    </svg>
  );
}

export function BarSpread({ values, you, title, reference, W = 720 }: { values: number[]; you: number; title: string; reference?: number; W?: number }) {
  const H = 150;
  const all = [...values, you].sort((a, b) => a - b);
  const youIdx = all.lastIndexOf(you);
  const lo = Math.min(0, ...all);
  const max = Math.max(...all, reference ?? 0, 1);
  const y = scale(lo, max * 1.08, H - 26, 10);
  const slot = (W - 32) / all.length;
  const bw = Math.min(30, slot * 0.66);
  return (
    <svg className="block h-auto w-full overflow-visible" viewBox={`0 0 ${W} ${H}`} role="img" aria-label={title}>
      <title>{title}</title>
      <line x1={12} x2={W - 12} y1={y(0)} y2={y(0)} stroke={T.axis} />
      {reference !== undefined ? (
        <g>
          <line x1={12} x2={W - 12} y1={y(reference)} y2={y(reference)} stroke={T.violet} strokeDasharray="4 4" strokeWidth={1.5} />
          <text x={W - 12} y={y(reference) - 6} textAnchor="end" fontSize={12} fill={T.violet}>MGB average {reference}</text>
        </g>
      ) : null}
      {all.map((v, i) => {
        const cx = 16 + slot * i + slot / 2;
        const top = Math.min(y(v), y(0));
        const h = Math.max(2, Math.abs(y(0) - y(v)));
        return i === youIdx ? (
          <g key={i}>
            <rect x={cx - bw / 2} y={top} width={bw} height={h} rx={3} fill={T.teal} />
            <text x={cx} y={H - 6} textAnchor="middle" fontSize={13} fontWeight={600} fill={T.teal}>You</text>
          </g>
        ) : (
          <rect key={i} x={cx - bw / 2} y={top} width={bw} height={h} rx={3} fill="#cbd5e1" />
        );
      })}
    </svg>
  );
}

/** Renders a chart at three native widths; CSS shows the one that fits, so labels stay 12 to 14px on screen. */
export function Responsive({ render }: { render: (W: number) => ReactNode }) {
  return (
    <>
      <div className="hidden xl:block">{render(1240)}</div>
      <div className="hidden sm:block xl:hidden">{render(760)}</div>
      <div className="sm:hidden">{render(360)}</div>
    </>
  );
}
