import Link from "next/link";
import {
  FileText, Download, Receipt, Mail, Phone, Shield, MapPin,
  Calendar, AlertCircle, ArrowRight, Briefcase, Scale,
} from "lucide-react";
import { requireTenant } from "@/lib/tenancy";
import { prisma } from "@/lib/prisma";
import { Kpi } from "@/components/ui/kpi";
import { SectionHead } from "@/components/ui/section-head";
import { matterStatusChip, invoiceStatusChip } from "@/lib/labels";
import { formatDateTR, formatTRY } from "@/lib/utils";
import { FIRM_INFO } from "@/lib/firm-info";
import { PortalTabs } from "./portal-tabs";

export const metadata = { title: "Portal" };

type TabKey = "overview" | "matters" | "finance" | "contracts" | "kvkk" | "contacts";

export default async function ClientPortalPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: TabKey }>;
}) {
  const { firmId, email } = await requireTenant();
  const params = await searchParams;
  const tab: TabKey = params.tab ?? "overview";

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
      <div className="card p-12 text-center">
        <h2 className="display text-xl text-juris-navy mb-2">Müvekkil kaydı bulunamadı</h2>
        <p className="text-sm text-juris-ink-3">
          Portal erişiminiz için avukatınızla görüşün: {" "}
          <a href={`mailto:${FIRM_INFO.contact.email}`} className="text-juris-red hover:underline">
            {FIRM_INFO.contact.email}
          </a>
        </p>
      </div>
    );
  }

  const openMatters = contact.matters.filter((m) => m.status === "ACTIVE");
  const totalDocs = contact.matters.reduce((s, m) => s + m._count.documents, 0);
  const unpaid = contact.invoices
    .filter((i) => i.status === "SENT" || i.status === "OVERDUE")
    .reduce((s, i) => s + i.total.toNumber(), 0);
  const paidYtd = contact.invoices
    .filter((i) => i.status === "PAID")
    .reduce((s, i) => s + i.total.toNumber(), 0);

  const displayName = contact.type === "COMPANY" ? contact.companyName ?? contact.name : contact.name;

  return (
    <>
      {/* Hero header */}
      <div className="mb-2">
        <div className="text-[11px] uppercase tracking-[0.14em] text-juris-red font-semibold mb-1">
          Müvekkil Portalı
        </div>
        <div className="display text-[32px] text-juris-navy leading-tight">
          Hoş geldiniz, {displayName}
        </div>
        <div className="text-sm text-juris-ink-3 mt-1.5">
          Dosyalarınız, belgeleriniz, faturalarınız ve sözleşmeleriniz tek yerde
        </div>
      </div>

      <PortalTabs active={tab} />

      {tab === "overview" && (
        <OverviewTab
          contact={contact}
          openMatters={openMatters}
          totalDocs={totalDocs}
          unpaid={unpaid}
        />
      )}
      {tab === "matters" && <MattersTab matters={contact.matters} />}
      {tab === "finance" && <FinanceTab invoices={contact.invoices} unpaid={unpaid} paidYtd={paidYtd} />}
      {tab === "contracts" && <ContractsTab />}
      {tab === "kvkk" && <KvkkTab />}
      {tab === "contacts" && <ContactsTab contact={contact} />}
    </>
  );
}

// ===================== OVERVIEW =====================

