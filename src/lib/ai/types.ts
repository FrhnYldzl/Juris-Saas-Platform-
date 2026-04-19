export type AIProviderId = "anthropic" | "openai" | "gemini" | "grok" | "mistral";

export interface AIMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface AICompleteOptions {
  model?: string;
  messages: AIMessage[];
  maxTokens?: number;
  temperature?: number;
  /** Optional system prompt shortcut (prepended as a "system" message). */
  system?: string;
}

export interface AICompleteResult {
  text: string;
  model: string;
  provider: AIProviderId;
  inputTokens?: number;
  outputTokens?: number;
}

export interface AIProvider {
  id: AIProviderId;
  label: string;
  defaultModel: string;
  available: boolean;
  complete(opts: AICompleteOptions): Promise<AICompleteResult>;
}
