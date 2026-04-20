"use client";

import { useState, useEffect } from "react";
import { Database, ExternalLink, Plus, Upload, X } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Cross-module "Kaynak Bağla" drawer — Platform.html SourcesPanel'den.
 * Modül bazlı Drive klasörü + bağlı dökümanlar + API entegrasyon durumları.
 */

type ModuleKey = "finance" | "sales" | "marketing" | "matters" | "operations" | "bd" | "people";

interface DocRef {
  name: string;
  type: "xlsx" | "docx" | "pdf" | "csv" | "folder";
  size: string;
  updated: string;
  primary?: boolean;
}

interface ApiRef {
  name: string;
  status: "connected" | "pending" | "disconnected";
  lastPing: string;
  note: string;
}

interface ModuleSources {
  drive: { path: string; sync: "live" | "paused"; lastSync: string; files: number };
  docs: DocRef[];
  apis: ApiRef[];
}

const MODULE_SOURCES: Record<ModuleKey, ModuleSources> = {
  finance: {
    drive: { path: "/Juris Drive/Finans", sync: "live", lastSync: "2 dk önce", files: 47 },
    docs: [
      { name: "Juris Finansal-01.03.2026.xlsx", type: "xlsx", size: "284 KB", updated: "5 gün önce", primary: true },
      { name: "Hesap Bakiyeleri.xlsx", type: "xlsx", size: "112 KB", updated: "5 gün önce" },
      { name: "Danışmanlık Sözleşmeleri.pdf", type: "pdf", size: "1.2 MB", updated: "12 gün önce" },
      { name: "2026 Öngörü.xlsx", type: "xlsx", size: "68 KB", updated: "5 gün önce" },
    ],
    apis: [
      { name: "Yapı Kredi Kurumsal", status: "connected", lastPing: "30 sn", note: "Vadeli + blokeli hesap" },
      { name: "Garanti BBVA", status: "connected", lastPing: "1 dk", note: "Cari TL" },
      { name: "Logo Muhasebe", status: "pending", lastPing: "—", note: "Kurulum bekleniyor" },
      { name: "GİB e-Fatura", status: "connected", lastPing: "5 dk", note: "Kesim & takip" },
    ],
  },
  sales: {
    drive: { path: "/Juris Drive/Satış", sync: "live", lastSync: "4 dk önce", files: 128 },
    docs: [
      { name: "Teklif Şablonu v3.docx", type: "docx", size: "94 KB", updated: "1 gün önce" },
      { name: "Müvekkil CRM Export.csv", type: "csv", size: "2.1 MB", updated: "3 saat önce" },
      { name: "Potansiyel Firma Listesi.xlsx", type: "xlsx", size: "312 KB", updated: "2 gün önce" },
    ],
    apis: [
      { name: "Google Drive", status: "connected", lastPing: "4 dk", note: "Teklif klasörü" },
      { name: "Gmail / Outlook", status: "connected", lastPing: "1 dk", note: "E-posta senkron" },
      { name: "LinkedIn Sales Nav.", status: "connected", lastPing: "15 dk", note: "Lead zenginleştirme" },
      { name: "Kredi Kayıt Bürosu", status: "disconnected", lastPing: "—", note: "Müvekkil taraması" },
    ],
  },
  marketing: {
    drive: { path: "/Juris Drive/Pazarlama", sync: "live", lastSync: "8 dk önce", files: 89 },
    docs: [
      { name: "İçerik Takvimi 2026.xlsx", type: "xlsx", size: "156 KB", updated: "6 saat önce" },
      { name: "Marka Rehberi v2.pdf", type: "pdf", size: "4.8 MB", updated: "3 hafta önce" },
      { name: "SEO Keyword Raporu.csv", type: "csv", size: "890 KB", updated: "1 gün önce" },
    ],
    apis: [
      { name: "juris.com.tr (WordPress)", status: "connected", lastPing: "2 dk", note: "Makale yayını" },
      { name: "Google Analytics 4", status: "connected", lastPing: "5 dk", note: "Trafik" },
      { name: "Google Search Console", status: "connected", lastPing: "1 saat", note: "SEO pozisyon" },
      { name: "LinkedIn Company", status: "connected", lastPing: "30 dk", note: "Yayın & reklam" },
      { name: "Mailchimp", status: "pending", lastPing: "—", note: "Bülten" },
    ],
  },
  matters: {
    drive: { path: "/Juris Drive/Dosyalar", sync: "live", lastSync: "1 dk önce", files: 2340 },
    docs: [
      { name: "Dosya Kayıt Defteri.xlsx", type: "xlsx", size: "720 KB", updated: "15 dk önce", primary: true },
      { name: "Vekaletname Şablonları.docx", type: "docx", size: "124 KB", updated: "1 ay önce" },
    ],
    apis: [
      { name: "UYAP Avukat Portal", status: "connected", lastPing: "12 dk", note: "Duruşma & karar" },
      { name: "e-Tebligat", status: "connected", lastPing: "3 dk", note: "Tebligat takibi" },
      { name: "MERNİS", status: "connected", lastPing: "—", note: "Kimlik sorgu" },
      { name: "Lexpera", status: "connected", lastPing: "1 saat", note: "Mevzuat & içtihat" },
    ],
  },
  operations: {
    drive: { path: "/Juris Drive/Operasyon", sync: "live", lastSync: "3 dk önce", files: 56 },
    docs: [
      { name: "Personel Listesi.xlsx", type: "xlsx", size: "82 KB", updated: "2 gün önce" },
      { name: "İzin Talep Formları/", type: "folder", size: "18 dosya", updated: "Dün" },
    ],
    apis: [
      { name: "SGK İşveren", status: "connected", lastPing: "1 saat", note: "Bildirim & prim" },
      { name: "e-Bordro", status: "connected", lastPing: "2 saat", note: "Maaş bordroları" },
      { name: "Google Workspace", status: "connected", lastPing: "5 dk", note: "E-posta & takvim" },
    ],
  },
  bd: {
    drive: { path: "/Juris Drive/İş Geliştirme", sync: "live", lastSync: "12 dk önce", files: 34 },
    docs: [
      { name: "Pipeline 2026.xlsx", type: "xlsx", size: "210 KB", updated: "3 saat önce", primary: true },
      { name: "Kaynak Haritası.pdf", type: "pdf", size: "480 KB", updated: "1 hafta önce" },
    ],
    apis: [
      { name: "LinkedIn Sales Nav.", status: "connected", lastPing: "10 dk", note: "Lead zenginleştirme" },
      { name: "Hubspot CRM", status: "pending", lastPing: "—", note: "Kurulum bekliyor" },
    ],
  },
  people: {
    drive: { path: "/Juris Drive/İK", sync: "live", lastSync: "28 dk önce", files: 18 },
    docs: [
      { name: "Kadro 2026.xlsx", type: "xlsx", size: "48 KB", updated: "Dün" },
      { name: "Yetki Matrisi.pdf", type: "pdf", size: "320 KB", updated: "2 hafta önce" },
    ],
    apis: [
      { name: "Google Workspace", status: "connected", lastPing: "5 dk", note: "E-posta & hesap yönetimi" },
      { name: "SGK İşveren", status: "connected", lastPing: "1 saat", note: "Bildirim & prim" },
    ],
  },
};

