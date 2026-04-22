import Link from "next/link";
import {
  ChevronRight, ScrollText, CreditCard, Download, Shield, Plug, Users,
  Palette, Bell, Database, Building2,
} from "lucide-react";
import { requireTenant } from "@/lib/tenancy";
import { prisma } from "@/lib/prisma";
import { can } from "@/lib/rbac";
import { SectionHead } from "@/components/ui/section-head";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { planByTier } from "@/lib/billing/plans";
import { SettingsTabs, type SettingsTabKey } from "./settings-tabs";
import { FirmForm } from "./firm-form";

export const metadata = { title: "Ayarlar" };

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: SettingsTabKey }>;
}) {
  const { firmId, role } = await requireTenant();
  const params = await searchParams;
  const tab: SettingsTabKey = (params.tab ?? "firma") as SettingsTabKey;

  const [firm, sub, userCount, integrationCount] = await Promise.all([
    prisma.firm.findUnique({ where: { id: firmId } }),
    prisma.subscription.findUnique({ where: { firmId } }),
    prisma.user.count({ where: { firmId, active: true, role: { not: "CLIENT" } } }),
    prisma.integration.count({ where: { firmId, status: "CONNECTED" } }),
  ]);
  if (!firm) return null;

  const canAudit = can(role, "audit.view");
  const canBilling = role === "OWNER" || role === "PARTNER";
  const canEditFirm = role === "OWNER" || role === "PARTNER";
  const plan = planByTier(sub?.tier ?? "FREE");

  return (
    <div className="px-6 py-8 max-w-[1100px] mx-auto">
      <div className="mb-4">
        <Breadcrumb
          crumbs={[
            { label: "Firma", href: "/settings" },
            { label: TAB_LABELS[tab] },
          ]}
        />
      </div>

      <SectionHead
        title="Firma Ayarları"
        subtitle="Firma bilgileri, marka, bildirim kuralları ve veri politikası"
      />

      <SettingsTabs active={tab} />

      {tab === "firma"       && <FirmaTab firm={firm} canEdit={canEditFirm} plan={plan?.name ?? "—"} subStatus={sub?.status ?? "TRIALING"} userCount={userCount} integrationCount={integrationCount} canBilling={canBilling} canAudit={canAudit} />}
      {tab === "markalasma"  && <MarkalasmaTab firmName={firm.name} logoUrl={firm.logoUrl} />}
      {tab === "bildirimler" && <BildirimlerTab />}
      {tab === "veri"        && <VeriTab />}
    </div>
  );
}

const TAB_LABELS: Record<SettingsTabKey, string> = {
  firma:       "Firma Bilgileri",
  markalasma:  "Markalaşma",
  bildirimler: "Bildirim Kuralları",
  abonelik:    "Abonelik & Faturalama",
  denetim:     "Denetim İzi",
  veri:        "Veri & KVKK",
};

// ────────────────── FIRMA tab ──────────────────

function FirmaTab({
  firm, canEdit, plan, subStatus, userCount, integrationCount, canBilling, canAudit,
}: {
  firm: { id: string; name: string; slug: string; taxNumber: string | null; email: string | null; phone: string | null; website: string | null; address: string | null };
  canEdit: boolean;
  plan: string;
  subStatus: string;
  userCount: number;
  integrationCount: number;
  canBilling: boolean;
  canAudit: boolean;
}) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1.5fr_1fr] gap-6">
      {/* Edit form */}
      <div className="card p-6">
        <div className="flex items-start gap-3 mb-5">
          <div
            className="w-10 h-10 rounded-md flex items-center justify-center shrink-0"
            style={{ background: "rgba(10,34,64,0.08)", color: "#0A2240" }}
          >
            <Building2 size={16} />
          </div>
          <div>
            <h3 className="text-[16px] font-semibold text-juris-navy">Firma Bilgileri</h3>
            <p className="text-[12px] text-juris-ink-3 mt-0.5">
              Vekâlet, fatura ve resmi yazışmalarda görünür
            </p>
          </div>
        </div>

        <FirmForm firm={firm} canEdit={canEdit} />
      </div>

      {/* Right rail — quick links + stats */}
      <div className="flex flex-col gap-4">
        {/* Quick stats */}
        <div className="card p-5">
          <h4 className="label mb-3">Özet</h4>
          <dl className="grid grid-cols-2 gap-4 text-sm">
            <StatBlock
              label="Aktif Kullanıcı"
              value={userCount}
              href="/people"
              icon={<Users size={12} />}
            />
            <StatBlock
              label="Bağlı Entegrasyon"
              value={integrationCount}
              href="/integrations"
              icon={<Plug size={12} />}
            />
            <StatBlock
              label="Mevcut Plan"
              value={plan}
              href="/settings/billing"
              icon={<CreditCard size={12} />}
              small
            />
            <StatBlock
              label="Abonelik"
              value={subStatus === "ACTIVE" ? "Aktif" : subStatus === "TRIALING" ? "Deneme" : subStatus}
              icon={<Shield size={12} />}
              small
            />
          </dl>
        </div>

        {canBilling && (
          <QuickLinkCard
            href="/settings/billing"
            icon={<CreditCard size={16} />}
            title="Abonelik & Faturalama"
            subtitle={`Plan: ${plan}${subStatus && subStatus !== "TRIALING" ? ` · ${subStatus}` : ""}`}
          />
        )}
        {canAudit && (
          <QuickLinkCard
            href="/settings/audit"
            icon={<ScrollText size={16} />}
            title="Denetim İzi (Audit Log)"
            subtitle="Tüm eylemlerin değişmez kaydı · KVKK m.12"
          />
        )}
        <QuickLinkCard
          href="/integrations"
          icon={<Plug size={16} />}
          title="Entegrasyonlar"
          subtitle="UYAP, GİB, Drive ve daha fazlası"
        />
        <QuickLinkCard
          href="/people"
          icon={<Users size={16} />}
          title="Ekip Yönetimi"
          subtitle="Üye davet et, rolleri düzenle"
        />
      </div>
    </div>
  );
}

