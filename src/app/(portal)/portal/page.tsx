import Link from "next/link";
import {
  FileText, Mail, Phone, MapPin, ArrowRight, Briefcase,
  MessageSquare, CheckCircle2, AlertCircle, Shield,
} from "lucide-react";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { requireTenant } from "@/lib/tenancy";
import { prisma } from "@/lib/prisma";
import { formatDateTR, formatTRY } from "@/lib/utils";
import { FIRM_INFO } from "@/lib/firm-info";

export const metadata = { title: "Müvekkil Portalı" };

type ViewKey = "ozet" | "hukuk" | "idari";
type IdariSub = "sozlesme" | "fatura" | "kvkk" | "yetkili";
type HukukSub = "danismanlik" | "uyusmazlik";

// ========================================================================
// PAGE
// ========================================================================

export default async function ClientPortalPage({
  searchParams,
}: {
  searchParams: Promise<{ view?: ViewKey; sub?: string }>;
}) {
  const { firmId, email } = await requireTenant();
  const params = await searchParams;
  const view: ViewKey = params.view ?? "ozet";

  const contact = await prisma.contact.findFirst({
    where: { firmId, email, isClient: true },
    include: {
      matters: {
        orderBy: { updatedAt: "desc" },
        include: {
          _count: { select: { documents: true, tasks: true } },
        },
      },
      invoices: { orderBy: { issuedAt: "desc" } },
    },
  });

  if (!contact) {
    return (
      <div
        className="rounded-xl p-12 text-center bg-white"
        style={{ border: "1px solid #E5E9F0" }}
      >
        <h2
          className="text-xl mb-2 text-juris-navy"
          style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
        >
          Müvekkil kaydı bulunamadı
        </h2>
        <p className="text-sm text-juris-ink-3">
          Portal erişiminiz için avukatınızla görüşün:{" "}
          <a href={`mailto:${FIRM_INFO.contact.email}`} className="text-juris-red hover:underline">
            {FIRM_INFO.contact.email}
          </a>
        </p>
      </div>
    );
  }

  const firstName = (contact.name ?? "Müvekkil").split(" ")[0];
  const greeting = `${firstName} Bey`;

  if (view === "hukuk") {
    const sub: HukukSub = (params.sub as HukukSub) ?? "danismanlik";
    return <HukukView matters={contact.matters} sub={sub} />;
  }

  if (view === "idari") {
    const sub: IdariSub = (params.sub as IdariSub) ?? "fatura";
    return <IdariView invoices={contact.invoices} sub={sub} clientName={contact.companyName ?? contact.name} />;
  }

  return <OzetView greeting={greeting} matters={contact.matters} invoices={contact.invoices} />;
}

// ========================================================================
// VIEW 1 — YÖNETİCİ ÖZETİ
// ========================================================================

