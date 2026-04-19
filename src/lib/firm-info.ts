/**
 * Juris Avukatlık Ortaklığı — Ana Firma Bilgileri
 * (Landing page ve iletişim bölümleri için — canlıdaki www.juris.com.tr ile senkron)
 */

export const FIRM_INFO = {
  legalName: "Juris Avukatlık Ortaklığı",
  shortName: "Juris",
  tagline: "Özgür olmak.",
  description:
    "Juris, multi-disipliner bakış açısıyla oyun değiştiren teknolojiler ve yenilikçi iş modelleri geliştiren müvekkillerinin sektörel bilgi ve tecrübe birikimiyle en yüksek değeri sağlamayı hedefler.",

  contact: {
    email: "iletisim@jurishukuk.com",
    website: "https://www.juris.com.tr",
  },

  offices: [
    {
      city: "Ankara",
      address:
        "Beştepe Mah. Nergiz Sok. No:7A-14 Kat:8 Via Tower, Yenimahalle",
      phone: "+90 312 502 23 89",
      mobile: "+90 539 610 90 27",
      mapsUrl:
        "https://www.google.com/maps/search/?api=1&query=Via+Tower+Be%C5%9Ftepe+Mahallesi+Yenimahalle+Ankara",
    },
    {
      city: "İstanbul",
      address: "Yakında — yeni ofisimiz hazırlanıyor",
      phone: null as string | null,
      mobile: null as string | null,
      mapsUrl: null as string | null,
      comingSoon: true,
    },
  ],

  social: {
    linkedin: "https://www.linkedin.com/company/jurisavukatlik",
    instagram: "https://www.instagram.com/jurisavukatlik",
    facebook: "https://www.facebook.com/jurisavukatlik",
    youtube: "https://www.youtube.com/channel/UC28Uoq4mgAFtq2h7q4_6ypg",
  },

  practiceAreas: [
    {
      key: "corporate",
      title: "Şirketler Hukuku ve Kurumsal Yönetim",
      short: "Kurumsal yönetim, sözleşme altyapısı ve uyum.",
      icon: "Building2" as const,
    },
    {
      key: "ma",
      title: "Birleşme ve Devralmalar",
      short: "Due diligence, müzakere ve kapanış süreçleri.",
      icon: "Handshake" as const,
    },
    {
      key: "it",
      title: "Bilgi Teknolojileri Hukuku",
      short: "Teknoloji sözleşmeleri, KVKK ve siber güvenlik.",
      icon: "Cpu" as const,
    },
    {
      key: "arbitration",
      title: "Tahkim (Yerel – Uluslararası)",
      short: "ICC, ISTAC ve ad hoc tahkim dosya yönetimi.",
      icon: "Gavel" as const,
    },
    {
      key: "ip",
      title: "Fikri ve Sınai Mülkiyet",
      short: "Marka, patent, telif ve lisans yönetimi.",
      icon: "Lightbulb" as const,
    },
    {
      key: "litigation",
      title: "Dava Yönetimi",
      short: "Ticari uyuşmazlıklar, tahsilat ve uygulama.",
      icon: "Scale" as const,
    },
  ],
};
