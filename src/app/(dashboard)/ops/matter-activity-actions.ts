"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { TaskStatus, TaskPriority, EventType } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireTenant } from "@/lib/tenancy";
import { requirePermission } from "@/lib/rbac";
import { audit } from "@/lib/audit";

// ============================== NOTES ==============================

const noteSchema = z.object({
  matterId: z.string().min(1),
  body: z.string().min(1, "Not içeriği zorunlu").max(5000, "En fazla 5000 karakter"),
});

export type NoteState = { ok: boolean; error?: string; fieldErrors?: Record<string, string[]> };

export async function addNote(_prev: NoteState, formData: FormData): Promise<NoteState> {
  const { firmId, userId, role } = await requireTenant();
  requirePermission(role, "matter.edit");

  const parsed = noteSchema.safeParse({
    matterId: formData.get("matterId"),
    body: formData.get("body"),
  });
  if (!parsed.success) return { ok: false, fieldErrors: parsed.error.flatten().fieldErrors };

  const matter = await prisma.matter.findFirst({
    where: { id: parsed.data.matterId, firmId },
    select: { id: true },
  });
  if (!matter) return { ok: false, error: "Dosya bulunamadı" };

  await prisma.note.create({
    data: {
      firmId,
      authorId: userId,
      matterId: matter.id,
      body: parsed.data.body,
    },
  });

  await audit({ firmId, actorId: userId, action: "note.create", entityType: "matter", entityId: matter.id });
  revalidatePath(`/ops/${matter.id}`);
  return { ok: true };
}

export async function deleteNote(id: string, matterId: string) {
  const { firmId, userId, role } = await requireTenant();
  requirePermission(role, "matter.edit");

  const note = await prisma.note.findFirst({
    where: { id, firmId },
    select: { id: true, authorId: true },
  });
  if (!note) throw new Error("Not bulunamadı");
  // Sadece not yazarı veya PARTNER/OWNER silebilir
  if (note.authorId !== userId && role !== "OWNER" && role !== "PARTNER") {
    throw new Error("Bu notu silme yetkiniz yok");
  }

  await prisma.note.delete({ where: { id } });
  await audit({ firmId, actorId: userId, action: "note.delete", entityType: "matter", entityId: matterId });
  revalidatePath(`/ops/${matterId}`);
}

// ============================== TASKS ==============================

const taskSchema = z.object({
  matterId: z.string().optional().nullable(),
  title: z.string().min(2, "Başlık en az 2 karakter"),
  description: z.string().optional().nullable(),
  assigneeId: z.string().optional().nullable(),
  dueAt: z.string().optional().nullable(),
  priority: z.nativeEnum(TaskPriority).default(TaskPriority.NORMAL),
  status: z.nativeEnum(TaskStatus).default(TaskStatus.TODO),
});

export type TaskState = { ok: boolean; error?: string; fieldErrors?: Record<string, string[]> };

function parseTask(formData: FormData) {
  const toStr = (v: FormDataEntryValue | null) => {
    const s = typeof v === "string" ? v.trim() : "";
    return s.length ? s : null;
  };
  return {
    matterId: toStr(formData.get("matterId")),
    title: String(formData.get("title") ?? "").trim(),
    description: toStr(formData.get("description")),
    assigneeId: toStr(formData.get("assigneeId")),
    dueAt: toStr(formData.get("dueAt")),
    priority: (formData.get("priority") as TaskPriority) ?? TaskPriority.NORMAL,
    status: (formData.get("status") as TaskStatus) ?? TaskStatus.TODO,
  };
}

export async function createTask(_prev: TaskState, formData: FormData): Promise<TaskState> {
  const { firmId, userId, role } = await requireTenant();
  // Anyone who can edit matters or view can create tasks for themselves
  if (role === "CLIENT") return { ok: false, error: "Yetki yok" };

  const parsed = taskSchema.safeParse(parseTask(formData));
  if (!parsed.success) return { ok: false, fieldErrors: parsed.error.flatten().fieldErrors };

  const d = parsed.data;
  if (d.matterId) {
    const exists = await prisma.matter.count({ where: { id: d.matterId, firmId } });
    if (!exists) return { ok: false, error: "Dosya bulunamadı" };
  }

  const task = await prisma.task.create({
    data: {
      firmId,
      creatorId: userId,
      matterId: d.matterId,
      title: d.title,
      description: d.description,
      assigneeId: d.assigneeId ?? userId,
      dueAt: d.dueAt ? new Date(d.dueAt) : null,
      priority: d.priority,
      status: d.status,
    },
  });

  await audit({
    firmId, actorId: userId, action: "task.create",
    entityType: "task", entityId: task.id,
    diff: { title: task.title, matterId: d.matterId ?? null },
  });

  if (d.matterId) revalidatePath(`/ops/${d.matterId}`);
  revalidatePath("/tasks");
  revalidatePath("/command");
  return { ok: true };
}