function StatBlock({
  label, value, href, icon, small,
}: {
  label: string;
  value: string | number;
  href?: string;
  icon: React.ReactNode;
  small?: boolean;
}) {
  const body = (
    <>
      <div className="text-[10px] text-juris-ink-3 uppercase tracking-wider font-semibold mb-1 inline-flex items-center gap-1">
        {icon} {label}
      </div>
      <div
        className={`text-juris-navy leading-none ${small ? "font-semibold text-sm" : "font-semibold"}`}
        style={!small ? { fontFamily: "'Playfair Display', Georgia, serif", fontSize: 22 } : {}}
      >
        {value}
      </div>
    </>
  );
  if (href) {
    return (
      <Link href={href} className="block hover:bg-juris-paper-2 -mx-2 px-2 py-1 rounded transition-colors">
        {body}
      </Link>
    );
  }
  return <div>{body}</div>;
}

function QuickLinkCard({
  href, icon, title, subtitle,
}: {
  href: string;
  icon: React.ReactNode;
  title: string;
  subtitle: string;
}) {
  return (
    <Link
      href={href}
      className="card p-4 flex items-center gap-3 hover:border-juris-navy-200 hover:shadow-juris-md transition-all group"
    >
      <div
        className="w-10 h-10 rounded-md flex items-center justify-center shrink-0 text-juris-navy"
        style={{ background: "rgba(10,34,64,0.08)" }}
      >
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <h4 className="font-semibold text-juris-navy text-[13px] mb-0.5">{title}</h4>
        <p className="text-[11px] text-juris-ink-3 truncate">{subtitle}</p>
      </div>
      <ChevronRight size={16} className="text-juris-ink-4 group-hover:text-juris-red shrink-0 transition-colors" />
    </Link>
  );
}

// ────────────────── MARKALAŞMA tab ──────────────────

