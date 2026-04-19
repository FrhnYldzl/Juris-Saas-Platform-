"use client";

import { useActionState, useState, useTransition } from "react";
import { Clock, Plus, Trash2, X } from "lucide-react";
import { Field, Input, TextArea, FormError } from "@/components/ui/form";
import { addTimeEntry, deleteTimeEntry, type TimeEntryState } from "../time-actions";
import { formatDateTR } from "@/lib/utils";

interface TimeEntryLite {
  id: string;
  startedAt: Date;
  durationMin: number;
  description: string;
  billable: boolean;
  billed: boolean;
  userName: string;
}

export function TimeEntryPanel({
  matterId, entries, canEdit, hourlyRate,
}: {
  matterId: string;
  entries: TimeEntryLite[];
  canEdit: boolean;
  hourlyRate?: number | null;
}) {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState<TimeEntryState, FormData>(
    addTimeEntry,
    { ok: false },
  );
  const err = (f: string) => state.fieldErrors?.[f]?.[0];
  const [deletingId, startDelete] = useTransition();

  const totalHours = entries.reduce((s, e) => s + e.durationMin, 0) / 60;
  const billableHours =
    entries.filter((e) => e.billable).reduce((s, e) => s + e.durationMin, 0) / 60;
  const billedHours =
    entries.filter((e) => e.billed).reduce((s, e) => s + e.durationMin, 0) / 60;

  const onDelete = (id: string) => {
    if (!confirm("Zaman kaydını silmek istediğinize emin misiniz?")) return;
    startDelete(async () => {
      try {
        await deleteTimeEntry(id, matterId);
      } catch (e) {
        alert(e instanceof Error ? e.message : "Silme başarısız");
      }
    });
  };

  // Close modal on successful save
  if (open && state.ok && !pending) {
    setTimeout(() => setOpen(false), 100);
  }

  return (
    <div className="card p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="display text-lg text-juris-navy">Zaman Kayıtları</h3>
          <div className="text-xs text-juris-ink-3 mt-0.5">
            Toplam <span className="mono font-semibold text-juris-navy">{totalHours.toFixed(1)}h</span>
            {" · "}Faturalanabilir {billableHours.toFixed(1)}h · Faturalanan {billedHours.toFixed(1)}h
          </div>
        </div>
        {canEdit && (
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="btn btn-sm btn-primary"
          >
            <Plus size={12} /> Kayıt Ekle
          </button>
        )}
      </div>

      {entries.length === 0 ? (
        <div className="text-sm text-juris-ink-3 py-6 text-center">
          Zaman kaydı yok. &ldquo;Kayıt Ekle&rdquo; ile ilk girişi yap.
        </div>
      ) : (
        <div className="flex flex-col divide-y divide-juris-line-2">
          {entries.map((e) => {
            const hours = e.durationMin / 60;
            const amount = hourlyRate ? hours * hourlyRate : null;
            return (
              <div key={e.id} className="py-3 flex items-start gap-3">
                <Clock size={14} className="text-juris-ink-3 flex-shrink-0 mt-1" />
                <div className="flex-1 min-w-0">
                  <div className="text-sm text-juris-navy">{e.description}</div>
                  <div className="text-[11px] text-juris-ink-4 mt-0.5 flex items-center gap-2">
                    <span>{formatDateTR(e.startedAt)}</span>
                    <span>·</span>
                    <span>{e.userName}</span>
                    {!e.billable && <span className="chip" style={{ height: 18, fontSize: 9 }}>Faturalanmaz</span>}
                    {e.billed && <span className="chip chip-green" style={{ height: 18, fontSize: 9 }}>Faturalandı</span>}
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <div className="mono font-semibold text-juris-navy">{hours.toFixed(1)}h</div>
                  {amount != null && (
                    <div className="text-[11px] text-juris-ink-3 mono">
                      {amount.toLocaleString("tr-TR", { maximumFractionDigits: 0 })} ₺
                    </div>
                  )}
                </div>
                {canEdit && !e.billed && (
                  <button
                    type="button"
                    onClick={() => onDelete(e.id)}
                    disabled={!!deletingId}
                    className="text-juris-ink-4 hover:text-juris-red p-1"
                    aria-label="Sil"
                  >
                    <Trash2 size={13} />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(10,34,64,0.45)", backdropFilter: "blur(2px)" }}
          onClick={() => !pending && setOpen(false)}
        >
          <div
            className="bg-white rounded-lg shadow-juris-pop max-w-md w-full animate-modalIn"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between p-6 border-b border-juris-line-2">
              <div>
                <div className="text-[11px] uppercase tracking-wider text-juris-red font-semibold mb-1">
                  Zaman Kaydı
                </div>
                <h3 className="display text-xl text-juris-navy">Yeni Kayıt</h3>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                disabled={pending}
                className="text-juris-ink-4 hover:text-juris-navy p-1"
              >
                <X size={16} />
              </button>
            </div>

            <form action={formAction} className="p-6 flex flex-col gap-4">
              <input type="hidden" name="matterId" value={matterId} />

              <Field label="Tarih" error={err("startedAt")} required>
                <Input
                  type="date"
                  name="startedAt"
                  defaultValue={new Date().toISOString().slice(0, 10)}
                  required
                />
              </Field>

              <Field label="Süre (saat)" error={err("hours")} required hint="Örn: 1.5 = 1 saat 30 dk">
                <Input
                  type="number"
                  step="0.25"
                  min="0"
                  max="24"
                  name="hours"
                  defaultValue="1"
                  className="mono"
                  required
                />
              </Field>

              <Field label="Açıklama" error={err("description")} required>
                <TextArea
                  name="description"
                  rows={3}
                  placeholder="Ne üzerinde çalıştınız?"
                  required
                />
              </Field>

              <label className="flex items-center gap-2.5 text-sm text-juris-ink-2">
                <input
                  type="checkbox"
                  name="billable"
                  defaultChecked
                  className="w-4 h-4 accent-juris-red"
                />
                Faturalanabilir
              </label>

              {state.error && <FormError>{state.error}</FormError>}

              <div className="flex gap-2 justify-end pt-2 border-t border-juris-line-2 mt-2">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  disabled={pending}
                  className="btn btn-ghost"
                >
                  Vazgeç
                </button>
                <button type="submit" disabled={pending} className="btn btn-primary">
                  {pending ? "Kaydediliyor…" : "Kaydet"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
