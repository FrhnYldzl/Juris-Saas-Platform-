export type IntegrationGroup = "legal" | "finance" | "marketing" | "productivity" | "crm";

export interface IntegrationDef {
  provider: string;
  name: string;
  description: string;
  group: IntegrationGroup;
  emoji?: string;
  authType: "oauth2" | "api_key" | "credentials" | "cert";
  docsUrl?: string;
}

export const INTEGRATION_CATALOG: IntegrationDef[] = [
  // Legal (Turkey-specific)
  { provider: "uyap", name: "UYAP Avukat Portalı", description: "Duruşma takvimi, karar ve dosya takibi", group: "legal", emoji: "⚖️", authType: "cert" },
  { provider: "etebligat", name: "e-Tebligat", description: "Tebligat takibi ve otomatik uyarılar", group: "legal", emoji: "✉️", authType: "cert" },
  { provider: "mernis", name: "MERNİS", description: "TC kimlik sorgusu ve doğrulama", group: "legal", emoji: "🪪", authType: "credentials" },
  { provider: "lexpera", name: "Lexpera", description: "Mevzuat ve içtihat veritabanı", group: "legal", emoji: "📚", authType: "api_key" },
  { provider: "kazanci", name: "Kazancı İçtihat", description: "Yargıtay & Danıştay kararları", group: "legal", emoji: "📖", authType: "api_key" },

  // Finance
  { provider: "gib_efatura", name: "GİB e-Fatura", description: "Resmi fatura kesim ve arşiv", group: "finance", emoji: "🧾", authType: "credentials" },
  { provider: "gib_earsiv", name: "GİB e-Arşiv", description: "e-Arşiv fatura", group: "finance", emoji: "📂", authType: "credentials" },
  { provider: "logo", name: "Logo Muhasebe", description: "Muhasebe yazılımıyla senkron", group: "finance", emoji: "📊", authType: "api_key" },
  { provider: "parasut", name: "Paraşüt", description: "Fatura ve ön muhasebe", group: "finance", emoji: "📋", authType: "oauth2" },
  { provider: "yapikredi", name: "Yapı Kredi Kurumsal", description: "Hesap hareketleri ve bakiye", group: "finance", emoji: "🏦", authType: "api_key" },
  { provider: "garanti", name: "Garanti BBVA", description: "Hesap hareketleri ve bakiye", group: "finance", emoji: "🏦", authType: "api_key" },
  { provider: "isbank", name: "İş Bankası", description: "Hesap hareketleri ve bakiye", group: "finance", emoji: "🏦", authType: "api_key" },
  { provider: "sgk", name: "SGK İşveren", description: "Bildirim ve prim takibi", group: "finance", emoji: "🏛️", authType: "credentials" },

  // Marketing
  { provider: "ga4", name: "Google Analytics 4", description: "Web sitesi trafik raporları", group: "marketing", emoji: "📈", authType: "oauth2" },
  { provider: "gsc", name: "Search Console", description: "SEO pozisyon ve tıklama", group: "marketing", emoji: "🔎", authType: "oauth2" },
  { provider: "linkedin_co", name: "LinkedIn Company", description: "Şirket sayfası yayın & analiz", group: "marketing", emoji: "💼", authType: "oauth2" },
  { provider: "wordpress", name: "WordPress", description: "Blog ve makale yayını", group: "marketing", emoji: "📝", authType: "api_key" },
  { provider: "mailchimp", name: "Mailchimp", description: "E-posta bülten", group: "marketing", emoji: "📧", authType: "oauth2" },

  // Productivity
  { provider: "google_drive", name: "Google Drive", description: "Dosya ve klasör senkronu", group: "productivity", emoji: "📁", authType: "oauth2" },
  { provider: "google_workspace", name: "Google Workspace", description: "Gmail & Takvim entegrasyonu", group: "productivity", emoji: "✉️", authType: "oauth2" },
  { provider: "ms_365", name: "Microsoft 365", description: "Outlook, OneDrive, Teams", group: "productivity", emoji: "🔷", authType: "oauth2" },
  { provider: "zoom", name: "Zoom", description: "Toplantı otomatik kayıt & özet", group: "productivity", emoji: "🎥", authType: "oauth2" },

  // CRM
  { provider: "linkedin_sales", name: "LinkedIn Sales Navigator", description: "Müvekkil adayı zenginleştirme", group: "crm", emoji: "🎯", authType: "oauth2" },
  { provider: "hubspot", name: "HubSpot", description: "CRM senkronu", group: "crm", emoji: "🧲", authType: "oauth2" },
];
