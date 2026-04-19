"use client";

import { useActionState, useState, useTransition } from "react";
import { CheckSquare, Plus, X, Trash2, Circle, CheckCircle2, Clock } from "lucide-react";
import { TaskStatus, TaskPriority } from "@prisma/client";
import { Field, Input, TextArea, Select, FormError } from "@/components/ui/form";
import {
  createTask, updateTaskStatus, deleteTask, type TaskState,
} from "../matter-activity-actions";
import { formatDateTR } from "@/lib/utils";
import { taskPriorityLabel } from "@/lib/labels";
import { cn } from "@/lib/utils";

interface TaskLite {
  id: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  dueAt: Date | null;
  assigneeId: string | null;
  assigneeName: string | null;
  creatorId: string;
}

type UserOpt = { id: string; name: string };

const PRIORITY_TONE: Record<TaskPriority, string> = {
  LOW: "",
  NORMAL: "",
  HIGH: "chip-amber",
  URGENT: "chip-red",
};

export function TasksPanel({
  matterId, tasks, users, currentUserId, canEditAll,
}: {
  matterId: string;
  tasks: TaskLite[];
  users: UserOpt[];
  currentUserId: string;
  canEditAll: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState<TaskState, FormData>(
    createTask,
    { ok: false },
  );
  const [busy, start] = useTransition();

  const err = (f: string) => state.fieldErrors?.[f]?.[0];

  if (state.ok && open && !pending) {
    setTimeout(() => setOpen(false), 100);
  }

  const toggle = (task: TaskLite) => {
    const next: TaskStatus =
      task.status === "DONE" ? "TODO" :
      task.status === "TODO" ? "IN_PROGRESS" :
      "DONE";
    start(async () => {
      try { await updateTaskStatus(task.id, next); }
      catch (e) { alert(e instanceof Error ? e.message : "Güncelleme başarısız"); }
    });
  };

  const remove = (id: string) => {
    if (!confirm("Görevi silmek istediğinize emin misiniz?")) return;
    start(async () => {
      try { await deleteTask(id); }
      catch (e) { alert(e instanceof Error ? e.message : "Silme başarısız"); }
    });
  };

  const sorted = [...tasks].sort((a, b) => {
    // Open tasks before done, then by due date
    if (a.status !== "DONE" && b.status === "DONE") return -1;
    if (a.status === "DONE" && b.status !== "DONE") return 1;
    const ad = a.dueAt?.getTime() ?? Infinity;
    const bd = b.dueAt?.getTime() ?? Infinity;
    return ad - bd;
  });

  const openCount = tasks.filter((t) => t.status !== "DONE" && t.status !== "CANCELLED").length;

  return (
    <div className="card p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="display text-lg text-juris-navy">Görevler</h3>
          <div className="text-xs text-juris-ink-3 mt-0.5">
            {openCount} açık · {tasks.length - openCount} tamamlanmış
          </div>
        </div>
        <button type="button" onClick={() => setOpen(true)} className="btn btn-sm btn-primary">
          <Plus size={12} /> Görev Ekle
        </button>
      </div>

      {sorted.length === 0 ? (
        <div className="flex flex-col items-center py-8 text-center">
          <CheckSquare size={22} className="text-juris-ink-4 mb-2" />
          <div className="text-sm text-juris-ink-3">Görev yok.</div>
        </div>
      ) : (
        <ul className="flex flex-col divide-y divide-juris-line-2">
          {sorted.map((t) => {
            const done = t.status === "DONE";
            const overdue = !done && t.dueAt && t.dueAt < new Date();
            const canDelete = canEditAll || t.creatorId === currentUserId;
            return (
              <li key={t.id} className="py-3 flex items-start gap-3">
                <button
                  type="button"
                  onClick={() => toggle(t)}
                  disabled={busy}
                  aria-label={done ? "TODO yap" : "Tamamla"}
                  className="flex-shrink-0 mt-0.5 text-juris-ink-3 hover:text-juris-red"
                >
                  {done ? (
                    <CheckCircle2 size={18} className="text-juris-success" />
                  ) : t.status === "IN_PROGRESS" ? (
                    <Clock size={18} className="text-juris-warn" />
                  ) : (
                    <Circle size={18} />
                  )}
                </button>
                <div className="flex-1 min-w-0">
                  <div className={cn(
                    "text-sm font-medium text-juris-navy",
                    done && "line-through text-juris-ink-3",
                  )}>
                    {t.title}
                  </div>
                  {t.description && (
                    <div className="text-xs text-juris-ink-3 mt-0.5 line-clamp-2">{t.description}</div>
                  )}
                  <div className="flex items-center gap-2 mt-1.5 text-[11px] text-juris-ink-4">
                    {t.priority !== "NORMAL" && (
                      <span className={cn("chip", PRIORITY_TONE[t.priority])} style={{ height: 18, fontSize: 9 }}>
                        {taskPriorityLabel(t.priority)}
                      </span>
                    )}
                    {t.assigneeName && <span>👤 {t.assigneeName}</span>}
                    {t.dueAt && (
                      <span className={overdue ? "text-juris-red font-semibold" : ""}>
                        📅 {formatDateTR(t.dueAt)}
                      </span>
                    )}
                  </div>
                </div>
                {canDelete && !done && (
                  <button
                    type="button"
                    onClick={() => remove(t.id)}
                    disabled={busy}
                    className="text-juris-ink-4 hover:text-juris-red p-1"
                  >
                    <Trash2 size={12} />
                  </button>
                )}
              </li>
            );
          })}
        </ul>
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
                  Yeni Görev
                </div>
                <h3 className="display text-xl text-juris-navy">Görev Ekle</h3>
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

              <Field label="Başlık" error={err("title")} required>
                <Input name="title" placeholder="Örn: Dilekçe taslağı hazırla" required />
              </Field>

              <Field label="Açıklama">
                <TextArea name="description" rows={2} placeholder="Detay (opsiyonel)" />
              </Field>

              <div className="grid grid-cols-2 gap-3">
                <Field label="Sorumlu">
                  <Select name="assigneeId" defaultValue={currentUserId}>
                    {users.map((u) => (
                      <option key={u.id} value={u.id}>{u.name}</option>
                    ))}
                  </Select>
                </Field>
                <Field label="Son Tarih">
                  <Input type="date" name="dueAt" />
                </Field>
              </div>

              <Field label="Öncelik">
                <Select name="priority" defaultValue="NORMAL">
                  <option value="LOW">Düşük</option>
                  <option value="NORMAL">Normal</option>
                  <option value="HIGH">Yüksek</option>
                  <option value="URGENT">Acil</option>
                </Select>
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
                  {pending ? "Kaydediliyor…" : "Görevi Oluştur"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
