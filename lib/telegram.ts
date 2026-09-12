// Operator alerts via a Telegram bot. Env (Vercel):
//   TELEGRAM_BOT_TOKEN — from @BotFather
//   TELEGRAM_CHAT_ID   — your chat id (message the bot once, then read it from
//                        https://api.telegram.org/bot<token>/getUpdates)
// No-op when either is unset. Never throws; alerts must not break a request.
export function telegramConfigured(): boolean {
  return !!process.env.TELEGRAM_BOT_TOKEN && !!process.env.TELEGRAM_CHAT_ID;
}

export async function notifyTelegram(text: string): Promise<void> {
  if (!telegramConfigured()) return;
  try {
    await fetch(
      `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`,
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          chat_id: process.env.TELEGRAM_CHAT_ID,
          text,
          disable_web_page_preview: true,
        }),
        signal: AbortSignal.timeout(5000),
      }
    );
  } catch (e) {
    console.error("[telegram] send failed:", e);
  }
}
