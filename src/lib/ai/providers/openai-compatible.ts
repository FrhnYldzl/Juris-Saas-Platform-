import OpenAI from "openai";
import type { AIProvider, AICompleteOptions, AICompleteResult, AIProviderId } from "../types";

/** Generic adapter for OpenAI-compatible APIs (Grok/xAI, Mistral, DeepSeek). */
export function makeOpenAICompatible(config: {
  id: AIProviderId;
  label: string;
  baseURL: string;
  apiKey: string | undefined;
  defaultModel: string;
}): AIProvider {
  const client = config.apiKey
    ? new OpenAI({ apiKey: config.apiKey, baseURL: config.baseURL })
    : null;

  return {
    id: config.id,
    label: config.label,
    defaultModel: config.defaultModel,
    available: Boolean(config.apiKey),
    async complete(opts: AICompleteOptions): Promise<AICompleteResult> {
      if (!client) throw new Error(`${config.id.toUpperCase()} API key missing`);
      const model = opts.model ?? config.defaultModel;

      const messages = [
        ...(opts.system ? [{ role: "system" as const, content: opts.system }] : []),
        ...opts.messages.map((m) => ({ role: m.role, content: m.content })),
      ];

      const res = await client.chat.completions.create({
        model,
        messages,
        max_tokens: opts.maxTokens ?? 2048,
        temperature: opts.temperature ?? 0.3,
      });

      return {
        text: res.choices[0]?.message?.content ?? "",
        model,
        provider: config.id,
        inputTokens: res.usage?.prompt_tokens,
        outputTokens: res.usage?.completion_tokens,
      };
    },
  };
}

export const grokProvider = makeOpenAICompatible({
  id: "grok",
  label: "xAI Grok",
  baseURL: "https://api.x.ai/v1",
  apiKey: process.env.XAI_API_KEY,
  defaultModel: "grok-2-1212",
});

export const mistralProvider = makeOpenAICompatible({
  id: "mistral",
  label: "Mistral (EU)",
  baseURL: "https://api.mistral.ai/v1",
  apiKey: process.env.MISTRAL_API_KEY,
  defaultModel: "mistral-large-latest",
});
