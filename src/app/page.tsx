import Link from "next/link";
import { redirect } from "next/navigation";
import {
  Building2, Handshake, Cpu, Gavel, Lightbulb, Scale,
  ShieldCheck, FileLock2, Sparkles, Database, Users, Globe,
  Phone, Mail, MapPin, ArrowRight, Linkedin, Instagram, Facebook, Youtube,
  ArrowUpRight, Briefcase, UserCircle2,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { auth } from "@/lib/auth";
import { JurisLogo } from "@/components/ui/brand-mark";
import { FIRM_INFO } from "@/lib/firm-info";
import { StrategySection } from "@/components/landing/strategy-section";

export const metadata = {
  title: "Juris Avukatlık Ortaklığı",
  description: FIRM_INFO.description,
  robots: { index: true, follow: true },
};

const ICON_MAP: Record<string, LucideIcon> = {
  Building2, Handshake, Cpu, Gavel, Lightbulb, Scale,
};

export default async function LandingPage() {
  const session = await auth();
  if (session?.user) {
    redirect(session.user.role === "CLIENT" ? "/portal" : "/command");
  }

  return (
    <div className="min-h-screen bg-[#FBFAF7] text-[#0A2240]">
      <LandingNav />
      <Hero />
      <StrategySection />
      <AudienceSplit />
      <PracticeAreas />
      <PlatformFeatures />
      <Offices />
      <CTA />
      <LandingFooter />
    </div>
  );
}

// =========================================================
// Navigation
// =========================================================
function LandingNav() {
  return (
    <header className="sticky top-0 z-40 bg-[#FBFAF7]/90 backdrop-blur-md border-b border-[#E5E9F0]">
      <div className="max-w-[1240px] mx-auto px-6 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center">
          <JurisLogo variant="color" height={38} priority />
        </Link>
        <nav className="hidden md:flex items-center gap-7 text-[13px] text-[#2A3B54] font-medium">
          <a href="#uzmanlik" className="hover:text-[#BC2F2C] transition-colors">Uzmanlık</a>
          <a href="#platform" className="hover:text-[#BC2F2C] transition-colors">Platform</a>
          <a href="#ofisler" className="hover:text-[#BC2F2C] transition-colors">Ofisler</a>
          <a href={FIRM_INFO.contact.website} target="_blank" rel="noreferrer" className="hover:text-[#BC2F2C] transition-colors inline-flex items-center gap-1">
            Kurumsal Site <ArrowUpRight size={12} />
          </a>
        </nav>
        <div className="flex items-center gap-2">
          <Link
            href="/login?as=client"
            className="hidden sm:inline-flex items-center gap-1.5 h-9 px-3.5 rounded-md text-[13px] font-semibold text-[#0A2240] hover:bg-[#E8EEF5] transition-colors"
          >
            <UserCircle2 size={14} /> Müvekkil Girişi
          </Link>
          <Link
            href="/login?as=team"
            className="inline-flex items-center gap-1.5 h-9 px-4 rounded-md text-[13px] font-semibold text-white transition-all"
            style={{
              background: "#0A2240",
              boxShadow: "inset 0 -2px 0 rgba(188,47,44,0.6)",
            }}
          >
            <Briefcase size={14} /> Ekip Girişi
          </Link>
        </div>
      </div>
    </header>
  );
}

// =========================================================
// Hero
// =========================================================
function Hero() {
  return (
    <section className="relative overflow-hidden">
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage:
            "radial-gradient(900px 500px at 85% -10%, rgba(188,47,44,0.09), transparent 60%), " +
            "radial-gradient(700px 400px at 5% 90%, rgba(10,34,64,0.05), transparent 60%)",
        }}
      />
      <div className="relative max-w-[1240px] mx-auto px-6 pt-20 pb-24 md:pt-28 md:pb-32 grid md:grid-cols-[1.2fr_1fr] gap-16 items-center">
        <div>
          <div className="inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.18em] font-semibold text-[#BC2F2C] bg-[rgba(188,47,44,0.08)] px-3 py-1.5 rounded-full mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-[#BC2F2C]" />
            Juris Platform v0.1
          </div>
          <h1
            style={{
              fontFamily: "'Playfair Display', Georgia, serif",
              fontSize: "clamp(42px, 6vw, 72px)",
              fontWeight: 500,
              letterSpacing: "-0.02em",
              lineHeight: 1.05,
              color: "#0A2240",
            }}
          >
            <span style={{ fontStyle: "italic", color: "#BC2F2C" }}>Özgür</span> olmak.
            <br />
            Bir hukuk bürosu,
            <br />
            tek bir platform.
          </h1>
          <p className="mt-6 text-[17px] leading-relaxed text-[#2A3B54] max-w-[560px]">
            {FIRM_INFO.description}
          </p>
          <div className="mt-9 flex flex-wrap gap-3">
            <Link
              href="/login?as=team"
              className="inline-flex items-center gap-2 h-12 px-6 rounded-md text-[14px] font-semibold text-white transition-all"
              style={{
                background: "#0A2240",
                boxShadow: "inset 0 -3px 0 rgba(188,47,44,0.7), 0 2px 6px rgba(10,34,64,0.15)",
              }}
            >
              <Briefcase size={16} /> Ekip Girişi
              <ArrowRight size={14} />
            </Link>
            <Link
              href="/login?as=client"
              className="inline-flex items-center gap-2 h-12 px-6 rounded-md text-[14px] font-semibold text-[#0A2240] border border-[#D1DCE9] bg-white hover:bg-[#F4F7FB] transition-all"
            >
              <UserCircle2 size={16} /> Müvekkil Portalına Giriş
            </Link>
          </div>
          <div className="mt-10 flex items-center gap-6 text-[12px] text-[#5A6B82]">
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#BC2F2C]" />
              UYAP Uyumlu
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#BC2F2C]" />
              GİB e-Fatura
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#BC2F2C]" />
              KVKK
            </span>
          </div>
        </div>
        <div className="relative">
          <div
            className="aspect-[4/5] rounded-[20px] relative overflow-hidden"
            style={{
              background:
                "linear-gradient(160deg, #0A2240 0%, #1a3558 100%)",
              boxShadow: "0 32px 80px rgba(10,34,64,0.25)",
            }}
          >
            <div
              aria-hidden
              className="absolute inset-0"
              style={{
                backgroundImage:
                  "radial-gradient(500px 300px at 80% 20%, rgba(188,47,44,0.28), transparent 60%), " +
                  "radial-gradient(400px 300px at 20% 80%, rgba(188,47,44,0.12), transparent 60%)",
              }}
            />
            <div
              aria-hidden
              className="absolute inset-0 opacity-[0.06]"
              style={{
                backgroundImage:
                  "linear-gradient(rgba(255,255,255,1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,1) 1px, transparent 1px)",
                backgroundSize: "36px 36px",
              }}
            />
            <div className="relative h-full flex flex-col justify-between p-8">
              <JurisLogo variant="white" height={48} />
              <div>
                <div className="text-[10px] tracking-[0.2em] uppercase text-white/50 font-semibold mb-2">
                  Hizmet Alanları
                </div>
                <div className="flex flex-wrap gap-2">
                  {FIRM_INFO.practiceAreas.slice(0, 4).map((a) => (
                    <span
                      key={a.key}
                      className="text-[11px] px-2.5 py-1 rounded-full text-white/85"
                      style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.1)" }}
                    >
                      {a.title.split(" ")[0]}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
          <div className="hidden md:block absolute -left-6 -bottom-6 bg-white rounded-lg border border-[#E5E9F0] p-4 shadow-lg max-w-[220px]">
            <div className="text-[11px] uppercase tracking-wider text-[#BC2F2C] font-semibold mb-1">
              2021’den bu yana
            </div>
            <div className="display text-[22px] text-[#0A2240] leading-tight">
              Özgür olmak.
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// =========================================================
// Audience split (Müvekkil / Ekip)
// =========================================================
function AudienceSplit() {
  return (
    <section className="bg-white border-y border-[#E5E9F0]">
      <div className="max-w-[1240px] mx-auto px-6 py-16 grid md:grid-cols-2 gap-4">
        <AudienceCard
          icon={<UserCircle2 size={26} />}
          audience="Müvekkil"
          headline="Dosyanıza anlık erişim"
          body="Dosyalarınızın durumu, yüklenen belgeler, faturalarınız ve avukatınızla güvenli mesajlaşma — hepsi tek ekranda."
          ctaLabel="Müvekkil Portalına Giriş"
          ctaHref="/login?as=client"
          tone="light"
        />
        <AudienceCard
          icon={<Briefcase size={26} />}
          audience="Avukat / Ortak"
          headline="Firmanın komuta merkezi"
          body="Dava & danışmanlık dosyaları, CRM pipeline, finans, UYAP entegrasyonu, yapay zekâ destekli dilekçe ve analiz."
          ctaLabel="Ekip Girişi"
          ctaHref="/login?as=team"
          tone="dark"
        />
      </div>
    </section>
  );
}

function AudienceCard({
  icon, audience, headline, body, ctaLabel, ctaHref, tone,
}: {
  icon: React.ReactNode;
  audience: string;
  headline: string;
  body: string;
  ctaLabel: string;
  ctaHref: string;
  tone: "light" | "dark";
}) {
  const isDark = tone === "dark";
  return (
    <div
      className="rounded-[16px] p-8 md:p-10 relative overflow-hidden group"
      style={{
        background: isDark ? "#0A2240" : "#F4F7FB",
        color: isDark ? "white" : "#0A2240",
        border: isDark ? "1px solid rgba(255,255,255,0.08)" : "1px solid #E5E9F0",
      }}
    >
      {isDark && (
        <div
          aria-hidden
          className="absolute inset-0 opacity-40"
          style={{
            backgroundImage: "radial-gradient(500px 300px at 100% 0%, rgba(188,47,44,0.25), transparent 60%)",
          }}
        />
      )}
      <div className="relative">
        <div
          className="w-12 h-12 rounded-md flex items-center justify-center mb-5"
          style={{
            background: isDark ? "rgba(188,47,44,0.25)" : "rgba(188,47,44,0.1)",
            color: isDark ? "#F4A4A1" : "#BC2F2C",
          }}
        >
          {icon}
        </div>
        <div className={`text-[11px] uppercase tracking-[0.16em] font-semibold mb-2 ${isDark ? "text-white/50" : "text-[#5A6B82]"}`}>
          {audience}
        </div>
        <h3
          style={{
            fontFamily: "'Playfair Display', Georgia, serif",
            fontSize: 28, fontWeight: 500, letterSpacing: "-0.015em", lineHeight: 1.2,
          }}
        >
          {headline}
        </h3>
        <p className={`mt-3 text-[15px] leading-relaxed ${isDark ? "text-white/70" : "text-[#2A3B54]"}`}>
          {body}
        </p>
        <Link
          href={ctaHref}
          className="mt-7 inline-flex items-center gap-2 text-[13px] font-semibold group-hover:gap-3 transition-all"
          style={{ color: isDark ? "#F4A4A1" : "#BC2F2C" }}
        >
          {ctaLabel}
          <ArrowRight size={14} />
        </Link>
      </div>
    </div>
  );
}

// =========================================================
// Practice areas
// =========================================================
function PracticeAreas() {
  return (
    <section id="uzmanlik" className="py-20 md:py-24 bg-[#FBFAF7]">
      <div className="max-w-[1240px] mx-auto px-6">
        <SectionTitle
          eyebrow="Uzmanlık Alanları"
          title="Çoklu disiplinli hukuk hizmeti"
          description="Kurumsal müvekkillerimize doğrudan değer yaratan, sektörel tecrübeye dayalı hizmet sunuyoruz."
        />
        <div className="mt-12 grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {FIRM_INFO.practiceAreas.map((a) => {
            const Icon = ICON_MAP[a.icon] ?? Scale;
            return (
              <div
                key={a.key}
                className="bg-white rounded-[14px] border border-[#E5E9F0] p-6 hover:shadow-lg hover:border-[#D1DCE9] transition-all group"
              >
                <div
                  className="w-11 h-11 rounded-md flex items-center justify-center mb-4 transition-colors"
                  style={{ background: "#F4F7FB", color: "#0A2240" }}
                >
                  <Icon size={20} />
                </div>
                <h4
                  style={{
                    fontFamily: "'Playfair Display', Georgia, serif",
                    fontSize: 18, fontWeight: 500, color: "#0A2240", letterSpacing: "-0.01em",
                  }}
                >
                  {a.title}
                </h4>
                <p className="mt-2 text-[13px] text-[#5A6B82] leading-relaxed">{a.short}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

// =========================================================
// Platform features (icons)
// =========================================================
function PlatformFeatures() {
  const features: { icon: LucideIcon; title: string; desc: string }[] = [
    { icon: ShieldCheck, title: "KVKK Uyumlu", desc: "Veri TR/AB bölgesinde, şifrelenmiş, audit log ile izlenebilir." },
    { icon: Gavel, title: "UYAP Entegrasyonu", desc: "Duruşma, karar, tebligat — resmi kanallardan otomatik akış." },
    { icon: FileLock2, title: "GİB e-Fatura", desc: "Fatura kesimi ve arşiv, resmi formatında." },
    { icon: Sparkles, title: "Yapay Zekâ", desc: "Dilekçe taslağı, sözleşme analizi, dosya özeti — Claude, GPT, Gemini." },
    { icon: Database, title: "Tek Doğruluk Kaynağı", desc: "Dosyalar, müvekkiller, finans, CRM — hepsi bir arada." },
    { icon: Users, title: "Rol Bazlı Erişim", desc: "Ortak, avukat, stajyer, idari, müvekkil — her rolün kendi görünümü." },
    { icon: Globe, title: "Her Yerden Erişim", desc: "Web tabanlı, mobil uyumlu, 7/24 güvenli oturum." },
    { icon: Briefcase, title: "Portal + CRM + ERP", desc: "Müvekkil portalı + satış pipeline + finans — tek platform." },
  ];

  return (
    <section id="platform" className="py-20 md:py-24 bg-white border-y border-[#E5E9F0]">
      <div className="max-w-[1240px] mx-auto px-6">
        <SectionTitle
          eyebrow="Juris Platform"
          title="Hukukun iş motoru"
          description="Günlük operasyonunuzu, müvekkil ilişkinizi ve finansınızı tek bir yerden yönetin."
        />
        <div className="mt-12 grid sm:grid-cols-2 lg:grid-cols-4 gap-y-10 gap-x-6">
          {features.map((f) => {
            const Icon = f.icon;
            return (
              <div key={f.title} className="flex flex-col gap-3">
                <div
                  className="w-10 h-10 rounded-md flex items-center justify-center"
                  style={{ background: "rgba(188,47,44,0.08)", color: "#BC2F2C" }}
                >
                  <Icon size={18} />
                </div>
                <h5 className="font-semibold text-[14px] text-[#0A2240]">{f.title}</h5>
                <p className="text-[12.5px] text-[#5A6B82] leading-relaxed">{f.desc}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

// =========================================================
// Offices (Istanbul + Ankara)
// =========================================================
function Offices() {
  return (
    <section id="ofisler" className="py-20 md:py-24 bg-[#FBFAF7]">
      <div className="max-w-[1240px] mx-auto px-6">
        <SectionTitle
          eyebrow="Ofisler"
          title="İstanbul · Ankara"
          description="İki büyük merkezde hizmet veriyoruz."
        />
        <div className="mt-12 grid md:grid-cols-2 gap-5">
          {FIRM_INFO.offices.map((office) => (
            <div
              key={office.city}
              className="bg-white rounded-[14px] border border-[#E5E9F0] p-8 flex flex-col gap-5 relative overflow-hidden"
            >
              {office.comingSoon && (
                <span className="absolute top-5 right-5 chip chip-amber">Yakında</span>
              )}
              <div className="flex items-center gap-3">
                <div
                  className="w-11 h-11 rounded-md flex items-center justify-center"
                  style={{ background: "#F4F7FB", color: "#BC2F2C" }}
                >
                  <MapPin size={20} />
                </div>
                <h4
                  style={{
                    fontFamily: "'Playfair Display', Georgia, serif",
                    fontSize: 26, fontWeight: 500, color: "#0A2240",
                  }}
                >
                  {office.city}
                </h4>
              </div>
              <p className="text-[14px] text-[#2A3B54] leading-relaxed">{office.address}</p>
              {(office.phone || office.mobile) && (
                <div className="flex flex-col gap-1.5 text-[13px] text-[#2A3B54]">
                  {office.phone && (
                    <a href={`tel:${office.phone.replace(/\s/g, "")}`} className="flex items-center gap-2 hover:text-[#BC2F2C]">
                      <Phone size={14} className="text-[#5A6B82]" />
                      {office.phone}
                    </a>
                  )}
                  {office.mobile && (
                    <a href={`tel:${office.mobile.replace(/\s/g, "")}`} className="flex items-center gap-2 hover:text-[#BC2F2C]">
                      <Phone size={14} className="text-[#5A6B82]" />
                      {office.mobile}
                    </a>
                  )}
                </div>
              )}
              {office.mapsUrl && (
                <a
                  href={office.mapsUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-[#BC2F2C] hover:gap-2 transition-all mt-auto"
                >
                  Haritada göster <ArrowUpRight size={13} />
                </a>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// =========================================================
// CTA band
// =========================================================
function CTA() {
  return (
    <section className="relative py-16 md:py-20">
      <div className="max-w-[1240px] mx-auto px-6">
        <div
          className="rounded-[20px] p-10 md:p-14 relative overflow-hidden"
          style={{
            background: "linear-gradient(135deg, #0A2240 0%, #1a3558 100%)",
          }}
        >
          <div
            aria-hidden
            className="absolute inset-0 opacity-50"
            style={{
              backgroundImage:
                "radial-gradient(600px 300px at 100% 0%, rgba(188,47,44,0.28), transparent 60%)",
            }}
          />
          <div className="relative flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
            <div>
              <h3
                style={{
                  fontFamily: "'Playfair Display', Georgia, serif",
                  fontSize: 34, fontWeight: 500, color: "white", letterSpacing: "-0.015em",
                  lineHeight: 1.15,
                }}
              >
                Juris Platform’a hazır mısınız?
              </h3>
              <p className="mt-3 text-white/70 text-[15px] max-w-xl">
                Ekibinizin günlük işleyişini dijitalleştirmek için hemen başlayın.
                Mevcut müvekkillerimiz için portal erişimi aktif.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 flex-shrink-0">
              <Link
                href="/login?as=team"
                className="inline-flex items-center justify-center gap-2 h-12 px-6 rounded-md text-[14px] font-semibold text-[#0A2240] bg-white hover:bg-[#F4F7FB] transition-all"
              >
                <Briefcase size={16} /> Ekip Girişi
              </Link>
              <a
                href={`mailto:${FIRM_INFO.contact.email}`}
                className="inline-flex items-center justify-center gap-2 h-12 px-6 rounded-md text-[14px] font-semibold text-white border border-white/25 hover:bg-white/10 transition-all"
              >
                <Mail size={16} /> Bizimle İletişime Geçin
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// =========================================================
// Footer
// =========================================================
function LandingFooter() {
  const year = new Date().getFullYear();
  return (
    <footer className="bg-[#0A2240] text-white/70">
      <div className="max-w-[1240px] mx-auto px-6 py-14 grid md:grid-cols-[1.4fr_1fr_1fr_1fr] gap-10">
        <div>
          <JurisLogo variant="white" height={40} />
          <p className="mt-5 text-[13px] leading-relaxed max-w-xs text-white/60">
            Kurumsal müvekkillere multi-disipliner hukuk hizmeti — Ankara ve İstanbul.
          </p>
          <div className="mt-5 flex items-center gap-2">
            <SocialLink href={FIRM_INFO.social.linkedin} icon={Linkedin} label="LinkedIn" />
            <SocialLink href={FIRM_INFO.social.instagram} icon={Instagram} label="Instagram" />
            <SocialLink href={FIRM_INFO.social.facebook} icon={Facebook} label="Facebook" />
            <SocialLink href={FIRM_INFO.social.youtube} icon={Youtube} label="YouTube" />
          </div>
        </div>
        <FooterCol title="Uzmanlık">
          {FIRM_INFO.practiceAreas.slice(0, 4).map((a) => (
            <a key={a.key} href="#uzmanlik" className="block text-[13px] text-white/60 hover:text-white py-0.5">
              {a.title}
            </a>
          ))}
        </FooterCol>
        <FooterCol title="Platform">
          <Link href="/login?as=team" className="block text-[13px] text-white/60 hover:text-white py-0.5">Ekip Girişi</Link>
          <Link href="/login?as=client" className="block text-[13px] text-white/60 hover:text-white py-0.5">Müvekkil Portalı</Link>
          <Link href="/kvkk" className="block text-[13px] text-white/60 hover:text-white py-0.5">KVKK Aydınlatma</Link>
          <a href={FIRM_INFO.contact.website} target="_blank" rel="noreferrer" className="block text-[13px] text-white/60 hover:text-white py-0.5">
            juris.com.tr ↗
          </a>
        </FooterCol>
        <FooterCol title="İletişim">
          <a href={`mailto:${FIRM_INFO.contact.email}`} className="block text-[13px] text-white/60 hover:text-white py-0.5">
            {FIRM_INFO.contact.email}
          </a>
          {FIRM_INFO.offices.filter((o) => !o.comingSoon).map((o) => (
            <div key={o.city} className="text-[12px] text-white/50 leading-relaxed mt-2">
              <span className="text-white/80 font-semibold">{o.city}</span>
              <br />
              {o.address}
            </div>
          ))}
        </FooterCol>
      </div>
      <div className="border-t border-white/10">
        <div className="max-w-[1240px] mx-auto px-6 py-5 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-white/45">
          <div>© {year} {FIRM_INFO.legalName}. Tüm hakları saklıdır.</div>
          <div className="flex items-center gap-4">
            <Link href="/kvkk" className="hover:text-white/80">KVKK</Link>
            <Link href="/gizlilik" className="hover:text-white/80">Gizlilik</Link>
            <span className="text-white/25">·</span>
            <span>Juris Platform v0.1.0</span>
          </div>
        </div>
      </div>
    </footer>
  );
}

function SocialLink({ href, icon: Icon, label }: { href: string; icon: LucideIcon; label: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      aria-label={label}
      className="w-9 h-9 rounded-full flex items-center justify-center text-white/70 border border-white/15 hover:bg-[#BC2F2C] hover:border-[#BC2F2C] hover:text-white transition-colors"
    >
      <Icon size={15} />
    </a>
  );
}

function FooterCol({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-[0.18em] font-semibold text-white/40 mb-3">
        {title}
      </div>
      <div className="flex flex-col gap-0.5">{children}</div>
    </div>
  );
}

// =========================================================
// Shared
// =========================================================
function SectionTitle({
  eyebrow, title, description,
}: {
  eyebrow: string;
  title: string;
  description?: string;
}) {
  return (
    <div className="max-w-2xl">
      <div className="text-[11px] uppercase tracking-[0.18em] font-semibold text-[#BC2F2C] mb-3">
        {eyebrow}
      </div>
      <h2
        style={{
          fontFamily: "'Playfair Display', Georgia, serif",
          fontSize: "clamp(32px, 4.2vw, 46px)",
          fontWeight: 500, letterSpacing: "-0.015em", lineHeight: 1.1,
          color: "#0A2240",
        }}
      >
        {title}
      </h2>
      {description && (
        <p className="mt-4 text-[16px] text-[#2A3B54] leading-relaxed">{description}</p>
      )}
    </div>
  );
}
