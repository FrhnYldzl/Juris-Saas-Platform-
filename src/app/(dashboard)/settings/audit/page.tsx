import Link from "next/link";
import { redirect } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { requireTenant } from "@/lib/tenancy";
import { can } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { SectionHead } from "@/components/ui/section-head";
import { formatDateTimeTR } from "@/lib/utils";

export const metadata = { title: "Audit Log · Ayarlar" };

const PAGE_SIZE = 50;

export default async function AuditLogPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; q?: string }>;
}) {
  const { firmId, role } = await requireTenant();
  if (!can(role, "audit.view")) redirect("/settings");

  const params = await searchParams;
  const page = Math.max(1, parseInt(params.page ?? "1", 10) || 1);
  const q = params.q?.trim() ?? "";

  const where = {
    firmId,
    ...(q ? { action: { contains: q } } : {}),
  };

  const [total, logs] = await Promise.all([
    prisma.auditLog.count({ where }),
    prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: { actor: { select: { name: true, email: true } } },
    }),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="px-6 py-8 max-w-[1200px] mx-auto">
      <Link
        href="/settings"
        className="inline-flex items-center gap-1 text-xs text-juris-ink-3 hover:text-juris-navy mb-4"
      >
        <ChevronLeft size={14} /> Ayarlar
      </Link>

      <SectionHead
        title="Audit Log"
        subtitle={`${total.toLocaleString("tr-TR")} kayıt · KVKK madde 12 denetim izi`}
      />

      <form className="mb-5">
        <input
          type="search"
          name="q"
          defaultValue={q}
          placeholder="Eylem ara (matter.create, invoice.sent, …)"
          className="h-10 px-3 rounded-md border border-juris-line bg-juris-paper text-sm mono w-full max-w-sm
                     focus:border-juris-red focus:bg-white focus:ring-[3px] focus:ring-juris-red/10 outline-none"
        />
      </form>

      {logs.length === 0 ? (
        <div className="card p-10 text-center text-sm text-juris-ink-3">
          Kayıt bulunamadı.
        </div>
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-juris-paper-2 text-juris-ink-3 text-[10px] uppercase tracking-wider">
              <tr>
                <th className="text-left px-4 py-3 font-semibold w-[160px]">Zaman</th>
                <th className="text-left px-4 py-3 font-semibold">Eylem</th>
                <th className="text-left px-4 py-3 font-semibold w-[220px]">Kullanıcı</th>
                <th className="text-left px-4 py-3 font-semibold w-[180px]">Varlık</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <tr key={log.id} className="border-t border-juris-line-2 hover:bg-juris-paper-2">
                  <td className="px-4 py-2.5 text-xs text-juris-ink-3 mono">
                    {formatDateTimeTR(log.createdAt)}
                  </td>
                  <td className="px-4 py-2.5">
                    <span className="mono text-xs font-semibold text-juris-navy">{log.action}</span>
                  </td>
                  <td className="px-4 py-2.5">
                    <div className="text-juris-ink-2">{log.actor?.name ?? "Sistem"}</div>
                    <div className="text-[10px] text-juris-ink-4">{log.actor?.email ?? "—"}</div>
                  </td>
                  <td className="px-4 py-2.5">
                    {log.entityType ? (
                      <div>
                        <span className="chip" style={{ fontSize: 10, height: 18 }}>
                          {log.entityType}
                        </span>
                        {log.entityId && (
                          <div className="text-[10px] text-juris-ink-4 mono mt-1 truncate">
                            {log.entityId}
                          </div>
                        )}
                      </div>
                    ) : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4">
          <div className="text-xs text-juris-ink-3">
            Sayfa {page} / {totalPages}
          </div>
          <div className="flex gap-2">
            <Link
              href={`/settings/audit?${new URLSearchParams({
                ...(q && { q }),
                page: String(Math.max(1, page - 1)),
              })}`}
              aria-disabled={page === 1}
              className={`btn btn-sm btn-ghost ${page === 1 ? "opacity-40 pointer-events-none" : ""}`}
            >
              <ChevronLeft size={12} /> Önceki
            </Link>
            <Link
              href={`/settings/audit?${new URLSearchParams({
                ...(q && { q }),
                page: String(Math.min(totalPages, page + 1)),
              })}`}
              aria-disabled={page === totalPages}
              className={`btn btn-sm btn-ghost ${page === totalPages ? "opacity-40 pointer-events-none" : ""}`}
            >
              Sonraki <ChevronRight size={12} />
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
