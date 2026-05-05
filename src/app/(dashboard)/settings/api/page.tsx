import { redirect } from "next/navigation";
import Link from "next/link";
import {
  Key, Activity, AlertCircle, Clock, ExternalLink, ShieldCheck, Hash,
  CheckCircle2, XCircle, Globe, FileText, BarChart3, Megaphone,
} from "lucide-react";
import { requireTenant } from "@/lib/tenancy";
import { prisma } from "@/lib/prisma";
import { Kpi } from "@/components/ui/kpi";
import { SectionHead } from "@/components/ui/section-head";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { formatRelativeTR, formatDateTR } from "@/lib/utils";
import { CreateKeyButton } from "./create-key-button";
import { RevokeButton } from "./revoke-button";

export const metadata = { title: "API & Anahtarlar · Ayarlar" };

const SCOPE_GROUPS = [
  { domain: "lead",      label: "Lead",      color: "#0A2240" },
  { domain: "content",   label: "Content",   color: "#1F5AA8" },
  { domain: "analytics", label: "Analytics", color: "#1F7A4E" },
  { domain: "campaign",  label: "Campaign",  color: "#B4701C" },
];

const ENDPOINTS: Array<{
  method: "GET" | "POST" | "PATCH";
  path: string;
  scope: string;
  desc: string;
  icon: typeof Globe;
}> = [
  { method: "GET",   path: "/api/paperclip/health",                 scope: "lead:read",      desc: "Auth ping — anahtar geçerli mi?",                icon: ShieldCheck },
  { method: "GET",   path: "/api/paperclip/leads",                  scope: "lead:read",      desc: "Lead listele (stage/source/campaign filtreli)", icon: Hash },
  { method: "POST",  path: "/api/paperclip/leads",                  scope: "lead:write",     desc: "Yeni lead oluştur (S&M kampanyalarından)",      icon: Hash },
  { method: "GET",   path: "/api/paperclip/content/posts",          scope: "content:read",   desc: "İçerik listesi (status/channel filtreli)",      icon: FileText },
  { method: "POST",  path: "/api/paperclip/content/posts",          scope: "content:draft",  desc: "Sadece DRAFT/IDEA — yayım board approval'a gider", icon: FileText },
  { method: "PATCH", path: "/api/paperclip/content/posts/{id}",     scope: "content:draft",  desc: "DRAFT/IDEA düzenle (REVIEW+ kilidi)",          icon: FileText },
  { method: "GET",   path: "/api/paperclip/analytics/leads",        scope: "analytics:read", desc: "MQL stats + funnel + 30-gün trend",            icon: BarChart3 },
  { method: "POST",  path: "/api/paperclip/campaigns",              scope: "campaign:write", desc: "UTM kampanya kaydı + trackingUrl döner",       icon: Megaphone },
  { method: "GET",   path: "/api/paperclip/campaigns",              scope: "campaign:read",  desc: "Kampanya listesi",                              icon: Megaphone },
];

const FORBIDDEN = [
  { domain: "product",   note: "spec / feature / fiyat" },
  { domain: "deploy",    note: "CI/CD, infra" },
  { domain: "support",   note: "müvekkil ticketları" },
  { domain: "contracts", note: "vekâlet, sözleşme" },
  { domain: "auth",      note: "kullanıcı, billing" },
];