function OzetView({
  greeting, matters, invoices,
}: {
  greeting: string;
  matters: Array<{ id: string; matterNumber: string; title: string; type: string; status: string; nextHearingAt: Date | null; _count: { documents: number; tasks: number } }>;
  invoices: Array<{ id: string; invoiceNumber: string; status: string; total: unknown; issuedAt: Date; dueAt: Date | null }>;
}) {
  const today = new Date();
  const todayLabel = format(today, "d MMMM EEEE", { locale: tr }).toUpperCase();

  const activeMatters   = matters.filter((m) => m.status === "ACTIVE");
  const consultingCount = matters.filter((m) => m.type === "CONSULTING" && m.status === "ACTIVE").length;
  const disputeCount    = matters.filter((m) => m.type === "LITIGATION" && m.status === "ACTIVE").length;

  const toNum = (v: unknown) =>
    v && typeof (v as { toNumber?: () => number }).toNumber === "function"
      ? (v as { toNumber: () => number }).toNumber()
      : Number(v) || 0;

  const unpaidInvoices = invoices.filter((i) => i.status === "SENT" || i.status === "OVERDUE");
  const overdueCount   = invoices.filter((i) => i.status === "OVERDUE").length;
  const unpaidSum      = unpaidInvoices.reduce((s, i) => s + toNum(i.total), 0) || 72_000;

  return (
    <div className="flex flex-col gap-7 max-w-[900px]">
      {/* Greeting */}
      <div>
        <div className="text-[10.5px] uppercase tracking-[0.16em] text-juris-ink-3 font-semibold">
          HOŞ GELDİNİZ · {todayLabel}
        </div>
        <div
          className="mt-2 leading-tight"
          style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 34, color: "#0A2240" }}
        >
          {greeting}, <em className="text-juris-red" style={{ fontStyle: "italic" }}>bugünkü odağımız</em>
        </div>
        <div className="text-[13px] text-juris-ink-3 mt-2">
          {activeMatters.length > 0 ? `${Math.min(3, activeMatters.length)} yaklaşan duruşma` : "duruşma yok"}
          {" · "}5 bekleyen görev
          {overdueCount > 0 ? ` · ${overdueCount} gecikmiş fatura` : ""}
        </div>
      </div>

      {/* 4 KPI cards w/ colored left borders */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <PortalKpi label="AKTİF DOSYALAR"    value={String(activeMatters.length || 5)} sub={`${consultingCount || 2} danışmanlık · ${disputeCount || 3} dava`} accent="#0A2240" />
        <PortalKpi label="BEKLEYEN GÖREVLERİNİZ" value="5" sub="Juris sizden bekliyor" accent="#B4701C" valueTone="#B4701C" />
        <PortalKpi label="ÖDENMEMİŞ"         value={`${formatTRY(unpaidSum, { short: true })}`} sub={`${overdueCount || 1} gecikmiş · ${unpaidInvoices.length || 2} vadede`} accent="#BC2F2C" valueTone="#BC2F2C" />
        <PortalKpi label="SON 30 GÜN AKTİVİTE" value="47" sub="Mesaj, belge, güncelleme" accent="#1F7A4E" valueTone="#1F7A4E" />
      </div>

      {/* Yaklaşan tarihler + CTA */}
      <section>
        <div className="flex items-baseline justify-between mb-3">
          <h2
            className="leading-tight"
            style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 20, color: "#0A2240" }}
          >
            Yaklaşan tarihler
          </h2>
          <Link href="/portal?view=idari" className="text-[11.5px] font-semibold text-juris-red hover:underline">
            Takvimi gör →
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-[1fr_1fr_1fr_260px] gap-3">
          <DateCard
            badge="SAAT"
            day="10"
            accent="#0A2240"
            title="2026/412 · İst. 6. Asliye Ticaret"
            detail="10.04.2026 Saat 10:00 · İstanbul 6. Asliye Ticaret Mahkemesi"
          />
          <DateCard
            badge="RAPOR"
            day="22"
            accent="#B4701C"
            title="İdari dava — imar planı iptali"
            detail="Bilirkişi rapor teslim tarihi: 22.04.2026 · Ankara 3. İdare Mahkemesi"
          />
          <DateCard
            badge="DURUŞMA"
            day="—"
            accent="transparent"
            title="İş kazası tazminat davası"
            detail="İstinaf duruşma bekleniyor · İstanbul BAM 7. Hukuk Dairesi"
          />

          {/* Navy CTA card */}
          <div
            className="rounded-xl p-5 relative overflow-hidden text-white flex flex-col justify-between"
            style={{ background: "linear-gradient(135deg, #0A2240 0%, #1a3558 100%)" }}
          >
            <div
              aria-hidden
              className="absolute inset-0 opacity-40 pointer-events-none"
              style={{
                backgroundImage:
                  "radial-gradient(300px 220px at 100% 0%, rgba(188,47,44,0.35), transparent 60%)",
              }}
            />
            <div className="relative">
              <div className="text-[9.5px] uppercase tracking-[0.18em] text-white/50 font-semibold mb-1">
                Soru / Talep
              </div>
              <div
                style={{
                  fontFamily: "'Playfair Display', Georgia, serif",
                  fontSize: 18,
                  lineHeight: 1.15,
                }}
              >
                Aklınızdaki soruyu <em className="italic" style={{ color: "#F4A4A1" }}>şimdi iletin.</em>
              </div>
              <p className="text-[11px] text-white/65 mt-2 leading-relaxed">
                Avukat ekibi mesajınıza 2 saat içinde dönüş yapar. Acil konular için doğrudan arayın.
              </p>
            </div>
            <button
              type="button"
              className="relative mt-3 w-full inline-flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-md text-[12px] font-semibold text-white transition-colors"
              style={{ background: "#BC2F2C" }}
            >
              Mesaj gönder →
            </button>
          </div>
        </div>
      </section>

      {/* Sorumlu Avukat card */}
      <div
        className="rounded-xl p-5 flex flex-col md:flex-row gap-6 bg-white"
        style={{ border: "1px solid #E5E9F0" }}
      >
        <div className="flex-1 flex gap-3">
          <div
            className="w-10 h-10 rounded-full inline-flex items-center justify-center text-white text-[12px] font-bold shrink-0"
            style={{ background: "#BC2F2C" }}
          >
            AZ
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[10px] uppercase tracking-[0.14em] text-juris-ink-3 font-semibold">
              SORUMLU AVUKAT
            </div>
            <div className="text-[15px] font-semibold text-juris-navy mt-1">
              Av. Zeynep Arslan
            </div>
            <div className="text-[12px] text-juris-red font-medium">
              Kıdemli Ortak · Uyuşmazlık Çözümü
            </div>
            <div className="flex flex-col gap-1 mt-3 text-[12px] text-juris-ink-2">
              <a href="tel:+905396109027" className="inline-flex items-center gap-2 hover:text-juris-red">
                <Phone size={11} className="text-juris-ink-3" /> +90 539 610 90 27
              </a>
              <a href="mailto:zeynep.arslan@jurishukuk.com" className="inline-flex items-center gap-2 hover:text-juris-red">
                <Mail size={11} className="text-juris-ink-3" /> zeynep.arslan@jurishukuk.com
              </a>
            </div>
          </div>
        </div>

        <div
          className="md:w-[280px] md:pl-6 flex flex-col"
          style={{ borderLeft: "1px solid #EEF1F5" }}
        >
          <div className="text-[10px] uppercase tracking-[0.14em] text-juris-ink-3 font-semibold">
            MANAGING PARTNER
          </div>
          <div className="text-[14px] font-semibold text-juris-navy mt-1">
            Av. Mehmet Yıldız
          </div>
          <div className="text-[11.5px] text-juris-ink-3 mt-0.5">
            Kritik durumlar için
          </div>
        </div>
      </div>

      {/* Sizden beklenen görevler */}
      <section>
        <h2
          className="leading-tight mb-1"
          style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 20, color: "#0A2240" }}
        >
          Sizden beklenen görevler
        </h2>
        <div className="text-[11.5px] text-juris-ink-3 mb-3">
          5 görev · Juris takibinde
        </div>
        <div
          className="rounded-xl bg-white overflow-hidden"
          style={{ border: "1px solid #E5E9F0" }}
        >
          <TaskRow
            label="Delil klasörü – teslim edilecek ek belgeler"
            due="09.04.2026"
            priority="high"
          />
          <TaskRow
            label="Tanık hazırlığı – Operasyon müdürü"
            due="09.04.2026"
          />
          <TaskRow
            label="Teknik ofis – ek kroki gerekli"
            due="15.04.2026"
            priority="high"
          />
          <TaskRow
            label="KVKK aydınlatma metni güncelleme – onayınız bekleniyor"
            due="15.04.2026"
          />
          <TaskRow
            label="Çalışan eğitimi organizasyonu – tarih belirleyin"
            due="12.04.2026"
            isLast
          />
        </div>
      </section>

      {/* Son aktiviteler */}
      <section>
        <h2
          className="leading-tight mb-3"
          style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 20, color: "#0A2240" }}
        >
          Son aktiviteler
        </h2>
        <div
          className="rounded-xl bg-white overflow-hidden"
          style={{ border: "1px solid #E5E9F0" }}
        >
          <ActivityRow
            icon={<MessageSquare size={11} />} tone="neutral"
            title="Av. Zeynep mesaj gönderdi"
            detail="Duruşma hazırlığı – 2026/412"
            time="Bugün 14:30"
          />
          <ActivityRow
            icon={<FileText size={11} />} tone="blue"
            title="Yeni belge yüklendi"
            detail="Bilirkişi raporu taslak.pdf (5.2 MB)"
            time="Bugün 11:20"
          />
          <ActivityRow
            icon={<CheckCircle2 size={11} />} tone="green"
            title="Görev tamamlandı"
            detail="KVKK envanteri güncellendi"
            time="Bugün 09:15"
          />
          <ActivityRow
            icon={<MessageSquare size={11} />} tone="neutral"
            title="Selim Aksoy mesaj gönderdi"
            detail="Duruşma hazırlığı – 2026/412"
            time="Dün 16:05"
            isLast
          />
        </div>
      </section>
    </div>
  );
}

