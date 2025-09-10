export const ALLOWED_MODELS: readonly string[] = [
"openrouter/sonoma-sky-alpha",
"deepseek/deepseek-chat-v3.1:free",
"openrouter/sonoma-dusk-alpha",
"deepseek/deepseek-chat-v3-0324:free",
"mistralai/mistral-small-3.2-24b-instruct:free",
"meta-llama/llama-4-maverick:free",
"qwen/qwen2.5-vl-72b-instruct:free"
] as const;

// Default model to fall back to when input is invalid or missing
export const DEFAULT_MODEL = ALLOWED_MODELS[0]

export function sanitizeModel(input?: string | null): string {
  const candidate = (input || "").trim();
  if (!candidate) return DEFAULT_MODEL;
  if (ALLOWED_MODELS.includes(candidate)) return candidate;
  return DEFAULT_MODEL;
}
