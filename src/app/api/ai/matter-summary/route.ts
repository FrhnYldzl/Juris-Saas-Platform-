import { NextResponse } from "next/server";
import { z } from "zod";
import { requireTenant } from "@/lib/tenancy";
import { can } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { aiComplete } from "@/lib/ai";
import { audit } from "@/lib/audit";
import { formatDateTR, formatTRY } from "@/lib/utils";
import { matterTypeLabel, taskStatusLabel, eventTypeLabel } from "@/lib/labels";
import type { AIProviderId } from "@/lib/ai/types";

const schema = z.object({
  matterId: z.string().min(1),
  provider: z.enum(["anthropic", "openai", "gemini", "grok", "mistral"]).optional(),
});

const SYSTEM_PROMPT = `Sen Türk hukuku konusunda uzman bir avukat asistanısın.
Sana bir dosyanın (dava/danışmanlık) tüm verisi verilecek:
müvekkil bilgisi, dosya özeti, taraflar, mahkeme, görevler, notlar, etkinlikler, zaman kayıtları, faturalar.

Görevin: **kısa, profesyonel, yönetici seviyesi** bir özet üret. Şu formatta Markdown:

## Özet
(1-2 paragraf, dosyanın durumu ve gidişatı)

## Kilit Olaylar (kronolojik)
- (tarih + olay)

## Açık Konular
- (çözülmemiş görev / risk / karar bekleniyor)

## Sonraki Adımlar
- (somut, yapılacak işler)

## Finansal Durum
(faturalanan, tahsil edilen, kalan saat)

Türkçe yaz. Emin olmadığın hukuki görüşleri "yorum gerekiyor" notu düş.
Asla gerçek olmayan bilgi uydurma.`;

export async function POST(req: Request) {
  try {
    const { firmId, userId, role } = await requireTenant();
    if (!can(role, "ai.use") || !can(role, "matter.view")) {
      return NextResponse.json({ error: "Yetki yok" }, { status: 403 });
    }

    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Geçersiz istek" }, { status: 400 });
    }

    const matter = await prisma.matter.findFirst({
      where: { id: parsed.data.matterId, firmId },
      include: {
        client: true,
        assignees: { include: { user: { select: { name: true } } } },
        notes: {
          orderBy: { createdAt: "desc" },
          take: 50,
          include: { author: { select: { name: true } } },
        },
        tasks: { orderBy: { createdAt: "desc" }, take: 30 },
        events: { orderBy: { startsAt: "desc" }, take: 30 },
        timeEntries: { orderBy: { startedAt: "desc" }, take: 50 },
        invoices: true,
        documents: { orderBy: { createdAt: "desc" }, take: 20 },
      },
    });

    if (!matter) {
      return NextResponse.json({ error: "Dosya bulunamadı" }, { status: 404 });
    }

    const clientName =
      matter.client?.type === "COMPANY"
        ? matter.client.companyName ?? matter.client.name
        : matter.client?.name ?? "—";

    const totalHours = matter.timeEntries.reduce((s, t) => s + t.durationMin, 0) / 60;
    const billedTotal = matter.invoices
      .filter((i) => i.status === "PAID" || i.status === "SENT")
      .reduce((s, i) => s + i.total.toNumber(), 0);
    const paidTotal = matter.invoices
      .filter((i) => i.status === "PAID")
      .reduce((s, i) => s + i.total.toNumber(), 0);

    // Build a compact context document (~2-5k tokens)
    const context = `
# Dosya: ${matter.matterNumber} — ${matter.title}

## Temel Bilgi
- Müvekkil: ${clientName}
- Tür: ${matterTypeLabel(matter.type)}
- Durum: ${matter.status}
- Açılış: ${formatDateTR(matter.openedAt)}
${matter.courtName ? `- Mahkeme: ${matter.courtName}` : ""}
${matter.courtFileNo ? `- Esas No: ${matter.courtFileNo}` : ""}
${matter.opposingParty ? `- Karşı Taraf: ${matter.opposingParty}` : ""}
${matter.nextHearingAt ? `- Sıradaki Duruşma: ${formatDateTR(matter.nextHearingAt)}` : ""}

## Açıklama
${matter.description ?? "(açıklama yok)"}

## Sorumlular
${matter.assignees.map((a) => `- ${a.user.name} (${a.role})`).join("\n") || "- (atanmamış)"}

## Görevler (${matter.tasks.length})
${matter.tasks.length === 0 ? "(görev yok)" : matter.tasks
  .map((t) => `- [${taskStatusLabel(t.status)}] ${t.title}${t.dueAt ? ` (son tarih: ${formatDateTR(t.dueAt)})` : ""}`)
  .join("\n")}

## Etkinlikler (${matter.events.length})
${matter.events.length === 0 ? "(etkinlik yok)" : matter.events
  .map((e) => `- ${formatDateTR(e.startsAt)} [${eventTypeLabel(e.type)}] ${e.title}${e.location ? ` @ ${e.location}` : ""}`)
  .join("\n")}

## Notlar (${matter.notes.length}, en yeni önce)
${matter.notes.length === 0 ? "(not yok)" : matter.notes
  .slice(0, 20)
  .map((n) => `### ${formatDateTR(n.createdAt)} — ${n.author.name}\n${n.body}`)
  .join("\n\n")}

## Zaman Kayıtları (${matter.timeEntries.length} kayıt, toplam ${totalHours.toFixed(1)}h)
${matter.timeEntries.slice(0, 20).map((t) => `- ${formatDateTR(t.startedAt)}: ${(t.durationMin / 60).toFixed(1)}h — ${t.description}`).join("\n")}

## Finansal
- Toplam kesilen fatura: ${formatTRY(billedTotal)}
- Tahsil edilen: ${formatTRY(paidTotal)}
- Fatura sayısı: ${matter.invoices.length}

## Belgeler (${matter.documents.length})
${matter.documents.map((d) => `- ${d.name} (${d.category ?? "diğer"})`).join("\n") || "(belge yok)"}
`.trim();

    const result = await aiComplete({
      provider: parsed.data.provider as AIProviderId | undefined,
      system: SYSTEM_PROMPT,
      messages: [
        { role: "user", content: `Aşağıdaki dosyayı özetle:\n\n${context}` },
      ],
      maxTokens: 1500,
      temperature: 0.2,
    });

    // Save summary to the last note (or first document with empty summary)
    // For now, just return it; v0.6 will persist per-matter AI summary
    await audit({
      firmId,
      actorId: userId,
      action: "ai.matter_summary",
      entityType: "matter",
      entityId: matter.id,
      diff: {
        provider: result.provider,
        model: result.model,
        inputTokens: result.inputTokens,
        outputTokens: result.outputTokens,
      },
    });

    return NextResponse.json({
      summary: result.text,
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
