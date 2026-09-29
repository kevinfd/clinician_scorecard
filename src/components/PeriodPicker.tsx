import { CalendarDays } from "lucide-react";
import { monthName, publishedPeriods, type Period } from "@/lib/periods";
import { btn } from "./ui";

export function PeriodPicker({ period, path }: { period: Period; path: string }) {
  return (
    <form action={path} method="get" className="flex items-center gap-2" data-tour="period">
      <label htmlFor="period" className="flex items-center gap-1.5 text-[12px] text-slate-500">
        <CalendarDays className="size-4" strokeWidth={1.75} />Period
      </label>
      <select id="period" name="period" defaultValue={period}
        className="min-h-9 rounded-lg border border-slate-200 bg-white px-2.5 text-[13px] text-slate-800 shadow-sm">
        {publishedPeriods().slice().reverse().map((p) => <option key={p} value={p}>{monthName(p)}</option>)}
      </select>
      <button type="submit" className={btn("secondary", "sm")}>Go</button>
    </form>
  );
}