function MarkalasmaTab({ firmName, logoUrl }: { firmName: string; logoUrl: string | null }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="card p-6">
        <div className="flex items-start gap-3 mb-4">
          <div
            className="w-10 h-10 rounded-md flex items-center justify-center shrink-0"
            style={{ background: "rgba(188,47,44,0.1)", color: "#BC2F2C" }}
          >
            <Palette size={16} />
          </div>
          <div>
            <h3 className="text-[16px] font-semibold text-juris-navy">Logo & Görsel Kimlik</h3>
            <p className="text-[12px] text-juris-ink-3 mt-0.5">
              Portal, fatura ve dilekçelerde kullanılır
            </p>
          </div>
        </div>

        <div
          className="rounded-lg p-6 flex flex-col items-center justify-center gap-3"
          style={{ background: "#FAFBFD", border: "1px dashed #C7D0DE" }}
        >
          {logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={logoUrl} alt={firmName} className="max-h-[80px]" />
          ) : (
            <div
              className="w-14 h-14 rounded-md flex items-center justify-center text-white font-bold text-xl"
              style={{ background: "#BC2F2C" }}
            >
              {firmName.charAt(0)}
            </div>
          )}
          <div className="text-[12px] text-juris-ink-3 text-center">
            Logo yüklemek için PNG/SVG (min. 400px, şeffaf arka plan önerilir)
          </div>
          <button
            type="button"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-md text-[11.5px] font-semibold text-juris-ink-2"
            style={{ border: "1px solid #E5E9F0" }}
            disabled
          >
            Logo Yükle (yakında)
          </button>
        </div>
      </div>

      <div className="card p-6">
        <h3 className="text-[16px] font-semibold text-juris-navy mb-2">Renk Paleti</h3>
        <p className="text-[12px] text-juris-ink-3 mb-4">
          Juris kurumsal kimliği — değiştirmek için yeniden markalaşma paketi gerekir.
        </p>
        <div className="grid grid-cols-3 gap-3">
          <ColorSwatch hex="#0A2240" name="Juris Navy" role="Ana marka" />
          <ColorSwatch hex="#BC2F2C" name="Juris Kırmızı" role="Vurgu" />
          <ColorSwatch hex="#1F7A4E" name="Başarı" role="Olumlu durumlar" />
          <ColorSwatch hex="#B4701C" name="Uyarı" role="Bekleyen / süre" />
          <ColorSwatch hex="#1F5AA8" name="Bilgi" role="Nötr bilgi" />
          <ColorSwatch hex="#5A6B82" name="Nötr" role="Metin & sınır" />
        </div>
      </div>

      <div className="lg:col-span-2 card p-6">
        <h3 className="text-[16px] font-semibold text-juris-navy mb-2">Tipografi</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-3">
          <div>
            <div
              className="text-[32px] leading-none mb-1 text-juris-navy"
              style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
            >
              Playfair Display
            </div>
            <div className="text-[11px] text-juris-ink-3">Başlıklar — serif · 400/500/600</div>
          </div>
          <div>
            <div className="text-[24px] leading-none mb-1 text-juris-navy font-semibold">
              Inter
            </div>
            <div className="text-[11px] text-juris-ink-3">Gövde & UI — sans-serif · 400/500/600/700</div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ColorSwatch({ hex, name, role }: { hex: string; name: string; role: string }) {
  return (
    <div className="flex flex-col gap-1.5">
      <div
        className="h-[54px] rounded-md"
        style={{ background: hex, border: "1px solid #E5E9F0" }}
      />
      <div>
        <div className="text-[12px] font-semibold text-juris-navy leading-none">{name}</div>
        <div className="text-[10px] text-juris-ink-4 mt-0.5">{role}</div>
        <div className="text-[10px] mono text-juris-ink-3 mt-0.5">{hex}</div>
      </div>
    </div>
  );
}

// ────────────────── BİLDİRİMLER tab ──────────────────

function BildirimlerTab() {
  const groups = [
    {
      title: "Dava & Duruşma",
      items: [
        { label: "Yaklaşan duruşma uyarısı",            email: true, push: true,  sms: false },
        { label: "UYAP belge bildirimi",                 email: true, push: true,  sms: false },
        { label: "Mahkeme karar bildirimi",              email: true, push: false, sms: false },
      ],
    },
    {
      title: "Finans",
      items: [
        { label: "Fatura ödendiğinde",                   email: true, push: true,  sms: false },
        { label: "Vade geçtiğinde",                      email: true, push: true,  sms: true  },
        { label: "Abonelik bitmek üzereyken",            email: true, push: false, sms: false },
      ],
    },
    {
      title: "Müvekkil İletişimi",
      items: [
        { label: "Müvekkil mesaj gönderdiğinde",         email: true, push: true,  sms: false },
        { label: "Portal'a yeni belge yüklendiğinde",    email: true, push: false, sms: false },
        { label: "Müvekkil onay bekliyor",                email: true, push: true,  sms: false },
      ],
    },
  ];

  return (
    <div className="card p-6">
      <div className="flex items-start gap-3 mb-5">
        <div
          className="w-10 h-10 rounded-md flex items-center justify-center shrink-0"
          style={{ background: "rgba(180,112,28,0.1)", color: "#B4701C" }}
        >
          <Bell size={16} />
        </div>
        <div>
          <h3 className="text-[16px] font-semibold text-juris-navy">Bildirim Kuralları</h3>
          <p className="text-[12px] text-juris-ink-3 mt-0.5">
            Hangi olaylarda hangi kanaldan bilgilendiril — ekip genelinde varsayılanlar
          </p>
        </div>
      </div>

      <div className="grid grid-cols-[1fr_auto_auto_auto] gap-2 items-center text-[10px] text-juris-ink-3 uppercase tracking-wider font-semibold pb-2 border-b border-juris-line-2">
        <div />
        <div className="w-20 text-center">E-posta</div>
        <div className="w-20 text-center">Push</div>
        <div className="w-20 text-center">SMS</div>
      </div>

      {groups.map((g) => (
        <div key={g.title} className="mt-4">
          <div className="text-[10.5px] uppercase tracking-[0.14em] text-juris-red font-semibold mb-2">
            {g.title}
          </div>
          {g.items.map((item) => (
            <div
              key={item.label}
              className="grid grid-cols-[1fr_auto_auto_auto] gap-2 items-center py-2.5"
              style={{ borderTop: "1px solid #EEF1F5" }}
            >
              <div className="text-[13px] text-juris-ink-2">{item.label}</div>
              <Toggle checked={item.email} />
              <Toggle checked={item.push} />
              <Toggle checked={item.sms} />
            </div>
          ))}
        </div>
      ))}

      <div
        className="mt-5 rounded-md p-3 text-[11.5px] text-juris-ink-2 leading-relaxed flex items-start gap-2"
        style={{ background: "#FAFBFD", border: "1px solid #EEF1F5" }}
      >
        <Bell size={12} className="text-juris-ink-3 shrink-0 mt-0.5" />
        Her kullanıcı kendi profili üzerinden bu tercihleri ezebilir. SMS kanalı için SGK API bağlantısı gerekli — Entegrasyonlar sekmesinden etkinleştirilebilir.
      </div>
    </div>
  );
}

