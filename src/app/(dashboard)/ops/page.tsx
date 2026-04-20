import Link from "next/link";
import {
  Plus, Scale, Briefcase, Gavel, Calendar, Clock, AlertCircle,
  ChevronRight, FolderKanban,
} from "lucide-react";
import { MatterStatus, MatterType } from "@prisma/client";
import { startOfDay, endOfDay, addDays } from "date-fns";
import { requireTenant } from "@/lib/tenancy";
import { prisma } from "@/lib/prisma";
import { Kpi } from "@/components/ui/kpi";
import { SectionHead } from "@/components/ui/section-head";
import { Avatar } from "@/components/ui/avatar";
import { formatDateTR, formatTRY } from "@/lib/utils";
import { matterTypeLabel, matterStatusChip } from "@/lib/labels";
import { cn } from "@/lib/utils";
import { OpsTabs } from "./ops-tabs";

export const metadata = { title: "Operasyonlar · Dosyalar" };

type TabKey = "ozet" | "danismanlik" | "dava" | "tumu";

const LITIGATION_TYPES: MatterType[] = ["LITIGATION", "CRIMINAL", "ADMINISTRATIVE", "FAMILY"];
const CONSULTING_TYPES: MatterType[] = ["CONSULTING", "CONTRACT", "COMPLIANCE", "CORPORATE", "IP", "LABOR"];

export default async function OpsPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: TabKey }>;
}) {
  const { firmId } = await requireTenant();
  const params = await searchParams;
  const tab: TabKey = params.tab ?? "ozet";
  const now = new Date();

  const [
    activeCount, litigationCount, consultingCount, closedCount,
    hearingsWeek, urgentTasks,
    allMatters, byType, byStatus,
  ] = await Promise.all([
    prisma.matter.count({ where: { firmId, status: "ACTIVE" } }),
    prisma.matter.count({
      where: { firmId, type: { in: LITIGATION_TYPES }, status: "ACTIVE" },
    }),
    prisma.matter.count({
      where: { firmId, type: { in: CONSULTING_TYPES }, status: "ACTIVE" },
    }),
    prisma.matter.count({
      where: { firmId, status: { in: ["CLOSED_WON", "CLOSED_LOST"] } },
    }),
    prisma.calendarEvent.count({
      where: {
        firmId, type: "HEARING",
        startsAt: { gte: now, lte: endOfDay(addDays(now, 7)) },
      },
    }),
    prisma.task.count({
      where: {
        firmId, status: { in: ["TODO", "IN_PROGRESS"] },
        dueAt: { lt: startOfDay(now) },
      },
    }),
    prisma.matter.findMany({
      where: { firmId },
      orderBy: { updatedAt: "desc" },
      take: 80,
      include: {
        client: { select: { name: true, companyName: true, type: true } },
        assignees: {
          take: 1,
          include: { user: { select: { id: true, name: true } } },
        },
        _count: { select: { tasks: true, documents: true, events: true } },
      },
    }),
    prisma.matter.groupBy({
      by: ["type"],
      where: { firmId },
      _count: { _all: true },
    }),
    prisma.matter.groupBy({
      by: ["status"],
      where: { firmId },
      _count: { _all: true },
    }),
  ]);

  // Filter by tab
  const filteredMatters =
    tab === "danismanlik"
      ? allMatters.filter((m) => CONSULTING_TYPES.includes(m.type))
      : tab === "dava"
      ? allMatters.filter((m) => LITIGATION_TYPES.includes(m.type))
      : allMatters;

  return (
    <div className="px-6 py-8 max-w-[1440px] mx-auto">
      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-7">
        <Kpi label="Aktif Dosya" value={activeCount} emphasized />
        <Kpi label="Dava" value={litigationCount} sub="litigation + criminal" />
        <Kpi label="Danışmanlık" value={consultingCount} sub="consulting + contract" />
        <Kpi label="Kapatılan" value={closedCount} sub="tüm zamanlar" />
        <Kpi
          label="Hafta Duruşma"
          value={hearingsWeek}
          sub="7 gün içinde"
          trend={hearingsWeek > 0 ? "up" : undefined}
        />
        <Kpi
          label="Gecikmiş Görev"
          value={urgentTasks}
          sub="tüm dosyalar"
          trend={urgentTasks > 0 ? "down" : undefined}
        />
      </div>

      {/* Tabs + actions */}
      <div className="flex items-center justify-between gap-3 mb-5">
        <OpsTabs active={tab} />
        <Link href="/ops/new" className="btn btn-primary btn-sm">
          <Plus size={13} /> Yeni Dosya
        </Link>
      </div>

      {tab === "ozet" ? (
        <OzetTab byType={byType} byStatus={byStatus} matters={allMatters} />
      ) : (
        <MattersList matters={filteredMatters} tab={tab} />
      )}
    </div>
  );
}

