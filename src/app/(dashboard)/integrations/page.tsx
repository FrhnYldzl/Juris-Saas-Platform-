import Link from "next/link";
import { Check, Plug, CheckCircle2, AlertTriangle, Clock, Link2Off, Search } from "lucide-react";
import { SectionHead } from "@/components/ui/section-head";
import { Kpi } from "@/components/ui/kpi";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { requireTenant } from "@/lib/tenancy";
import { prisma } from "@/lib/prisma";
import { INTEGRATION_CATALOG } from "@/lib/integrations/catalog";
import { formatRelativeTR } from "@/lib/utils";

export const metadata = { title: "Entegrasyonlar" };

type FilterKey = "all" | "connected" | "pending" | "error" | "disconnected";

export default async function IntegrationsPage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: FilterKey; group?: string }>;
}) {
  const { firmId } = await requireTenant();
  const params = await searchParams;
  const filter: FilterKey = params.filter ?? "all";
  const groupFilter = params.group ?? "all";

  const connected = await prisma.integration.findMany({ where: { firmId } });
  const connectedMap = new Map(connected.map((i) => [i.provider, i]));

  const counts = {
    total: INTEGRATION_CATALOG.length,
    connected: connected.filter((i) => i.status === "CONNECTED").length,
    pending:   connected.filter((i) => i.status === "PENDING").length,
    errored:   connected.filter((i) => i.status === "ERROR").length,
  };
  const notConnected = INTEGRATION_CATALOG.length - connected.length;

  const groups = ["legal", "finance", "marketing", "productivity", "crm"] as const;
  const groupLabels: Record<string, string> = {
    legal: "Hukuk",
    finance: "Finans & Bankacılık",
    marketing: "Pazarlama & Analitik",
    productivity: "Verimlilik",
    crm: "Satış & CRM",
  };

  // Apply filters
  const filtered = INTEGRATION_CATALOG.filter((it) => {
    if (groupFilter !== "all" && it.group !== groupFilter) return false;
    const state = connectedMap.get(it.provider);
    const status = state?.status ?? "DISCONNECTED";
    if (filter === "connected")    return status === "CONNECTED";
    if (filter === "pending")      return status === "PENDING";
    if (filter === "error")        return status === "ERROR";
    if (filter === "disconnected") return status === "DISCONNECTED";
    return true;
  });

  const byGroup = Object.fromEntries(
    groups.map((g) => [g, filtered.filter((it) => it.group === g)]),
  );

  const groupCounts = Object.fromEntries(
    groups.map((g) => [g, INTEGRATION_CATALOG.filter((it) => it.group === g).length]),
  );

  const qs = (f: FilterKey, g: string = groupFilter) => {
    const s = new URLSearchParams();
    if (f !== "all") s.set("filter", f);
    if (g !== "all") s.set("group", g);
    return s.toString() ? `?${s}` : "";
  };

  const qsGroup = (g: string) => qs(filter, g);

  return (
    <div className="px-6 py-8 max-w-[1400px] mx-auto">
      <div className="mb-4">
        <Breadcrumb
          crumbs={[
            { label: "Firma", href: "/settings" },
            { label: "Entegrasyonlar" },
          ]}
        />
      </div>

      <SectionHead
        title="Entegrasyonlar"
        subtitle="Firmanıza veri akışı — resmi sistemler, bulut araçlar ve bankalar"
      />

      {/* KPI strip */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-7">
        <Kpi
          href={`/integrations${qs("connected")}`}
          label="Bağlı"
          value={counts.connected}
          sub={`${INTEGRATION_CATALOG.length} toplam`}
          emphasized
        />
        <Kpi
          href={`/integrations${qs("pending")}`}
          label="Bekliyor"
          value={counts.pending}
          sub="yetkilendirme"
        />
        <Kpi
          href={`/integrations${qs("error")}`}
          label="Hata"
          value={counts.errored}
          sub={counts.errored > 0 ? "incele" : "sorun yok"}
          trend={counts.errored > 0 ? "down" : undefined}
        />
        <Kpi
          href={`/integrations${qs("disconnected")}`}
          label="Bağlanmamış"
          value={notConnected}
          sub="kurulum bekliyor"
        />
        <Kpi
          label="Bu Ay Senkron"
          value={connected.filter((i) => i.lastSyncAt && i.lastSyncAt > new Date(Date.now() - 30 * 86400000)).length}
          sub="son 30 gün"
        />
      </div>

      {/* Filter bar */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <div className="flex items-center gap-1.5">
          <StatusChip href={`/integrations${qs("all")}`}          active={filter === "all"}          label="Tümü"         count={INTEGRATION_CATALOG.length} />
          <StatusChip href={`/integrations${qs("connected")}`}    active={filter === "connected"}    label="Bağlı"        count={counts.connected} tone="green" />
          <StatusChip href={`/integrations${qs("pending")}`}      active={filter === "pending"}      label="Bekliyor"     count={counts.pending}   tone="amber" />
          <StatusChip href={`/integrations${qs("error")}`}        active={filter === "error"}        label="Hata"         count={counts.errored}   tone="red" />
          <StatusChip href={`/integrations${qs("disconnected")}`} active={filter === "disconnected"} label="Bağlanmamış"  count={notConnected} />
        </div>
        <div className="flex-1" />
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-[11px] text-juris-ink-3 font-semibold mr-1">Kategori:</span>
          <GroupChip href={`/integrations${qsGroup("all")}`} active={groupFilter === "all"} label="Tümü" />
          {groups.map((g) => (
            <GroupChip
              key={g}
              href={`/integrations${qsGroup(g)}`}
              active={groupFilter === g}
              label={groupLabels[g]}
              count={groupCounts[g] as number}
            />
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="card p-12 text-center">
          <Search size={28} className="text-juris-ink-3 mx-auto mb-3" />
          <h3 className="display text-xl text-juris-navy mb-1.5">Eşleşen entegrasyon yok</h3>
          <p className="text-sm text-juris-ink-3">
            Filtreleri değiştir veya{" "}
            <Link href="/integrations" className="text-juris-red hover:underline font-semibold">tümünü göster</Link>
          </p>
        </div>
      ) : (
        <>
          {groups.map((g) => {
            const items = byGroup[g] ?? [];
            if (items.length === 0) return null;
            return (
              <section key={g} className="mb-9">
                <div className="flex items-baseline justify-between mb-3">
                  <h4 className="label">{groupLabels[g]}</h4>
                  <span className="text-[11px] text-juris-ink-4 mono">
                    {items.length} / {groupCounts[g]}
                  </span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {items.map((it) => {
                    const state = connectedMap.get(it.provider);
                    const status = state?.status ?? "DISCONNECTED";
                    return <IntegrationCard
                      key={it.provider}
                      name={it.name}
                      provider={it.provider}
                      description={it.description}
                      emoji={it.emoji}
                      authType={it.authType}
                      status={status}
                      lastSyncAt={state?.lastSyncAt ?? null}
                      lastError={state?.lastError ?? null}
                    />;
                  })}
                </div>
              </section>
            );
          })}
        </>
      )}

      {/* Footer hint */}
      <div
        className="mt-6 rounded-xl p-4 flex items-start gap-3"
        style={{ background: "#FAFBFD", border: "1px solid #EEF1F5" }}
      >
        <Plug size={14} className="text-juris-ink-3 shrink-0 mt-0.5" />
        <p className="text-[12px] text-juris-ink-2 leading-relaxed">
          OAuth2 entegrasyonlar tek tıklama ile bağlanır. API-key ve sertifika tabanlı entegrasyonlar için
          avukatınız gerekli bilgileri <Link href="/settings" className="text-juris-red font-semibold hover:underline">Ayarlar → Kimlik Bilgileri</Link> üzerinden yükleyebilir.
        </p>
      </div>
    </div>
  );
}

// ─────────────── Components ───────────────

function IntegrationCard({
  name, provider, description, emoji, authType, status, lastSyncAt, lastError,
}: {
  name: string;
  provider: string;
  description: string;
  emoji?: string;
  authType: string;
  status: "CONNECTED" | "PENDING" | "ERROR" | "DISCONNECTED" | string;
  lastSyncAt: Date | null;
  lastError: string | null;
}) {
  const statusConfig = {
    CONNECTED:    { tone: "#1F7A4E", label: "Bağlı",       icon: <CheckCircle2 size={10} />, chip: "chip-green" },
    PENDING:      { tone: "#B4701C", label: "Bekliyor",    icon: <Clock size={10} />,         chip: "chip-amber" },
    ERROR:        { tone: "#BC2F2C", label: "Hata",        icon: <AlertTriangle size={10} />, chip: "chip-red" },
    DISCONNECTED: { tone: "#8895AB", label: "Bağlanmamış", icon: <Link2Off size={10} />,      chip: "" },
  }[status] ?? { tone: "#8895AB", label: "Bilinmiyor", icon: <Link2Off size={10} />, chip: "" };

  const authBadge =
    authType === "oauth2"      ? "OAuth"        :
    authType === "api_key"     ? "API key"      :
    authType === "cert"        ? "Sertifika"    :
    authType === "credentials" ? "Kullanıcı adı" : authType;

  return (
    <div
      className="card p-4 flex flex-col gap-3 transition-all hover:shadow-juris-md relative overflow-hidden"
    >
      {status === "CONNECTED" && (
        <div
          aria-hidden
          className="absolute left-0 top-0 bottom-0 w-1"
          style={{ background: statusConfig.tone }}
        />
      )}
      <div className="flex items-start gap-3">
        <div
          className="w-10 h-10 rounded-md flex items-center justify-center text-lg flex-shrink-0"
          style={{ background: "#F1F4F8" }}
        >
          {emoji ?? <Plug size={18} />}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <div className="font-semibold text-juris-navy text-sm">{name}</div>
            <span className={`chip ${statusConfig.chip}`}>
              {statusConfig.icon} {statusConfig.label}
            </span>
          </div>
          <div className="text-xs text-juris-ink-3 mt-1 leading-relaxed">
            {description}
          </div>
        </div>
      </div>

      {/* Meta row */}
      <div className="flex items-center gap-3 text-[10.5px] text-juris-ink-4 flex-wrap">
        <span className="mono uppercase tracking-wider">{authBadge}</span>
        {lastSyncAt && (
          <span className="inline-flex items-center gap-1">
            <Clock size={9} />
            {formatRelativeTR(lastSyncAt)}
          </span>
        )}
        {lastError && status === "ERROR" && (
          <span className="text-juris-red font-medium truncate max-w-[220px]" title={lastError}>
            ! {lastError.slice(0, 60)}
          </span>
        )}
      </div>

      <div className="flex gap-2 pt-2" style={{ borderTop: "1px solid #EEF1F5" }}>
        <button
          type="button"
          className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-md text-[11.5px] font-semibold transition-colors"
          style={{
            background: status === "CONNECTED" ? "white" : "#0A2240",
            color: status === "CONNECTED" ? "#0A2240" : "white",
            border: status === "CONNECTED" ? "1px solid #E5E9F0" : "1px solid #0A2240",
          }}
          disabled
          title="v0.9.x'de gerçek OAuth akışı"
        >
          {status === "CONNECTED" ? "Yönet" : status === "PENDING" ? "Tamamla" : "Bağla"}
        </button>
        {status === "CONNECTED" && (
          <button
            type="button"
            className="inline-flex items-center justify-center px-3 py-1.5 rounded-md text-[11.5px] text-juris-ink-3 hover:text-juris-red transition-colors"
            style={{ border: "1px solid #E5E9F0" }}
            disabled
            title="v0.9.x'de gerçek senkron"
          >
            <Check size={11} />
          </button>
        )}
      </div>
      {provider && null}
    </div>
  );
}

function StatusChip({
  href, active, label, count, tone,
}: {
  href: string;
  active: boolean;
  label: string;
  count: number;
  tone?: "green" | "amber" | "red";
}) {
  const activeBg =
    tone === "green" ? "#1F7A4E" :
    tone === "amber" ? "#B4701C" :
    tone === "red"   ? "#BC2F2C" :
                       "#0A2240";
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

function GroupChip({
  href, active, label, count,
}: {
  href: string;
  active: boolean;
  label: string;
  count?: number;
}) {
  return (
    <Link
      href={href}
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10.5px] font-semibold transition-all"
      style={{
        background: active ? "#0A2240" : "transparent",
        color: active ? "white" : "#5A6B82",
        border: `1px solid ${active ? "#0A2240" : "#E5E9F0"}`,
      }}
    >
      {label}
      {count !== undefined && <span className="opacity-70">{count}</span>}
    </Link>
  );
}
