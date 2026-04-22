import Link from "next/link";
import { Plus, Mail, Phone, Circle, Search, Briefcase, CheckSquare } from "lucide-react";
import type { UserRole } from "@prisma/client";
import { requireTenant } from "@/lib/tenancy";
import { prisma } from "@/lib/prisma";
import { Kpi } from "@/components/ui/kpi";
import { SectionHead } from "@/components/ui/section-head";
import { Avatar } from "@/components/ui/avatar";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { roleLabelTR } from "@/lib/labels";
import { formatDateTR } from "@/lib/utils";
import { ProgressThin } from "@/components/ui/mini-chart";
import { cn } from "@/lib/utils";
import { SourcesButton } from "@/components/shell/sources-panel";

export const metadata = { title: "Ekip" };

type FilterKey = "all" | "partners" | "associates" | "paralegals" | "admin" | "inactive";

export default async function PeoplePage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: FilterKey; q?: string }>;
}) {
  const { firmId, role } = await requireTenant();
  const params = await searchParams;
  const filter: FilterKey = params.filter ?? "all";
  const query = (params.q ?? "").trim();

  const users = await prisma.user.findMany({
    where: { firmId, role: { not: "CLIENT" } },
    orderBy: [{ role: "asc" }, { createdAt: "asc" }],
    select: {
      id: true, name: true, email: true, role: true, title: true, phone: true,
      active: true, lastLoginAt: true, createdAt: true, image: true,
      _count: {
        select: {
          assignedMatters: true,
          assignedTasks: { where: { status: { in: ["TODO", "IN_PROGRESS"] } } },
          createdTasks: true,
        },
      },
    },
  });

  const canInvite = role === "OWNER" || role === "PARTNER";
  const activeCount = users.filter((u) => u.active).length;
  const inactiveCount = users.length - activeCount;
  const roleCounts = users.reduce<Record<string, number>>((acc, u) => {
    acc[u.role] = (acc[u.role] ?? 0) + 1;
    return acc;
  }, {});
  const partnersCount   = (roleCounts.OWNER ?? 0) + (roleCounts.PARTNER ?? 0);
  const associatesCount = roleCounts.ASSOCIATE  ?? 0;
  const paralegalsCount = roleCounts.PARALEGAL  ?? 0;
  const adminCount      = roleCounts.ADMIN_STAFF ?? 0;

  // Apply filters
  const normalized = query.toLocaleLowerCase("tr-TR");
  const filtered = users.filter((u) => {
    if (filter === "partners"   && !(u.role === "OWNER" || u.role === "PARTNER")) return false;
    if (filter === "associates" && u.role !== "ASSOCIATE") return false;
    if (filter === "paralegals" && u.role !== "PARALEGAL") return false;
    if (filter === "admin"      && u.role !== "ADMIN_STAFF") return false;
    if (filter === "inactive"   && u.active) return false;
    if (query.length >= 2) {
      const hay = `${u.name} ${u.email} ${u.title ?? ""} ${roleLabelTR(u.role)}`.toLocaleLowerCase("tr-TR");
      if (!hay.includes(normalized)) return false;
    }
    return true;
  });

  const maxTasks = Math.max(...users.map((u) => u._count.assignedTasks), 1);

  const qs = (f: FilterKey, q: string = query) => {
    const s = new URLSearchParams();
    if (f !== "all") s.set("filter", f);
    if (q) s.set("q", q);
    return s.toString() ? `?${s}` : "";
  };

  return (
    <div className="px-6 py-8 max-w-[1400px] mx-auto">
      <div className="mb-4">
        <Breadcrumb
          crumbs={[
            { label: "Firma", href: "/settings" },
            { label: "Ekip" },
          ]}
        />
      </div>

      {/* KPIs — all clickable to filter */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-7">
        <Kpi href={`/people${qs("all")}`}        label="Ekip"      value={activeCount} sub={`${users.length} toplam`} emphasized />
        <Kpi href={`/people${qs("partners")}`}   label="Ortak"     value={partnersCount}   sub="yönetim" />
        <Kpi href={`/people${qs("associates")}`} label="Avukat"    value={associatesCount} sub="associate" />
        <Kpi href={`/people${qs("paralegals")}`} label="Paralegal" value={paralegalsCount} sub="stajyer" />
        <Kpi href={`/people${qs("admin")}`}      label="İdari"     value={adminCount}      sub="destek" />
      </div>

      <SectionHead
        title="Ekip"
        subtitle="Avukatlar, stajyerler, idari kadro · iş yükü görünümü"
        actions={
          <div className="flex gap-2">
            <SourcesButton moduleKey="people" />
            {canInvite && (
              <Link href="/people/invite" className="btn btn-primary">
                <Plus size={14} /> Üye Davet Et
              </Link>
            )}
          </div>
        }
      />

      {/* Filter bar */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <div className="flex items-center gap-1.5 flex-wrap">
          <FilterChip href={`/people${qs("all")}`}        active={filter === "all"}        label="Tümü"       count={users.length} />
          <FilterChip href={`/people${qs("partners")}`}   active={filter === "partners"}   label="Ortaklar"   count={partnersCount} />
          <FilterChip href={`/people${qs("associates")}`} active={filter === "associates"} label="Avukatlar"  count={associatesCount} />
          <FilterChip href={`/people${qs("paralegals")}`} active={filter === "paralegals"} label="Paralegal"  count={paralegalsCount} />
          <FilterChip href={`/people${qs("admin")}`}      active={filter === "admin"}      label="İdari"      count={adminCount} />
          {inactiveCount > 0 && (
            <FilterChip href={`/people${qs("inactive")}`} active={filter === "inactive"} label="Pasif" count={inactiveCount} tone="gray" />
          )}
        </div>
        <div className="flex-1" />
        {/* Search box */}
        <form action="/people" method="GET" className="flex items-center gap-2">
          {filter !== "all" && <input type="hidden" name="filter" value={filter} />}
          <div
            className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-white"
            style={{ border: "1px solid #E5E9F0" }}
          >
            <Search size={12} className="text-juris-ink-3" />
            <input
              name="q"
              type="search"
              defaultValue={query}
              placeholder="İsim, e-posta…"
              className="bg-transparent outline-none text-[11.5px] text-juris-ink-2 placeholder:text-juris-ink-4 w-[160px]"
            />
          </div>
        </form>
      </div>

      {filtered.length === 0 ? (
        <div className="card p-12 text-center">
          <Search size={28} className="text-juris-ink-3 mx-auto mb-3" />
          <h3 className="display text-xl text-juris-navy mb-1.5">Eşleşen üye yok</h3>
          <p className="text-sm text-juris-ink-3">
            {query ? `"${query}" aramasıyla ` : ""}Filtreleri değiştir veya{" "}
            <Link href="/people" className="text-juris-red hover:underline font-semibold">tümünü göster</Link>
          </p>
        </div>
      ) : (
        <>
          {/* Team grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
            {filtered.map((u) => (
              <div
                key={u.id}
                className={cn(
                  "card p-5 flex flex-col gap-3 transition-all hover:shadow-juris-md relative overflow-hidden",
                  !u.active && "opacity-60",
                )}
              >
                <div
                  aria-hidden
                  className="absolute left-0 top-0 bottom-0 w-1"
                  style={{ background: roleColor(u.role) }}
                />
                <div className="flex items-start gap-3 pl-2">
                  <Avatar name={u.name} src={u.image} size={46} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="font-semibold text-juris-navy truncate">
                        {u.title ? `${u.title} ` : ""}{u.name}
                      </span>
                      {!u.active && <span className="chip">Pasif</span>}
                    </div>
                    <div className="text-xs text-juris-ink-3 mt-0.5">
                      {roleLabelTR(u.role)}
                    </div>
                  </div>
                  {u.active && (
                    <Circle
                      size={8}
                      className="text-juris-success fill-juris-success mt-1.5"
                    />
                  )}
                </div>

                <div className="flex flex-col gap-1.5 text-xs text-juris-ink-2 pl-2">
                  <a href={`mailto:${u.email}`} className="flex items-center gap-1.5 min-w-0 hover:text-juris-red">
                    <Mail size={11} className="text-juris-ink-4 flex-shrink-0" />
                    <span className="truncate">{u.email}</span>
                  </a>
                  {u.phone && (
                    <a href={`tel:${u.phone.replace(/\s/g, "")}`} className="flex items-center gap-1.5 hover:text-juris-red">
                      <Phone size={11} className="text-juris-ink-4 flex-shrink-0" />
                      <span className="mono">{u.phone}</span>
                    </a>
                  )}
                </div>

                {/* Workload bar */}
                <div className="pt-3 pl-2 border-t border-juris-line-2">
                  <div className="flex items-center justify-between text-[11px] mb-1.5">
                    <span className="text-juris-ink-3">İş Yükü</span>
                    <span className="mono font-semibold text-juris-navy">
                      {u._count.assignedTasks} açık görev
                    </span>
                  </div>
                  <ProgressThin
                    value={u._count.assignedTasks}
                    max={maxTasks}
                    color={u._count.assignedTasks >= maxTasks * 0.7 ? "#BC2F2C" : "#0A2240"}
                    warn={u._count.assignedTasks >= maxTasks * 0.9}
                  />
                  <div className="grid grid-cols-2 gap-2 mt-3 text-[11px]">
                    <Link
                      href={`/ops?assignee=${encodeURIComponent(u.name)}`}
                      className="hover:bg-juris-paper-2 -mx-1 px-1 py-1 rounded transition-colors group"
                    >
                      <div className="text-juris-ink-4 inline-flex items-center gap-1">
                        <Briefcase size={9} /> Dosya
                      </div>
                      <div className="font-semibold text-juris-navy mono group-hover:text-juris-red">
                        {u._count.assignedMatters || "—"}
                      </div>
                    </Link>
                    <div>
                      <div className="text-juris-ink-4 inline-flex items-center gap-1">
                        <CheckSquare size={9} /> Son Giriş
                      </div>
                      <div className="text-juris-ink-2 text-[11px]">
                        {u.lastLoginAt ? formatDateTR(u.lastLoginAt) : "Hiç"}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Compact list */}
          <div className="card overflow-hidden">
            <div className="px-5 py-3 border-b border-juris-line-2 bg-juris-paper-2">
              <h4 className="label">Tam Liste ({filtered.length})</h4>
            </div>
            <table className="w-full text-sm">
              <thead className="text-juris-ink-3 text-[11px] uppercase tracking-wider">
                <tr className="border-b border-juris-line-2">
                  <th className="text-left px-5 py-3 font-semibold">Üye</th>
                  <th className="text-left px-4 py-3 font-semibold">E-posta</th>
                  <th className="text-left px-4 py-3 font-semibold">Rol</th>
                  <th className="text-right px-4 py-3 font-semibold">Dosya</th>
                  <th className="text-right px-4 py-3 font-semibold">Görev</th>
                  <th className="text-left px-4 py-3 font-semibold">Durum</th>
                  <th className="text-left px-5 py-3 font-semibold">Son Giriş</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((u) => (
                  <tr key={u.id} className="border-t border-juris-line-2 hover:bg-juris-paper-2">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2.5">
                        <Avatar name={u.name} src={u.image} size={28} />
                        <div className="font-medium text-juris-navy">
                          {u.title ? `${u.title} ` : ""}{u.name}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-juris-ink-2 text-xs truncate max-w-[220px]">{u.email}</td>
                    <td className="px-4 py-3 text-xs text-juris-ink-2">
                      <span
                        className="inline-flex items-center gap-1.5"
                      >
                        <span
                          className="w-1.5 h-1.5 rounded-full"
                          style={{ background: roleColor(u.role) }}
                        />
                        {roleLabelTR(u.role)}
                      </span>
                    </td>
                    <td className="px-4 py-3 mono text-right text-juris-navy font-semibold">
                      <Link href={`/ops?assignee=${encodeURIComponent(u.name)}`} className="hover:text-juris-red">
                        {u._count.assignedMatters || "—"}
                      </Link>
                    </td>
                    <td className="px-4 py-3 mono text-right text-juris-navy font-semibold">
                      {u._count.assignedTasks || "—"}
                    </td>
                    <td className="px-4 py-3">
                      {u.active ? (
                        <span className="chip chip-green">Aktif</span>
                      ) : (
                        <span className="chip">Pasif</span>
                      )}
                    </td>
                    <td className="px-5 py-3 text-xs text-juris-ink-3">
                      {u.lastLoginAt ? formatDateTR(u.lastLoginAt) : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}

function roleColor(r: UserRole): string {
  switch (r) {
    case "OWNER":       return "#BC2F2C";
    case "PARTNER":     return "#0A2240";
    case "ASSOCIATE":   return "#1F5AA8";
    case "PARALEGAL":   return "#B4701C";
    case "ADMIN_STAFF": return "#5A6B82";
    default:            return "#8895AB";
  }
}

function FilterChip({
  href, active, label, count, tone,
}: {
  href: string;
  active: boolean;
  label: string;
  count: number;
  tone?: "gray";
}) {
  const activeBg = tone === "gray" ? "#5A6B82" : "#0A2240";
  return (
    <Link
      href={href}
      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-semibold transition-all"
      style={{
        background: active ? activeBg : "white",
        color: active ? "white" : "#5A6B82",
        border: `1px solid ${active ? activeBg : "#E5E9F0"}`,
      }}
    >
      {label}
      <span
        className="inline-flex items-center justify-center min-w-[18px] h-4 rounded-full text-[9.5px] font-bold px-1"
        style={{
          background: active ? "rgba(255,255,255,0.2)" : "#F1F4F8",
          color: active ? "white" : "#5A6B82",
        }}
      >
        {count}
      </span>
    </Link>
  );
}
