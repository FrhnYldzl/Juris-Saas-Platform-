"use client";

import { useActionState, useState, useTransition } from "react";
import { Calendar, Plus, X, Trash2, MapPin, Gavel } from "lucide-react";
import { EventType } from "@prisma/client";
import { Field, Input, TextArea, Select, FormError } from "@/components/ui/form";
import {
  createEvent, deleteEvent, type EventState,
} from "../matter-activity-actions";
import { formatDateTimeTR, formatDateTR } from "@/lib/utils";
import { eventTypeLabel } from "@/lib/labels";

interface EventLite {
  id: string;
  type: EventType;
  title: string;
  location: string | null;
  startsAt: Date;
  endsAt: Date | null;
  allDay: boolean;
  notes: string | null;
  ownerId: string;
  ownerName: string;
}

const TYPE_ICON: Record<EventType, typeof Gavel> = {
  HEARING: Gavel,
  MEETING: Calendar,
  DEADLINE: Calendar,
  REMINDER: Calendar,
  OTHER: Calendar,
};

export function EventsPanel({
  matterId, events, currentUserId, canEditAll,
}: {
  matterId: string;
  events: EventLite[];
  currentUserId: string;
  canEditAll: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState<EventState, FormData>(
    createEvent,
    { ok: false },
  );
  const [busy, start] = useTransition();
  const [allDay, setAllDay] = useState(false);
  const err = (f: string) => state.fieldErrors?.[f]?.[0];

  if (state.ok && open && !pending) {
    setTimeout(() => setOpen(false), 100);
  }

  const remove = (id: string) => {
    if (!confirm("Etkinliği silmek istediğinize emin misiniz?")) return;
    start(async () => {
      try { await deleteEvent(id); }
      catch (e) { alert(e instanceof Error ? e.message : "Silme başarısız"); }
    });
  };

  const now = new Date();
  const upcoming = events.filter((e) => e.startsAt >= now);
  const past = events.filter((e) => e.startsAt < now);

  const defaultStart = new Date(Date.now() + 2 * 86400000);
  defaultStart.setHours(10, 0, 0, 0);

  return (
    <div className="card p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="display text-lg text-juris-navy">Takvim</h3>
          <div className="text-xs text-juris-ink-3 mt-0.5">
            {upcoming.length} yaklaşan · {past.length} geçmiş
          </div>
        </div>
        <button type="button" onClick={() => setOpen(true)} className="btn btn-sm btn-primary">
          <Plus size={12} /> Etkinlik Ekle
        </button>
      </div>

      {upcoming.length === 0 && past.length === 0 ? (
        <div className="flex flex-col items-center py-8 text-center">
          <Calendar size={22} className="text-juris-ink-4 mb-2" />
          <div className="text-sm text-juris-ink-3">Etkinlik yok.</div>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {upcoming.length > 0 && (
            <div>
              <div className="label mb-2">Yaklaşan</div>
              <ul className="flex flex-col divide-y divide-juris-line-2">
                {upcoming.map((e) => (
                  <EventRow key={e.id} event={e} canDelete={canEditAll || e.ownerId === currentUserId} onDelete={remove} busy={busy} />
                ))}
              </ul>
            </div>
          )}
          {past.length > 0 && (
            <div>
              <div className="label mb-2 mt-2">Geçmiş</div>
              <ul className="flex flex-col divide-y divide-juris-line-2 opacity-70">
                {past.slice(0, 5).map((e) => (
                  <EventRow key={e.id} event={e} canDelete={canEditAll || e.ownerId === currentUserId} onDelete={remove} busy={busy} />
                ))}
              </ul>
            </div>
          )}
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
                  Yeni Etkinlik
                </div>
                <h3 className="display text-xl text-juris-navy">Etkinlik Ekle</h3>
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

              <div className="grid grid-cols-2 gap-3">
                <Field label="Tür">
                  <Select name="type" defaultValue="HEARING">
                    <option value="HEARING">Duruşma</option>
                    <option value="MEETING">Toplantı</option>
                    <option value="DEADLINE">Süre Sonu</option>
                    <option value="REMINDER">Hatırlatma</option>
                    <option value="OTHER">Diğer</option>
                  </Select>
                </Field>
                <Field label="Tüm Gün">
                  <label className="flex items-center gap-2 h-10 text-sm text-juris-ink-2">
                    <input
                      type="checkbox"
                      name="allDay"
                      checked={allDay}
                      onChange={(e) => setAllDay(e.target.checked)}
                      className="w-4 h-4 accent-juris-red"
                    />
                    Tüm gün etkinlik
                  </label>
                </Field>
              </div>

              <Field label="Başlık" error={err("title")} required>
                <Input name="title" placeholder="Örn: İst. 3. Asliye Ticaret Mahkemesi duruşma" required />
              </Field>

              <Field label="Yer / Lokasyon">
                <Input name="location" placeholder="Mahkeme salonu, adres veya Zoom linki" />
              </Field>

              <div className="grid grid-cols-2 gap-3">
                <Field label={allDay ? "Tarih" : "Başlangıç"} error={err("startsAt")} required>
                  <Input
                    type={allDay ? "date" : "datetime-local"}
                    name="startsAt"
                    defaultValue={
                      allDay
                        ? defaultStart.toISOString().slice(0, 10)
                        : defaultStart.toISOString().slice(0, 16)
                    }
                    required
                  />
                </Field>
                {!allDay && (
                  <Field label="Bitiş">
                    <Input type="datetime-local" name="endsAt" />
                  </Field>
                )}
              </div>

              <Field label="Not">
                <TextArea name="notes" rows={2} placeholder="Hazırlık notu, ek belgeler…" />
              </Field>

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
                  {pending ? "Kaydediliyor…" : "Etkinliği Ekle"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function EventRow({
  event, canDelete, onDelete, busy,
}: {
  event: EventLite;
  canDelete: boolean;
  onDelete: (id: string) => void;
  busy: boolean;
}) {
  const Icon = TYPE_ICON[event.type];
  return (
    <li className="py-3 flex items-start gap-3">
      <Icon
        size={14}
        className={event.type === "HEARING" ? "text-juris-red mt-1" : "text-juris-ink-3 mt-1"}
      />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-xs uppercase tracking-wider text-juris-ink-3 font-semibold">
            {eventTypeLabel(event.type)}
          </span>
          <span className="text-[11px] text-juris-ink-4">
            {event.allDay
              ? formatDateTR(event.startsAt)
              : formatDateTimeTR(event.startsAt)}
          </span>
        </div>
        <div className="text-sm font-medium text-juris-navy mt-0.5">{event.title}</div>
        {event.location && (
          <div className="text-[11px] text-juris-ink-3 mt-0.5 flex items-center gap-1">
            <MapPin size={10} /> {event.location}
          </div>
        )}
      </div>
      {canDelete && (
        <button
          type="button"
          onClick={() => onDelete(event.id)}
          disabled={busy}
          className="text-juris-ink-4 hover:text-juris-red p-1"
        >
          <Trash2 size={12} />
        </button>
      )}
    </li>
  );
}