function Toggle({ checked }: { checked: boolean }) {
  return (
    <div className="w-20 flex justify-center">
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled
        className="relative inline-flex items-center w-9 h-5 rounded-full transition-all"
        style={{
          background: checked ? "#1F7A4E" : "#E5E9F0",
        }}
      >
        <span
          className="absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all"
          style={{ left: checked ? 18 : 2 }}
        />
      </button>
    </div>
  );
}

// ────────────────── VERİ & KVKK tab ──────────────────

function VeriTab() {
  return (
    <div className="flex flex-col gap-4">
      <div className="card p-6">
        <div className="flex items-start gap-3">
          <div
            className="w-10 h-10 rounded-md flex items-center justify-center shrink-0"
            style={{ background: "rgba(31,90,168,0.1)", color: "#1F5AA8" }}
          >
            <Shield size={16} />
          </div>
          <div className="flex-1">
            <h3 className="text-[16px] font-semibold text-juris-navy">KVKK & Veri Politikası</h3>
            <p className="text-[12.5px] text-juris-ink-2 mt-2 leading-relaxed">
              Juris Platform, KVKK madde 12 kapsamında veri güvenliği önlemlerini uygular.
              Tüm veriler <strong className="text-juris-navy">TR bölgesinde</strong> (Railway AWS eu-west)
              şifreli olarak saklanır. Yedekler günlük, log&apos;lar 30 gün süreyle tutulur.
            </p>
            <Link href="/kvkk" className="text-[11.5px] font-semibold text-juris-red hover:underline mt-2 inline-block">
              Tam politika metni →
            </Link>
          </div>
        </div>
      </div>

      <div className="card p-6">
        <div className="flex items-start gap-3">
          <div
            className="w-10 h-10 rounded-md flex items-center justify-center shrink-0"
            style={{ background: "rgba(10,34,64,0.08)", color: "#0A2240" }}
          >
            <Database size={16} />
          </div>
          <div className="flex-1">
            <h3 className="text-[16px] font-semibold text-juris-navy">Veri Dışa Aktarımı</h3>
            <p className="text-[12.5px] text-juris-ink-2 mt-2 leading-relaxed">
              Firmanızın tüm verilerini JSON formatında tek dosyada indirin — dosyalar,
              müvekkiller, faturalar, zaman girişleri, mesajlar dahil.
            </p>
            <div className="flex gap-2 mt-4">
              <button
                type="button"
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-md text-[11.5px] font-semibold text-white opacity-60 cursor-not-allowed"
                style={{ background: "#0A2240" }}
                disabled
              >
                <Download size={11} /> Veri İndir (JSON) — yakında
              </button>
              <button
                type="button"
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-md text-[11.5px] font-semibold text-juris-ink-2 opacity-60 cursor-not-allowed"
                style={{ border: "1px solid #E5E9F0" }}
                disabled
              >
                Belgeleri ZIP&apos;le
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="card p-6" style={{ borderColor: "#BC2F2C33" }}>
        <div className="flex items-start gap-3">
          <div
            className="w-10 h-10 rounded-md flex items-center justify-center shrink-0"
            style={{ background: "rgba(188,47,44,0.1)", color: "#BC2F2C" }}
          >
            <Shield size={16} />
          </div>
          <div className="flex-1">
            <h3 className="text-[16px] font-semibold text-juris-navy">Firma Verilerini Sil</h3>
            <p className="text-[12.5px] text-juris-ink-2 mt-2 leading-relaxed">
              Tüm firma verilerini kalıcı olarak silmek için doğrudan destek ile iletişime geçin.
              Silme işlemi geri alınamaz; 30 gün içinde yedekten geri yükleme talep edebilirsiniz.
            </p>
            <a
              href="mailto:destek@jurishukuk.com"
              className="text-[11.5px] font-semibold text-juris-red hover:underline mt-2 inline-block"
            >
              destek@jurishukuk.com →
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
