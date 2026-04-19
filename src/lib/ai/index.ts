import type { AIProvider, AIProviderId, AICompleteOptions, AICompleteResult } from "./types";
import { anthropicProvider } from "./providers/anthropic";
import { openaiProvider } from "./providers/openai";
import { geminiProvider } from "./providers/gemini";
import { grokProvider, mistralProvider } from "./providers/openai-compatible";

export const PROVIDERS: Record<AIProviderId, AIProvider> = {
  anthropic: anthropicProvider,
  openai: openaiProvider,
  gemini: geminiProvider,
  grok: grokProvider,
  mistral: mistralProvider,
};

export function listProviders() {
  return Object.values(PROVIDERS).map((p) => ({
    id: p.id,
    label: p.label,
    defaultModel: p.defaultModel,
    available: p.available,
  }));
}

export function getProvider(id?: AIProviderId): AIProvider {
  const defaultId = (process.env.AI_DEFAULT_PROVIDER as AIProviderId) || "anthropic";
  const chosen = id ? PROVIDERS[id] : PROVIDERS[defaultId];
  if (!chosen) throw new Error(`Unknown AI provider: ${id ?? defaultId}`);
  if (!chosen.available) {
    // Fall back to any available provider
    const fallback = Object.values(PROVIDERS).find((p) => p.available);
    if (!fallback) {
      throw new Error("Hiçbir AI sağlayıcı yapılandırılmamış. .env'de bir API anahtarı ayarlayın.");
    }
    return fallback;
  }
  return chosen;
}

export async function aiComplete(
  opts: AICompleteOptions & { provider?: AIProviderId },
): Promise<AICompleteResult> {
  const provider = getProvider(opts.provider);
  return provider.complete(opts);
}

/** Juris-specific: Turkish legal assistant system prompt */
export const JURIS_SYSTEM_PROMPT = `Sen, Türk hukuku konusunda uzman bir hukuki asistansın.
Türkçe cevap ver. Yanıtlarında:
- Mevzuat referansı ver (TBK, TMK, HMK, TCK, vb.).
- Son güncel bilgiye göre değil, genel hukuki prensiplere göre yorum yap.
- Kesin hukuki tavsiye vermediğini ve avukat onayı gerektiğini belirt.
- Kısa ve somut ol.
`;