function OverviewTab({
  contact, openMatters, totalDocs, unpaid,
}: {
  contact: Awaited<ReturnType<typeof loadContact>>;
  openMatters: Array<{ id: string; matterNumber: string; title: string; status: import("@prisma/client").MatterStatus; nextHearingAt: Date | null; _count: { documents: number; tasks: number } }>;
  totalDocs: number;
  unpaid: number;
}) {
  if (!contact) return null;

  const upcomingHearings = openMatters.filter((m) => m.nextHearingAt).slice(0, 3);

  return (
    <>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
        <Kpi label="Açık Dosya" value={openMatters.length} emphasized />
        <Kpi label="Tüm Dosyalar" value={contact.matters.length} />
        <Kpi label="Belgeler" value={totalDocs} sub="paylaşılan" />
        <Kpi label="Bekleyen" value={formatTRY(unpaid, { short: true })} sub="ödeme" trend={unpaid > 0 ? "down" : undefined} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 flex flex-col gap-6">
          <div className="card p-6">
            <SectionHead
              title="Açık Dosyalarım"
              small
              actions={
                <Link href="/portal?tab=matters" className="text-xs text-juris-red hover:underline">
                  Tümü →
                </Link>
              }
            />
            {openMatters.length === 0 ? (
              <div className="py-6 text-center text-sm text-juris-ink-3">Açık dosya yok.</div>
            ) : (
              <ul className="flex flex-col divide-y divide-juris-line-2">
                {openMatters.slice(0, 5).map((m) => {
                  const chip = matterStatusChip(m.status);
                  return (
                    <li key={m.id} className="py-3">
                      <Link href={`/portal/matters/${m.id}`} className="flex items-start gap-3 hover:bg-juris-paper-2 -mx-2 px-2 py-1 rounded">
                        <Briefcase size={14} className="text-juris-ink-3 mt-1 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-0.5">
                            <span className="mono text-[11px] text-juris-ink-3">{m.matterNumber}</span>
                            <span className={`chip chip-${chip.tone}`}>{chip.label}</span>
                          </div>
                          <div className="text-sm font-medium text-juris-navy truncate">{m.title}</div>
                          {m.nextHearingAt && (
                            <div className="text-[11px] text-juris-red font-semibold mt-0.5">
                              Sıradaki duruşma: {formatDateTR(m.nextHearingAt)}
                            </div>
                          )}
                        </div>
                        <ArrowRight size={14} className="text-juris-ink-4 mt-1.5" />
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          {upcomingHearings.length > 0 && (
            <div className="card p-6">
              <SectionHead title="Yaklaşan Duruşmalar" small />
              <ul className="flex flex-col gap-2">
                {upcomingHearings.map((m) => (
                  <li key={m.id} className="flex items-center gap-3">
                    <Scale size={13} className="text-juris-red flex-shrink-0" />
                    <span className="mono text-xs text-juris-ink-3 w-[80px]">
                      {m.nextHearingAt && formatDateTR(m.nextHearingAt)}
                    </span>
                    <Link href={`/portal/matters/${m.id}`} className="text-sm text-juris-navy hover:text-juris-red truncate">
                      {m.title}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <div className="flex flex-col gap-6">
          <div
            className="card p-6 relative overflow-hidden text-white"
            style={{ background: "linear-gradient(135deg, #0A2240 0%, #1a3558 100%)", border: "none" }}
          >
            <div
              aria-hidden
              className="absolute inset-0 opacity-40 pointer-events-none"
              style={{
                backgroundImage: "radial-gradient(400px 300px at 100% 0%, rgba(188,47,44,0.35), transparent 60%)",
              }}
            />
            <div className="relative">
              <div className="text-[10px] uppercase tracking-[0.14em] font-semibold text-white/50 mb-2">
                Destek
              </div>
              <h3 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 20, fontWeight: 500 }}>
                Avukatınıza ulaşın
              </h3>
              <p className="text-[13px] text-white/70 mt-2 leading-relaxed">
                Sorularınız için doğrudan dosya üzerinden mesaj gönderebilir ya da
                kurumsal iletişim kanallarını kullanabilirsiniz.
              </p>
              <div className="flex gap-2 mt-4">
                <a href={`mailto:${FIRM_INFO.contact.email}`} className="btn btn-accent btn-sm">
                  <Mail size={12} /> E-posta
                </a>
              </div>
            </div>
          </div>

          {contact.invoices.length > 0 && (
            <div className="card p-6">
              <SectionHead title="Son Faturalar" small />
              <ul className="flex flex-col divide-y divide-juris-line-2">
                {contact.invoices.slice(0, 3).map((inv) => {
                  const chip = invoiceStatusChip(inv.status);
                  return (
                    <li key={inv.id} className="py-2.5 flex items-center gap-2">
                      <Receipt size={13} className="text-juris-ink-3 flex-shrink-0" />
                      <span className="mono text-xs text-juris-navy">{inv.invoiceNumber}</span>
                      <span className={`chip chip-${chip.tone}`}>{chip.label}</span>
                      <span className="mono text-sm font-semibold text-juris-navy ml-auto">
                        {formatTRY(inv.total.toString(), { short: true })}
                      </span>
                    </li>
                  );
                })}
              </ul>
              <Link href="/portal?tab=finance" className="mt-3 block text-center text-xs text-juris-red hover:underline">
                Tüm faturalar →
              </Link>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

// ===================== MATTERS =====================

function MattersTab({
  matters,
}: {
  matters: Array<{ id: string; matterNumber: string; title: string; status: import("@prisma/client").MatterStatus; openedAt: Date; nextHearingAt: Date | null; _count: { documents: number; tasks: number } }>;
}) {
  return (
    <div className="card overflow-hidden">
      <SectionHead title="Tüm Dosyalarım" subtitle={`${matters.length} dosya · en son güncellemeden eskiye`} small />
      {matters.length === 0 ? (
        <div className="p-8 text-center text-sm text-juris-ink-3">Dosya yok</div>
      ) : (
        <table className="w-full text-sm">
          <thead className="bg-juris-paper-2 text-juris-ink-3 text-[11px] uppercase tracking-wider">
            <tr>
              <th className="text-left px-4 py-3 font-semibold">Dosya No</th>
              <th className="text-left px-4 py-3 font-semibold">Başlık</th>
              <th className="text-left px-4 py-3 font-semibold">Durum</th>
              <th className="text-left px-4 py-3 font-semibold">Açılış</th>
              <th className="text-left px-4 py-3 font-semibold">Duruşma</th>
              <th className="text-right px-4 py-3 font-semibold">Belge</th>
            </tr>
          </thead>
          <tbody>
            {matters.map((m) => {
              const chip = matterStatusChip(m.status);
              return (
                <tr key={m.id} className="border-t border-juris-line-2 hover:bg-juris-paper-2">
                  <td className="px-4 py-3 mono text-xs text-juris-navy">
                    <Link href={`/portal/matters/${m.id}`} className="hover:text-juris-red">
                      {m.matterNumber}
                    </Link>
                  </td>
                  <td className="px-4 py-3 font-medium">
                    <Link href={`/portal/matters/${m.id}`} className="hover:text-juris-red">
                      {m.title}
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`chip chip-${chip.tone}`}>{chip.label}</span>
                  </td>
                  <td className="px-4 py-3 text-xs text-juris-ink-3">{formatDateTR(m.openedAt)}</td>
                  <td className="px-4 py-3 text-xs">
                    {m.nextHearingAt ? (
                      <span className="text-juris-red font-semibold">{formatDateTR(m.nextHearingAt)}</span>
                    ) : (
                      <span className="text-juris-ink-4">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 mono text-right text-juris-navy font-semibold">
                    {m._count.documents || "—"}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </div>
  );
}

// ===================== FINANCE =====================

function FinanceTab({
  invoices, unpaid, paidYtd,
}: {
  invoices: Array<{ id: string; invoiceNumber: string; status: import("@prisma/client").InvoiceStatus; total: import("@prisma/client").Prisma.Decimal; issuedAt: Date; dueAt: Date | null; paidAt: Date | null }>;
  unpaid: number;
  paidYtd: number;
}) {
  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-7">
        <Kpi label="Bekleyen" value={formatTRY(unpaid, { short: true })} emphasized trend={unpaid > 0 ? "down" : undefined} />
        <Kpi label="Ödenen (YTD)" value={formatTRY(paidYtd, { short: true })} />
        <Kpi label="Toplam Fatura" value={invoices.length} />
      </div>

      <div className="card overflow-hidden">
        <SectionHead title="Fatura Geçmişi" small />
        {invoices.length === 0 ? (
          <div className="p-8 text-center text-sm text-juris-ink-3">Fatura yok</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-juris-paper-2 text-juris-ink-3 text-[11px] uppercase tracking-wider">
              <tr>
                <th className="text-left px-4 py-3 font-semibold">No</th>
                <th className="text-right px-4 py-3 font-semibold">Tutar</th>
                <th className="text-left px-4 py-3 font-semibold">Durum</th>
                <th className="text-left px-4 py-3 font-semibold">Kesim</th>
                <th className="text-left px-4 py-3 font-semibold">Vade</th>
                <th className="w-[90px]" />
              </tr>
            </thead>
            <tbody>
              {invoices.map((inv) => {
                const chip = invoiceStatusChip(inv.status);
                return (
                  <tr key={inv.id} className="border-t border-juris-line-2 hover:bg-juris-paper-2">
                    <td className="px-4 py-3 mono text-xs text-juris-navy font-semibold">
                      {inv.invoiceNumber}
                    </td>
                    <td className="px-4 py-3 mono text-right text-juris-navy font-semibold">
                      {formatTRY(inv.total.toString())}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`chip chip-${chip.tone}`}>{chip.label}</span>
                    </td>
                    <td className="px-4 py-3 text-xs text-juris-ink-3">{formatDateTR(inv.issuedAt)}</td>
                    <td className="px-4 py-3 text-xs text-juris-ink-3">{formatDateTR(inv.dueAt)}</td>
                    <td className="px-4 py-3">
                      <a
                        href={`/api/invoices/${inv.id}/pdf`}
                        target="_blank"
                        rel="noreferrer"
                        className="btn btn-sm btn-ghost"
                      >
                        <Download size={11} /> PDF
                      </a>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}

// ===================== CONTRACTS =====================

function ContractsTab() {
  return (
    <div className="card p-12 text-center">
      <FileText size={28} className="text-juris-ink-3 mx-auto mb-3" />
      <h3 className="display text-xl text-juris-navy mb-2">Sözleşmeler</h3>
      <p className="text-sm text-juris-ink-3 max-w-md mx-auto mb-4">
        Firma ile imzaladığınız danışmanlık sözleşmeleri ve ek protokoller v0.8&apos;de
        burada listelenecek. Şu anda dosya detay sayfasından ilgili belgelere
        ulaşabilirsiniz.
      </p>
      <Link href="/portal?tab=matters" className="btn btn-primary">
        Dosyalarıma git
      </Link>
    </div>
  );
}

// ===================== KVKK =====================

function KvkkTab() {
  return (
    <div className="grid grid-cols-1 gap-4">
      <div className="card p-6 flex items-start gap-4">
        <div className="w-10 h-10 rounded-md flex items-center justify-center bg-juris-navy-100 text-juris-navy flex-shrink-0">
          <Shield size={18} />
        </div>
        <div className="flex-1">
          <h3 className="display text-lg text-juris-navy mb-1.5">KVKK Aydınlatma Metni</h3>
          <p className="text-sm text-juris-ink-2 leading-relaxed">
            Juris Avukatlık Ortaklığı olarak kişisel verileriniz,{" "}
            <strong className="text-juris-navy">6698 sayılı Kanun</strong> kapsamında{" "}
            <strong className="text-juris-navy">veri sorumlusu</strong> sıfatıyla işlenmektedir.
            Vekâlet sözleşmesi çerçevesinde ad-soyad, kimlik, iletişim, mali ve hukuki
            bilgileriniz; dosyanın yürütülmesi, faturalandırma, KVKK ve mesleki
            yükümlülüklerin yerine getirilmesi amacıyla kullanılır.
          </p>
        </div>
      </div>

      <div className="card p-6">
        <h4 className="label mb-3">Veri İşleme Amaçları</h4>
        <ul className="flex flex-col gap-2 text-sm text-juris-ink-2">
          {[
            "Dava ve danışmanlık dosyalarının yürütülmesi",
            "Resmi mercilere başvuru, tebligat ve dilekçe süreçleri (UYAP, e-Tebligat, MERNİS)",
            "Fatura kesimi ve mali yükümlülükler (GİB e-Fatura)",
            "Müvekkil-avukat iletişiminin güvenli kanallardan sağlanması",
            "İşyeri ve meslek güvenliği yükümlülüklerinin yerine getirilmesi",
          ].map((x) => (
            <li key={x} className="flex items-start gap-2">
              <span className="w-1 h-1 rounded-full bg-juris-red mt-2 flex-shrink-0" />
              {x}
            </li>
          ))}
        </ul>
      </div>

      <div className="card p-6">
        <h4 className="label mb-3">Haklarınız (KVKK m.11)</h4>
        <p className="text-sm text-juris-ink-2 leading-relaxed mb-3">
          Kişisel verilerinizin işlenip işlenmediğini öğrenme, amaç dışı kullanımın
          önlenmesini isteme, silinmesi/yok edilmesini talep etme ve aktarılan
          üçüncü kişileri bilme haklarınız vardır. Başvurularınızı aşağıdaki
          kanallardan yapabilirsiniz:
        </p>
        <div className="flex flex-col gap-1.5 text-sm">
          <a href={`mailto:${FIRM_INFO.contact.email}`} className="inline-flex items-center gap-2 text-juris-red font-semibold hover:underline">
            <Mail size={13} /> {FIRM_INFO.contact.email}
          </a>
          {FIRM_INFO.offices.filter((o) => !o.comingSoon).map((o) => (
            <div key={o.city} className="flex items-start gap-2 text-juris-ink-2">
              <MapPin size={13} className="text-juris-ink-3 mt-0.5" />
              <span className="text-xs">{o.city} · {o.address}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="card p-5 border-juris-warn/30" style={{ background: "rgba(180,112,28,0.04)" }}>
        <div className="flex items-start gap-3">
          <AlertCircle size={16} className="text-juris-warn flex-shrink-0 mt-0.5" />
          <p className="text-xs text-juris-ink-2 leading-relaxed">
            Bu metin genel bir aydınlatma metni taslağıdır. Resmi aydınlatma metni
            ve müvekkile özel açık rıza formları vekâlet imza süreciyle birlikte
            ayrı olarak iletilir. VERBİS kaydımız Veri Sorumluları Sicili&apos;nde
            arşivlenmektedir.
          </p>
        </div>
      </div>
    </div>
  );
}

// ===================== CONTACTS =====================

function ContactsTab({
  contact,
}: {
  contact: { name: string; email: string | null; phone: string | null; address: string | null; taxNumber: string | null; tcNumber: string | null; companyName: string | null; type: string };
}) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
      <div className="card p-6">
        <SectionHead title="Kendi Bilgileriniz" subtitle="Müvekkil kartı" small />
        <dl className="grid grid-cols-[140px_1fr] gap-y-3 text-sm">
          <dt className="text-juris-ink-3">Ad Soyad</dt>
          <dd className="text-juris-navy font-medium">{contact.name}</dd>
          {contact.companyName && (
            <>
              <dt className="text-juris-ink-3">Şirket</dt>
              <dd className="text-juris-navy font-medium">{contact.companyName}</dd>
            </>
          )}
          <dt className="text-juris-ink-3">E-posta</dt>
          <dd className="text-juris-ink-2">{contact.email ?? "—"}</dd>
          <dt className="text-juris-ink-3">Telefon</dt>
          <dd className="text-juris-ink-2">{contact.phone ?? "—"}</dd>
          {contact.tcNumber && (
            <>
              <dt className="text-juris-ink-3">TC Kimlik</dt>
              <dd className="mono text-juris-ink-2">{contact.tcNumber}</dd>
            </>
          )}
          {contact.taxNumber && (
            <>
              <dt className="text-juris-ink-3">Vergi No</dt>
              <dd className="mono text-juris-ink-2">{contact.taxNumber}</dd>
            </>
          )}
          {contact.address && (
            <>
              <dt className="text-juris-ink-3">Adres</dt>
              <dd className="text-juris-ink-2">{contact.address}</dd>
            </>
          )}
        </dl>
        <p className="text-[11px] text-juris-ink-4 mt-5 pt-4 border-t border-juris-line-2">
          Bilgilerinizde değişiklik varsa avukatınızla paylaşın — güncelleme ekip tarafından yapılır.
        </p>
      </div>

      <div className="card p-6">
        <SectionHead title="Juris Avukatlık Ortaklığı" subtitle="İletişim" small />
        <a
          href={`mailto:${FIRM_INFO.contact.email}`}
          className="flex items-center gap-3 text-sm text-juris-navy hover:text-juris-red mb-4 font-medium"
        >
          <Mail size={16} className="text-juris-ink-3" />
          {FIRM_INFO.contact.email}
        </a>

        {FIRM_INFO.offices.map((o) => (
          <div key={o.city} className="py-3 border-t border-juris-line-2">
            <div className="flex items-center gap-2 mb-1">
              <MapPin size={13} className="text-juris-red" />
              <span className="font-semibold text-juris-navy">{o.city}</span>
              {o.comingSoon && <span className="chip chip-amber">Yakında</span>}
            </div>
            <p className="text-sm text-juris-ink-2 leading-relaxed pl-5">{o.address}</p>
            {o.phone && (
              <a href={`tel:${o.phone.replace(/\s/g, "")}`} className="inline-flex items-center gap-2 mt-1.5 text-sm text-juris-ink-2 hover:text-juris-red pl-5">
                <Phone size={12} className="text-juris-ink-3" /> {o.phone}
              </a>
            )}
          </div>
        ))}

        <div className="mt-4 pt-4 border-t border-juris-line-2 flex items-center gap-2 text-[11px] text-juris-ink-4">
          <Calendar size={11} /> Pazartesi–Cuma 09:00–18:00 · kurumsal mesai
        </div>
      </div>
    </div>
  );
}

// ----- Types helper -----
async function loadContact() {
  return prisma.contact.findFirst({
    where: {},
    include: { matters: true, invoices: true },
  });
}
