import Link from "next/link";
import { Lock, Quote } from "lucide-react";
import { department, type Person } from "@/lib/synth";
import { addDays, cmp, LATEST_PUBLISHED, longDate, monthName, publishDate } from "@/lib/periods";
import type { Note } from "@/lib/store";
import type { OverrideMap } from "@/lib/disputes";
import { saveNote, deleteNote, restoreNote } from "../../app/actions";
import { btn } from "./ui";
import { DISPUTES_ENABLED } from "@/lib/features";

export const LEADER_GATE_DAYS = 30;

/** Comments credited to the surgeon, newest first. The leader view shows a month only 30 days after the surgeon's. */
export function inboxItems(surgeon: Person, ov: OverrideMap, asLeader: boolean) {
  const today = new Date().toISOString().slice(0, 10);
  return department()
    .surveys.filter((s) => s.clinicianId === surgeon.id && s.comment && !ov.get(s.ref)?.provider_named && cmp(s.period, LATEST_PUBLISHED) <= 0)
    .filter((s) => !asLeader || addDays(publishDate(s.period), LEADER_GATE_DAYS) <= today)
    .sort((a, b) => (a.returnedOn < b.returnedOn ? 1 : -1));
}

function Score({ label, value, of }: { label: string; value: number; of: number }) {
  const top = value === of;
  return (
    <span className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11.5px] font-medium tabular ${top ? "bg-teal-50 text-teal-800 ring-1 ring-teal-200" : "bg-slate-50 text-slate-600 ring-1 ring-slate-200"}`}>
      {label} {value}/{of}
    </span>
  );
}

export function InboxList({
  items, notes, editable, flash,
}: {
  items: ReturnType<typeof inboxItems>;
  notes: Note[];
  editable: boolean;
  flash?: { saved?: string; deleted?: string; error?: string; on?: string };
}) {
  if (!items.length) return <p className="rounded-xl border border-slate-200 bg-white px-5 py-6 text-[14px] text-slate-600">No comments yet. Comments appear here as survey months are published.</p>;
  return (
    <div className="flex flex-col gap-4">
      {items.map((s, i) => {
        const note = notes.find((n) => n.surveyRef === s.ref && !n.deleted);
        const deleted = notes.find((n) => n.surveyRef === s.ref && n.deleted);
        return (
          <article key={s.ref} id={s.ref} aria-labelledby={`h-${s.ref}`} data-tour={i === 0 ? "inbox-item" : undefined}
            className="scroll-mt-24 rounded-xl border border-slate-200 bg-white p-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 id={`h-${s.ref}`} className="text-[13px] font-semibold text-slate-900">{monthName(s.period)} survey <span className="font-normal text-slate-400">· returned {longDate(s.returnedOn)}</span></h3>
              <div className="flex flex-wrap gap-1.5">
                <Score label="Explained" value={s.explained} of={5} />
                <Score label="Listened" value={s.listened} of={5} />
                <Score label="Respect" value={s.respect} of={5} />
                <Score label="Recommend" value={s.recommend} of={10} />
              </div>
            </div>
            <blockquote className="mt-3 flex gap-3 text-[15px] leading-relaxed text-slate-800">
              <Quote className="mt-1 size-4 shrink-0 text-amber-500" strokeWidth={2} aria-hidden />
              <span className="max-w-prose">{s.comment}</span>
            </blockquote>
            {editable ? (
              <div className="mt-4 border-t border-slate-100 pt-3">
                {flash?.saved === s.ref && note ? <p role="status" className="mb-2 text-[12.5px] font-medium text-emerald-700">Note saved {longDate(note.savedAt)}. Visible to you only.</p> : null}
                {flash?.deleted === s.ref && deleted ? (
                  <form action={restoreNote} role="status" className="mb-2 text-[12.5px] text-slate-600">
                    <input type="hidden" name="surveyRef" value={s.ref} />Note deleted. <button className="font-medium text-teal-700 underline" type="submit">Restore it</button>
                  </form>
                ) : null}
                {note ? (
                  <div className="mb-3 rounded-lg bg-teal-50/50 px-3 py-2">
                    <p className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wider text-teal-700"><Lock className="size-3" />Your private note · {longDate(note.savedAt)}</p>
                    <p className="mt-1 whitespace-pre-wrap text-[13.5px] text-slate-800">{note.text}</p>
                  </div>
                ) : null}
                <details className="group">
                  <summary className="inline-flex min-h-9 cursor-pointer items-center rounded-md px-2 text-[13px] font-medium text-teal-700 hover:bg-teal-50">{note ? "Edit your note" : "Add a private note"}</summary>
                  <form action={saveNote} className="mt-2 flex flex-col gap-2">
                    <input type="hidden" name="surveyRef" value={s.ref} />
                    <label htmlFor={`note-${s.ref}`} className="text-[12.5px] font-medium text-slate-700">Private note, visible to you only and never counted</label>
                    <textarea id={`note-${s.ref}`} name="text" rows={3} defaultValue={note?.text ?? ""} className="w-full max-w-prose rounded-lg border border-slate-300 px-3 py-2 text-[14px]" />
                    {flash?.error && flash.on === s.ref ? <p className="text-[13px] font-medium text-amber-800" role="alert">Write the note before saving.</p> : null}
                    <div className="flex gap-2">
                      <button className={btn("primary", "sm")} type="submit">Save note</button>
                    </div>
                  </form>
                  {note ? (
                    <form action={deleteNote} className="mt-2"><input type="hidden" name="surveyRef" value={s.ref} /><button className={btn("ghost", "sm")} type="submit">Delete note</button></form>
                  ) : null}
                </details>
                {DISPUTES_ENABLED ? <p className="mt-2 text-[12px] text-slate-400">Not your patient? <Link className="text-slate-500 underline" href={`/records/${s.ref}/dispute?metric=feedback_inbox`}>Dispute who it is credited to</Link>. The comment itself cannot be disputed.</p> : null}
              </div>
            ) : null}
          </article>
        );
      })}
    </div>
  );
}
