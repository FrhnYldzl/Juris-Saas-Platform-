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