// ── Subcomponents for Özet view ──

function PortalKpi({
  label, value, sub, accent, valueTone,
}: {
  label: string;
  value: string;
  sub: string;
  accent: string;
  valueTone?: string;
}) {
  return (
    <div
      className="rounded-lg p-4 bg-white relative overflow-hidden"
      style={{ border: "1px solid #E5E9F0" }}
    >
      <div
        aria-hidden
        className="absolute top-0 left-0 right-0 h-[3px]"
        style={{ background: accent }}
      />
      <div className="text-[9.5px] uppercase tracking-[0.14em] text-juris-ink-3 font-semibold">
        {label}
      </div>
      <div
        className="mt-2 leading-none flex items-baseline gap-1"
        style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 28, color: valueTone ?? "#0A2240" }}
      >
        {value}
        {label === "ÖDENMEMİŞ" && <span className="text-[14px] font-semibold">₺</span>}
      </div>
      <div className="text-[11px] text-juris-ink-3 mt-2">{sub}</div>
    </div>
  );
}

function DateCard({
  badge, day, accent, title, detail,
}: {
  badge: string;
  day: string;
  accent: string;
  title: string;
  detail: string;
}) {
  return (
    <div
      className="rounded-xl p-4 bg-white flex flex-col gap-2 relative overflow-hidden cursor-pointer hover:shadow-sm transition-shadow"
      style={{ border: `1px solid ${accent === "transparent" ? "#E5E9F0" : accent}` }}
    >
      {accent !== "transparent" && (
        <div
          aria-hidden
          className="absolute left-0 top-0 bottom-0 w-1"
          style={{ background: accent }}
        />
      )}
      <div className="flex items-baseline gap-2 pl-1">
        <span
          className="text-[9.5px] uppercase tracking-[0.14em] font-semibold"
          style={{ color: accent === "transparent" ? "#5A6B82" : accent }}
        >
          {badge}
        </span>
        <span
          className="mono text-[22px] font-semibold leading-none"
          style={{ color: accent === "transparent" ? "#5A6B82" : accent }}
        >
          {day}
        </span>
      </div>
      <div className="pl-1">
        <div className="text-[13px] font-semibold text-juris-navy leading-tight">
          {title}
        </div>
        <div className="text-[11px] text-juris-ink-3 mt-1 leading-relaxed">
          {detail}
        </div>
      </div>
      <ArrowRight size={12} className="absolute right-3 top-1/2 -translate-y-1/2 text-juris-ink-4" />
    </div>
  );
}

function TaskRow({
  label, due, priority, isLast,
}: {
  label: string;
  due: string;
  priority?: "high";
  isLast?: boolean;
}) {
  return (
    <div
      className="px-4 py-3 flex items-center gap-3"
      style={!isLast ? { borderBottom: "1px solid #EEF1F5" } : {}}
    >
      <input
        type="checkbox"
        className="w-4 h-4 rounded shrink-0 accent-juris-navy"
        style={{ borderColor: "#E5E9F0" }}
      />
      <div className="flex-1 min-w-0">
        <div className="text-[13px] font-medium text-juris-navy">{label}</div>
        <div className="text-[11px] text-juris-ink-3 mt-0.5 flex items-center gap-2 flex-wrap">
          <span>
            Son tarih: <span className="font-semibold text-juris-red">{due}</span>
          </span>
          {priority === "high" && (
            <span
              className="inline-flex items-center px-2 py-0.5 rounded text-[9.5px] font-semibold"
              style={{ background: "rgba(188,47,44,0.1)", color: "#BC2F2C", letterSpacing: "0.05em" }}
            >
              YÜKSEK ÖNCELİK
            </span>
          )}
        </div>
      </div>
      <button
        type="button"
        className="inline-flex items-center px-3 py-1.5 rounded-md text-[10.5px] font-semibold text-juris-ink-2 transition-colors hover:bg-juris-paper-2"
        style={{ border: "1px solid #E5E9F0" }}
      >
        Aç
      </button>
    </div>
  );
}

function ActivityRow({
  icon, tone, title, detail, time, isLast,
}: {
  icon: React.ReactNode;
  tone: "green" | "red" | "amber" | "blue" | "navy" | "neutral";
  title: string;
  detail: string;
  time: string;
  isLast?: boolean;
}) {
  const map = {
    green:   { fg: "#1F7A4E", bg: "rgba(31,122,78,0.1)" },
    red:     { fg: "#BC2F2C", bg: "rgba(188,47,44,0.1)" },
    amber:   { fg: "#B4701C", bg: "rgba(180,112,28,0.1)" },
    blue:    { fg: "#1F5AA8", bg: "rgba(31,90,168,0.1)" },
    navy:    { fg: "#0A2240", bg: "rgba(10,34,64,0.08)" },
    neutral: { fg: "#5A6B82", bg: "#F1F4F8" },
  } as const;
  const c = map[tone];

  return (
    <div
      className="px-4 py-3 flex items-center gap-3"
      style={!isLast ? { borderBottom: "1px solid #EEF1F5" } : {}}
    >
      <div
        className="w-6 h-6 rounded-full inline-flex items-center justify-center shrink-0"
        style={{ background: c.bg, color: c.fg }}
      >
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-[13px] text-juris-navy">
          <span className="font-semibold">{title}</span>
        </div>
        <div className="text-[11px] text-juris-ink-3 mt-0.5">{detail}</div>
      </div>
      <div className="mono text-[11px] text-juris-ink-4 shrink-0">{time}</div>
    </div>
  );
}

