"use client";

// Dimmed backdrop with a spotlight cutout around the step's target, a pulsing
// ring, and a tooltip card. The spotlight stays clickable; everything else is
// blocked while the tour runs.

import { ArrowLeft, ArrowRight, MousePointerClick, X } from "lucide-react";
import { useEffect, useRef } from "react";
import type { TourStep } from "@/lib/tours";

const PAD = 8;

export function TourOverlay({
  step, index, total, rect, tourLabel, onNext, onBack, onClose,
}: {
  step: TourStep; index: number; total: number; rect: DOMRect | null; tourLabel: string;
  onNext: () => void; onBack: () => void; onClose: () => void;
}) {
  const nextRef = useRef<HTMLButtonElement>(null);
  useEffect(() => { nextRef.current?.focus({ preventScroll: true }); }, [index]);
  const isLast = index === total - 1;
  const vw = typeof window !== "undefined" ? window.innerWidth : 1280;
  const vh = typeof window !== "undefined" ? window.innerHeight : 800;
  const cut = rect ? { x: rect.left - PAD, y: rect.top - PAD, w: rect.width + PAD * 2, h: rect.height + PAD * 2 } : null;
  const TIP_W = Math.min(360, vw - 24);

  let tip: React.CSSProperties;
  if (cut) {
    const below = vh - (cut.y + cut.h) > 250;
    const above = cut.y > 250;
    const left = Math.min(Math.max(12, cut.x + cut.w / 2 - TIP_W / 2), vw - TIP_W - 12);
    tip = below ? { top: cut.y + cut.h + 12, left, width: TIP_W }
      : above ? { bottom: vh - cut.y + 12, left, width: TIP_W }
        : { bottom: 16, left, width: TIP_W };
  } else {
    tip = { top: "50%", left: "50%", transform: "translate(-50%, -50%)", width: TIP_W };
  }

  return (
    <div className="pointer-events-none fixed inset-0 z-[100] print-hide" aria-live="polite">
      {cut ? (
        <svg className="pointer-events-none absolute inset-0 h-full w-full" aria-hidden>
          <defs>
            <mask id="cs-tour-mask">
              <rect width="100%" height="100%" fill="white" />
              <rect x={cut.x} y={cut.y} width={cut.w} height={cut.h} rx={12} fill="black" />
            </mask>
          </defs>
          <rect width="100%" height="100%" fill="rgba(15,23,42,0.55)" mask="url(#cs-tour-mask)" />
        </svg>
      ) : (
        <div className="pointer-events-auto absolute inset-0 bg-slate-900/55" />
      )}
      {cut ? (
        <>
          <Blocker left={0} top={0} width={vw} height={cut.y} />
          <Blocker left={0} top={cut.y + cut.h} width={vw} height={vh - (cut.y + cut.h)} />
          <Blocker left={0} top={cut.y} width={cut.x} height={cut.h} />
          <Blocker left={cut.x + cut.w} top={cut.y} width={vw - (cut.x + cut.w)} height={cut.h} />
          <div className="pointer-events-none absolute rounded-[12px] ring-2 ring-teal-400 cs-tour-pulse" style={{ top: cut.y, left: cut.x, width: cut.w, height: cut.h }} />
        </>
      ) : null}

      <div role="dialog" aria-modal="true" aria-label={`${tourLabel}: ${step.title}`}
        className="pointer-events-auto absolute rounded-xl border border-slate-200 bg-white p-4 shadow-2xl animate-fade-in" style={tip}>
        <div className="mb-2 flex items-center justify-between">
          <span className="inline-flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-teal-700">
            <span className="size-1.5 rounded-full bg-teal-500" />{tourLabel} · {index + 1} of {total}
          </span>
          <button type="button" onClick={onClose} aria-label="End tour" className="rounded p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700">
            <X className="size-4" strokeWidth={2} />
          </button>
        </div>
        <h3 className="text-[15px] font-semibold text-slate-900">{step.title}</h3>
        <p className="mt-1 text-[13px] leading-relaxed text-slate-600">{step.body}</p>
        {step.cta ? (
          <div className="mt-2.5 inline-flex items-center gap-1.5 rounded-md bg-teal-50 px-2.5 py-1.5 text-[12px] font-medium text-teal-800">
            <MousePointerClick className="size-3.5 shrink-0" strokeWidth={2} />{step.cta}
          </div>
        ) : null}
        <div className="mt-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-1" aria-hidden>
            {Array.from({ length: total }).map((_, i) => (
              <span key={i} className={"h-1.5 rounded-full transition-all " + (i === index ? "w-4 bg-teal-500" : "w-1.5 bg-slate-200")} />
            ))}
          </div>
          <div className="flex items-center gap-1.5">
            {index > 0 ? (
              <button type="button" onClick={onBack} className="inline-flex min-h-9 items-center gap-1 rounded-md px-2.5 text-[12px] font-medium text-slate-600 transition-colors hover:bg-slate-100">
                <ArrowLeft className="size-3.5" strokeWidth={2} />Back
              </button>
            ) : null}
            <button ref={nextRef} type="button" onClick={onNext} className="inline-flex min-h-9 items-center gap-1 rounded-md bg-teal-600 px-3 text-[12px] font-semibold text-white transition-colors hover:bg-teal-700">
              {isLast ? "Finish" : "Next"}{!isLast ? <ArrowRight className="size-3.5" strokeWidth={2} /> : null}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Blocker({ left, top, width, height }: { left: number; top: number; width: number; height: number }) {
  return <div aria-hidden className="pointer-events-auto absolute" style={{ left, top, width: Math.max(0, width), height: Math.max(0, height) }} />;
}
