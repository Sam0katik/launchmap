import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import {
  telegramConfigured,
  telegramWebhookSecret,
  isOperatorChat,
  tgApi,
} from "@/lib/telegram";
import { handleTelegramCommand, BUTTON_COMMANDS, REPLY_KEYBOARD } from "@/lib/telegram-commands";

// POST /api/telegram/webhook — Telegram delivers bot updates here (registered
// from the admin panel). Two gates before anything runs:
//   1. X-Telegram-Bot-Api-Secret-Token must equal our derived secret
//      (timing-safe) — nobody but Telegram can call this;
//   2. the message must come from the operator chat (TELEGRAM_CHAT_ID) —
//      anyone else who finds the bot gets silence.
// Always answers 200 so Telegram doesn't retry.
export const dynamic = "force-dynamic";
export const maxDuration = 30;

export async function POST(req: NextRequest) {
  if (!telegramConfigured()) return NextResponse.json({ ok: true });

  const given = req.headers.get("x-telegram-bot-api-secret-token") ?? "";
  const expected = telegramWebhookSecret();
  const valid =
    given.length === expected.length &&
    crypto.timingSafeEqual(Buffer.from(given), Buffer.from(expected));
  if (!valid) return NextResponse.json({ ok: true });

  const update = (await req.json().catch(() => null)) as {
    message?: { chat?: { id?: number }; text?: string };
  } | null;
  const msg = update?.message;
  if (!msg?.chat?.id || !isOperatorChat(msg.chat.id)) {
    return NextResponse.json({ ok: true });
  }
  const text = (msg.text ?? "").trim();
  if (!text.startsWith("/") && !(text in BUTTON_COMMANDS)) {
    return NextResponse.json({ ok: true });
  }

  const reply = await handleTelegramCommand(text);
  await tgApi("sendMessage", {
    chat_id: msg.chat.id,
    text: reply.slice(0, 4000),
    disable_web_page_preview: true,
    reply_markup: REPLY_KEYBOARD,
  });
  return NextResponse.json({ ok: true });
}