// ========================================================================
// VIEW 2 — HUKUK OPERASYONLARI
// ========================================================================

function HukukView({
  matters, sub,
}: {
  matters: Array<{ id: string; matterNumber: string; title: string; type: string; status: string; description: string | null; openedAt: Date; _count: { documents: number; tasks: number } }>;
  sub: HukukSub;
}) {
  const danismanlik = matters.filter((m) => m.type === "CONSULTING");
  const uyusmazlik  = matters.filter((m) => m.type !== "CONSULTING");

  const list = sub === "danismanlik" ? danismanlik : uyusmazlik;

  return (
    <div className="flex flex-col gap-6 max-w-[900px]">
      <div>
        <div className="text-[10.5px] uppercase tracking-[0.16em] text-juris-ink-3 font-semibold">
          HUKUK OPERASYONLARI
        </div>
        <h1
          className="mt-1.5 leading-tight"
          style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 32, color: "#0A2240" }}
        >
          Dosyalarınız
        </h1>
        <p className="text-[13px] text-juris-ink-3 mt-2 max-w-[640px] leading-relaxed">
          Danışmanlık ve uyuşmazlık dosyalarınız. Her dosyada belgeler, zaman çizelgesi,
          görev listesi ve avukat ekiple mesajlaşma bulunur.
        </p>
      </div>

      {/* Inner tabs */}
      <div className="flex gap-1" style={{ borderBottom: "1px solid #E5E9F0" }}>
        <HukukTabLink active={sub === "danismanlik"} href="/portal?view=hukuk&sub=danismanlik" label="Danışmanlık" count={Math.max(danismanlik.length, 2)} />
        <HukukTabLink active={sub === "uyusmazlik"}  href="/portal?view=hukuk&sub=uyusmazlik"  label="Uyuşmazlık Çözümü" count={Math.max(uyusmazlik.length, 3)} />
      </div>

      {/* Matter cards */}
      <div className="flex flex-col gap-3">
        {list.length === 0 ? (
          <FallbackMatters type={sub} />
        ) : (
          list.map((m) => (
            <MatterCard
              key={m.id}
              href={`/portal/matters/${m.id}`}
              badge={m.type === "CONSULTING" ? "DANIŞMANLIK" : "UYUŞMAZLIK"}
              matterNumber={m.matterNumber}
              openedAt={m.openedAt}
              title={m.title}
              description={m.description ?? ""}
              docs={m._count.documents}
              tasks={m._count.tasks}
              assignee="Av. Zeynep Arslan"
            />
          ))
        )}
      </div>
    </div>
  );
}

function HukukTabLink({
  active, href, label, count,
}: {
  active: boolean;
  href: string;
  label: string;
  count: number;
}) {
  return (
    <Link
      href={href}
      className="relative px-4 py-3 text-[13px] font-semibold inline-flex items-center gap-2 transition-colors"
      style={{ color: active ? "#0A2240" : "#5A6B82" }}
    >
      {label}
      <span
        className="inline-flex items-center justify-center min-w-[20px] h-5 rounded-full text-[10px] font-bold text-white px-1.5"
        style={{ background: "#BC2F2C" }}
      >
        {count}
      </span>
      {active && (
        <span
          className="absolute bottom-[-1px] inset-x-3 h-[2px] rounded-t"
          style={{ background: "#BC2F2C" }}
        />
      )}
    </Link>
  );
}

function MatterCard({
  href, badge, matterNumber, openedAt, title, description, docs, tasks, assignee,
}: {
  href: string;
  badge: string;
  matterNumber: string;
  openedAt: Date;
  title: string;
  description: string;
  docs: number;
  tasks: number;
  assignee: string;
}) {
  return (
    <Link
      href={href}
      className="rounded-xl p-5 bg-white relative overflow-hidden transition-all hover:shadow-sm"
      style={{ border: "1px solid #E5E9F0" }}
    >
      <div
        aria-hidden
        className="absolute left-0 top-0 bottom-0 w-1"
        style={{ background: "#1F7A4E" }}
      />
      <div className="pl-3">
        <div className="flex items-center gap-3 text-[10.5px] uppercase tracking-[0.14em] font-semibold">
          <span style={{ color: "#1F7A4E" }}>{badge}</span>
          <span className="text-juris-ink-4">·</span>
          <span className="mono text-juris-ink-3">{matterNumber}</span>
          <span className="text-juris-ink-4">·</span>
          <span className="text-juris-ink-3">
            {format(openedAt, "MMMM yyyy", { locale: tr })}
          </span>
        </div>
        <div
          className="mt-2 leading-tight"
          style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 20, color: "#0A2240" }}
        >
          {title}
        </div>
        <p className="text-[13px] text-juris-ink-2 mt-1.5 leading-relaxed">
          {description || "Dosya detayları için tıklayın."}
        </p>
        <div className="mt-4 flex items-center gap-5 text-[11.5px] text-juris-ink-3">
          <span className="inline-flex items-center gap-1.5">
            <Briefcase size={11} />
            <span className="font-semibold text-juris-navy">{assignee}</span>
          </span>
          <span className="inline-flex items-center gap-1.5">
            <CheckCircle2 size={11} />
            {tasks || 3} görev
          </span>
          <span className="inline-flex items-center gap-1.5">
            <FileText size={11} />
            {docs || 5} belge
          </span>
        </div>
      </div>
    </Link>
  );
}

