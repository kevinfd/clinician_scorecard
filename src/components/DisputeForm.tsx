"use client";

import { useActionState } from "react";
import { fileDispute, type FormState } from "../../app/actions";
import { btn } from "./ui";
import { cn } from "@/lib/cn";

const field = "w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-[14px] text-slate-900 shadow-sm focus:border-teal-500";

export function DisputeForm({
  recordRef, fields, labels, options, effect, openNotice,
}: {
  recordRef: string;
  fields: string[];
  labels: Record<string, string>;
  options: { id: string; name: string }[];
  effect: string;
  openNotice?: string;
}) {
  const [state, action, pending] = useActionState<FormState, FormData>(fileDispute, {});
  const e = state.errors ?? {};
  const val = state.values ?? {};
  const initialField = val.field || (fields.length === 1 ? fields[0] : "");
  return (
    <form className="flex flex-col gap-5" action={action} noValidate>
      <input type="hidden" name="ref" value={recordRef} />
      {e.form && <p className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-[13px] font-medium text-amber-900" role="alert">{e.form}</p>}
      {openNotice && <p className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-[13px] text-slate-700">{openNotice}</p>}
      <fieldset className="flex flex-col gap-2" aria-describedby={e.field ? "field-err" : undefined}>
        <legend className="mb-2 text-[13px] font-semibold text-slate-900">What is wrong with this record?</legend>
        {fields.map((f) => (
          <label key={f} className="flex min-h-11 cursor-pointer items-start gap-3 rounded-lg border border-slate-200 px-3 py-2.5 transition-colors hover:bg-slate-50 has-[:checked]:border-teal-500 has-[:checked]:bg-teal-50/50">
            <input type="radio" name="field" value={f} defaultChecked={initialField === f} required className="mt-1 size-4 accent-teal-600" />
            <span className="text-[14px] text-slate-800">{labels[f]}</span>
          </label>
        ))}
        {e.field && <p className="text-[13px] font-medium text-amber-800" id="field-err" role="alert">{e.field}</p>}
      </fieldset>
      {fields.includes("primary_surgeon") && (
        <div>
          <label htmlFor="proposed" className="mb-1.5 block text-[13px] font-semibold text-slate-900">If it is not your case: who was the primary surgeon?</label>
          <select key={`p-${val.proposed ?? ""}-${Object.keys(e).join()}`} id="proposed" name="proposed" defaultValue={val.proposed ?? ""} aria-describedby="proposed-help" className={cn(field, "min-h-11", e.proposed && "border-amber-500 ring-1 ring-amber-500")}>
            <option value="">Choose a surgeon</option>
            {options.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}
          </select>
          <p className="mt-1.5 text-[12px] text-slate-500" id="proposed-help">Only needed for &ldquo;Not my case&rdquo;. That surgeon will see the record and its dispute history.</p>
          {e.proposed && <p className="mt-1 text-[13px] font-medium text-amber-800" role="alert">Surgeon: {e.proposed}</p>}
        </div>
      )}
      <div>
        <label htmlFor="claim" className="mb-1.5 block text-[13px] font-semibold text-slate-900">What happened</label>
        <textarea id="claim" name="claim" maxLength={1200} rows={5} defaultValue={val.claim ?? ""} aria-describedby="claim-help" className={cn(field, e.claim && "border-amber-500 ring-1 ring-amber-500")} />
        <p className="mt-1.5 text-[12px] text-slate-500" id="claim-help">Up to 1,000 characters. Refer to the record by its id; do not include patient names, record numbers or dates of birth.</p>
        {e.claim && <p className="mt-1 text-[13px] font-medium text-amber-800" role="alert">Claim: {e.claim}</p>}
      </div>
      <p className="rounded-lg border border-teal-200 bg-teal-50/60 px-4 py-3 text-[13px] leading-relaxed text-slate-700">{effect}</p>
      <div><button className={btn("primary")} type="submit" disabled={pending}>{pending ? "Filing" : "File dispute"}</button></div>
    </form>
  );
}