export function SourcesButton({ moduleKey }: { moduleKey: ModuleKey }) {
  const [open, setOpen] = useState(false);
  const src = MODULE_SOURCES[moduleKey];
  if (!src) return null;

  const connected = src.apis.filter((a) => a.status === "connected").length;
  const total = src.apis.length;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="btn btn-ghost btn-sm"
        aria-label="Kaynak bağlantıları"
      >
        <Database size={12} />
        Kaynaklar
        <span className="chip" style={{ height: 16, fontSize: 9 }}>
          {connected}/{total}
        </span>
      </button>

      {open && (
        <SourcesDrawer
          moduleKey={moduleKey}
          sources={src}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  );
}

function SourcesDrawer({
  moduleKey, sources, onClose,
}: {
  moduleKey: ModuleKey;
  sources: ModuleSources;
  onClose: () => void;
}) {
  // Lock body scroll while open
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  const moduleLabel: Record<ModuleKey, string> = {
    finance: "Finans",
    sales: "Satış",
    marketing: "Pazarlama",
    matters: "Dosyalar",
    operations: "Operasyonlar",
    bd: "İş Geliştirme",
    people: "Ekip",
  };

  const statusColor = (s: string) =>
    s === "connected" ? "#147D5C" :
    s === "pending" ? "#B4701C" : "#BC2F2C";
  const statusLabel = (s: string) =>
    s === "connected" ? "Bağlı" :
    s === "pending" ? "Bekliyor" : "Kesildi";

  const typeIcon = (t: DocRef["type"]) =>
    ({ xlsx: "📊", docx: "📄", pdf: "📕", csv: "📋", folder: "📁" }[t] ?? "📎");

  return (
    <>
      <div
        onClick={onClose}
        className="fixed inset-0 z-40 animate-fade"
        style={{ background: "rgba(10,34,64,0.45)" }}
      />
      <div
        className="fixed top-0 right-0 bottom-0 z-50 flex flex-col overflow-hidden bg-juris-paper animate-slideIn"
        style={{
          width: "min(560px, 100vw)",
          boxShadow: "-8px 0 24px rgba(10,34,64,0.18)",
        }}
      >
        {/* Header */}
        <div
          className="px-6 py-5 text-white relative"
          style={{ background: "linear-gradient(180deg, #0A2240, #1a3558)" }}
        >
          <div
            aria-hidden
            className="absolute inset-0 opacity-40 pointer-events-none"
            style={{
              backgroundImage: "radial-gradient(400px 300px at 100% 0%, rgba(188,47,44,0.30), transparent 60%)",
            }}
          />
          <div className="relative flex items-start justify-between gap-2">
            <div>
              <div className="text-[10px] uppercase tracking-[0.14em] font-semibold text-white/60 mb-1.5">
                Kaynak Bağlantıları · {moduleLabel[moduleKey]}
              </div>
              <h2
                style={{
                  fontFamily: "'Playfair Display', Georgia, serif",
                  fontSize: 24, fontWeight: 500, lineHeight: 1.1,
                }}
              >
                Bu modülün beslendiği yerler
              </h2>
              <div className="text-xs text-white/60 mt-2">
                {sources.docs.length} doküman · {sources.apis.length} entegrasyon ·{" "}
                <span className="text-[#6FBF90] font-semibold">● Senkron</span>
              </div>
            </div>
            <button
              onClick={onClose}
              aria-label="Kapat"
              className="bg-white/10 hover:bg-white/20 border-none text-white w-8 h-8 rounded flex items-center justify-center cursor-pointer flex-shrink-0"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {/* Drive */}
          <section className="px-6 py-4 border-b border-juris-line-2">
            <div className="label mb-2.5">Drive Klasörü</div>
            <div className="bg-white border border-juris-line rounded-md px-3.5 py-3 flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-md flex items-center justify-center text-white text-lg flex-shrink-0"
                style={{ background: "linear-gradient(135deg, #4285F4, #34A853)" }}
              >
                📁
              </div>
              <div className="flex-1 min-w-0">
                <div className="mono text-sm font-semibold text-juris-navy truncate">
                  {sources.drive.path}
                </div>
                <div className="text-[11px] text-juris-ink-3 mt-0.5">
                  {sources.drive.files} dosya ·{" "}
                  <span className="text-juris-success font-semibold">● Canlı</span>{" "}
                  · son {sources.drive.lastSync}
                </div>
              </div>
              <button className="btn btn-sm btn-ghost">
                Drive <ExternalLink size={11} />
              </button>
            </div>
          </section>

          {/* Documents */}
          <section className="px-6 py-4 border-b border-juris-line-2">
            <div className="flex items-center justify-between mb-2.5">
              <div className="label">
                Bağlı Dokümanlar ({sources.docs.length})
              </div>
              <button className="btn btn-sm btn-primary">
                <Plus size={11} /> Yükle
              </button>
            </div>
            <div className="flex flex-col gap-1.5">
              {sources.docs.map((d) => (
                <div
                  key={d.name}
                  className={cn(
                    "px-3 py-2.5 bg-white rounded flex items-center gap-2.5 border",
                    d.primary ? "border-juris-red/40" : "border-juris-line-2",
                  )}
                  style={d.primary ? { borderLeft: "3px solid #BC2F2C" } : undefined}
                >
                  <div className="text-lg flex-shrink-0">{typeIcon(d.type)}</div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-semibold text-juris-navy truncate">
                      {d.name}
                      {d.primary && (
                        <span
                          className="ml-2 px-1.5 py-px rounded text-[9px] font-bold uppercase tracking-wider"
                          style={{ background: "#FDF0EE", color: "#BC2F2C" }}
                        >
                          Birincil
                        </span>
                      )}
                    </div>
                    <div className="text-[10px] text-juris-ink-4 mt-0.5">
                      {d.size} · {d.updated}
                    </div>
                  </div>
                  <button className="btn btn-sm btn-ghost">Aç</button>
                </div>
              ))}
            </div>
          </section>

          {/* APIs */}
          <section className="px-6 py-4">
            <div className="flex items-center justify-between mb-2.5">
              <div className="label">Entegrasyonlar ({sources.apis.length})</div>
              <a
                href="/integrations"
                className="text-[11px] text-juris-red font-semibold hover:underline"
              >
                Tüm entegrasyonlar →
              </a>
            </div>
            <div className="flex flex-col gap-1.5">
              {sources.apis.map((a) => (
                <div
                  key={a.name}
                  className="px-3 py-2.5 bg-white border border-juris-line-2 rounded flex items-center gap-2.5"
                >
                  <span
                    className="w-2 h-2 rounded-full flex-shrink-0"
                    style={{ background: statusColor(a.status) }}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-semibold text-juris-navy truncate">
                      {a.name}
                    </div>
                    <div className="text-[10px] text-juris-ink-4 mt-0.5 truncate">{a.note}</div>
                  </div>
                  <span
                    className="text-[10px] font-semibold uppercase tracking-wider"
                    style={{ color: statusColor(a.status) }}
                  >
                    {statusLabel(a.status)}
                  </span>
                  <span className="text-[10px] text-juris-ink-4 mono min-w-[40px] text-right">
                    {a.lastPing}
                  </span>
                </div>
              ))}
            </div>
          </section>

          {/* Upload dropzone */}
          <section className="px-6 pb-8">
            <div
              className="rounded-md border-2 border-dashed border-juris-line p-6 text-center bg-white"
            >
              <Upload size={20} className="text-juris-ink-3 mx-auto mb-1.5" />
              <div className="text-sm font-medium text-juris-navy">
                Ek doküman yükle
              </div>
              <div className="text-[11px] text-juris-ink-3 mt-0.5">
                Bu modülle ilişkili dosyaları sürükle bırak ya da tıkla
              </div>
            </div>
          </section>
        </div>
      </div>
    </>
  );
}