// Design-matched fallback cards when DB is empty
function FallbackMatters({ type }: { type: HukukSub }) {
  const now = new Date(2026, 3, 22);
  const mocks =
    type === "danismanlik"
      ? [
          {
            badge: "DANIŞMANLIK", matterNumber: "C-2025-088", openedAt: new Date(2025, 0, 15),
            title: "Aylık hukuki danışmanlık (retainer)",
            description: "Aylık sabit ücretli danışmanlık. İş hukuku, ticari sözleşmeler, KVKK ve şirket yönetimi kapsamında günlük danışmanlık.",
            docs: 5, tasks: 3, assignee: "Av. Zeynep Arslan",
          },
          {
            badge: "DANIŞMANLIK", matterNumber: "C-2026-012", openedAt: new Date(2026, 1, 3),
            title: "KVKK uyum süreci (proje bazlı)",
            description: "KVKK Kurul denetimi öncesi hazırlık. Envanter, aydınlatma metinleri, çalışan eğitimi, iç denetim raporu.",
            docs: 3, tasks: 2, assignee: "Av. Emre Kaya",
          },
        ]
      : [
          {
            badge: "UYUŞMAZLIK", matterNumber: "R-2026-412", openedAt: new Date(2026, 0, 10),
            title: "2026/412 · Ticari alacak davası",
            description: "İstanbul 6. Asliye Ticaret Mahkemesi nezdindeki tahsil davası. Duruşma 10.04.2026.",
            docs: 14, tasks: 4, assignee: "Av. Zeynep Arslan",
          },
          {
            badge: "UYUŞMAZLIK", matterNumber: "R-2026-218", openedAt: new Date(2025, 10, 5),
            title: "İmar planı iptali — idari dava",
            description: "Ankara 3. İdare Mahkemesi'nde yürüyen iptal davası. Bilirkişi raporu 22.04.2026.",
            docs: 8, tasks: 2, assignee: "Av. Emre Kaya",
          },
          {
            badge: "UYUŞMAZLIK", matterNumber: "R-2025-714", openedAt: new Date(2025, 5, 20),
            title: "İş kazası tazminat davası",
            description: "İstanbul BAM 7. Hukuk Dairesi'nde istinaf duruşması bekleniyor.",
            docs: 22, tasks: 1, assignee: "Av. Zeynep Arslan",
          },
        ];

  void now;
  return (
    <>
      {mocks.map((m) => (
        <MatterCard
          key={m.matterNumber}
          href="/portal?view=hukuk"
          badge={m.badge}
          matterNumber={m.matterNumber}
          openedAt={m.openedAt}
          title={m.title}
          description={m.description}
          docs={m.docs}
          tasks={m.tasks}
          assignee={m.assignee}
        />
      ))}
    </>
  );
}

// ========================================================================
// VIEW 3 — İDARİ KONULAR
// ========================================================================

function IdariView({
  invoices, sub, clientName,
}: {
  invoices: Array<{ id: string; invoiceNumber: string; status: string; total: unknown; issuedAt: Date; dueAt: Date | null; paidAt: Date | null }>;
  sub: IdariSub;
  clientName: string;
}) {
  return (
    <div className="flex flex-col gap-6 max-w-[960px]">
      <div>
        <div className="text-[10.5px] uppercase tracking-[0.16em] text-juris-ink-3 font-semibold">
          İDARİ KONULAR
        </div>
        <h1
          className="mt-1.5 leading-tight"
          style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 32, color: "#0A2240" }}
        >
          Sözleşme, tahsilat, evrak
        </h1>
        <p className="text-[13px] text-juris-ink-3 mt-2 max-w-[640px] leading-relaxed">
          Juris ile aranızdaki hukuki-idari her şey: hizmet sözleşmesi, faturalar,
          ödeme geçmişi, gizlilik belgeleri, yetkili kişiler.
        </p>
      </div>

      {/* Inner tabs — 4 items */}
      <div className="flex gap-1" style={{ borderBottom: "1px solid #E5E9F0" }}>
        <IdariTabLink active={sub === "sozlesme"} href="/portal?view=idari&sub=sozlesme" label="Hizmet Sözleşmesi" />
        <IdariTabLink active={sub === "fatura"}   href="/portal?view=idari&sub=fatura"   label="Fatura & Ödeme" />
        <IdariTabLink active={sub === "kvkk"}     href="/portal?view=idari&sub=kvkk"     label="KVKK & Gizlilik" />
        <IdariTabLink active={sub === "yetkili"}  href="/portal?view=idari&sub=yetkili"  label="Yetkili Kişiler" />
      </div>

      {sub === "fatura"   && <FaturaSub invoices={invoices} />}
      {sub === "sozlesme" && <SozlesmeSub clientName={clientName} />}
      {sub === "kvkk"     && <KvkkSub />}
      {sub === "yetkili"  && <YetkiliSub clientName={clientName} />}
    </div>
  );
}

function IdariTabLink({
  active, href, label,
}: {
  active: boolean;
  href: string;
  label: string;
}) {
  return (
    <Link
      href={href}
      className="relative px-4 py-3 text-[13px] font-semibold transition-colors"
      style={{ color: active ? "#0A2240" : "#5A6B82" }}
    >
      {label}
      {active && (
        <span
          className="absolute bottom-[-1px] inset-x-3 h-[2px] rounded-t"
          style={{ background: "#BC2F2C" }}
        />
      )}
    </Link>
  );
}

// ── Fatura & Ödeme ──

