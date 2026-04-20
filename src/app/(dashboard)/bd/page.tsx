import Link from "next/link";
import {
  Plus, Calendar, Users, Linkedin, Mail, Building2, ArrowRight,
  CheckCircle2,
} from "lucide-react";
import type { ResourceType, ResourceHeat } from "@prisma/client";
import { startOfDay, endOfDay, addDays, startOfYear, format } from "date-fns";
import { tr } from "date-fns/locale";
import { requireTenant } from "@/lib/tenancy";
import { prisma } from "@/lib/prisma";
import { Kpi } from "@/components/ui/kpi";
import { Avatar } from "@/components/ui/avatar";
import { formatTRY, formatRelativeTR } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { BdSubTabs, ResourceFilterChips } from "./bd-tabs";
import { RelationMap } from "./relation-map";

export const metadata = { title: "İş Geliştirme · Network Yönetimi" };

type TabKey = "kaynaklar" | "kisiler" | "etkinlikler" | "harita";
type FilterKey = "all" | "company" | "partner" | "network";

const TYPE_LABEL: Record<ResourceType, string> = {
  COMPANY: "İLİŞKİLİ ŞİRKET",
  DIRECT_PARTNER: "DİREKT PARTNER",
  NETWORK: "NETWORK / DERNEK",
};

const TYPE_ACCENT: Record<ResourceType, string> = {
  COMPANY: "#0A2240",
  DIRECT_PARTNER: "#BC2F2C",
  NETWORK: "#2B5185",
};

const HEAT_META: Record<ResourceHeat, { label: string; color: string }> = {
  HOT:  { label: "Sıcak", color: "#BC2F2C" },
  WARM: { label: "Ilık",  color: "#B4701C" },
  COLD: { label: "Soğuk", color: "#8895AB" },
};