export default async function ApiSettingsPage() {
  const { firmId, role } = await requireTenant();
  if (role !== "OWNER" && role !== "PARTNER") {
    redirect("/settings");
  }

  // Pull DB-stored keys + recent paperclip audit logs
  const since24h = new Date(Date.now() - 24 * 3600 * 1000);
  const since7d  = new Date(Date.now() - 7 * 86400 * 1000);

  const [keys, calls24h, errors7d, recent] = await Promise.all([
    prisma.apiKey.findMany({
      where: { firmId },
      orderBy: [{ revokedAt: "asc" }, { createdAt: "desc" }],
    }),
    prisma.auditLog.count({
      where: { firmId, action: { startsWith: "paperclip." }, createdAt: { gte: since24h } },
    }),
    prisma.auditLog.count({
      where: {
        firmId,
        action: { startsWith: "paperclip." },
        createdAt: { gte: since7d },
        diff: { path: ["status"], gte: 400 },
      },
    }).catch(() => 0),
    prisma.auditLog.findMany({
      where: { firmId, action: { startsWith: "paperclip." } },
      orderBy: { createdAt: "desc" },
      take: 12,
      select: {
        id: true, action: true, createdAt: true, diff: true, ip: true,
      },
    }),
  ]);

  const activeKeys  = keys.filter((k) => !k.revokedAt && (!k.expiresAt || k.expiresAt > new Date()));
  const expiredKeys = keys.filter((k) => k.expiresAt && k.expiresAt < new Date() && !k.revokedAt);
  const revokedKeys = keys.filter((k) => k.revokedAt);
  const envKeyConfigured = !!process.env.JURIS_SM_KEY;

  return (
    <div className="px-6 py-8 max-w-[1200px] mx-auto">
      <div className="mb-4">
        <Breadcrumb
          crumbs={[
            { label: "Firma",   href: "/settings" },
            { label: "Ayarlar", href: "/settings" },
            { label: "API & Anahtarlar" },
          ]}
        />
      </div>

      <div className="flex items-end justify-between gap-4 mb-7 flex-wrap">
        <div>
          <h1
            className="leading-tight"
            style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 30, color: "#0A2240" }}
          >
            API & Anahtarlar
          </h1>
          <p className="text-[13px] text-juris-ink-3 mt-1.5 max-w-[640px]">
            Paperclip Sales & Marketing API — dış araçların lead/content/analytics/campaign domainlerine
            erişmesi için scope-bazlı anahtarlar. <Link href="/settings/audit" className="text-juris-red font-semibold hover:underline">Tüm çağrılar audit log&apos;da</Link>.
          </p>
        </div>
        <CreateKeyButton />
      </div>

      {/* KPI strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-7">
        <Kpi label="Aktif Anahtar"     value={activeKeys.length}  sub={`${keys.length} toplam`} emphasized />
        <Kpi label="24sa Çağrı"        value={calls24h}            sub="başarılı + hatalı" />
        <Kpi label="7g Hata"            value={errors7d}            sub="4xx + 5xx" trend={errors7d > 0 ? "down" : undefined} />
        <Kpi label="ENV Anahtar"        value={envKeyConfigured ? "Aktif" : "Yok"} sub={envKeyConfigured ? "JURIS_SM_KEY set" : "fallback yok"} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1.7fr_1fr] gap-5">
        {/* LEFT: Keys + Endpoints + Recent */}
        <div className="flex flex-col gap-5">
          {/* Keys */}
          <div className="card overflow-hidden">
            <div className="px-5 py-3 flex items-center justify-between" style={{ borderBottom: "1px solid #EEF1F5" }}>
              <h4 className="label inline-flex items-center gap-1.5">
                <Key size={11} /> Anahtarlar ({keys.length})
              </h4>
              <span className="text-[10px] text-juris-ink-4">
                {activeKeys.length} aktif · {expiredKeys.length} süresi dolmuş · {revokedKeys.length} iptal
              </span>
            </div>
            {keys.length === 0 ? (
              <div className="p-8 text-center">
                <Key size={24} className="text-juris-ink-3 mx-auto mb-3" />
                <h3
                  className="text-juris-navy mb-1"
                  style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 18 }}
                >
                  Henüz anahtar yok
                </h3>
                <p className="text-[12px] text-juris-ink-3 max-w-[400px] mx-auto leading-relaxed">
                  İlk Paperclip integration anahtarını oluştur. Anahtar tek seferlik gösterilir; sonra DB&apos;de yalnızca SHA-256 hash&apos;i kalır.
                </p>
              </div>
            ) : (
              <table className="w-full text-[12.5px]">
                <thead className="text-juris-ink-3 text-[10px] uppercase tracking-wider">
                  <tr style={{ background: "#FAFBFD" }}>
                    <th className="text-left px-5 py-2.5 font-semibold">İsim</th>
                    <th className="text-left px-3 py-2.5 font-semibold">Önek</th>
                    <th className="text-left px-3 py-2.5 font-semibold">Scope</th>
                    <th className="text-left px-3 py-2.5 font-semibold">Son Kullanım</th>
                    <th className="text-left px-3 py-2.5 font-semibold">Durum</th>
                    <th className="text-right px-5 py-2.5 font-semibold">İşlem</th>
                  </tr>
                </thead>
                <tbody>
                  {keys.map((k) => {
                    const expired = k.expiresAt && k.expiresAt < new Date();
                    const status = k.revokedAt ? "revoked" : expired ? "expired" : "active";
                    return (
                      <tr key={k.id} className="border-t border-juris-line-2 hover:bg-juris-paper-2">
                        <td className="px-5 py-3">
                          <div className="font-semibold text-juris-navy">{k.name}</div>
                          {k.service && (
                            <div className="text-[10px] text-juris-ink-4 mt-0.5">{k.service}</div>
                          )}
                        </td>
                        <td className="px-3 py-3 mono text-[11.5px] text-juris-ink-3">
                          {k.prefix}…
                        </td>
                        <td className="px-3 py-3">
                          <div className="flex flex-wrap gap-1">
                            {k.scopes.slice(0, 3).map((s) => (
                              <span
                                key={s}
                                className="inline-flex items-center px-1.5 py-0.5 rounded text-[9.5px] font-semibold mono"
                                style={{ background: "#F1F4F8", color: "#5A6B82" }}
                              >
                                {s}
                              </span>
                            ))}
                            {k.scopes.length > 3 && (
                              <span className="text-[9.5px] text-juris-ink-4 mono">+{k.scopes.length - 3}</span>
                            )}
                          </div>
                        </td>
                        <td className="px-3 py-3 text-[11px] text-juris-ink-3">
                          {k.lastUsedAt ? (
                            <span title={formatDateTR(k.lastUsedAt)}>
                              {formatRelativeTR(k.lastUsedAt)}
                            </span>
                          ) : (
                            <span className="text-juris-ink-4 italic">hiç kullanılmamış</span>
                          )}
                        </td>
                        <td className="px-3 py-3">
                          <StatusChip status={status} />
                          {k.expiresAt && status === "active" && (
                            <div className="text-[9.5px] text-juris-ink-4 mt-0.5">
                              {formatRelativeTR(k.expiresAt)} sona erer
                            </div>
                          )}
                        </td>
                        <td className="px-5 py-3 text-right">
                          {status === "active" ? (
                            <RevokeButton id={k.id} name={k.name} />
                          ) : (
                            <span className="text-[10px] text-juris-ink-4">—</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>

          {/* Endpoints */}
          <div className="card p-6">
            <SectionHead
              title="Endpoint Kataloğu"
              subtitle="Sadece bu yollar dışarıya açık — diğer her şey 404"
              small
              actions={
                <a
                  href="/api/paperclip/health"
                  target="_blank"
                  rel="noreferrer"
                  className="text-[11px] text-juris-red font-semibold hover:underline inline-flex items-center gap-1"
                >
                  /health <ExternalLink size={10} />
                </a>
              }
            />
            <div className="rounded-md overflow-hidden" style={{ border: "1px solid #E5E9F0" }}>
              {ENDPOINTS.map((e, i) => {
                const Icon = e.icon;
                return (
                  <div
                    key={`${e.method}-${e.path}`}
                    className="px-4 py-3 flex items-center gap-3"
                    style={i !== ENDPOINTS.length - 1 ? { borderBottom: "1px solid #EEF1F5" } : {}}
                  >
                    <span
                      className="inline-flex items-center justify-center w-14 px-2 py-0.5 rounded text-[10px] font-bold mono"
                      style={methodStyle(e.method)}
                    >
                      {e.method}
                    </span>
                    <Icon size={12} className="text-juris-ink-3 shrink-0" />
                    <code className="flex-1 mono text-[12px] text-juris-navy">{e.path}</code>
                    <span
                      className="inline-flex items-center px-2 py-0.5 rounded text-[9.5px] font-semibold mono"
                      style={{ background: "#F1F4F8", color: "#5A6B82" }}
                    >
                      {e.scope}
                    </span>
                  </div>
                );
              })}
            </div>
            <p className="text-[11px] text-juris-ink-4 mt-3 leading-relaxed">
              {ENDPOINTS.length} endpoint · Tüm çağrılar X-API-Key header gerektirir · Constant-time karşılaştırma
              · Her başarılı çağrı audit log&apos;a yazılır.
            </p>
          </div>

          {/* Recent activity */}
          <div className="card p-6">
            <SectionHead
              title="Son Aktivite"
              subtitle="Audit log'dan son 12 paperclip çağrısı"
              small
              actions={
                <Link href="/settings/audit?action=paperclip" className="text-[11px] text-juris-red font-semibold hover:underline">
                  Tümü →
                </Link>
              }
            />
            {recent.length === 0 ? (
              <div className="text-[12px] text-juris-ink-4 italic py-3 text-center">
                Henüz API çağrısı yok.
              </div>
            ) : (
              <ul className="flex flex-col divide-y divide-juris-line-2">
                {recent.map((r) => {
                  const diff = (r.diff ?? {}) as { method?: string; status?: number; key?: string };
                  const isError = (diff.status ?? 0) >= 400;
                  return (
                    <li key={r.id} className="py-2.5 flex items-center gap-3 text-[12px]">
                      <span
                        className="inline-flex items-center justify-center w-12 px-1.5 py-0.5 rounded text-[9.5px] font-bold mono"
                        style={methodStyle((diff.method as "GET" | "POST" | "PATCH") ?? "GET")}
                      >
                        {diff.method ?? "—"}
                      </span>
                      <span className="mono text-[11.5px] text-juris-navy flex-1 truncate">
                        {r.action.replace("paperclip.", "")}
                      </span>
                      {diff.key && (
                        <span className="text-[10px] text-juris-ink-4 mono">{diff.key}</span>
                      )}
                      <span
                        className="inline-flex items-center justify-center min-w-[34px] px-1.5 py-0.5 rounded text-[9.5px] font-bold mono"
                        style={{
                          background: isError ? "rgba(188,47,44,0.1)" : "rgba(31,122,78,0.08)",
                          color: isError ? "#BC2F2C" : "#1F7A4E",
                        }}
                      >
                        {diff.status ?? "—"}
                      </span>
                      <span className="text-[10px] text-juris-ink-4 mono inline-flex items-center gap-1 shrink-0">
                        <Clock size={9} />
                        {formatRelativeTR(r.createdAt)}
                      </span>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>

        {/* RIGHT: scopes + forbidden + curl example + docs */}
        <aside className="flex flex-col gap-5">
          {/* Allowed scopes */}
          <div className="card p-5">
            <h4 className="label mb-3 inline-flex items-center gap-1.5">
              <ShieldCheck size={11} /> İzin Verilen Domainler
            </h4>
            <div className="flex flex-col gap-2">
              {SCOPE_GROUPS.map((g) => (
                <div key={g.domain} className="flex items-center gap-2.5">
                  <div
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{ background: g.color }}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="text-[12.5px] font-semibold text-juris-navy">{g.label}</div>
                    <div className="text-[10.5px] text-juris-ink-3">
                      {g.domain === "lead"      && "CRM lead create / update / list"}
                      {g.domain === "content"   && "Blog post draft (publish board approval'a gider)"}
                      {g.domain === "analytics" && "read-only metrics"}
                      {g.domain === "campaign"  && "UTM campaign create / edit"}
                    </div>
                  </div>
                  <CheckCircle2 size={12} className="text-juris-success shrink-0" />
                </div>
              ))}
            </div>
          </div>

          {/* Forbidden */}
          <div className="card p-5" style={{ borderColor: "#BC2F2C33" }}>
            <h4 className="label mb-3 inline-flex items-center gap-1.5 text-juris-red">
              <XCircle size={11} /> Yasaklı Domainler
            </h4>
            <div className="flex flex-col gap-1.5">
              {FORBIDDEN.map((f) => (
                <div key={f.domain} className="flex items-center gap-2 text-[11.5px]">
                  <XCircle size={11} className="text-juris-red shrink-0" />
                  <span className="font-semibold text-juris-navy mono">{f.domain}</span>
                  <span className="text-juris-ink-4">— {f.note}</span>
                </div>
              ))}
            </div>
            <p className="text-[10.5px] text-juris-ink-3 mt-3 leading-relaxed">
              Bu domainlerde endpoint <strong>yok</strong> — yanlış path 404 döner. Public API yüzeyinde
              ürün/altyapı/destek/sözleşme/auth verisine erişim mümkün değildir.
            </p>
          </div>

          {/* curl example */}
          <div className="card p-5">
            <h4 className="label mb-3">Hızlı Test (curl)</h4>
            <pre
              className="rounded-md p-3 text-[11px] mono overflow-x-auto leading-relaxed"
              style={{ background: "#0A2240", color: "#F4A4A1" }}
            >
{`curl -sS \\
  -H "X-API-Key: $JURIS_SM_KEY" \\
  https://juris.com.tr/api/paperclip/health`}
            </pre>
            <p className="text-[10.5px] text-juris-ink-4 mt-2 leading-relaxed">
              Anahtar geçerliyse 200 + scope listesi döner. Tam dokümantasyon için
              <code className="mono ml-1 px-1 py-0.5 rounded bg-juris-paper-2 text-juris-navy">docs/paperclip.md</code>.
            </p>
          </div>

          {/* Notice */}
          <div
            className="rounded-xl p-4"
            style={{ background: "#FAFBFD", border: "1px solid #EEF1F5" }}
          >
            <div className="text-[10.5px] uppercase tracking-[0.14em] text-juris-ink-3 font-semibold mb-2 inline-flex items-center gap-1.5">
              <Activity size={10} /> Güvenlik Hatırlatması
            </div>
            <ul className="flex flex-col gap-1.5 text-[11.5px] text-juris-ink-2 leading-relaxed">
              <li className="flex gap-2"><span className="text-juris-red shrink-0">•</span>Anahtarı kod tabanına commit etme — env var olarak sakla.</li>
              <li className="flex gap-2"><span className="text-juris-red shrink-0">•</span>90 günlük rotasyon önerilir.</li>
              <li className="flex gap-2"><span className="text-juris-red shrink-0">•</span>Şüpheli aktivitede anında <strong className="text-juris-navy">İptal Et</strong>.</li>
              <li className="flex gap-2"><span className="text-juris-red shrink-0">•</span>Anahtar tek seferlik gösterilir — kayıp halinde yeniden üret.</li>
            </ul>
          </div>
        </aside>
      </div>

      {/* Forbidden warning explainer (issue: shown when user tries to do something forbidden) */}
      {!envKeyConfigured && keys.length === 0 && (
        <div
          className="mt-6 rounded-md p-4 flex items-start gap-3"
          style={{ background: "rgba(180,112,28,0.08)", border: "1px solid rgba(180,112,28,0.3)" }}
        >
          <AlertCircle size={14} className="text-juris-warn shrink-0 mt-0.5" />
          <div>
            <div className="text-[12.5px] font-semibold text-juris-navy">
              Henüz aktif anahtar yok
            </div>
            <div className="text-[11.5px] text-juris-ink-2 mt-1 leading-relaxed">
              Paperclip API çağrıları 401 alır. Üst sağdaki <strong>Yeni API Anahtarı</strong> ile
              ilk anahtarı oluştur veya Railway env&apos;e <code className="mono">JURIS_SM_KEY</code> set et.
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Helpers ───

function methodStyle(method: "GET" | "POST" | "PATCH" | "DELETE"): React.CSSProperties {
  const m: Record<string, { bg: string; color: string }> = {
    GET:    { bg: "rgba(31,122,78,0.1)", color: "#1F7A4E" },
    POST:   { bg: "rgba(10,34,64,0.08)", color: "#0A2240" },
    PATCH:  { bg: "rgba(180,112,28,0.1)", color: "#B4701C" },
    DELETE: { bg: "rgba(188,47,44,0.1)", color: "#BC2F2C" },
  };
  const c = m[method] ?? m.GET;
  return { background: c.bg, color: c.color, letterSpacing: "0.08em" };
}

function StatusChip({ status }: { status: "active" | "expired" | "revoked" }) {
  const config = {
    active:  { bg: "rgba(31,122,78,0.1)", color: "#1F7A4E", label: "Aktif" },
    expired: { bg: "rgba(180,112,28,0.1)", color: "#B4701C", label: "Süresi doldu" },
    revoked: { bg: "rgba(188,47,44,0.1)", color: "#BC2F2C", label: "İptal" },
  }[status];
  return (
    <span
      className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold"
      style={{ background: config.bg, color: config.color }}
    >
      {config.label}
    </span>
  );
}
