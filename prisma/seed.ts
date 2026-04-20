import { PrismaClient, UserRole, MatterType, MatterStatus, BillingType, LeadStage, ContactType, InvoiceStatus } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const firmName = process.env.BOOTSTRAP_FIRM_NAME ?? "Juris Avukatlık Ortaklığı";
  const adminEmail = (process.env.BOOTSTRAP_ADMIN_EMAIL ?? "admin@juris.local").toLowerCase();
  const adminPassword = process.env.BOOTSTRAP_ADMIN_PASSWORD ?? "juris1234";

  console.log(`🌱 Seeding: ${firmName} (admin: ${adminEmail})`);

  const slug = firmName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

  const firm = await prisma.firm.upsert({
    where: { slug },
    update: {},
    create: {
      name: firmName,
      slug,
      email: adminEmail,
      taxNumber: null,
    },
  });

  const passwordHash = await bcrypt.hash(adminPassword, 10);
  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: { passwordHash, role: UserRole.OWNER, firmId: firm.id, active: true },
    create: {
      email: adminEmail,
      name: "Av. Mehmet Yıldız",
      title: "Av.",
      role: UserRole.OWNER,
      passwordHash,
      firmId: firm.id,
    },
  });

  console.log(`✓ Admin user: ${admin.email}`);

  // Skip demo data if already seeded
  const existingMatters = await prisma.matter.count({ where: { firmId: firm.id } });
  if (existingMatters > 0) {
    console.log("✓ Demo data already present, skipping");
    return;
  }

  // Demo team members
  const sarah = await prisma.user.create({
    data: {
      email: `sarah.${slug}@juris.local`,
      name: "Av. Sarah Kılıç",
      title: "Av.",
      role: UserRole.ASSOCIATE,
      passwordHash: await bcrypt.hash("demo1234", 10),
      firmId: firm.id,
    },
  });

  const burak = await prisma.user.create({
    data: {
      email: `burak.${slug}@juris.local`,
      name: "Stj. Av. Burak Öztürk",
      title: "Stj. Av.",
      role: UserRole.PARALEGAL,
      passwordHash: await bcrypt.hash("demo1234", 10),
      firmId: firm.id,
    },
  });

  // Clients
  const teknosa = await prisma.contact.create({
    data: {
      firmId: firm.id,
      type: ContactType.COMPANY,
      name: "Teknosa İç ve Dış Ticaret A.Ş.",
      companyName: "Teknosa A.Ş.",
      taxNumber: "8330471830",
      email: "hukuk@teknosa.com",
      phone: "+90 216 528 00 00",
      isClient: true,
    },
  });

  const ayseKaya = await prisma.contact.create({
    data: {
      firmId: firm.id,
      type: ContactType.INDIVIDUAL,
      name: "Ayşe Kaya",
      email: "ayse.kaya@example.com",
      phone: "+90 532 444 55 66",
      tcNumber: "11111111110",
      isClient: true,
    },
  });

  const demoClient = await prisma.contact.create({
    data: {
      firmId: firm.id,
      type: ContactType.INDIVIDUAL,
      name: "Demo Müvekkil",
      email: "demo.muvekkil@juris.local",
      isClient: true,
    },
  });

  // Create demo client user account for portal
  await prisma.user.create({
    data: {
      email: "demo.muvekkil@juris.local",
      name: "Demo Müvekkil",
      role: UserRole.CLIENT,
      passwordHash: await bcrypt.hash("muvekkil1234", 10),
      firmId: firm.id,
    },
  });

  // Matters
  const matter1 = await prisma.matter.create({
    data: {
      firmId: firm.id,
      matterNumber: "2026-0001",
      title: "Teknosa vs. Tedarikçi — Tazminat Davası",
      type: MatterType.LITIGATION,
      status: MatterStatus.ACTIVE,
      billingType: BillingType.HOURLY,
      hourlyRate: 2500,
      clientId: teknosa.id,
      opposingParty: "ABC Elektronik Ltd. Şti.",
      courtName: "İstanbul 3. Asliye Ticaret Mahkemesi",
      courtFileNo: "2026/1234",
      description: "Sözleşme ihlali nedeniyle açılan tazminat davası.",
      assignees: {
        create: [
          { userId: admin.id, role: "lead" },
          { userId: sarah.id, role: "support" },
        ],
      },
    },
  });

  await prisma.matter.create({
    data: {
      firmId: firm.id,
      matterNumber: "2026-0002",
      title: "Ayşe Kaya — Boşanma Davası",
      type: MatterType.FAMILY,
      status: MatterStatus.ACTIVE,
      billingType: BillingType.FLAT_FEE,
      flatFee: 45000,
      clientId: ayseKaya.id,
      description: "Anlaşmalı boşanma süreci.",
      assignees: { create: { userId: sarah.id, role: "lead" } },
    },
  });

  await prisma.matter.create({
    data: {
      firmId: firm.id,
      matterNumber: "2026-0003",
      title: "Teknosa — GDPR/KVKK Uyum Danışmanlığı",
      type: MatterType.COMPLIANCE,
      status: MatterStatus.ACTIVE,
      billingType: BillingType.RETAINER,
      flatFee: 120000,
      clientId: teknosa.id,
      description: "3 aylık retainer anlaşması.",
      assignees: { create: { userId: admin.id, role: "lead" } },
    },
  });

  // Demo müvekkil için görünür bir dosya
  await prisma.matter.create({
    data: {
      firmId: firm.id,
      matterNumber: "2026-0004",
      title: "Demo Dosya — Örnek Danışmanlık",
      type: MatterType.CONSULTING,
      status: MatterStatus.ACTIVE,
      billingType: BillingType.HOURLY,
      hourlyRate: 1500,
      clientId: demoClient.id,
      description: "Portalın nasıl çalıştığını görmek için örnek.",
      assignees: { create: { userId: admin.id, role: "lead" } },
    },
  });

  // ============================================================
  // OPS · 6 Consulting + 9 Disputes — design doc exact match
  // ============================================================
  const opsClients = await Promise.all([
    prisma.contact.create({ data: { firmId: firm.id, type: "COMPANY", name: "Koç Holding A.Ş.", companyName: "Koç Holding", isClient: true, email: "hukuk@koc.com.tr" } }),
    prisma.contact.create({ data: { firmId: firm.id, type: "COMPANY", name: "Türk Telekom A.Ş.", companyName: "Türk Telekom", isClient: true, email: "compliance@tt.com.tr" } }),
    prisma.contact.create({ data: { firmId: firm.id, type: "COMPANY", name: "Akbank T.A.Ş.", companyName: "Akbank", isClient: true, email: "legal@akbank.com" } }),
    prisma.contact.create({ data: { firmId: firm.id, type: "COMPANY", name: "BioTech Lab", companyName: "BioTech Lab", isClient: true } }),
    prisma.contact.create({ data: { firmId: firm.id, type: "COMPANY", name: "Pegasus Hava Yolları", companyName: "Pegasus", isClient: true } }),
    prisma.contact.create({ data: { firmId: firm.id, type: "COMPANY", name: "Fevup Teknoloji", companyName: "Fevup", isClient: true } }),
    prisma.contact.create({ data: { firmId: firm.id, type: "COMPANY", name: "Aksoy İnşaat A.Ş.", companyName: "Aksoy İnşaat", isClient: true } }),
    prisma.contact.create({ data: { firmId: firm.id, type: "COMPANY", name: "BSH Türkiye", companyName: "BSH", isClient: true } }),
    prisma.contact.create({ data: { firmId: firm.id, type: "COMPANY", name: "Nova İnşaat", companyName: "Nova İnşaat", isClient: true } }),
    prisma.contact.create({ data: { firmId: firm.id, type: "COMPANY", name: "Zurich Sigorta", companyName: "Zurich Sigorta", isClient: true } }),
    prisma.contact.create({ data: { firmId: firm.id, type: "INDIVIDUAL", name: "Yılmaz Ailesi", isClient: true } }),
  ]);
  const [
    koc, tt, akbank, biotech, pegasus, fevup,
    aksoyC, bshC, novaC, zurichC, yilmazC,
  ] = opsClients;

  const nis = (d: number, h = 10, m = 0) => new Date(2026, 3, d, h, m);  // Nisan
  const may = (d: number, h = 10, m = 0) => new Date(2026, 4, d, h, m);  // Mayıs

  // 6 Danışmanlık (CONSULTING type)
  await prisma.matter.createMany({
    data: [
      {
        firmId: firm.id, matterNumber: "2026-D01", title: "Koç Holding — Kurumsal Yönetim",
        type: "CONSULTING", status: "ACTIVE", billingType: "RETAINER",
        clientId: koc.id, consultingCategory: "Kurumsal Yönetim",
        monthlyFee: 450000, progressPct: 72,
        nextStepTitle: "Yönetim Kurulu sunumu", nextStepAt: nis(19),
        driveFolderName: "KoçHolding-2026", documentCount: 14,
        leadAssigneeName: "Elif K.",
      },
      {
        firmId: firm.id, matterNumber: "2026-D02", title: "Türk Telekom — KVKK & Veri Koruma",
        type: "CONSULTING", status: "ACTIVE", billingType: "RETAINER",
        clientId: tt.id, consultingCategory: "KVKK & Veri Koruma",
        monthlyFee: 680000, progressPct: 58,
        nextStepTitle: "İlk denetim raporu", nextStepAt: nis(28),
        driveFolderName: "TT-KVKK-2026", documentCount: 28,
        leadAssigneeName: "Mehmet Y.",
      },
      {
        firmId: firm.id, matterNumber: "2026-D03", title: "Akbank T.A.Ş. — Sözleşme Danışmanlığı",
        type: "CONSULTING", status: "ACTIVE", billingType: "RETAINER",
        clientId: akbank.id, consultingCategory: "Sözleşme Danışmanlığı",
        monthlyFee: 380000, progressPct: 44,
        nextStepTitle: "Master agreement revizyonu", nextStepAt: nis(22),
        driveFolderName: "Akbank-Sozlesme-2026", documentCount: 36,
        leadAssigneeName: "Cem A.",
        isUrgent: true, // RISK
      },
      {
        firmId: firm.id, matterNumber: "2026-D04", title: "BioTech Lab — Fikri Mülkiyet",
        type: "CONSULTING", status: "ACTIVE", billingType: "RETAINER",
        clientId: biotech.id, consultingCategory: "Fikri Mülkiyet Danışmanlığı",
        monthlyFee: 220000, progressPct: 86,
        nextStepTitle: "Patent portföy raporu", nextStepAt: nis(30),
        driveFolderName: "BioTech-IP", documentCount: 22,
        leadAssigneeName: "Cem A.",
      },
      {
        firmId: firm.id, matterNumber: "2026-D05", title: "Pegasus Hava Yolları — Rekabet Uyum",
        type: "CONSULTING", status: "ACTIVE", billingType: "RETAINER",
        clientId: pegasus.id, consultingCategory: "Rekabet Uyum",
        monthlyFee: 290000, progressPct: 31,
        nextStepTitle: "Uyum programı taslağı", nextStepAt: may(5),
        driveFolderName: "Pegasus-Uyum", documentCount: 9,
        leadAssigneeName: "Elif K.",
      },
      {
        firmId: firm.id, matterNumber: "2026-D06", title: "Fevup Teknoloji — M&A Due Diligence",
        type: "CONSULTING", status: "ACTIVE", billingType: "FLAT_FEE",
        flatFee: 1200000,
        clientId: fevup.id, consultingCategory: "M&A Due Diligence",
        progressPct: 92,
        nextStepTitle: "Closing toplantısı", nextStepAt: nis(24),
        driveFolderName: "Fevup-MA-2026", documentCount: 41,
        leadAssigneeName: "Mehmet Y.",
      },
    ],
  });

  // 9 Uyuşmazlık (disputes)
  await prisma.matter.createMany({
    data: [
      {
        firmId: firm.id, matterNumber: "2026/412", title: "Aksoy İnşaat v. TOKİ",
        type: "LITIGATION", status: "ACTIVE", billingType: "HOURLY",
        clientId: aksoyC.id,
        disputeMethod: "DAVA", disputeSubtype: "Tazminat Davası",
        disputeValue: 8200000,
        courtName: "Ankara 4. Asliye Ticaret M.", courtFileNo: "2026/412",
        nextActionType: "Duruşma", nextActionAt: nis(16, 10, 30),
        nextHearingAt: nis(16, 10, 30),
        isUrgent: true, documentCount: 18, leadAssigneeName: "Mehmet",
      },
      {
        firmId: firm.id, matterNumber: "2026/367", title: "Yılmaz v. Yılmaz",
        type: "FAMILY", status: "ACTIVE", billingType: "FLAT_FEE",
        clientId: yilmazC.id,
        disputeMethod: "DAVA", disputeSubtype: "Boşanma & Mal Paylaşımı",
        courtName: "İstanbul 8. Aile M.", courtFileNo: "2026/367",
        nextActionType: "Duruşma", nextActionAt: new Date(new Date().setHours(14, 0, 0, 0)),
        nextHearingAt: new Date(new Date().setHours(14, 0, 0, 0)),
        isUrgent: true, documentCount: 24, leadAssigneeName: "Zeynep",
      },
      {
        firmId: firm.id, matterNumber: "2026/341", title: "BioTech v. MedCorp",
        type: "LITIGATION", status: "ACTIVE", billingType: "HOURLY",
        clientId: biotech.id,
        disputeMethod: "DAVA", disputeSubtype: "Patent İhlali",
        disputeValue: 1200000,
        courtName: "İstanbul FSHHM", courtFileNo: "2026/341",
        nextActionType: "Bilirkişi İncelemesi", nextActionAt: nis(22),
        documentCount: 32, leadAssigneeName: "Cem",
      },
      {
        firmId: firm.id, matterNumber: "2026/276", title: "BSH v. 14 işçi",
        type: "LABOR", status: "ACTIVE", billingType: "HOURLY",
        clientId: bshC.id,
        disputeMethod: "DAVA", disputeSubtype: "İşçilik Alacakları",
        disputeValue: 380000,
        courtName: "İstanbul 12. İş M.", courtFileNo: "2026/276",
        nextActionType: "Tanık Dinleme", nextActionAt: nis(30),
        documentCount: 15, leadAssigneeName: "Elif",
      },
      {
        firmId: firm.id, matterNumber: "2026/234", title: "Akbank v. Muhtelif (34 borçlu)",
        type: "LITIGATION", status: "ACTIVE", billingType: "FLAT_FEE",
        clientId: akbank.id,
        disputeMethod: "ICRA", disputeSubtype: "Kredi Takibi",
        disputeValue: 2400000,
        courtName: "Muhtelif İcra M.", courtFileNo: "2026/234",
        nextActionType: "Haciz İşlemi", isPortfolio: true,
        documentCount: 87, leadAssigneeName: "Cem",
      },
      {
        firmId: firm.id, matterNumber: "2026/198", title: "Pegasus v. 428 yolcu",
        type: "LITIGATION", status: "ACTIVE", billingType: "FLAT_FEE",
        clientId: pegasus.id,
        disputeMethod: "DAVA", disputeSubtype: "Tüketici Tazminatı",
        disputeValue: 520000,
        courtName: "İstanbul 6. Tük. M.", courtFileNo: "2026/198",
        nextActionType: "Toplu Duruşma", nextActionAt: may(5),
        nextHearingAt: may(5), isPortfolio: true,
        documentCount: 62, leadAssigneeName: "Zeynep",
      },
      {
        firmId: firm.id, matterNumber: "ISTAC-2026/12", title: "Nova İnşaat v. Yıldız",
        type: "LITIGATION", status: "ACTIVE", billingType: "HOURLY",
        clientId: novaC.id,
        disputeMethod: "TAHKIM", disputeSubtype: "Sözleşme İhlali",
        disputeValue: 3400000,
        courtName: "ISTAC", courtFileNo: "ISTAC-2026/12",
        nextActionType: "Beyan Sunma", nextActionAt: nis(18),
        isUrgent: true, documentCount: 19, leadAssigneeName: "Mehmet",
      },
      {
        firmId: firm.id, matterNumber: "SAHK-2026/88", title: "Zurich Sigorta v. Demir",
        type: "LITIGATION", status: "ACTIVE", billingType: "HOURLY",
        clientId: zurichC.id,
        disputeMethod: "SIGORTA_TAHKIM", disputeSubtype: "Kasko Tazminat",
        disputeValue: 140000,
        courtName: "SAHK", courtFileNo: "SAHK-2026/88",
        nextActionType: "Yazılı Savunma", nextActionAt: nis(20),
        isUrgent: true, documentCount: 8, leadAssigneeName: "Elif",
      },
      {
        firmId: firm.id, matterNumber: "İht-2026/14", title: "Juris → Ay Tekstil",
        type: "OTHER", status: "ON_HOLD", billingType: "FLAT_FEE",
        clientId: demoClient.id,
        disputeMethod: "IHTARNAME", disputeSubtype: "Alacak Talebi",
        disputeValue: 95000,
        courtName: "Noter", courtFileNo: "İht-2026/14",
        nextActionType: "Cevap süresi", nextActionAt: nis(25),
        documentCount: 3, leadAssigneeName: "Cem",
      },
    ],
  });

  console.log("✓ Ops data: 6 danışmanlık + 9 uyuşmazlık seeded");

  // Leads
  await prisma.lead.create({
    data: {
      firmId: firm.id,
      title: "Yıldız İnşaat — Yeni şirket kuruluşu",
      source: "Referans",
      stage: LeadStage.PROPOSAL,
      value: 85000,
      probability: 60,
      ownerId: admin.id,
      expectedCloseAt: new Date(Date.now() + 14 * 86400000),
    },
  });
  await prisma.lead.create({
    data: {
      firmId: firm.id,
      title: "Tech Startup — IP ve sözleşme",
      source: "LinkedIn",
      stage: LeadStage.QUALIFIED,
      value: 40000,
      probability: 40,
      ownerId: sarah.id,
    },
  });

  // Invoices
  await prisma.invoice.create({
    data: {
      firmId: firm.id,
      clientId: teknosa.id,
      matterId: matter1.id,
      invoiceNumber: "INV-2026-0001",
      status: InvoiceStatus.PAID,
      subtotal: 75000,
      taxRate: 20,
      tax: 15000,
      total: 90000,
      paidAt: new Date(),
      issuedAt: new Date(Date.now() - 30 * 86400000),
      items: {
        create: {
          description: "Mart 2026 - 30 saat hukuki hizmet",
          quantity: 30,
          unitPrice: 2500,
          total: 75000,
        },
      },
    },
  });

  await prisma.invoice.create({
    data: {
      firmId: firm.id,
      clientId: teknosa.id,
      invoiceNumber: "INV-2026-0002",
      status: InvoiceStatus.SENT,
      subtotal: 40000,
      taxRate: 20,
      tax: 8000,
      total: 48000,
      dueAt: new Date(Date.now() + 7 * 86400000),
      items: {
        create: {
          description: "KVKK danışmanlığı - retainer ilk dilim",
          quantity: 1,
          unitPrice: 40000,
          total: 40000,
        },
      },
    },
  });

  // ============================================================
  // BD · Network Yönetimi — 11 resources (3 şirket + 4 partner + 4 network)
  // ============================================================
  const resources = await Promise.all([
    // 3 İlişkili Şirket
    prisma.resource.create({
      data: {
        firmId: firm.id, type: "COMPANY", name: "Fevup",
        description: "Teknoloji yatırımları",
        tags: ["Teknoloji", "Yatırım"],
        heat: "HOT", score: 92, leadCount: 8,
        revenueTRY: 2400000, ownerId: admin.id,
        lastContactAt: new Date(Date.now() - 2 * 86400000),
      },
    }),
    prisma.resource.create({
      data: {
        firmId: firm.id, type: "COMPANY", name: "Marqby",
        description: "Marka & tasarım",
        tags: ["Yaratıcı", "B2B"],
        heat: "WARM", score: 74, leadCount: 3,
        revenueTRY: 680000, ownerId: sarah.id,
        lastContactAt: new Date(Date.now() - 9 * 86400000),
      },
    }),
    prisma.resource.create({
      data: {
        firmId: firm.id, type: "COMPANY", name: "Inforexpect",
        description: "Kurumsal danışmanlık",
        tags: ["Danışmanlık"],
        heat: "HOT", score: 81, leadCount: 5,
        revenueTRY: 1100000, ownerId: admin.id,
        lastContactAt: new Date(Date.now() - 5 * 86400000),
      },
    }),
    // 4 Direkt Partner
    prisma.resource.create({
      data: {
        firmId: firm.id, type: "DIRECT_PARTNER", name: "Çelikel YMM",
        description: "Yeminli mali müşavir",
        tags: ["Mali Müşavir"],
        heat: "HOT", score: 88, leadCount: 6,
        revenueTRY: 920000, ownerId: admin.id,
        lastContactAt: new Date(Date.now() - 3 * 86400000),
      },
    }),
    prisma.resource.create({
      data: {
        firmId: firm.id, type: "DIRECT_PARTNER", name: "PwC Türkiye",
        description: "Bağımsız denetim",
        tags: ["Denetim", "Global"],
        heat: "WARM", score: 65, leadCount: 2,
        revenueTRY: 450000, ownerId: admin.id,
        lastContactAt: new Date(Date.now() - 18 * 86400000),
      },
    }),
    prisma.resource.create({
      data: {
        firmId: firm.id, type: "DIRECT_PARTNER", name: "Aksu Hukuk Bürosu",
        description: "İzmir · gayrimenkul uzmanlık",
        tags: ["Hukuk", "İzmir"],
        heat: "WARM", score: 72, leadCount: 4,
        revenueTRY: 380000, ownerId: sarah.id,
        lastContactAt: new Date(Date.now() - 11 * 86400000),
      },
    }),
    prisma.resource.create({
      data: {
        firmId: firm.id, type: "DIRECT_PARTNER", name: "Sigma Eksper",
        description: "Sigorta eksperliği",
        tags: ["Sigorta"],
        heat: "COLD", score: 58, leadCount: 1,
        revenueTRY: 120000, ownerId: admin.id,
        lastContactAt: new Date(Date.now() - 28 * 86400000),
      },
    }),
    // 4 Network / Dernek
    prisma.resource.create({
      data: {
        firmId: firm.id, type: "NETWORK", name: "ETİD",
        description: "Elektronik Ticaret İşletmecileri Derneği",
        tags: ["E-Ticaret", "Üyelik"],
        heat: "HOT", score: 84, leadCount: 7,
        revenueTRY: 1400000, ownerId: admin.id,
        lastContactAt: new Date(Date.now() - 4 * 86400000),
      },
    }),
    prisma.resource.create({
      data: {
        firmId: firm.id, type: "NETWORK", name: "TİM",
        description: "Türkiye İhracatçılar Meclisi",
        tags: ["İhracat", "Üyelik"],
        heat: "WARM", score: 70, leadCount: 3,
        revenueTRY: 720000, ownerId: sarah.id,
        lastContactAt: new Date(Date.now() - 12 * 86400000),
      },
    }),
    prisma.resource.create({
      data: {
        firmId: firm.id, type: "NETWORK", name: "OAİB",
        description: "Orta Anadolu İhracatçı Birlikleri",
        tags: ["İhracat"],
        heat: "COLD", score: 48, leadCount: 1,
        revenueTRY: 180000, ownerId: admin.id,
        lastContactAt: new Date(Date.now() - 42 * 86400000),
      },
    }),
    prisma.resource.create({
      data: {
        firmId: firm.id, type: "NETWORK", name: "Sigorta Hakem Derneği",
        description: "Üye avukat",
        tags: ["Sigorta", "Hakem"],
        heat: "WARM", score: 62, leadCount: 4,
        revenueTRY: 320000, ownerId: admin.id,
        lastContactAt: new Date(Date.now() - 7 * 86400000),
      },
    }),
  ]);

  // 7 resource contacts (kilit temaslar)
  const contactsMap: Record<string, string> = {};
  for (const r of resources) contactsMap[r.name] = r.id;

  await prisma.resourceContact.createMany({
    data: [
      {
        firmId: firm.id, resourceId: contactsMap["Fevup"],
        name: "Burak Özgür", role: "Partner",
        email: "burak@fevup.com", linkedinUrl: "https://linkedin.com/in/burakozgur",
        heat: "HOT", lastContactAt: new Date(Date.now() - 2 * 86400000),
      },
      {
        firmId: firm.id, resourceId: contactsMap["Marqby"],
        name: "Seda Akın", role: "GM",
        email: "seda@marqby.com", linkedinUrl: "https://linkedin.com/in/sedaakin",
        heat: "WARM", lastContactAt: new Date(Date.now() - 9 * 86400000),
      },
      {
        firmId: firm.id, resourceId: contactsMap["Çelikel YMM"],
        name: "Ayşegül Dinç", role: "YMM",
        email: "aysegul@celikel.com.tr",
        heat: "HOT", lastContactAt: new Date(Date.now() - 3 * 86400000),
      },
      {
        firmId: firm.id, resourceId: contactsMap["PwC Türkiye"],
        name: "Hakan Yurt", role: "Direktör",
        email: "hakan.yurt@pwc.com", linkedinUrl: "https://linkedin.com/in/hakanyurt",
        heat: "WARM", lastContactAt: new Date(Date.now() - 18 * 86400000),
      },
      {
        firmId: firm.id, resourceId: contactsMap["ETİD"],
        name: "İsmail Tekin", role: "Başkan Yrd.",
        email: "ismail@etid.org", linkedinUrl: "https://linkedin.com/in/ismailtekin",
        heat: "HOT", lastContactAt: new Date(Date.now() - 4 * 86400000),
      },
      {
        firmId: firm.id, resourceId: contactsMap["TİM"],
        name: "Dr. Nihal Arslan", role: "Yön. Kur. Üye",
        email: "nihal.arslan@tim.org.tr",
        heat: "WARM", lastContactAt: new Date(Date.now() - 12 * 86400000),
      },
      {
        firmId: firm.id, resourceId: contactsMap["Aksu Hukuk Bürosu"],
        name: "Av. Mustafa Aksu", role: "Kurucu",
        email: "aksu@aksuhukuk.com", linkedinUrl: "https://linkedin.com/in/mustafaaksu",
        heat: "WARM", lastContactAt: new Date(Date.now() - 11 * 86400000),
      },
    ],
  });

  // 4 upcoming events
  const may2026 = (d: number, h = 10) => new Date(2026, 4, d, h, 0);
  const apr2026 = (d: number, h = 10) => new Date(2026, 3, d, h, 0);
  await prisma.resourceEvent.createMany({
    data: [
      {
        firmId: firm.id, resourceId: contactsMap["ETİD"],
        date: may2026(8, 14),
        eventType: "KONUŞMACI", title: "ETİD E-Ticaret Zirvesi", organizer: "ETİD",
        attendeeCount: 180, leadCount: 3, leadUserName: "Mehmet",
        calendarSynced: true,
      },
      {
        firmId: firm.id, resourceId: contactsMap["Fevup"],
        date: may2026(15, 18),
        eventType: "SPONSOR + PANELİST", title: "Fevup portföy günü", organizer: "Fevup",
        attendeeCount: 60, leadCount: 2, leadUserName: "Elif",
        calendarSynced: true,
      },
      {
        firmId: firm.id, resourceId: contactsMap["TİM"],
        date: apr2026(22, 9),
        eventType: "KATILIMCI", title: "TİM Ege Bölge Toplantısı", organizer: "TİM",
        attendeeCount: 120, leadCount: 1, leadUserName: "Mehmet",
        calendarSynced: true,
      },
      {
        firmId: firm.id, resourceId: contactsMap["PwC Türkiye"],
        date: apr2026(18, 15),
        eventType: "CO-HOST", title: "PwC Vergi Güncesi", organizer: "PwC Türkiye",
        attendeeCount: 45, leadCount: 4, leadUserName: "Cem",
        calendarSynced: true,
      },
    ],
  });

  console.log("✓ BD network data (11 resources, 7 contacts, 4 events)");

  // ============================================================
  // PAZARLAMA · 6 içerik (tasarım doc exact)
  // ============================================================
  const today = new Date();
  const daysAgo = (d: number) => new Date(today.getTime() - d * 86400000);

  await prisma.contentItem.createMany({
    data: [
      {
        firmId: firm.id,
        title: "KVKK 2026: sınır ötesi veri aktarımında yeni dönem",
        summary:
          "2026 KVKK değişikliklerinin şirketlere etkisi, sınır ötesi veri aktarımı ve otomatik karar alma yükümlülükleri — 8 dakikada uygulanabilir rehber.",
        body: "Bu içerik yayında. Editörden içeriği düzenleyebilir, AI ile türevlerini üretebilir veya metrikleri canlı takip edebilirsiniz.",
        channel: "BLOG",
        contentType: "SEO Makale",
        status: "PUBLISHED",
        author: "Elif K.",
        aiAssisted: true,
        publishedAt: daysAgo(2),
        readMinutes: 8,
        viewCount: 4820,
        leadCount: 3,
        engagementPct: 74,
        seoRank: 4,
        backlinks: 12,
        metaTitle: "KVKK 2026 Güncellemeleri — Sınır Ötesi Veri Aktarımı Rehberi",
        metaDescription:
          "2026 KVKK değişikliklerinin şirketlere etkisi, sınır ötesi veri aktarımı ve otomatik karar alma yükümlülükleri — 8 dakikada uygulanabilir rehber.",
        keywords: ["KVKK 2026", "veri koruma", "sınır ötesi veri", "GDPR Türkiye", "kişisel veri"],
        tags: ["LegalArticle", "Attorney", "FAQPage"],
      },
      {
        firmId: firm.id,
        title: "E-ticaret rekabet davaları: 2026'da beklenenler",
        summary: "2026 yılında e-ticaret sektöründe beklenen rekabet hukuku davaları ve hukuki stratejiler.",
        channel: "BLOG",
        contentType: "Vaka Notu",
        status: "REVIEW",
        author: "Mehmet Y.",
        aiAssisted: true,
        draftVersion: 3,
        tags: [],
      },
      {
        firmId: firm.id,
        title: "Aile hukukunda arabuluculuk rehberi",
        summary: "Arabuluculuğa ilişkin güncel mevzuat ve uygulama örnekleri.",
        channel: "LINKEDIN",
        contentType: "LinkedIn",
        status: "PUBLISHED",
        author: "Zeynep D.",
        aiAssisted: true,
        publishedAt: daysAgo(5),
        viewCount: 1800,
        leadCount: 2,
        engagementPct: 58,
        url: "https://linkedin.com/pulse/juris-aile-hukuku-arabuluculuk",
        tags: [],
      },
      {
        firmId: firm.id,
        title: "Patent savunmasında bilirkişi stratejisi — whitepaper",
        summary: "Patent ihlali davalarında bilirkişi raporlarının etkin kullanımı için stratejik rehber.",
        channel: "OTHER",
        contentType: "Whitepaper",
        status: "PUBLISHED",
        author: "Cem A.",
        aiAssisted: true,
        publishedAt: daysAgo(14),
        viewCount: 700,
        leadCount: 5,
        engagementPct: 82,
        tags: [],
      },
      {
        firmId: firm.id,
        title: "Q1 2026 hukuki gündem — e-bülten #42",
        summary: "Bu ayın en kritik mevzuat güncellemeleri ve yargı kararları.",
        channel: "NEWSLETTER",
        contentType: "Newsletter",
        status: "PUBLISHED",
        author: "Elif K.",
        aiAssisted: false,
        publishedAt: daysAgo(7),
        viewCount: 3100,
        leadCount: 4,
        engagementPct: 52,
        tags: [],
      },
      {
        firmId: firm.id,
        title: "Rekabet Kurulu'nun son e-ticaret kararları",
        summary: "Son 3 ayın en önemli Rekabet Kurulu kararlarından özet + pratik çıkarımlar.",
        channel: "OTHER",
        contentType: "Basın Bülteni",
        status: "DRAFT",
        author: "AI ilk draft",
        aiAssisted: true,
        draftVersion: 1,
        tags: [],
      },
    ],
  });

  console.log("✓ Marketing content data (6 items)");

  // ============================================================
  // SATIŞ · 12 deals + 5 proposal templates (tasarım doc exact)
  // ============================================================
  const nis2026 = (d: number) => new Date(2026, 3, d, 10, 0);

  await prisma.lead.createMany({
    data: [
      {
        firmId: firm.id, title: "Garanti BBVA — Kurumsal hukuk danışmanlığı",
        clientName: "Garanti BBVA", topic: "Kurumsal hukuk danışmanlığı",
        source: "Referans", pricingModel: "Retainer ₺100K/ay",
        stage: "NEGOTIATION", value: 1200000, probability: 75,
        nextActionText: "22 Nis · Karar toplantısı", nextActionAt: nis2026(22),
        assigneeName: "Mehmet",
      },
      {
        firmId: firm.id, title: "Aksa Enerji — Rekabet Kurulu şikayet savunması",
        clientName: "Aksa Enerji", topic: "Rekabet Kurulu şikayet savunması",
        source: "Network", pricingModel: "Sabit ₺850K",
        stage: "PROPOSAL", value: 858000, probability: 55,
        nextActionText: "19 Nis · Teklif revize", nextActionAt: nis2026(19),
        assigneeName: "Elif",
      },
      {
        firmId: firm.id, title: "Sabancı Holding — M&A due diligence",
        clientName: "Sabancı Holding", topic: "M&A due diligence",
        source: "Referans", pricingModel: "Proje ₺2.4M",
        stage: "MEETING", value: 2400000, probability: 68,
        nextActionText: "24 Nis · Scope sunumu", nextActionAt: nis2026(24),
        assigneeName: "Mehmet",
      },
      {
        firmId: firm.id, title: "Trendyol — KVKK uyum revizyon",
        clientName: "Trendyol", topic: "KVKK uyum revizyon",
        source: "Web", pricingModel: "Retainer ₺40K/ay",
        stage: "CONTRACT", value: 488000, probability: 88,
        nextActionText: "İç onay bekleniyor",
        assigneeName: "Elif",
      },
      {
        firmId: firm.id, title: "BSH Türkiye — İş hukuku savunma (7 dosya)",
        clientName: "BSH Türkiye", topic: "İş hukuku savunma (7 dosya)",
        source: "Referans", pricingModel: "Dosya bazlı",
        stage: "SIGNING", value: 398000, probability: 95,
        nextActionText: "Müvekkil e-imzası",
        assigneeName: "Elif",
      },
      {
        firmId: firm.id, title: "Teknosa — Tüketici davaları portföy",
        clientName: "Teknosa", topic: "Tüketici davaları portföy",
        source: "LinkedIn", pricingModel: "Saatlik",
        stage: "QUALIFIED", value: 628000, probability: 42,
        nextActionText: "20 Nis · Uygunluk toplantısı", nextActionAt: nis2026(20),
        assigneeName: "Cem",
      },
      {
        firmId: firm.id, title: "Migros — Ticari sözleşme yenileme",
        clientName: "Migros", topic: "Ticari sözleşme yenileme",
        source: "Etkinlik", pricingModel: "Sabit",
        stage: "QUALIFIED", value: 188000, probability: 50,
        nextActionText: "23 Nis · İlk görüşme", nextActionAt: nis2026(23),
        assigneeName: "Zeynep",
      },
      {
        firmId: firm.id, title: "Yapı Kredi — İcra takip portföyü",
        clientName: "Yapı Kredi", topic: "İcra takip portföyü",
        source: "Network", pricingModel: "Dosya bazlı",
        stage: "NEW", value: 960000, probability: 30,
        nextActionText: "21 Nis · İlk temas", nextActionAt: nis2026(21),
        assigneeName: "Cem",
      },
      {
        firmId: firm.id, title: "Nova Tekstil — Tahkim savunması",
        clientName: "Nova Tekstil", topic: "Tahkim savunması",
        source: "Referans", pricingModel: "Retainer + başarı primi",
        stage: "NEGOTIATION", value: 1800000, probability: 62,
        nextActionText: "25 Nis · Retainer müzakere", nextActionAt: nis2026(25),
        assigneeName: "Mehmet",
      },
      {
        firmId: firm.id, title: "Enerjisa — Düzenleme danışmanlığı",
        clientName: "Enerjisa", topic: "Düzenleme danışmanlığı",
        source: "E-bülten", pricingModel: "Retainer ₺60K/ay",
        stage: "PROPOSAL", value: 720000, probability: 58,
        nextActionText: "24 Nis · Teklif sunumu", nextActionAt: nis2026(24),
        assigneeName: "Elif",
      },
      {
        firmId: firm.id, title: "Ford Otosan — Tedarik zinciri uyum",
        clientName: "Ford Otosan", topic: "Tedarik zinciri uyum",
        source: "Referans", pricingModel: "Sabit",
        stage: "WON", value: 348000, probability: 100,
        nextActionText: "Operasyona devredildi",
        assigneeName: "Mehmet",
      },
      {
        firmId: firm.id, title: "Vestel — Patent savunma",
        clientName: "Vestel", topic: "Patent savunma",
        source: "LinkedIn", pricingModel: "Proje",
        stage: "MEETING", value: 890000, probability: 60,
        nextActionText: "26 Nis · Scope toplantısı", nextActionAt: nis2026(26),
        assigneeName: "Cem",
      },
    ],
  });

  await prisma.proposalTemplate.createMany({
    data: [
      {
        firmId: firm.id, name: "Kurumsal Danışmanlık — Retainer",
        model: "RETAINER", sectionCount: 8, usageCount: 34,
        lastUsedAt: daysAgo(3),
        driveUrl: "https://drive.google.com/juris/templates/retainer",
      },
      {
        firmId: firm.id, name: "Tek Seferlik Dava Savunması",
        model: "FLAT_FEE", sectionCount: 6, usageCount: 28,
        lastUsedAt: daysAgo(1),
        driveUrl: "https://drive.google.com/juris/templates/flat",
      },
      {
        firmId: firm.id, name: "M&A Due Diligence",
        model: "PROJECT", sectionCount: 12, usageCount: 14,
        lastUsedAt: daysAgo(7),
        driveUrl: "https://drive.google.com/juris/templates/ma",
      },
      {
        firmId: firm.id, name: "KVKK Uyum Paketi",
        model: "RETAINER_PLUS_PROJECT", sectionCount: 10, usageCount: 22,
        lastUsedAt: daysAgo(5),
        driveUrl: "https://drive.google.com/juris/templates/kvkk",
      },
      {
        firmId: firm.id, name: "İcra Takip Portföy",
        model: "FILE_BASED", sectionCount: 5, usageCount: 8,
        lastUsedAt: daysAgo(14),
        driveUrl: "https://drive.google.com/juris/templates/icra",
      },
    ],
  });

  console.log("✓ Sales data (12 deals, 5 proposal templates)");

  console.log("✓ Demo data seeded");
  console.log("");
  console.log("Giriş bilgileri:");
  console.log(`  Yönetici: ${adminEmail} / ${adminPassword}`);
  console.log(`  Avukat  : sarah.${slug}@juris.local / demo1234`);
  console.log(`  Stajyer : burak.${slug}@juris.local / demo1234`);
  console.log(`  Müvekkil: demo.muvekkil@juris.local / muvekkil1234`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
