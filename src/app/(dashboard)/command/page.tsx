import Link from "next/link";
import { Kpi } from "@/components/ui/kpi";
import { SectionHead } from "@/components/ui/section-head";
import { requireTenant } from "@/lib/tenancy";
import { prisma } from "@/lib/prisma";
import { formatTRY, formatDateTR, formatDateTimeTR } from "@/lib/utils";
import { eventTypeLabel, taskPriorityLabel } from "@/lib/labels";
import { startOfDay, endOfDay, addDays, startOfMonth, endOfMonth } from "date-fns";
import { Gavel, Calendar, Clock, CheckCircle2, Circle, FileText, Briefcase, Receipt } from "lucide-react";

export const metadata = { title: "Komuta Merkezi" };

export default async function CommandPage() {
  const { firmId, userId, name } = await requireTenant();
  const now = new Date();
  const today0 = startOfDay(now);
  const today1 = endOfDay(now);
  const week1 = endOfDay(addDays(now, 7));
  const mStart = startOfMonth(now);
  const mEnd = endOfMonth(now);

  const [
    activeMatters,
    openLeads,
    invoicedThisMonth,
    upcomingHearingsCount,
    myOpenTasks,
    todayEvents,
    weekEvents,
    overdueTasks,
    recentActivity,
  ] = await Promise.all([
    prisma.matter.count({ where: { firmId, status: "ACTIVE" } }),
    prisma.lead.count({ where: { firmId, stage: { notIn: ["WON", "LOST"] } } }),
    prisma.invoice.aggregate({
      where: { firmId, issuedAt: { gte: mStart, lte: mEnd }, status: { in: ["SENT", "PAID"] } },
      _sum: { total: true },
    }),
    prisma.calendarEvent.count({
      where: { firmId, type: "HEARING", startsAt: { gte: now, lte: week1 } },
    }),
    prisma.task.findMany({
      where: {
        firmId,
        assigneeId: userId,
        status: { in: ["TODO", "IN_PROGRESS"] },
      },
      orderBy: [{ priority: "desc" }, { dueAt: "asc" }],
      take: 8,
      include: { matter: { select: { id: true, matterNumber: true, title: true } } },
    }),
    prisma.calendarEvent.findMany({
      where: { firmId, startsAt: { gte: today0, lte: today1 } },
      orderBy: { startsAt: "asc" },
      include: {
        matter: { select: { id: true, matterNumber: true, title: true } },
        owner: { select: { name: true } },
      },
    }),
    prisma.calendarEvent.findMany({
      where: { firmId, startsAt: { gt: today1, lte: week1 } },
      orderBy: { startsAt: "asc" },
      take: 6,
      include: {
        matter: { select: { id: true, matterNumber: true, title: true } },
      },
    }),
    prisma.task.count({
      where: {
        firmId,
        status: { in: ["TODO", "IN_PROGRESS"] },
        dueAt: { lt: today0 },
      },
    }),
    prisma.auditLog.findMany({
      where: { firmId },
      orderBy: { createdAt: "desc" },
      take: 8,
      include: { actor: { select: { name: true } } },
    }),
  ]);

  const invoiced = invoicedThisMonth._sum.total?.toNumber() ?? 0;
  const firstName = name.split(" ")[0] ?? name;

  return (
    <div className="px-6 py-8 max-w-[1400px] mx-auto">
      <div className="mb-7">
        <div className="display text-[28px] text-juris-navy">İyi günler, {firstName}.</div>
        <div className="text-sm text-juris-ink-3 mt-1">
          Firmanızın bugünkü durumu. Tüm modüllerden beslenen özet.
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-10">
        <Kpi label="Aktif Dosyalar" value={activeMatters} sub="tüm statüler" emphasized />
        <Kpi label="Açık Fırsatlar" value={openLeads} sub="CRM'de pipeline" />
        <Kpi
          label="Bu Ay Fatura"
          value={formatTRY(invoiced, { short: true })}
          sub="gönderilen + ödenen"
        />
        <Kpi
          label="Yaklaşan Duruşma"
          value={upcomingHearingsCount}
          sub="7 gün içinde"
          trend={upcomingHearingsCount > 0 ? "up" : undefined}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Bugünün Gündemi */}
        <div className="card p-6 lg:col-span-2">
          <SectionHead
            title="Bugünün Gündemi"
            subtitle={formatDateTR(now)}
            small
          />
          {todayEvents.length === 0 ? (
            <div className="text-sm text-juris-ink-3 py-6 text-center">
              Bugün için kayıtlı etkinlik yok.
            </div>
          ) : (
            <ul className="flex flex-col divide-y divide-juris-line-2">
              {todayEvents.map((e) => (
                <li key={e.id} className="py-3 flex items-start gap-3">
                  {e.type === "HEARING" ? (
                    <Gavel size={16} className="text-juris-red mt-0.5 flex-shrink-0" />
                  ) : (
                    <Calendar size={16} className="text-juris-ink-3 mt-0.5 flex-shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-juris-navy">{e.title}</div>
                    <div className="text-[11px] text-juris-ink-4 mt-0.5">
                      {e.allDay ? "Tüm gün" : formatDateTimeTR(e.startsAt).split(" ")[1]}
                      {e.location && ` · ${e.location}`}
                      {e.matter && (
                        <>
                          {" · "}
                          <Link href={`/ops/${e.matter.id}`} className="hover:text-juris-red mono">
                            {e.matter.matterNumber}
                          </Link>
                        </>
                      )}
                    </div>
                  </div>
                  <span className="chip" style={{ fontSize: 10, height: 20 }}>
                    {eventTypeLabel(e.type)}
                  </span>
                </li>
              ))}
            </ul>
          )}

          {weekEvents.length > 0 && (
            <>
              <div className="sep my-4" />
              <div className="label mb-2">Bu Hafta</div>
              <ul className="flex flex-col gap-2">
                {weekEvents.map((e) => (
                  <li key={e.id} className="flex items-center gap-2 text-sm">
                    {e.type === "HEARING" ? (
                      <Gavel size={13} className="text-juris-red flex-shrink-0" />
                    ) : (
                      <Calendar size={13} className="text-juris-ink-3 flex-shrink-0" />
                    )}
                    <span className="text-xs text-juris-ink-3 mono w-[68px] flex-shrink-0">
                      {e.startsAt.toLocaleDateString("tr-TR", { day: "2-digit", month: "short" })}
                    </span>
                    <span className="flex-1 truncate text-juris-ink-2">{e.title}</span>
                    {e.matter && (
                      <Link
                        href={`/ops/${e.matter.id}`}
                        className="mono text-[11px] text-juris-ink-3 hover:text-juris-red"
                      >
                        {e.matter.matterNumber}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>

        {/* Görevlerim */}
        <div className="card p-6">
          <SectionHead
            title="Görevlerim"
            subtitle={`${myOpenTasks.length} açık${overdueTasks > 0 ? ` · ${overdueTasks} gecikmiş` : ""}`}
            small
          />
          {myOpenTasks.length === 0 ? (
            <div className="text-sm text-juris-ink-3 py-6 text-center">
              Açık göreviniz yok. 🎉
            </div>
          ) : (
            <ul className="flex flex-col divide-y divide-juris-line-2">
              {myOpenTasks.map((t) => {
                const overdue = t.dueAt && t.dueAt < today0;
                return (
                  <li key={t.id} className="py-2.5 flex items-start gap-2.5">
                    {t.status === "IN_PROGRESS" ? (
                      <Clock size={14} className="text-juris-warn mt-0.5 flex-shrink-0" />
                    ) : (
                      <Circle size={14} className="text-juris-ink-3 mt-0.5 flex-shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="text-sm text-juris-navy font-medium line-clamp-2">
                        {t.title}
                      </div>
                      <div className="text-[10px] text-juris-ink-4 mt-0.5 flex items-center gap-1.5">
                        {t.priority !== "NORMAL" && (
                          <span className={t.priority === "URGENT" ? "text-juris-red font-semibold" : ""}>
                            {taskPriorityLabel(t.priority)}
                          </span>
                        )}
                        {t.dueAt && (
                          <span className={overdue ? "text-juris-red font-semibold" : ""}>
                            {formatDateTR(t.dueAt)}
                          </span>
                        )}
                        {t.matter && (
                          <Link
                            href={`/ops/${t.matter.id}`}
                            className="mono hover:text-juris-red"
                          >
                            {t.matter.matterNumber}
                          </Link>
                        )}
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>

      {/* Son Hareketler */}
      <div className="card p-6">
        <SectionHead
          title="Son Hareketler"
          subtitle="Ekipten son güncellemeler"
          small
        />
        {recentActivity.length === 0 ? (
          <div className="text-sm text-juris-ink-3 py-6 text-center">Hareket yok.</div>
        ) : (
          <ul className="flex flex-col divide-y divide-juris-line-2">
            {recentActivity.map((a) => (
              <li key={a.id} className="py-2.5 flex items-center gap-3 text-sm">
                <ActivityIcon action={a.action} />
                <span className="flex-1 text-juris-ink-2">
                  <span className="font-medium text-juris-navy">
                    {a.actor?.name ?? "Sistem"}
                  </span>
                  {" "}
                  <span>{humanizeAction(a.action)}</span>
                </span>
                <span className="text-[11px] text-juris-ink-4">
                  {formatDateTimeTR(a.createdAt)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function humanizeAction(action: string): string {
  const map: Record<string, string> = {
    "matter.create": "yeni dosya oluşturdu",
    "matter.update": "bir dosyayı güncelledi",
    "matter.delete": "bir dosyayı sildi",
    "invoice.create": "fatura oluşturdu",
    "invoice.sent": "fatura gönderdi",
    "invoice.paid": "faturayı ödendi işaretledi",
    "invoice.cancelled": "faturayı iptal etti",
    "lead.create": "fırsat oluşturdu",
    "lead.update": "fırsat güncelledi",
    "lead.convert_to_matter": "fırsatı müvekkile dönüştürdü",
    "contact.create": "kişi ekledi",
    "contact.update": "kişi güncelledi",
    "note.create": "not ekledi",
    "task.create": "görev oluşturdu",
    "task.done": "görev tamamladı",
    "event.create": "etkinlik ekledi",
    "time_entry.create": "zaman kaydı yaptı",
    "user.invite": "yeni üye davet etti",
    "user.activate": "bir üyeyi aktifleştirdi",
    "user.deactivate": "bir üyeyi pasifleştirdi",
    "ai.chat": "AI asistanına soru sordu",
  };
  return map[action] ?? action;
}

function ActivityIcon({ action }: { action: string }) {
  const [category] = action.split(".");
  const cls = "flex-shrink-0 text-juris-ink-3";
  if (category === "invoice") return <Receipt size={14} className={cls} />;
  if (category === "matter" || category === "time_entry") return <Briefcase size={14} className={cls} />;
  if (category === "note" || category === "document") return <FileText size={14} className={cls} />;
  if (category === "task") return <CheckCircle2 size={14} className={cls} />;
  if (category === "event") return <Calendar size={14} className={cls} />;
  return <Circle size={14} className={cls} />;
}