export default async function BdPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: TabKey; type?: FilterKey }>;
}) {
  const { firmId, name: firmName } = await requireTenant();
  const params = await searchParams;
  const tab: TabKey = params.tab ?? "kaynaklar";
  const filter: FilterKey = params.type ?? "all";

  const now = new Date();
  const ytdStart = startOfYear(now);
  const weekAhead = endOfDay(addDays(startOfDay(now), 30));

  const [
    resources, contacts, events, totalCount,
    companyCount, partnerCount, networkCount,
    ytdLeadCount, upcomingEventCount,
  ] = await Promise.all([
    prisma.resource.findMany({
      where: { firmId },
      orderBy: [{ score: "desc" }, { updatedAt: "desc" }],
      include: {
        _count: { select: { contacts: true } },
        owner: { select: { id: true, name: true } },
      },
    }),
    prisma.resourceContact.findMany({
      where: { firmId },
      orderBy: { lastContactAt: "desc" },
      include: {
        resource: { select: { name: true, type: true } },
      },
    }),
    prisma.resourceEvent.findMany({
      where: { firmId },
      orderBy: { date: "asc" },
      include: { resource: { select: { name: true } } },
    }),
    prisma.resource.count({ where: { firmId } }),
    prisma.resource.count({ where: { firmId, type: "COMPANY" } }),
    prisma.resource.count({ where: { firmId, type: "DIRECT_PARTNER" } }),
    prisma.resource.count({ where: { firmId, type: "NETWORK" } }),
    prisma.lead.count({
      where: { firmId, createdAt: { gte: ytdStart } },
    }),
    prisma.resourceEvent.count({
      where: { firmId, date: { gte: startOfDay(now), lte: weekAhead } },
    }),
  ]);

  const totalRevenue = resources.reduce(
    (s, r) => s + (r.revenueTRY?.toNumber() ?? 0), 0,
  );

  const filtered = resources.filter((r) =>
    filter === "all" ? true :
    filter === "company" ? r.type === "COMPANY" :
    filter === "partner" ? r.type === "DIRECT_PARTNER" :
    r.type === "NETWORK",
  );

  return (
    <div className="px-6 py-8 max-w-[1440px] mx-auto">
      {/* Header */}
      <div className="mb-7 flex items-end justify-between gap-4 flex-wrap">
        <div>
          <div className="text-[11px] uppercase tracking-[0.14em] text-juris-red font-semibold mb-2">
            İş Geliştirme · Network Yönetimi
          </div>
          <h1
            className="display leading-tight"
            style={{
              fontSize: "clamp(28px, 3.4vw, 36px)",
              color: "#0A2240", letterSpacing: "-0.015em",
            }}
          >
            İş kaynaklarınızı{" "}
            <em style={{ fontStyle: "italic", color: "#BC2F2C" }}>ilişki</em>{" "}
            olarak yönetin.
          </h1>
          <p className="text-sm text-juris-ink-3 mt-2 max-w-2xl">
            İlişkili şirketler, direkt partnerler ve networkler — kaynakları besleyin, attributionu takip edin.
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Link href="/bd?tab=etkinlikler" className="btn btn-ghost">
            <Calendar size={14} /> Etkinlikler
          </Link>
          <Link href="/bd?tab=kisiler" className="btn btn-ghost">
            <Users size={14} /> Kişiler
          </Link>
          <Link href="/bd/new" className="btn btn-primary">
            <Plus size={14} /> Kaynak ekle
          </Link>
        </div>
      </div>

      {/* 4 KPI strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-7">
        <Kpi
          label="Toplam Kaynak"
          value={totalCount}
          sub={`${companyCount} şirket · ${partnerCount} partner · ${networkCount} network`}
        />
        <Kpi
          label="Bu Yıl Üretilen Lead"
          value={ytdLeadCount}
          delta="+18%"
          trend="up"
          sub="tüm kaynaklardan"
        />
        <Kpi
          label="Kaynak Kaynaklı Gelir"
          value={formatTRY(totalRevenue, { short: true })}
          delta="+24%"
          trend="up"
          sub={`Q${Math.ceil((now.getMonth() + 1) / 3)} ${now.getFullYear()}`}
          emphasized
        />
        <Kpi
          label="Yaklaşan Etkinlik"
          value={upcomingEventCount}
          sub="30 gün içinde"
        />
      </div>

      {/* Sub-tabs + filter + search on same row */}
      <div className="flex items-center justify-between gap-4 flex-wrap mb-6">
        <BdSubTabs active={tab} />
        {tab === "kaynaklar" && (
          <>
            <ResourceFilterChips
              active={filter}
              counts={{
                all: totalCount,
                company: companyCount,
                partner: partnerCount,
                network: networkCount,
              }}
            />
            <div className="max-w-[260px] min-w-[160px]">
              <input
                type="search"
                placeholder="Ara…"
                className="w-full h-9 px-3 rounded-md border border-juris-line bg-white text-sm
                           focus:border-juris-red focus:ring-[3px] focus:ring-juris-red/10 outline-none"
              />
            </div>
          </>
        )}
      </div>

      {tab === "kaynaklar" && <KaynaklarTab resources={filtered} />}
      {tab === "kisiler" && <KisilerTab contacts={contacts} />}
      {tab === "etkinlikler" && <EtkinliklerTab events={events} />}
      {tab === "harita" && <RelationMap resources={resources} firmName={firmName} />}
    </div>
  );
}

// ============================== KAYNAKLAR ==============================

type ResourceWithExtras = {
  id: string;
  name: string;
  description: string | null;
  type: ResourceType;
  tags: string[];
  heat: ResourceHeat;
  score: number;
  leadCount: number;
  revenueTRY: import("@prisma/client").Prisma.Decimal | null;
  lastContactAt: Date | null;
  owner: { id: string; name: string } | null;
  _count: { contacts: number };
};

function KaynaklarTab({ resources }: { resources: ResourceWithExtras[] }) {
  if (resources.length === 0) {
    return (
      <div className="card p-12 flex flex-col items-center text-center">
        <Building2 size={28} className="text-juris-ink-3 mb-3" />
        <h3 className="display text-xl text-juris-navy mb-1.5">Kaynak yok</h3>
        <p className="text-sm text-juris-ink-3 max-w-md mb-5">
          Network yönetimi için ilk kaynağınızı (şirket / partner / dernek) ekleyerek başlayın.
        </p>
        <Link href="/bd/new" className="btn btn-primary">
          <Plus size={14} /> İlk Kaynağı Ekle
        </Link>
      </div>
    );
  }
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
      {resources.map((r) => (
        <ResourceCard key={r.id} resource={r} />
      ))}
    </div>
  );
}

