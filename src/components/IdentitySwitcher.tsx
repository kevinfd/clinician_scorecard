"use client";

import { Check, ChevronDown } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { signIn } from "../../app/actions";
import { cn } from "@/lib/cn";

export interface PersonOption {
  id: string;
  name: string;
  sub: string;
  group: string;
}

function initials(name: string) {
  return name.replace(/^Dr\.\s*/, "").split(/\s+/).map((s) => s[0]).slice(0, 2).join("");
}

export function IdentitySwitcher({ current, people }: { current: PersonOption | null; people: PersonOption[] }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const away = (e: MouseEvent) => { if (!ref.current?.contains(e.target as Node)) setOpen(false); };
    const key = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("mousedown", away);
    document.addEventListener("keydown", key);
    return () => { document.removeEventListener("mousedown", away); document.removeEventListener("keydown", key); };
  }, [open]);
  const groups = [...new Set(people.map((p) => p.group))];
  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-label={current ? `Signed in as ${current.name}. Switch identity` : "Choose an identity"}
        className="flex min-h-11 shrink-0 items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-2 py-1.5 transition-colors hover:bg-slate-100 sm:px-3"
      >
        <span className="flex size-7 items-center justify-center rounded-full bg-teal-600 text-[11px] font-semibold text-white">
          {current ? initials(current.name) : "?"}
        </span>
        <span className="hidden text-left sm:block">
          <span className="block whitespace-nowrap text-[12px] font-medium leading-tight text-slate-900">{current?.name ?? "Choose who you are"}</span>
          <span className="hidden max-w-[220px] truncate whitespace-nowrap text-[10px] leading-tight text-slate-500 md:block">{current?.sub ?? "Synthetic identities"}</span>
        </span>
        <ChevronDown className="size-3 shrink-0 text-slate-400" strokeWidth={2} />
      </button>
      {open ? (
        <div className="absolute right-0 z-50 mt-1.5 max-h-[70vh] w-80 overflow-y-auto rounded-xl border border-slate-200 bg-white shadow-xl animate-fade-in">
          {groups.map((g) => (
            <div key={g}>
              <div className="sticky top-0 border-b border-slate-100 bg-white px-3 py-2 text-[10px] font-medium uppercase tracking-wider text-slate-400">{g}</div>
              {people.filter((p) => p.group === g).map((p) => (
                <form key={p.id} action={signIn}>
                  <input type="hidden" name="id" value={p.id} />
                  <button type="submit" className={cn("flex w-full items-start gap-2.5 px-3 py-2 text-left transition-colors hover:bg-slate-50", current?.id === p.id && "bg-teal-50/60")}>
                    <span className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full bg-slate-100 text-[10px] font-semibold text-slate-600">{initials(p.name)}</span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-[13px] font-medium text-slate-900">{p.name}</span>
                      <span className="block truncate text-[11px] text-slate-500">{p.sub}</span>
                    </span>
                    {current?.id === p.id ? <Check className="mt-1 size-4 text-teal-600" strokeWidth={2} /> : null}
                  </button>
                </form>
              ))}
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}
