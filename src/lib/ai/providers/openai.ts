import OpenAI from "openai";
import type { AIProvider, AICompleteOptions, AICompleteResult } from "../types";

const client = process.env.OPENAI_API_KEY
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null;

export const openaiProvider: AIProvider = {
  id: "openai",
  label: "OpenAI",
  defaultModel: "gpt-4o",
  available: Boolean(process.env.OPENAI_API_KEY),
  async complete(opts: AICompleteOptions): Promise<AICompleteResult> {
    if (!client) throw new Error("OPENAI_API_KEY missing");
    const model = opts.model ?? "gpt-4o";

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
      provider: "openai",
      inputTokens: res.usage?.prompt_tokens,
      outputTokens: res.usage?.completion_tokens,
    };
  },
};