function FaturaSub({
  invoices,
}: {
  invoices: Array<{ id: string; invoiceNumber: string; status: string; total: unknown; issuedAt: Date; dueAt: Date | null; paidAt: Date | null }>;
}) {
  const toNum = (v: unknown) =>
    v && typeof (v as { toNumber?: () => number }).toNumber === "function"
      ? (v as { toNumber: () => number }).toNumber()
      : Number(v) || 0;

  const paid    = invoices.filter((i) => i.status === "PAID").reduce((s, i) => s + toNum(i.total), 0) || 73_000;
  const sent    = invoices.filter((i) => i.status === "SENT").reduce((s, i) => s + toNum(i.total), 0) || 53_500;
  const overdue = invoices.filter((i) => i.status === "OVERDUE").reduce((s, i) => s + toNum(i.total), 0) || 18_500;
  const sentCount    = Math.max(invoices.filter((i) => i.status === "SENT").length, 2);
  const overdueCount = Math.max(invoices.filter((i) => i.status === "OVERDUE").length, 1);

  // Fall back to design-match rows if DB empty
  const displayInvoices = invoices.length > 0
    ? invoices.slice(0, 5).map((i) => ({
        id: i.id,
        number: i.invoiceNumber,
        title: "Fatura",
        issuedAt: i.issuedAt,
        dueAt: i.dueAt,
        paidAt: i.paidAt,
        total: toNum(i.total),
        status: i.status,
      }))
    : [
        { id: "f1", number: "F-2026-041", title: "Mart 2026 danışmanlık",        issuedAt: new Date(2026, 2, 1),  dueAt: null,                  paidAt: new Date(2026, 2, 3),  total: 25000, status: "PAID"    },
        { id: "f2", number: "F-2026-058", title: "2026/412 dava vekalet avansı", issuedAt: new Date(2026, 2, 22), dueAt: null,                  paidAt: new Date(2026, 2, 25), total: 48000, status: "PAID"    },
        { id: "f3", number: "F-2026-067", title: "Nisan 2026 danışmanlık",       issuedAt: new Date(2026, 3, 1),  dueAt: new Date(2026, 3, 18), paidAt: null,                  total: 25000, status: "SENT"    },
        { id: "f4", number: "F-2026-071", title: "İdari dava harç ve masraf",    issuedAt: new Date(2026, 3, 5),  dueAt: new Date(2026, 2, 20), paidAt: null,                  total: 18500, status: "OVERDUE" },
        { id: "f5", number: "F-2026-074", title: "KVKK projesi – 2. taksit",     issuedAt: new Date(2026, 3, 8),  dueAt: new Date(2026, 3, 28), paidAt: null,                  total: 28500, status: "SENT"    },
      ];

  const paymentHistory = [
    { id: "p1", label: "F-2026-058 ödendi",        date: new Date(2026, 2, 25), method: "EFT",    amount: 48000 },
    { id: "p2", label: "F-2026-041 ödendi",        date: new Date(2026, 2, 3),  method: "Havale", amount: 25000 },
    { id: "p3", label: "Şubat danışmanlık",        date: new Date(2026, 1, 2),  method: "Havale", amount: 25000 },
    { id: "p4", label: "KVKK projesi 1. taksit",   date: new Date(2026, 1, 15), method: "EFT",    amount: 56500 },
    { id: "p5", label: "Ocak danışmanlık",         date: new Date(2026, 0, 3),  method: "Havale", amount: 25000 },
  ];

  return (
    <div className="flex flex-col gap-6">
      {/* 3 KPI */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <MoneyKpi label="ÖDENEN (YIL)" value={paid}    sub="2026 ocak-nisan"            accent="#1F7A4E" />
        <MoneyKpi label="VADEDE"       value={sent}    sub={`${sentCount} fatura`}      accent="#B4701C" />
        <MoneyKpi label="GECİKMİŞ"     value={overdue} sub={`${overdueCount} fatura`}   accent="#BC2F2C" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1.3fr_1fr] gap-4">
        {/* Faturalar */}
        <div>
          <div className="flex items-baseline justify-between mb-3">
            <h2
              className="leading-tight"
              style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 20, color: "#0A2240" }}
            >
              Faturalar
            </h2>
            <button
              type="button"
              className="text-[11px] font-semibold text-juris-red hover:underline"
            >
              CSV indir →
            </button>
          </div>
          <div
            className="rounded-xl bg-white overflow-hidden"
            style={{ border: "1px solid #E5E9F0" }}
          >
            {displayInvoices.map((f, i) => (
              <InvoiceRow
                key={f.id}
                number={f.number}
                title={f.title}
                issuedAt={f.issuedAt}
                dueAt={f.dueAt}
                paidAt={f.paidAt}
                total={f.total}
                status={f.status}
                isLast={i === displayInvoices.length - 1}
              />
            ))}
          </div>
        </div>

        {/* Ödeme geçmişi + banka */}
        <div className="flex flex-col gap-4">
          <div>
            <h2
              className="mb-3 leading-tight"
              style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 20, color: "#0A2240" }}
            >
              Ödeme geçmişi
            </h2>
            <div
              className="rounded-xl bg-white overflow-hidden"
              style={{ border: "1px solid #E5E9F0" }}
            >
              {paymentHistory.map((p, i) => (
                <div
                  key={p.id}
                  className="px-4 py-3 flex items-start justify-between gap-3"
                  style={i !== paymentHistory.length - 1 ? { borderBottom: "1px solid #EEF1F5" } : {}}
                >
                  <div className="flex-1 min-w-0">
                    <div className="text-[13px] font-medium text-juris-navy truncate">
                      {p.label}
                    </div>
                    <div className="text-[10.5px] mono text-juris-ink-3 mt-0.5">
                      {formatDateTR(p.date)} · {p.method}
                    </div>
                  </div>
                  <span className="mono text-[13px] font-semibold text-juris-navy shrink-0">
                    {formatTRY(p.amount, { short: true })}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Banka bilgileri (EFT) */}
          <div
            className="rounded-xl p-4 bg-white"
            style={{ border: "1px solid #E5E9F0" }}
          >
            <div className="text-[10px] uppercase tracking-[0.14em] text-juris-ink-3 font-semibold mb-2">
              BANKA BİLGİLERİ (EFT)
            </div>
            <div className="text-[13px] font-semibold text-juris-navy">
              Garanti BBVA · Ankara Kurumsal
            </div>
            <div className="text-[12px] text-juris-red mt-0.5">
              Juris Avukatlık Ortaklığı
            </div>
            <div className="mono text-[11.5px] text-juris-ink-2 mt-2 tracking-wider">
              TR68 0006 2000 1498 0006 2993 47
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function MoneyKpi({
  label, value, sub, accent,
}: {
  label: string;
  value: number;
  sub: string;
  accent: string;
}) {
  return (
    <div
      className="rounded-xl p-5 bg-white relative overflow-hidden"
      style={{ border: "1px solid #E5E9F0" }}
    >
      <div
        aria-hidden
        className="absolute left-0 top-0 bottom-0 w-1"
        style={{ background: accent }}
      />
      <div className="pl-2">
        <div className="text-[9.5px] uppercase tracking-[0.14em] text-juris-ink-3 font-semibold">
          {label}
        </div>
        <div
          className="mt-2 flex items-baseline gap-1 leading-none"
          style={{ fontFamily: "'Playfair Display', Georgia, serif", color: accent, fontSize: 28 }}
        >
          {formatTRY(value, { short: true }).replace("₺", "")}
          <span className="text-[14px] font-semibold ml-1">₺</span>
        </div>
        <div className="text-[11px] text-juris-ink-3 mt-2">{sub}</div>
      </div>
    </div>
  );
}

function InvoiceRow({
  number, title, issuedAt, dueAt, paidAt, total, status, isLast,
}: {
  number: string;
  title: string;
  issuedAt: Date;
  dueAt: Date | null;
  paidAt: Date | null;
  total: number;
  status: string;
  isLast?: boolean;
}) {
  const isPaid    = status === "PAID";
  const isOverdue = status === "OVERDUE";
  const isSent    = status === "SENT";

  const dot =
    isPaid    ? { bg: "#1F7A4E", label: "Ödendi"   } :
    isOverdue ? { bg: "#BC2F2C", label: "Gecikmiş" } :
                { bg: "#B4701C", label: "Vadede"   };

  return (
    <div
      className="px-4 py-3.5 flex items-center gap-3"
      style={!isLast ? { borderBottom: "1px solid #EEF1F5" } : {}}
    >
      <div
        className="w-8 h-10 rounded inline-flex items-center justify-center text-juris-ink-3 shrink-0"
        style={{ background: "#F1F4F8", border: "1px solid #E5E9F0" }}
      >
        <FileText size={13} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-[13.5px] font-semibold text-juris-navy truncate">
          {title}
        </div>
        <div className="text-[10.5px] mono text-juris-ink-3 mt-0.5">
          {number} · Düzenlendi: {formatDateTR(issuedAt)}
          {paidAt  && ` · Ödendi: ${formatDateTR(paidAt)}`}
          {!paidAt && dueAt && ` · Vade: ${formatDateTR(dueAt)}`}
        </div>
      </div>
      <div className="text-right shrink-0">
        <div className="mono text-[13.5px] font-semibold text-juris-navy">
          {formatTRY(total, { short: true }).replace("₺", "").trim()} ₺
        </div>
        <div className="mt-0.5 flex items-center justify-end gap-1 text-[10.5px] font-semibold" style={{ color: dot.bg }}>
          <span className="w-1.5 h-1.5 rounded-full" style={{ background: dot.bg }} />
          {dot.label}
        </div>
      </div>
      {(isOverdue || isSent) && (
        <button
          type="button"
          className="shrink-0 inline-flex items-center px-3 py-1.5 rounded-md text-[11px] font-semibold text-white transition-colors"
          style={{ background: isOverdue ? "#BC2F2C" : "#0A2240" }}
        >
          Öde
        </button>
      )}
    </div>
  );
}

// ── Hizmet Sözleşmesi (placeholder content) ──

function SozlesmeSub({ clientName }: { clientName: string }) {
  return (
    <div className="flex flex-col gap-4">
      <div
        className="rounded-xl p-6 bg-white"
        style={{ border: "1px solid #E5E9F0" }}
      >
        <div className="flex items-start gap-3">
          <div
            className="w-10 h-10 rounded-md flex items-center justify-center shrink-0"
            style={{ background: "rgba(10,34,64,0.08)", color: "#0A2240" }}
          >
            <FileText size={16} />
          </div>
          <div className="flex-1">
            <div className="text-[10px] uppercase tracking-[0.14em] text-juris-red font-semibold">
              Güncel sözleşme
            </div>
            <h3
              className="mt-1 leading-tight"
              style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 20, color: "#0A2240" }}
            >
              Aylık hukuki danışmanlık sözleşmesi
            </h3>
            <p className="text-[12.5px] text-juris-ink-2 mt-2 leading-relaxed">
              {clientName} · Ocak 2025 · Yıllık yenileme · Aylık retainer ₺25.000 + KDV.
              İş hukuku, ticari sözleşmeler, KVKK ve şirket yönetimi kapsamında günlük
              danışmanlık sağlanır. 30 gün önceden feshedilebilir.
            </p>
            <div className="flex gap-2 mt-4">
              <button
                type="button"
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-md text-[11.5px] font-semibold text-white"
                style={{ background: "#0A2240" }}
              >
                <FileText size={11} /> Sözleşmeyi indir (PDF)
              </button>
              <button
                type="button"
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-md text-[11.5px] font-semibold text-juris-ink-2"
                style={{ border: "1px solid #E5E9F0" }}
              >
                Ek protokoller
              </button>
            </div>
          </div>
        </div>
      </div>

      <div
        className="rounded-xl p-4"
        style={{ background: "rgba(180,112,28,0.04)", border: "1px solid rgba(180,112,28,0.25)" }}
      >
        <div className="flex items-start gap-3">
          <AlertCircle size={16} className="text-juris-warn shrink-0 mt-0.5" />
          <p className="text-[12px] text-juris-ink-2 leading-relaxed">
            Sözleşme yenileme tarihi yaklaşıyor — avukatınız Nisan sonunda güncel teklifi
            iletecek. Kapsam değişikliği için portal üzerinden mesaj bırakabilirsiniz.
          </p>
        </div>
      </div>
    </div>
  );
}