// ============================== OZET ==============================

function OzetTab({
  byType, byStatus, matters,
}: {
  byType: { type: MatterType; _count: { _all: number } }[];
  byStatus: { status: MatterStatus; _count: { _all: number } }[];
  matters: Awaited<ReturnType<typeof loadMatters>>;
}) {
  const typeSum = byType.reduce((s, t) => s + t._count._all, 0) || 1;
  const recentActive = matters.filter((m) => m.status === "ACTIVE").slice(0, 8);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_1fr] gap-6">
      <div className="card p-6">
        <SectionHead title="Dosya Türleri" subtitle="Aktif + kapanmış toplam" small />
        {byType.length === 0 ? (
          <div className="py-6 text-center text-sm text-juris-ink-3">Dosya yok.</div>
        ) : (
          <ul className="flex flex-col gap-3">
            {byType.map((t) => {
              const pct = (t._count._all / typeSum) * 100;
              const isLitigation = LITIGATION_TYPES.includes(t.type);
              return (
                <li key={t.type} className="flex items-center gap-3 text-sm">
                  <div
                    className="flex-shrink-0 w-8 h-8 rounded-md flex items-center justify-center"
                    style={{
                      background: isLitigation ? "rgba(188,47,44,0.08)" : "rgba(10,34,64,0.06)",
                      color: isLitigation ? "#BC2F2C" : "#0A2240",
                    }}
                  >
                    {isLitigation ? <Gavel size={14} /> : <Briefcase size={14} />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium text-juris-navy">{matterTypeLabel(t.type)}</span>
                      <span className="mono text-xs text-juris-ink-3">
                        {t._count._all} · %{pct.toFixed(0)}
                      </span>
                    </div>
                    <div className="h-1 rounded-full bg-juris-line-2 overflow-hidden">
                      <div
                        style={{
                          width: `${pct}%`,
                          height: "100%",
                          background: isLitigation ? "#BC2F2C" : "#0A2240",
                        }}
                      />
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <div className="card p-6">
        <SectionHead title="Durum Dağılımı" subtitle="Pipeline içi anlık görünüm" small />
        {byStatus.length === 0 ? (
          <div className="py-6 text-center text-sm text-juris-ink-3">Veri yok.</div>
        ) : (
          <ul className="flex flex-col divide-y divide-juris-line-2">
            {byStatus.map((s) => {
              const chip = matterStatusChip(s.status);
              return (
                <li key={s.status} className="py-3 flex items-center gap-3">
                  <span className={`chip chip-${chip.tone}`}>{chip.label}</span>
                  <span className="flex-1 text-sm text-juris-ink-3">{s._count._all} dosya</span>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <div className="card p-6 lg:col-span-2">
        <SectionHead
          title="Son Aktif Dosyalar"
          subtitle="Son hareket görenler"
          small
          actions={
            <Link href="/ops?tab=tumu" className="text-xs text-juris-ink-3 hover:text-juris-red">
              Tümü →
            </Link>
          }
        />
        {recentActive.length === 0 ? (
          <div className="py-8 text-center">
            <FolderKanban size={22} className="text-juris-ink-4 mx-auto mb-2" />
            <p className="text-sm text-juris-ink-3 mb-3">Henüz aktif dosya yok.</p>
            <Link href="/ops/new" className="btn btn-sm btn-primary">
              <Plus size={12} /> İlk Dosya
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {recentActive.map((m) => (
              <MatterCompactCard key={m.id} matter={m} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

async function loadMatters() {
  return [] as Awaited<ReturnType<typeof _dummy>>;
}
async function _dummy() {
  return prisma.matter.findMany({
    take: 1,
    include: {
      client: { select: { name: true, companyName: true, type: true } },
      assignees: {
        take: 1,
        include: { user: { select: { id: true, name: true } } },
      },
      _count: { select: { tasks: true, documents: true, events: true } },
    },
  });
}

type Matter = Awaited<ReturnType<typeof _dummy>>[number];

function MatterCompactCard({ matter }: { matter: Matter }) {
  const chip = matterStatusChip(matter.status);
  const client = matter.client?.type === "COMPANY"
    ? matter.client.companyName ?? matter.client.name
    : matter.client?.name;
  const assignee = matter.assignees[0]?.user;
  return (
    <Link
      href={`/ops/${matter.id}`}
      className="rounded-md border border-juris-line p-4 hover:border-juris-navy-200 hover:shadow-juris-md transition-all bg-white flex flex-col gap-2"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="mono text-[10px] text-juris-ink-3">{matter.matterNumber}</span>
            <span className={`chip chip-${chip.tone}`}>{chip.label}</span>
          </div>
          <div className="font-semibold text-juris-navy text-sm truncate">{matter.title}</div>
          <div className="text-xs text-juris-ink-3 mt-0.5 truncate">{client ?? "—"}</div>
        </div>
        <ChevronRight size={16} className="text-juris-ink-4 flex-shrink-0 mt-1" />
      </div>
      <div className="flex items-center gap-3 text-[11px] text-juris-ink-4 pt-2 border-t border-juris-line-2">
        {matter._count.tasks > 0 && (
          <span className="flex items-center gap-1">
            <Clock size={11} /> {matter._count.tasks}
          </span>
        )}
        {matter._count.events > 0 && (
          <span className="flex items-center gap-1">
            <Calendar size={11} /> {matter._count.events}
          </span>
        )}
        {matter.nextHearingAt && (
          <span className="flex items-center gap-1 text-juris-red font-semibold">
            <Gavel size={11} /> {formatDateTR(matter.nextHearingAt)}
          </span>
        )}
        {assignee && (
          <div className="ml-auto flex items-center gap-1.5">
            <Avatar name={assignee.name} size={18} />
            <span className="truncate max-w-[100px]">{assignee.name}</span>
          </div>
        )}
      </div>
    </Link>
  );
}

// ============================== LIST ==============================

function MattersList({
  matters, tab,
}: {
  matters: Matter[];
  tab: TabKey;
}) {
  if (matters.length === 0) {
    return (
      <div className="card p-12 flex flex-col items-center text-center">
        <Scale size={28} className="text-juris-ink-3 mb-3" />
        <h3 className="display text-xl text-juris-navy mb-1.5">
          {tab === "dava" ? "Dava yok" : tab === "danismanlik" ? "Danışmanlık yok" : "Dosya yok"}
        </h3>
        <p className="text-sm text-juris-ink-3 max-w-md mb-4">
          Müvekkilleriniz, dava ve danışmanlık dosyalarınız burada listelenecek.
        </p>
        <Link href="/ops/new" className="btn btn-primary">
          <Plus size={14} /> Yeni Dosya
        </Link>
      </div>
    );
  }
  return (
    <div className="card overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-juris-paper-2 text-juris-ink-3 text-[11px] uppercase tracking-wider">
          <tr>
            <th className="text-left px-4 py-3 font-semibold">Dosya No</th>
            <th className="text-left px-4 py-3 font-semibold">Müvekkil / Başlık</th>
            <th className="text-left px-4 py-3 font-semibold">Tür</th>
            <th className="text-left px-4 py-3 font-semibold">Durum</th>
            <th className="text-left px-4 py-3 font-semibold">Sorumlu</th>
            <th className="text-left px-4 py-3 font-semibold">Duruşma</th>
            <th className="text-right px-4 py-3 font-semibold">Görev</th>
          </tr>
        </thead>
        <tbody>
          {matters.map((m) => {
            const chip = matterStatusChip(m.status);
            const client = m.client?.type === "COMPANY"
              ? m.client.companyName ?? m.client.name
              : m.client?.name;
            const assignee = m.assignees[0]?.user;
            return (
              <tr key={m.id} className="border-t border-juris-line-2 hover:bg-juris-paper-2">
                <td className="px-4 py-3 mono text-xs text-juris-navy">
                  <Link href={`/ops/${m.id}`} className="hover:text-juris-red">
                    {m.matterNumber}
                  </Link>
                </td>
                <td className="px-4 py-3">
                  <Link href={`/ops/${m.id}`} className="hover:text-juris-red block">
                    <div className="text-[11px] text-juris-ink-3">{client ?? "—"}</div>
                    <div className="font-medium text-juris-navy truncate max-w-[280px]">{m.title}</div>
                  </Link>
                </td>
                <td className="px-4 py-3 text-xs text-juris-ink-2">{matterTypeLabel(m.type)}</td>
                <td className="px-4 py-3">
                  <span className={`chip chip-${chip.tone}`}>{chip.label}</span>
                </td>
                <td className="px-4 py-3">
                  {assignee ? (
                    <div className="flex items-center gap-2">
                      <Avatar name={assignee.name} size={22} />
                      <span className="text-xs text-juris-ink-2 truncate max-w-[130px]">{assignee.name}</span>
                    </div>
                  ) : (
                    <span className="text-xs text-juris-ink-4">—</span>
                  )}
                </td>
                <td className="px-4 py-3 text-xs">
                  {m.nextHearingAt ? (
                    <span className="text-juris-red font-semibold">
                      {formatDateTR(m.nextHearingAt)}
                    </span>
                  ) : (
                    <span className="text-juris-ink-4">—</span>
                  )}
                </td>
                <td className="px-4 py-3 mono text-right text-juris-navy font-semibold">
                  {m._count.tasks > 0 ? m._count.tasks : "—"}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
