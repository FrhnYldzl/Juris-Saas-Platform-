import { NextResponse } from "next/server";
import { z } from "zod";
import { requireTenant } from "@/lib/tenancy";
import { can } from "@/lib/rbac";
import { aiComplete, JURIS_SYSTEM_PROMPT } from "@/lib/ai";
import { audit } from "@/lib/audit";
import type { AIProviderId } from "@/lib/ai/types";

const schema = z.object({
  messages: z.array(
    z.object({
      role: z.enum(["user", "assistant"]),
      content: z.string().min(1).max(20000),
    }),
  ).min(1).max(40),
  provider: z.enum(["anthropic", "openai", "gemini", "grok", "mistral"]).optional(),
  model: z.string().optional(),
  system: z.string().max(4000).optional(),
});

export async function POST(req: Request) {
  try {
    const { firmId, userId, role } = await requireTenant();
    if (!can(role, "ai.use")) {
      return NextResponse.json({ error: "AI erişim izniniz yok" }, { status: 403 });
    }

    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Geçersiz istek", details: parsed.error.flatten() }, { status: 400 });
    }

    const { messages, provider, model, system } = parsed.data;

    const result = await aiComplete({
      provider: provider as AIProviderId | undefined,
      model,
      system: system ?? JURIS_SYSTEM_PROMPT,
      messages,
      maxTokens: 2048,
    });

    await audit({
      firmId,
      actorId: userId,
      action: "ai.chat",
      entityType: "ai",
      diff: {
        provider: result.provider,
        model: result.model,
        inputTokens: result.inputTokens,
        outputTokens: result.outputTokens,
      },
    });

    return NextResponse.json(result);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "AI hatası";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
