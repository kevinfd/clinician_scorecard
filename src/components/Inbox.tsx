import Link from "next/link";
import { department, type Person } from "@/lib/synth";
import { addDays, cmp, LATEST_PUBLISHED, longDate, monthName, publishDate } from "@/lib/periods";
import type { Note } from "@/lib/store";
import type { OverrideMap } from "@/lib/disputes";
import { saveNote, deleteNote, restoreNote } from "../../app/actions";

export const LEADER_GATE_DAYS = 30;

/** Comments credited to the surgeon, newest first. The leader view shows a month only 30 days after the surgeon's. */
export function inboxItems(surgeon: Person, ov: OverrideMap, asLeader: boolean) {
  const today = new Date().toISOString().slice(0, 10);
  return department()
    .surveys.filter((s) => s.clinicianId === surgeon.id && s.comment && !ov.get(s.ref)?.provider_named && cmp(s.period, LATEST_PUBLISHED) <= 0)
    .filter((s) => !asLeader || addDays(publishDate(s.period), LEADER_GATE_DAYS) <= today)
    .sort((a, b) => (a.returnedOn < b.returnedOn ? 1 : -1));
}

export function InboxList({
  items, notes, editable, flash,
}: {
  items: ReturnType<typeof inboxItems>;
  notes: Note[];
  editable: boolean;
  flash?: { saved?: string; deleted?: string; error?: string; on?: string };
}) {
  if (!items.length) return <p className="value">No comments yet. Comments appear here as survey months are published.</p>;
  return (
    <>
      {items.map((s) => {
        const note = notes.find((n) => n.surveyRef === s.ref && !n.deleted);
        const deleted = notes.find((n) => n.surveyRef === s.ref && n.deleted);
        return (
          <article className="item" key={s.ref} id={s.ref} aria-labelledby={`h-${s.ref}`}>
            <h3 id={`h-${s.ref}`}>{monthName(s.period)} survey</h3>
            <p className="tnum">
              Explained {s.explained} of 5 · Listened {s.listened} of 5 · Respect {s.respect} of 5 · Would recommend: {s.recommend} of 10
            </p>
            <blockquote>&ldquo;{s.comment}&rdquo;</blockquote>
            <p className="label">Returned {longDate(s.returnedOn)}.{editable && <> If this was not your patient, <Link href={`/records/${s.ref}/dispute?metric=feedback_inbox`}>dispute who it is credited to</Link>; the comment itself cannot be disputed.</>}</p>
            {editable && (
              <div>
                {flash?.saved === s.ref && note && <p role="status">Note saved {longDate(note.savedAt)}. Visible to you only.</p>}
                {flash?.deleted === s.ref && deleted && (
                  <form action={restoreNote} role="status">
                    <input type="hidden" name="surveyRef" value={s.ref} />
                    Note deleted. <button className="linkbtn" type="submit">Restore it</button>
                  </form>
                )}
                {note && (
                  <div>
                    <p className="note-date">Your note, {longDate(note.savedAt)}</p>
                    <p style={{ whiteSpace: "pre-wrap" }}>{note.text}</p>
                  </div>
                )}
                <details>
                  <summary className="linkbtn" style={{ display: "inline-flex", alignItems: "center" }}>{note ? "Edit your note" : "Add a private note"}</summary>
                  <form action={saveNote} className="stack" style={{ marginTop: 8 }}>
                    <input type="hidden" name="surveyRef" value={s.ref} />
                    <div className={`field${flash?.error && flash.on === s.ref ? " has-error" : ""}`}>
                      <label htmlFor={`note-${s.ref}`}>Private note</label>
                      <textarea id={`note-${s.ref}`} name="text" defaultValue={note?.text ?? ""} />
                      <p className="help">Visible to you only. Never shared with your direct leader and never counted.</p>
                      {flash?.error && flash.on === s.ref && <p className="error" role="alert">Note: write the note before saving.</p>}
                    </div>
                    <div style={{ display: "flex", gap: 12 }}>
                      <button className="btn primary" type="submit">Save note</button>
                    </div>
                  </form>
                  {note && (
                    <form action={deleteNote} style={{ marginTop: 8 }}>
                      <input type="hidden" name="surveyRef" value={s.ref} />
                      <button className="btn" type="submit">Delete note</button>
                    </form>
                  )}
                </details>
              </div>
            )}
          </article>
        );
      })}
    </>
  );
}
