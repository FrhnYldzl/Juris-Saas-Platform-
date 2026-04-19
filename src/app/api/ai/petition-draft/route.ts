import { NextResponse } from "next/server";
import { z } from "zod";
import { requireTenant } from "@/lib/tenancy";
import { can } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { aiComplete } from "@/lib/ai";
import { audit } from "@/lib/audit";
import type { AIProviderId } from "@/lib/ai/types";

const PETITION_TYPES = [
  "dava_dilekcesi",
  "cevap_dilekcesi",
  "itiraz_dilekcesi",
  "icra_takip_talebi",
  "tazminat_talebi",
  "fesih_bildirimi",
  "ihtarname",
  "dilekce_genel",
] as const;

const schema = z.object({
  matterId: z.string().optional().nullable(),
  type: z.enum(PETITION_TYPES),
  subject: z.string().min(5, "Konu en az 5 karakter"),
  facts: z.string().min(20, "Olaylar en az 20 karakter"),
  requests: z.string().optional().nullable(),
  extraContext: z.string().optional().nullable(),
  provider: z.enum(["anthropic", "openai", "gemini", "grok", "mistral"]).optional(),
});

const TYPE_LABELS: Record<string, string> = {
  dava_dilekcesi: "Dava Dilekçesi",
  cevap_dilekcesi: "Cevap Dilekçesi",
  itiraz_dilekcesi: "İtiraz Dilekçesi",
  icra_takip_talebi: "İcra Takip Talebi",
  tazminat_talebi: "Tazminat Talebi",
  fesih_bildirimi: "Fesih Bildirimi",
  ihtarname: "İhtarname",
  dilekce_genel: "Genel Dilekçe",
};

const SYSTEM_PROMPT = `Sen, Türk hukukunda 25 yıl deneyimli bir avukatsın.
Kullanıcı sana bir dilekçe türü, konu, olaylar ve talepler verecek.
Sen profesyonel, mahkemeye sunulabilir kalitede bir dilekçe TASLAĞI hazırlayacaksın.

Kurallar:
- Türkçe, resmi dil, Türk hukuk dilekçe formatı
- Başlık: mahkeme adı (boş bırak — placeholder [MAHKEME ADI])
- Taraflar: [DAVACI: ...], [DAVALI: ...] placeholder'ları
- Konu, Olaylar (kronolojik), Hukuki Sebepler, Deliller, Sonuç ve Talep bölümleri
- TBK, TMK, HMK, TCK, İİK gibi **gerçek** mevzuat maddelerine atıf yap, UYDURMA
- Emin olmadığın atıfları [İLGİLİ MADDE] şeklinde placeholder bırak
- Sonunda [Avukat İmzası] ve [Tarih] placeholder'ları
- Maksimum 800 kelime

ÖNEMLİ: Bu bir TASLAK'tır. Her zaman başında ve sonunda avukat kontrolü gerektiğini belirt.`;

export async function POST(req: Request) {
  try {
    const { firmId, userId, role } = await requireTenant();
    if (!can(role, "ai.use")) {
      return NextResponse.json({ error: "Yetki yok" }, { status: 403 });
    }

    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Geçersiz istek", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const d = parsed.data;

    // Optional matter context
    let matterContext = "";
    if (d.matterId) {
      const matter = await prisma.matter.findFirst({
        where: { id: d.matterId, firmId },
        include: { client: true },
      });
      if (matter) {
        const clientName =
          matter.client?.type === "COMPANY"
            ? matter.client.companyName ?? matter.client.name
            : matter.client?.name ?? null;
        matterContext = `
İLGİLİ DOSYA:
- Dosya No: ${matter.matterNumber}
- Başlık: ${matter.title}
${clientName ? `- Müvekkil: ${clientName}` : ""}
${matter.opposingParty ? `- Karşı Taraf: ${matter.opposingParty}` : ""}
${matter.courtName ? `- Mahkeme: ${matter.courtName}` : ""}
${matter.courtFileNo ? `- Esas No: ${matter.courtFileNo}` : ""}
`.trim();
      }
    }

    const userPrompt = `
${matterContext}

DİLEKÇE TÜRÜ: ${TYPE_LABELS[d.type] ?? d.type}
KONU: ${d.subject}

OLAYLAR:
${d.facts}

${d.requests ? `TALEPLER:\n${d.requests}\n` : ""}
${d.extraContext ? `EK BAĞLAM:\n${d.extraContext}\n` : ""}

Yukarıdaki bilgileri kullanarak profesyonel bir dilekçe taslağı hazırla.
`.trim();

    const result = await aiComplete({
      provider: d.provider as AIProviderId | undefined,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: userPrompt }],
      maxTokens: 2500,
      temperature: 0.3,
    });

    await audit({
      firmId, actorId: userId,
      action: "ai.petition_draft",
      entityType: d.matterId ? "matter" : "ai",
      entityId: d.matterId ?? undefined,
      diff: {
        type: d.type,
        provider: result.provider,
        model: result.model,
        inputTokens: result.inputTokens,
        outputTokens: result.outputTokens,
      },
    });

    return NextResponse.json({
      draft: result.text,
      type: d.type,
      typeLabel: TYPE_LABELS[d.type],
      model: result.model,
      provider: result.provider,
      inputTokens: result.inputTokens,
      outputTokens: result.outputTokens,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "AI hatası";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