export async function updateTaskStatus(id: string, status: TaskStatus) {
  const { firmId, userId, role } = await requireTenant();
  if (role === "CLIENT") throw new Error("Yetki yok");

  const task = await prisma.task.findFirst({ where: { id, firmId }, select: { id: true, matterId: true } });
  if (!task) throw new Error("Görev bulunamadı");

  await prisma.task.update({
    where: { id },
    data: {
      status,
      completedAt: status === "DONE" ? new Date() : null,
    },
  });

  await audit({ firmId, actorId: userId, action: `task.${status.toLowerCase()}`, entityType: "task", entityId: id });
  if (task.matterId) revalidatePath(`/ops/${task.matterId}`);
  revalidatePath("/tasks");
  revalidatePath("/command");
}

export async function deleteTask(id: string) {
  const { firmId, userId, role } = await requireTenant();
  if (role === "CLIENT") throw new Error("Yetki yok");

  const task = await prisma.task.findFirst({ where: { id, firmId } });
  if (!task) throw new Error("Görev bulunamadı");
  // Sadece yaratan veya OWNER/PARTNER silebilir
  if (task.creatorId !== userId && role !== "OWNER" && role !== "PARTNER") {
    throw new Error("Silme yetkiniz yok");
  }

  await prisma.task.delete({ where: { id } });
  await audit({ firmId, actorId: userId, action: "task.delete", entityType: "task", entityId: id });
  if (task.matterId) revalidatePath(`/ops/${task.matterId}`);
  revalidatePath("/tasks");
}

// ============================== EVENTS ==============================

const eventSchema = z.object({
  matterId: z.string().optional().nullable(),
  type: z.nativeEnum(EventType).default(EventType.MEETING),
  title: z.string().min(2, "Başlık en az 2 karakter"),
  location: z.string().optional().nullable(),
  startsAt: z.string().min(1, "Başlangıç tarihi/saati zorunlu"),
  endsAt: z.string().optional().nullable(),
  allDay: z.boolean().default(false),
  notes: z.string().optional().nullable(),
});

export type EventState = { ok: boolean; error?: string; fieldErrors?: Record<string, string[]> };

function parseEvent(formData: FormData) {
  const toStr = (v: FormDataEntryValue | null) => {
    const s = typeof v === "string" ? v.trim() : "";
    return s.length ? s : null;
  };
  return {
    matterId: toStr(formData.get("matterId")),
    type: (formData.get("type") as EventType) ?? EventType.MEETING,
    title: String(formData.get("title") ?? "").trim(),
    location: toStr(formData.get("location")),
    startsAt: String(formData.get("startsAt") ?? ""),
    endsAt: toStr(formData.get("endsAt")),
    allDay: formData.get("allDay") === "on",
    notes: toStr(formData.get("notes")),
  };
}

export async function createEvent(_prev: EventState, formData: FormData): Promise<EventState> {
  const { firmId, userId, role } = await requireTenant();
  if (role === "CLIENT") return { ok: false, error: "Yetki yok" };

  const parsed = eventSchema.safeParse(parseEvent(formData));
  if (!parsed.success) return { ok: false, fieldErrors: parsed.error.flatten().fieldErrors };

  const d = parsed.data;
  const event = await prisma.calendarEvent.create({
    data: {
      firmId,
      ownerId: userId,
      matterId: d.matterId,
      type: d.type,
      title: d.title,
      location: d.location,
      startsAt: new Date(d.startsAt),
      endsAt: d.endsAt ? new Date(d.endsAt) : null,
      allDay: d.allDay,
      notes: d.notes,
    },
  });

  // If it's a hearing linked to a matter, update matter.nextHearingAt
  if (d.type === "HEARING" && d.matterId) {
    await prisma.matter.update({
      where: { id: d.matterId },
      data: { nextHearingAt: new Date(d.startsAt) },
    });
  }

  await audit({
    firmId, actorId: userId, action: "event.create",
    entityType: "event", entityId: event.id,
    diff: { title: event.title, type: event.type, startsAt: d.startsAt },
  });

  if (d.matterId) revalidatePath(`/ops/${d.matterId}`);
  revalidatePath("/command");
  return { ok: true };
}

export async function deleteEvent(id: string) {
  const { firmId, userId, role } = await requireTenant();
  if (role === "CLIENT") throw new Error("Yetki yok");

  const event = await prisma.calendarEvent.findFirst({ where: { id, firmId } });
  if (!event) throw new Error("Etkinlik bulunamadı");
  if (event.ownerId !== userId && role !== "OWNER" && role !== "PARTNER") {
    throw new Error("Silme yetkiniz yok");
  }

  await prisma.calendarEvent.delete({ where: { id } });
  await audit({ firmId, actorId: userId, action: "event.delete", entityType: "event", entityId: id });
  if (event.matterId) revalidatePath(`/ops/${event.matterId}`);
  revalidatePath("/command");
}
