import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, Pencil } from "lucide-react";
import { requireTenant } from "@/lib/tenancy";
import { prisma } from "@/lib/prisma";
import { SectionHead } from "@/components/ui/section-head";
import { matterStatusChip, matterTypeLabel } from "@/lib/labels";
import { formatDateTR, formatTRY } from "@/lib/utils";
import { TimeEntryPanel } from "./time-entry-panel";
import { NotesPanel } from "./notes-panel";
import { TasksPanel } from "./tasks-panel";
import { EventsPanel } from "./events-panel";
import { DocumentsPanel } from "./documents-panel";
import { auth } from "@/lib/auth";
import { can } from "@/lib/rbac";

export const metadata = { title: "Dosya Detayı" };

export default async function MatterDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { firmId, userId } = await requireTenant();

  const session = await auth();
  const matter = await prisma.matter.findFirst({
    where: { id, firmId },
    include: {
      client: true,
      assignees: { include: { user: { select: { id: true, name: true } } } },
      documents: { orderBy: { createdAt: "desc" }, take: 10 },
      invoices: { orderBy: { issuedAt: "desc" } },
      timeEntries: { orderBy: { startedAt: "desc" } },
      notes: {
        orderBy: { createdAt: "desc" },
        include: { author: { select: { id: true, name: true } } },
      },
      tasks: {
        orderBy: [{ status: "asc" }, { dueAt: "asc" }],
        include: { assignee: { select: { id: true, name: true } } },
      },
      events: {
        orderBy: { startsAt: "desc" },
        include: { owner: { select: { id: true, name: true } } },
      },
    },
  });

  if (!matter) notFound();
  const canEditMatter = session?.user ? can(session.user.role, "matter.edit") : false;
  const canEditAll = session?.user?.role === "OWNER" || session?.user?.role === "PARTNER";

  // Time entries → need user names
  const timeUserIds = Array.from(new Set(matter.timeEntries.map((t) => t.userId)));
  const timeUsers = timeUserIds.length
    ? await prisma.user.findMany({
        where: { id: { in: timeUserIds } },
        select: { id: true, name: true },
      })
    : [];
  const userNameMap = new Map(timeUsers.map((u) => [u.id, u.name]));

  // Team members (for task assignment)
  const teamMembers = await prisma.user.findMany({
    where: { firmId, active: true, role: { not: "CLIENT" } },
    orderBy: { name: "asc" },
    select: { id: true, name: true },
  });

  const chip = matterStatusChip(matter.status);
  const totalBilled = matter.invoices.reduce((s, i) => s + i.total.toNumber(), 0);
  const totalHours = matter.timeEntries.reduce((s, t) => s + t.durationMin, 0) / 60;
  const openTasks = matter.tasks.filter((t) => t.status !== "DONE" && t.status !== "CANCELLED").length;

  return (
    <div className="px-6 py-8 max-w-[1240px] mx-auto">
      <Link
        href="/ops"
        className="inline-flex items-center gap-1 text-xs text-juris-ink-3 hover:text-juris-navy mb-4"
      >
        <ChevronLeft size={14} /> Dosyalar
      </Link>

      <div className="flex items-start gap-3 mb-6">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-1">
            <span className="mono text-xs text-juris-ink-3">{matter.matterNumber}</span>
            <span className={`chip chip-${chip.tone}`}>{chip.label}</span>
            <span className="chip">{matterTypeLabel(matter.type)}</span>
            {openTasks > 0 && <span className="chip chip-amber">{openTasks} açık görev</span>}
          </div>
          <h1 className="display text-[28px] text-juris-navy">{matter.title}</h1>
          {matter.client && (
            <div className="text-sm text-juris-ink-3 mt-1">
              <Link href={`/sales/${matter.client.id}`} className="hover:text-juris-red">
                {matter.client.type === "COMPANY"
                  ? matter.client.companyName ?? matter.client.name
                  : matter.client.name}
              </Link>
            </div>
          )}
        </div>
        <Link href={`/ops/${id}/edit`} className="btn btn-ghost">
          <Pencil size={14} /> Düzenle
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main (2/3) */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          <div className="card p-6">
            <SectionHead title="Özet" small />
            <dl className="grid grid-cols-[160px_1fr] gap-y-2.5 text-sm">
              <dt className="text-juris-ink-3">Açıklama</dt>
              <dd className="text-juris-ink-2 leading-relaxed whitespace-pre-wrap">
                {matter.description ?? "—"}
              </dd>
              <dt className="text-juris-ink-3">Karşı Taraf</dt>
              <dd className="text-juris-ink-2">{matter.opposingParty ?? "—"}</dd>
              <dt className="text-juris-ink-3">Mahkeme</dt>
              <dd className="text-juris-ink-2">{matter.courtName ?? "—"}</dd>
              <dt className="text-juris-ink-3">Esas No</dt>
              <dd className="mono text-juris-ink-2">{matter.courtFileNo ?? "—"}</dd>
              <dt className="text-juris-ink-3">Açılış</dt>
              <dd className="text-juris-ink-2">{formatDateTR(matter.openedAt)}</dd>
              {matter.closedAt && (
                <>
                  <dt className="text-juris-ink-3">Kapanış</dt>
                  <dd className="text-juris-ink-2">{formatDateTR(matter.closedAt)}</dd>
                </>
              )}
              {matter.nextHearingAt && (
                <>
                  <dt className="text-juris-ink-3">Sıradaki Duruşma</dt>
                  <dd className="text-juris-red font-semibold">
                    {formatDateTR(matter.nextHearingAt)}
                  </dd>
                </>
              )}
            </dl>
          </div>

          <TasksPanel
            matterId={matter.id}
            currentUserId={userId}
            canEditAll={canEditAll}
            users={teamMembers}
            tasks={matter.tasks.map((t) => ({
              id: t.id,
              title: t.title,
              description: t.description,
              status: t.status,
              priority: t.priority,
              dueAt: t.dueAt,
              assigneeId: t.assigneeId,
              assigneeName: t.assignee?.name ?? null,
              creatorId: t.creatorId,
            }))}
          />

          <EventsPanel
            matterId={matter.id}
            currentUserId={userId}
            canEditAll={canEditAll}
            events={matter.events.map((e) => ({
              id: e.id,
              type: e.type,
              title: e.title,
              location: e.location,
              startsAt: e.startsAt,
              endsAt: e.endsAt,
              allDay: e.allDay,
              notes: e.notes,
              ownerId: e.ownerId,
              ownerName: e.owner.name,
            }))}
          />

          <NotesPanel
            matterId={matter.id}
            currentUserId={userId}
            canEditAll={canEditAll}
            notes={matter.notes.map((n) => ({
              id: n.id,
              body: n.body,
              createdAt: n.createdAt,
              authorId: n.authorId,
              authorName: n.author.name,
            }))}
          />

          <DocumentsPanel
            matterId={matter.id}
            canUpload={session?.user ? can(session.user.role, "document.upload") : false}
            canDelete={session?.user ? can(session.user.role, "document.delete") : false}
            documents={matter.documents.map((d) => ({
              id: d.id,
              name: d.name,
              mimeType: d.mimeType,
              size: d.size,
              category: d.category,
              uploaderName: null, // fetched lazily below
              createdAt: d.createdAt,
            }))}
          />

          <TimeEntryPanel
            matterId={matter.id}
            canEdit={canEditMatter}
            hourlyRate={matter.hourlyRate?.toNumber() ?? null}
            entries={matter.timeEntries.map((t) => ({
              id: t.id,
              startedAt: t.startedAt,
              durationMin: t.durationMin,
              description: t.description,
              billable: t.billable,
              billed: t.billed,
              userName: userNameMap.get(t.userId) ?? "—",
            }))}
          />
        </div>

        {/* Side (1/3) */}
        <div className="flex flex-col gap-6">
          <div className="card p-6">
            <SectionHead title="Ücret & Faturalama" small />
            <dl className="grid grid-cols-[140px_1fr] gap-y-2 text-sm">
              <dt className="text-juris-ink-3">Yöntem</dt>
              <dd className="text-juris-ink-2">
                {matter.billingType === "HOURLY" ? "Saatlik"
                  : matter.billingType === "FLAT_FEE" ? "Sabit"
                  : matter.billingType === "CONTINGENCY" ? "Başarı"
                  : "Retainer"}
              </dd>
              {matter.hourlyRate && (
                <>
                  <dt className="text-juris-ink-3">Saatlik</dt>
                  <dd className="mono">{formatTRY(matter.hourlyRate.toString())}/sa</dd>
                </>
              )}
              {matter.flatFee && (
                <>
                  <dt className="text-juris-ink-3">Sabit</dt>
                  <dd className="mono">{formatTRY(matter.flatFee.toString())}</dd>
                </>
              )}
              <dt className="text-juris-ink-3">Toplam Saat</dt>
              <dd className="mono">{totalHours.toFixed(1)}h</dd>
              <dt className="text-juris-ink-3">Faturalanan</dt>
              <dd className="mono font-semibold text-juris-navy">
                {formatTRY(totalBilled, { short: true })}
              </dd>
            </dl>
            <div className="sep my-4" />
            <Link
              href={`/finance/new?clientId=${matter.clientId ?? ""}&matterId=${matter.id}`}
              className="btn btn-sm btn-primary w-full justify-center"
            >
              Fatura Oluştur
            </Link>
          </div>

          <div className="card p-6">
            <SectionHead title="Sorumlular" small />
            {matter.assignees.length === 0 ? (
              <div className="text-sm text-juris-ink-3">—</div>
            ) : (
              <ul className="flex flex-col gap-2 text-sm">
                {matter.assignees.map((a) => (
                  <li key={a.id} className="flex items-center justify-between">
                    <span className="text-juris-ink-2">{a.user.name}</span>
                    <span className="text-[11px] text-juris-ink-4">{a.role}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {matter.invoices.length > 0 && (
            <div className="card p-6">
              <SectionHead title="Faturalar" small />
              <ul className="flex flex-col divide-y divide-juris-line-2">
                {matter.invoices.map((inv) => (
                  <li key={inv.id} className="py-2.5 flex items-center gap-2">
                    <Link
                      href={`/finance/${inv.id}`}
                      className="mono text-xs text-juris-navy hover:text-juris-red flex-shrink-0"
                    >
                      {inv.invoiceNumber}
                    </Link>
                    <div className="mono text-sm font-semibold text-juris-navy ml-auto">
                      {formatTRY(inv.total.toString(), { short: true })}
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