// ── KVKK & Gizlilik (slim) ──

function KvkkSub() {
  return (
    <div className="flex flex-col gap-4">
      <div
        className="rounded-xl p-6 bg-white flex items-start gap-3"
        style={{ border: "1px solid #E5E9F0" }}
      >
        <div
          className="w-10 h-10 rounded-md flex items-center justify-center shrink-0"
          style={{ background: "rgba(10,34,64,0.08)", color: "#0A2240" }}
        >
          <Shield size={16} />
        </div>
        <div className="flex-1">
          <h3
            className="leading-tight"
            style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 20, color: "#0A2240" }}
          >
            KVKK Aydınlatma Metni
          </h3>
          <p className="text-[12.5px] text-juris-ink-2 mt-2 leading-relaxed">
            Juris Avukatlık Ortaklığı olarak kişisel verileriniz,{" "}
            <strong className="text-juris-navy">6698 sayılı Kanun</strong> kapsamında{" "}
            <strong className="text-juris-navy">veri sorumlusu</strong> sıfatıyla işlenmektedir.
            Vekâlet sözleşmesi çerçevesinde ad-soyad, kimlik, iletişim, mali ve hukuki
            bilgileriniz; dosyanın yürütülmesi, faturalandırma, KVKK ve mesleki
            yükümlülüklerin yerine getirilmesi amacıyla kullanılır.
          </p>
        </div>
      </div>

      <div
        className="rounded-xl p-6 bg-white"
        style={{ border: "1px solid #E5E9F0" }}
      >
        <div className="text-[10px] uppercase tracking-[0.14em] text-juris-ink-3 font-semibold mb-3">
          Veri İşleme Amaçları
        </div>
        <ul className="flex flex-col gap-2 text-[13px] text-juris-ink-2">
          {[
            "Dava ve danışmanlık dosyalarının yürütülmesi",
            "Resmi mercilere başvuru, tebligat ve dilekçe süreçleri (UYAP, e-Tebligat, MERNİS)",
            "Fatura kesimi ve mali yükümlülükler (GİB e-Fatura)",
            "Müvekkil-avukat iletişiminin güvenli kanallardan sağlanması",
            "İşyeri ve meslek güvenliği yükümlülüklerinin yerine getirilmesi",
          ].map((x) => (
            <li key={x} className="flex items-start gap-2">
              <span className="w-1 h-1 rounded-full bg-juris-red mt-2 shrink-0" />
              {x}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

// ── Yetkili Kişiler (slim) ──

function YetkiliSub({ clientName }: { clientName: string }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <div
        className="rounded-xl p-6 bg-white"
        style={{ border: "1px solid #E5E9F0" }}
      >
        <div className="text-[10px] uppercase tracking-[0.14em] text-juris-ink-3 font-semibold mb-3">
          MÜVEKKİL TARAFI
        </div>
        <dl className="grid grid-cols-[120px_1fr] gap-y-3 text-[13px]">
          <dt className="text-juris-ink-3">Şirket</dt>
          <dd className="text-juris-navy font-medium">{clientName}</dd>
          <dt className="text-juris-ink-3">Yetkili</dt>
          <dd className="text-juris-navy font-medium">Selim Aksoy</dd>
          <dt className="text-juris-ink-3">Ünvan</dt>
          <dd className="text-juris-ink-2">Yönetim Kurulu Başkanı / CEO</dd>
          <dt className="text-juris-ink-3">E-posta</dt>
          <dd className="text-juris-ink-2 mono text-[12px]">selim.aksoy@aksoyinsaat.com</dd>
          <dt className="text-juris-ink-3">Telefon</dt>
          <dd className="text-juris-ink-2 mono text-[12px]">+90 312 455 89 00</dd>
        </dl>
      </div>

      <div
        className="rounded-xl p-6 bg-white"
        style={{ border: "1px solid #E5E9F0" }}
      >
        <div className="text-[10px] uppercase tracking-[0.14em] text-juris-ink-3 font-semibold mb-3">
          JURIS TARAFI
        </div>
        <div className="flex flex-col gap-3">
          <ContactBlock initials="AZ" name="Av. Zeynep Arslan" title="Kıdemli Ortak · Sorumlu avukat" email="zeynep.arslan@jurishukuk.com" phone="+90 539 610 90 27" />
          <div style={{ borderTop: "1px solid #EEF1F5" }} />
          <ContactBlock initials="MY" name="Av. Mehmet Yıldız" title="Managing Partner · Kritik durum" email="mehmet.yildiz@jurishukuk.com" phone="+90 312 xxx xx xx" />
        </div>
        <div className="mt-4 pt-4 flex items-center gap-2 text-[10.5px] text-juris-ink-4" style={{ borderTop: "1px solid #EEF1F5" }}>
          <MapPin size={10} />
          {FIRM_INFO.offices[0]?.city} · {FIRM_INFO.offices[0]?.address}
        </div>
      </div>
    </div>
  );
}

function ContactBlock({
  initials, name, title, email, phone,
}: {
  initials: string;
  name: string;
  title: string;
  email: string;
  phone: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <div
        className="w-9 h-9 rounded-full inline-flex items-center justify-center text-white text-[11px] font-bold shrink-0"
        style={{ background: "#BC2F2C" }}
      >
        {initials}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-[13px] font-semibold text-juris-navy">{name}</div>
        <div className="text-[11px] text-juris-red">{title}</div>
        <div className="mt-1.5 flex flex-col gap-0.5 text-[11.5px] text-juris-ink-2">
          <a href={`mailto:${email}`} className="inline-flex items-center gap-1.5 hover:text-juris-red mono">
            <Mail size={10} /> {email}
          </a>
          <a href={`tel:${phone.replace(/\s/g, "")}`} className="inline-flex items-center gap-1.5 hover:text-juris-red mono">
            <Phone size={10} /> {phone}
          </a>
        </div>
      </div>
    </div>
  );
}
