import { GoogleGenerativeAI } from "@google/generative-ai";
import type { AIProvider, AICompleteOptions, AICompleteResult } from "../types";

const client = process.env.GOOGLE_AI_API_KEY
  ? new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY)
  : null;

export const geminiProvider: AIProvider = {
  id: "gemini",
  label: "Google Gemini",
  defaultModel: "gemini-2.0-flash-exp",
  available: Boolean(process.env.GOOGLE_AI_API_KEY),
  async complete(opts: AICompleteOptions): Promise<AICompleteResult> {
    if (!client) throw new Error("GOOGLE_AI_API_KEY missing");
    const modelName = opts.model ?? "gemini-2.0-flash-exp";
    const model = client.getGenerativeModel({
      model: modelName,
      systemInstruction: opts.system,
    });

    const history = opts.messages
      .filter((m) => m.role !== "system")
      .map((m) => ({
        role: m.role === "assistant" ? "model" : "user",
        parts: [{ text: m.content }],
      }));
    const lastUser = history[history.length - 1];
    const prior = history.slice(0, -1);

    const chat = model.startChat({
      history: prior,
      generationConfig: {
        maxOutputTokens: opts.maxTokens ?? 2048,
        temperature: opts.temperature ?? 0.3,
      },
    });

    const res = await chat.sendMessage(lastUser?.parts[0].text ?? "");
    return {
      text: res.response.text(),
      model: modelName,
      provider: "gemini",
    };
  },
};