function ResourceCard({ resource }: { resource: ResourceWithExtras }) {
  const accent = TYPE_ACCENT[resource.type];
  const heat = HEAT_META[resource.heat];
  const revenue = resource.revenueTRY?.toNumber() ?? 0;
  const daysSinceContact = resource.lastContactAt
    ? Math.floor((Date.now() - resource.lastContactAt.getTime()) / 86400000)
    : null;

  return (
    <Link
      href={`/bd/${resource.id}`}
      className="relative bg-white rounded-md border border-juris-line hover:shadow-juris-md transition-all block overflow-hidden"
      style={{ borderLeft: `3px solid ${accent}` }}
    >
      <div className="p-5">
        <div className="flex items-start justify-between mb-2 gap-2">
          <div
            className="text-[10px] uppercase tracking-[0.14em] font-semibold"
            style={{ color: accent }}
          >
            {TYPE_LABEL[resource.type]}
          </div>
          <div className="flex flex-col items-end gap-0.5">
            <div className="flex items-center gap-1 text-[11px]">
              <span className="w-1.5 h-1.5 rounded-full" style={{ background: heat.color }} />
              <span style={{ color: heat.color, fontWeight: 600 }}>{heat.label}</span>
            </div>
            <span className="mono text-[10px] text-juris-ink-4">
              {resource.score}/100
            </span>
          </div>
        </div>

        <h3
          className="text-juris-navy leading-tight"
          style={{
            fontFamily: "'Playfair Display', Georgia, serif",
            fontSize: 22, fontWeight: 500, letterSpacing: "-0.01em",
          }}
        >
          {resource.name}
        </h3>
        {resource.description && (
          <div className="text-xs text-juris-ink-3 mt-1 line-clamp-1">
            {resource.description}
          </div>
        )}

        {resource.tags.length > 0 && (
          <div className="flex gap-1.5 mt-3 flex-wrap">
            {resource.tags.map((t) => (
              <span
                key={t}
                className="text-[10px] px-2 py-[3px] rounded border border-juris-line-2 bg-juris-paper-2 text-juris-ink-3 font-medium"
              >
                {t}
              </span>
            ))}
          </div>
        )}

        <div className="grid grid-cols-3 gap-3 mt-5 pt-3 border-t border-juris-line-2">
          <div>
            <div className="text-[10px] uppercase tracking-wider text-juris-ink-3 font-semibold">Lead</div>
            <div className="mono text-[18px] font-semibold text-juris-navy">{resource.leadCount}</div>
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-wider text-juris-ink-3 font-semibold">Gelir</div>
            <div className="mono text-[18px] font-semibold text-juris-navy">
              {formatTRY(revenue, { short: true })}
            </div>
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-wider text-juris-ink-3 font-semibold">Temas</div>
            <div className="mono text-[18px] font-semibold text-juris-navy">
              {daysSinceContact != null ? `${daysSinceContact}g` : "—"}
            </div>
          </div>
        </div>
      </div>

      <div className="px-5 py-3 bg-juris-paper-2 flex items-center gap-2 border-t border-juris-line-2">
        {resource.owner ? (
          <>
            <Avatar name={resource.owner.name} size={22} />
            <span className="text-[11px]" style={{ color: accent, fontWeight: 600 }}>
              Sorumlu
            </span>
          </>
        ) : (
          <span className="text-[11px] text-juris-ink-4">Sorumlu atanmamış</span>
        )}
        <span className="ml-auto text-[11px] text-juris-ink-3">
          {resource._count.contacts} kişi
        </span>
      </div>
    </Link>
  );
}

// ============================== KİŞİLER ==============================

type ContactWithResource = {
  id: string;
  name: string;
  role: string | null;
  email: string | null;
  linkedinUrl: string | null;
  heat: ResourceHeat;
  lastContactAt: Date | null;
  resource: { name: string; type: ResourceType };
};

