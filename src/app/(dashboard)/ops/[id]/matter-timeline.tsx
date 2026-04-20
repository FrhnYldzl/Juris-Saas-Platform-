import { Briefcase, Gavel, CheckCircle2, Calendar, StickyNote, Upload, Receipt, Clock, MessageSquare } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { formatDateTimeTR, formatTRY } from "@/lib/utils";
import { SectionHead } from "@/components/ui/section-head";

interface TimelineItem {
  id: string;
  type: "matter" | "note" | "task" | "event" | "document" | "invoice" | "time" | "message";
  title: string;
  detail?: string;
  actorName?: string | null;
  at: Date;
  iconColor: string;
}

/**
 * Matter-scoped activity timeline — zaman çizelgesi.
 * Merges notes, tasks, events, documents, invoices, time entries, messages.
 */
export async function MatterTimeline({ matterId }: { matterId: string }) {
  const [notes, tasks, events, docs, invoices, timeEntries, messages, matter] = await Promise.all([
    prisma.note.findMany({
      where: { matterId },
      include: { author: { select: { name: true } } },
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
    prisma.task.findMany({
      where: { matterId },
      include: { creator: { select: { name: true } } },
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
    prisma.calendarEvent.findMany({
      where: { matterId },
      include: { owner: { select: { name: true } } },
      orderBy: { startsAt: "desc" },
      take: 50,
    }),
    prisma.document.findMany({
      where: { matterId },
      include: { uploader: { select: { name: true } } },
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
    prisma.invoice.findMany({
      where: { matterId },
      orderBy: { issuedAt: "desc" },
      take: 30,
    }),
    prisma.timeEntry.findMany({
      where: { matterId },
      orderBy: { startedAt: "desc" },
      take: 50,
    }),
    prisma.matterMessage.findMany({
      where: { matterId },
      include: { sender: { select: { name: true } } },
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
    prisma.matter.findUnique({
      where: { id: matterId },
      select: { openedAt: true, title: true, matterNumber: true, closedAt: true },
    }),
  ]);

  // Build unified timeline
  const items: TimelineItem[] = [];

  if (matter) {
    items.push({
      id: `open-${matterId}`,
      type: "matter",
      title: "Dosya açıldı",
      detail: `${matter.matterNumber} · ${matter.title}`,
      at: matter.openedAt,
      iconColor: "#1F5AA8",
    });
    if (matter.closedAt) {
      items.push({
        id: `close-${matterId}`,
        type: "matter",
        title: "Dosya kapandı",
        at: matter.closedAt,
        iconColor: "#5A6B82",
      });
    }
  }

  for (const n of notes) {
    items.push({
      id: `note-${n.id}`, type: "note",
      title: "Not eklendi",
      detail: n.body.slice(0, 140),
      actorName: n.author.name,
      at: n.createdAt,
      iconColor: "#B4701C",
    });
  }
  for (const t of tasks) {
    items.push({
      id: `task-create-${t.id}`, type: "task",
      title: `Görev: ${t.title}`,
      detail: t.dueAt ? `Son tarih: ${formatDateTimeTR(t.dueAt)}` : undefined,
      actorName: t.creator.name,
      at: t.createdAt,
      iconColor: "#0A2240",
    });
    if (t.completedAt) {
      items.push({
        id: `task-done-${t.id}`, type: "task",
        title: `Görev tamamlandı: ${t.title}`,
        at: t.completedAt,
        iconColor: "#1F7A4E",
      });
    }
  }
  for (const e of events) {
    items.push({
      id: `event-${e.id}`, type: "event",
      title: e.type === "HEARING" ? `Duruşma: ${e.title}` : `Etkinlik: ${e.title}`,
      detail: e.location ?? undefined,
      actorName: e.owner.name,
      at: e.startsAt,
      iconColor: e.type === "HEARING" ? "#BC2F2C" : "#0A2240",
    });
  }
  for (const d of docs) {
    items.push({
      id: `doc-${d.id}`, type: "document",
      title: `Belge yüklendi: ${d.name}`,
      detail: `${(d.size / 1024).toFixed(0)} KB`,
      actorName: d.uploader?.name ?? null,
      at: d.createdAt,
      iconColor: "#5A6B82",
    });
  }
  for (const inv of invoices) {
    items.push({
      id: `invoice-${inv.id}`, type: "invoice",
      title: `Fatura: ${inv.invoiceNumber}`,
      detail: `${formatTRY(inv.total.toString())} · ${inv.status.toLowerCase()}`,
      at: inv.issuedAt,
      iconColor: "#1F7A4E",
    });
  }
  for (const te of timeEntries) {
    items.push({
      id: `time-${te.id}`, type: "time",
      title: `Zaman kaydı: ${(te.durationMin / 60).toFixed(1)} saat`,
      detail: te.description,
      at: te.startedAt,
      iconColor: "#8895AB",
    });
  }
  for (const m of messages) {
    items.push({
      id: `msg-${m.id}`, type: "message",
      title: "Mesaj",
      detail: m.body.slice(0, 140),
      actorName: m.sender.name,
      at: m.createdAt,
      iconColor: "#1F5AA8",
    });
  }

  items.sort((a, b) => b.at.getTime() - a.at.getTime());

  return (
    <div className="card p-6">
      <SectionHead
        title="Zaman Çizelgesi"
        subtitle={`${items.length} hareket · dosyanın tam geçmişi`}
        small
      />

      {items.length === 0 ? (
        <div className="py-10 text-center text-sm text-juris-ink-3">
          Henüz hareket yok. Not, görev veya belge ekleyerek başlayın.
        </div>
      ) : (
        <ol className="relative border-l-2 border-juris-line-2 ml-3 mt-4">
          {items.slice(0, 60).map((item) => {
            const Icon = iconFor(item.type);
            return (
              <li key={item.id} className="mb-6 ml-6 relative">
                <span
                  className="absolute -left-[34px] flex items-center justify-center w-6 h-6 rounded-full bg-white border-2"
                  style={{ borderColor: item.iconColor, top: 0 }}
                >
                  <Icon size={11} style={{ color: item.iconColor }} />
                </span>
                <div className="flex items-baseline gap-2 flex-wrap">
                  <span className="font-semibold text-sm text-juris-navy">{item.title}</span>
                  {item.actorName && (
                    <span className="text-[11px] text-juris-ink-4">· {item.actorName}</span>
                  )}
                  <span className="text-[11px] text-juris-ink-4 ml-auto mono">
                    {formatDateTimeTR(item.at)}
                  </span>
                </div>
                {item.detail && (
                  <div className="text-xs text-juris-ink-3 mt-1 leading-relaxed">
                    {item.detail}
                  </div>
                )}
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}

function iconFor(type: TimelineItem["type"]) {
  return {
    matter: Briefcase,
    note: StickyNote,
    task: CheckCircle2,
    event: Gavel,
    document: Upload,
    invoice: Receipt,
    time: Clock,
    message: MessageSquare,
  }[type] ?? Calendar;
}
