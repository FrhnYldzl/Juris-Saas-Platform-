"use client";

import { useActionState, useRef, useEffect, useTransition } from "react";
import { StickyNote, Trash2 } from "lucide-react";
import { TextArea, FormError } from "@/components/ui/form";
import { addNote, deleteNote, type NoteState } from "../matter-activity-actions";
import { formatDateTimeTR } from "@/lib/utils";
import { Avatar } from "@/components/ui/avatar";

interface NoteLite {
  id: string;
  body: string;
  createdAt: Date;
  authorId: string;
  authorName: string;
}

export function NotesPanel({
  matterId, notes, currentUserId, canEditAll,
}: {
  matterId: string;
  notes: NoteLite[];
  currentUserId: string;
  canEditAll: boolean;
}) {
  const [state, formAction, pending] = useActionState<NoteState, FormData>(
    addNote,
    { ok: false },
  );
  const [deletingId, startDelete] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);

  // Clear textarea after successful save
  useEffect(() => {
    if (state.ok && formRef.current) formRef.current.reset();
  }, [state.ok]);

  const onDelete = (id: string) => {
    if (!confirm("Bu notu silmek istediğinize emin misiniz?")) return;
    startDelete(async () => {
      try {
        await deleteNote(id, matterId);
      } catch (e) {
        alert(e instanceof Error ? e.message : "Silme başarısız");
      }
    });
  };

  return (
    <div className="card p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="display text-lg text-juris-navy">Notlar</h3>
          <div className="text-xs text-juris-ink-3 mt-0.5">
            {notes.length} not · Ekibe görünür
          </div>
        </div>
      </div>

      <form ref={formRef} action={formAction} className="mb-5">
        <input type="hidden" name="matterId" value={matterId} />
        <TextArea
          name="body"
          rows={3}
          placeholder="Yeni not ekle… (konuşma özeti, gözlem, karar)"
          required
          maxLength={5000}
        />
        {state.fieldErrors?.body?.[0] && (
          <div className="text-[11px] text-juris-red mt-1">
            {state.fieldErrors.body[0]}
          </div>
        )}
        {state.error && <FormError>{state.error}</FormError>}
        <div className="flex justify-end mt-2">
          <button type="submit" disabled={pending} className="btn btn-sm btn-primary">
            {pending ? "Ekleniyor…" : "Not Ekle"}
          </button>
        </div>
      </form>

      {notes.length === 0 ? (
        <div className="flex flex-col items-center py-8 text-center">
          <StickyNote size={22} className="text-juris-ink-4 mb-2" />
          <div className="text-sm text-juris-ink-3">Henüz not yok.</div>
        </div>
      ) : (
        <ul className="flex flex-col gap-3">
          {notes.map((n) => {
            const canDelete = canEditAll || n.authorId === currentUserId;
            return (
              <li
                key={n.id}
                className="flex gap-3 p-3 rounded-md bg-juris-paper-2 border border-juris-line-2"
              >
                <Avatar name={n.authorName} size={28} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-xs text-juris-navy">
                      {n.authorName}
                    </span>
                    <span className="text-[10px] text-juris-ink-4">
                      {formatDateTimeTR(n.createdAt)}
                    </span>
                  </div>
                  <p className="text-sm text-juris-ink-2 whitespace-pre-wrap leading-relaxed">
                    {n.body}
                  </p>
                </div>
                {canDelete && (
                  <button
                    type="button"
                    onClick={() => onDelete(n.id)}
                    disabled={!!deletingId}
                    className="text-juris-ink-4 hover:text-juris-red p-1 flex-shrink-0"
                    aria-label="Notu sil"
                  >
                    <Trash2 size={13} />
                  </button>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
