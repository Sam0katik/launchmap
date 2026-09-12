import crypto from "crypto";

// Operator alerts + a small query bot over Telegram. Env (Vercel):
//   TELEGRAM_BOT_TOKEN — from @BotFather
//   TELEGRAM_CHAT_ID   — the operator's chat id (the ONLY chat the bot talks to)
// No-op when either is unset. Never throws; alerts must not break a request.

const API = "https://api.telegram.org";

export function telegramConfigured(): boolean {
  return !!process.env.TELEGRAM_BOT_TOKEN && !!process.env.TELEGRAM_CHAT_ID;
}

/** Raw Bot API call. Returns the parsed JSON (or null on any failure). */
export async function tgApi(
  method: string,
  body: Record<string, unknown>
): Promise<{ ok?: boolean; description?: string; result?: unknown } | null> {
  if (!process.env.TELEGRAM_BOT_TOKEN) return null;
  try {
    const res = await fetch(`${API}/bot${process.env.TELEGRAM_BOT_TOKEN}/${method}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(8000),
    });
    return (await res.json().catch(() => null)) as ReturnType<typeof tgApi> extends Promise<infer T> ? T : never;
  } catch (e) {
    console.error("[telegram]", method, "failed:", e);
    return null;
  }
}

/** Send a plain-text message to the operator chat. */
export async function notifyTelegram(text: string): Promise<void> {
  if (!telegramConfigured()) return;
  await tgApi("sendMessage", {
    chat_id: process.env.TELEGRAM_CHAT_ID,
    text: text.slice(0, 4000),
    disable_web_page_preview: true,
  });
}

/**
 * Secret Telegram must echo in `X-Telegram-Bot-Api-Secret-Token` on every
 * webhook call. Derived from the bot token so no extra env var is needed;
 * rotating the token rotates the secret (re-register the webhook then).
 */
export function telegramWebhookSecret(): string {
  return crypto
    .createHmac("sha256", process.env.TELEGRAM_BOT_TOKEN ?? "")
    .update("zerofans-telegram-webhook")
    .digest("hex")
    .slice(0, 64);
}

/** True if `chatId` is the operator chat. */
export function isOperatorChat(chatId: unknown): boolean {
  return String(chatId) === String(process.env.TELEGRAM_CHAT_ID ?? "");
}