function KisilerTab({ contacts }: { contacts: ContactWithResource[] }) {
  if (contacts.length === 0) {
    return (
      <div className="card p-12 text-center">
        <Users size={28} className="text-juris-ink-3 mx-auto mb-3" />
        <h3 className="display text-xl text-juris-navy mb-1.5">Temas kişisi yok</h3>
        <p className="text-sm text-juris-ink-3 max-w-md mx-auto">
          Kaynaklarınızda belirli kişileri takip etmek için kişi ekleyin.
        </p>
      </div>
    );
  }

  return (
    <div className="card overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b border-juris-line-2">
        <div>
          <h3 className="display text-[20px] text-juris-navy leading-tight">
            Temas Kişileri
          </h3>
          <div className="text-xs text-juris-ink-3 mt-1">
            {contacts.length} kişi · {new Set(contacts.map((c) => c.resource.name)).size} kurumdan
          </div>
        </div>
        <button className="btn btn-primary btn-sm">
          <Plus size={12} /> Kişi ekle
        </button>
      </div>
      <table className="w-full text-sm">
        <thead className="bg-juris-paper-2 text-juris-ink-3 text-[10px] uppercase tracking-wider">
          <tr>
            <th className="text-left px-5 py-3 font-semibold">İsim</th>
            <th className="text-left px-4 py-3 font-semibold">Rol · Kurum</th>
            <th className="text-left px-4 py-3 font-semibold w-[140px]">Tip</th>
            <th className="text-left px-4 py-3 font-semibold w-[100px]">Sıcaklık</th>
            <th className="text-left px-4 py-3 font-semibold w-[100px]">Son Temas</th>
            <th className="text-left px-5 py-3 font-semibold w-[100px]">Linkler</th>
          </tr>
        </thead>
        <tbody>
          {contacts.map((c) => {
            const heat = HEAT_META[c.heat];
            return (
              <tr key={c.id} className="border-t border-juris-line-2 hover:bg-juris-paper-2">
                <td className="px-5 py-3">
                  <div className="flex items-center gap-2.5">
                    <Avatar name={c.name} size={26} />
                    <span className="font-medium text-juris-navy">{c.name}</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-xs">
                  <span className="text-juris-red font-semibold">{c.role ?? "—"}</span>
                  <span className="text-juris-ink-3"> · {c.resource.name}</span>
                </td>
                <td className="px-4 py-3">
                  <span
                    className="inline-block text-[10px] font-semibold uppercase tracking-wider px-2 py-1 rounded"
                    style={{
                      color: TYPE_ACCENT[c.resource.type],
                      background: `${TYPE_ACCENT[c.resource.type]}12`,
                    }}
                  >
                    {TYPE_LABEL[c.resource.type]}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span
                    className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full"
                    style={{ background: `${heat.color}14`, color: heat.color }}
                  >
                    {heat.label.toLowerCase()}
                  </span>
                </td>
                <td className="px-4 py-3 mono text-xs text-juris-ink-3">
                  {c.lastContactAt ? formatRelativeTR(c.lastContactAt) : "—"}
                </td>
                <td className="px-5 py-3">
                  <div className="flex gap-1">
                    {c.linkedinUrl && (
                      <a
                        href={c.linkedinUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="w-7 h-7 rounded inline-flex items-center justify-center transition-colors"
                        style={{ background: "#0077B5", color: "white" }}
                        aria-label="LinkedIn"
                      >
                        <Linkedin size={13} />
                      </a>
                    )}
                    {c.email && (
                      <a
                        href={`mailto:${c.email}`}
                        className="w-7 h-7 rounded inline-flex items-center justify-center bg-juris-paper-2 hover:bg-juris-navy-100 text-juris-ink-3 hover:text-juris-navy transition-colors"
                        aria-label="E-posta"
                      >
                        <Mail size={12} />
                      </a>
                    )}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// ============================== ETKİNLİKLER ==============================

type EventWithResource = {
  id: string;
  date: Date;
  eventType: string;
  title: string;
  organizer: string | null;
  attendeeCount: number | null;
  leadCount: number | null;
  leadUserName: string | null;
  calendarSynced: boolean;
  resource: { name: string } | null;
};

function EtkinliklerTab({ events }: { events: EventWithResource[] }) {
  return (
    <>
      <div
        className="rounded-md p-4 mb-5 flex items-center gap-4 relative overflow-hidden flex-wrap"
        style={{
          background: "linear-gradient(90deg, #EBE9F7 0%, #F0EDF8 100%)",
          border: "1px solid #D5D0EC",
        }}
      >
        <div
          className="w-10 h-10 rounded-md flex items-center justify-center flex-shrink-0 text-white font-bold"
          style={{ background: "linear-gradient(135deg, #4285F4, #34A853, #FBBC04, #EA4335)" }}
        >
          G
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-juris-navy text-sm">Google Takvim</span>
            <span
              className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full"
              style={{ background: "rgba(31,122,78,0.14)", color: "#147D5C" }}
            >
              <CheckCircle2 size={10} /> Bağlı
            </span>
          </div>
          <div className="text-xs text-juris-ink-3 mt-0.5 truncate">
            mehmet@juris.av.tr · 2 takvim senkron · etkinlikler otomatik push ediliyor
          </div>
        </div>
        <div className="flex gap-1.5 flex-shrink-0">
          <button className="btn btn-sm btn-ghost">
            <Calendar size={11} /> Takvimleri yönet
          </button>
          <button className="btn btn-sm btn-ghost">Bağlantıyı kes</button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {events.map((e) => {
          const day = format(e.date, "d");
          const mon = format(e.date, "MMM", { locale: tr }).toUpperCase();
          return (
            <div
              key={e.id}
              className="rounded-md overflow-hidden text-white relative"
              style={{ background: "linear-gradient(180deg, #0A2240 0%, #1a3558 100%)" }}
            >
              {e.calendarSynced && (
                <span
                  className="absolute top-3 right-3 text-[9px] font-semibold px-2 py-1 rounded"
                  style={{ background: "rgba(255,255,255,0.1)", color: "#6FBF90" }}
                >
                  G Senkron
                </span>
              )}
              <div className="p-4 pb-3">
                <div
                  className="bg-white rounded inline-block px-2 py-1 text-center"
                  style={{ minWidth: 46 }}
                >
                  <div className="text-[9px] uppercase tracking-wider font-semibold text-juris-red leading-none">
                    {mon}
                  </div>
                  <div
                    className="mt-0.5 leading-none"
                    style={{
                      fontFamily: "'Playfair Display', Georgia, serif",
                      fontSize: 22, fontWeight: 500, color: "#0A2240",
                    }}
                  >
                    {day}
                  </div>
                </div>
              </div>
              <div className="px-4 pb-3">
                <div className="text-[10px] uppercase tracking-[0.14em] font-semibold text-juris-red mb-1">
                  {e.eventType}
                </div>
                <h4
                  style={{
                    fontFamily: "'Playfair Display', Georgia, serif",
                    fontSize: 18, fontWeight: 500, lineHeight: 1.2,
                  }}
                >
                  {e.title}
                </h4>
                <div className="text-[11px] text-white/60 mt-1">
                  {e.organizer ?? e.resource?.name ?? "—"}
                </div>
              </div>
              <div className="grid grid-cols-3 px-4 py-3 border-t border-white/10 gap-2">
                <div>
                  <div className="text-[9px] uppercase tracking-wider text-white/50 font-semibold">Kişi</div>
                  <div className="mono text-[16px] font-semibold">
                    {e.attendeeCount ?? "—"}
                  </div>
                </div>
                <div>
                  <div className="text-[9px] uppercase tracking-wider text-white/50 font-semibold">Lead</div>
                  <div className="mono text-[16px] font-semibold">
                    {e.leadCount ?? "—"}
                  </div>
                </div>
                <div>
                  <div className="text-[9px] uppercase tracking-wider text-white/50 font-semibold">Katılan</div>
                  <div className="text-[13px] font-semibold mt-0.5" style={{ color: "#E07F7C" }}>
                    {e.leadUserName ?? "—"}
                  </div>
                </div>
              </div>
              <div className="flex border-t border-white/10 text-[11px]">
                <button className="flex-1 py-2 flex items-center justify-center gap-1.5 text-white/80 hover:bg-white/5">
                  <Calendar size={11} /> Takvime push
                </button>
                <span className="w-px bg-white/10" />
                <button className="flex-1 py-2 flex items-center justify-center gap-1.5 text-white/80 hover:bg-white/5">
                  <Users size={11} /> Davetli ekle
                </button>
              </div>
            </div>
          );
        })}

        <div
          className={cn(
            "rounded-md flex flex-col items-center justify-center gap-1.5 min-h-[240px] cursor-pointer transition-all",
            "border-2 border-dashed border-juris-line hover:border-juris-red/40 bg-juris-paper-2",
          )}
        >
          <Plus size={18} className="text-juris-ink-3" />
          <div className="text-sm font-semibold text-juris-ink-2">Etkinlik planla</div>
          <div className="text-[10px] text-juris-ink-4 inline-flex items-center gap-1">
            Google Takvim&apos;e otomatik düşer <ArrowRight size={9} />
          </div>
        </div>
      </div>
    </>
  );
}
