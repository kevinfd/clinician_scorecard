"use client";

import { useActionState } from "react";
import { decideDispute, type FormState } from "../../app/actions";
import { btn } from "./ui";
import { cn } from "@/lib/cn";

const choice = "flex min-h-11 cursor-pointer items-start gap-3 rounded-lg border border-slate-200 px-3 py-2.5 transition-colors hover:bg-slate-50 has-[:checked]:border-teal-500 has-[:checked]:bg-teal-50/50";

export function DecideForm({ id }: { id: string }) {
  const [state, action, pending] = useActionState<FormState, FormData>(decideDispute, {});
  const e = state.errors ?? {};
  const val = state.values ?? {};
  return (
    <form className="flex flex-col gap-5" action={action} noValidate>
      <input type="hidden" name="id" value={id} />
      {e.form && <p className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-[13px] font-medium text-amber-900" role="alert">{e.form}</p>}
      <fieldset className="flex flex-col gap-2">
        <legend className="mb-2 text-[13px] font-semibold text-slate-900">Your decision on the record</legend>
        <label className={choice}><input type="radio" name="decision" value="sustained" defaultChecked={val.decision === "sustained"} className="mt-1 size-4 accent-teal-600" /><span className="text-[14px] text-slate-800"><b className="font-semibold">Sustained</b>: the record is wrong as logged</span></label>
        <label className={choice}><input type="radio" name="decision" value="not_sustained" defaultChecked={val.decision === "not_sustained"} className="mt-1 size-4 accent-teal-600" /><span className="text-[14px] text-slate-800"><b className="font-semibold">Not sustained</b>: the record stands as logged</span></label>
        <label className={choice}><input type="radio" name="decision" value="definition_question" defaultChecked={val.decision === "definition_question"} className="mt-1 size-4 accent-teal-600" /><span className="text-[14px] text-slate-800"><b className="font-semibold">Definition question</b>: the record is right but the definition is in question</span></label>
        {e.decision && <p className="text-[13px] font-medium text-amber-800" role="alert">Decision: {e.decision}</p>}
      </fieldset>
      <fieldset className="flex flex-col gap-2">
        <legend className="mb-2 text-[13px] font-semibold text-slate-900">If sustained, what happens to the record</legend>
        <label className={choice}><input type="radio" name="outcome" value="annotated" defaultChecked={val.outcome === "annotated"} className="mt-1 size-4 accent-teal-600" /><span className="text-[14px] text-slate-800">Annotated: the adjudicated value shows beside the logged one</span></label>
        <label className={choice}><input type="radio" name="outcome" value="source_corrected" defaultChecked={val.outcome === "source_corrected"} className="mt-1 size-4 accent-teal-600" /><span className="text-[14px] text-slate-800">Source corrected: periop is also asked to correct its record</span></label>
        {e.outcome && <p className="text-[13px] font-medium text-amber-800" role="alert">Outcome: {e.outcome}</p>}
      </fieldset>
      <div>
        <label htmlFor="note" className="mb-1.5 block text-[13px] font-semibold text-slate-900">Note to the surgeon</label>
        <textarea id="note" name="note" rows={4} maxLength={1200} defaultValue={val.note ?? ""} aria-describedby="note-help"
          className={cn("w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-[14px] shadow-sm", e.note && "border-amber-500 ring-1 ring-amber-500")} />
        <p className="mt-1.5 text-[12px] text-slate-500" id="note-help">Required. The surgeon reads this on the row. Up to 1,000 characters.</p>
        {e.note && <p className="mt-1 text-[13px] font-medium text-amber-800" role="alert">Note: {e.note}</p>}
      </div>
      <div><button className={btn("primary")} type="submit" disabled={pending}>{pending ? "Recording" : "Record decision"}</button></div>
    </form>
  );
}
