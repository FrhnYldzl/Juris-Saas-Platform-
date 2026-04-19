import Anthropic from "@anthropic-ai/sdk";
import type { AIProvider, AICompleteOptions, AICompleteResult } from "../types";

const client = process.env.ANTHROPIC_API_KEY
  ? new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
  : null;

export const anthropicProvider: AIProvider = {
  id: "anthropic",
  label: "Anthropic Claude",
  defaultModel: "claude-opus-4-7",
  available: Boolean(process.env.ANTHROPIC_API_KEY),
  async complete(opts: AICompleteOptions): Promise<AICompleteResult> {
    if (!client) throw new Error("ANTHROPIC_API_KEY missing");
    const model = opts.model ?? "claude-opus-4-7";

    const systemMessages = opts.messages.filter((m) => m.role === "system");
    const chatMessages = opts.messages.filter((m) => m.role !== "system");
    const system = [opts.system, ...systemMessages.map((m) => m.content)]
      .filter(Boolean)
      .join("\n\n");

    const res = await client.messages.create({
      model,
      max_tokens: opts.maxTokens ?? 2048,
      temperature: opts.temperature ?? 0.3,
      system: system || undefined,
      messages: chatMessages.map((m) => ({
        role: m.role as "user" | "assistant",
        content: m.content,
      })),
    });

    const text = res.content
      .filter((b): b is Anthropic.TextBlock => b.type === "text")
      .map((b) => b.text)
      .join("\n");

    return {
      text,
      model,
      provider: "anthropic",
      inputTokens: res.usage.input_tokens,
      outputTokens: res.usage.output_tokens,
    };
  },
};
