import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isAdminUser } from "@/lib/admins";
import { telegramConfigured, telegramWebhookSecret, tgApi } from "@/lib/telegram";
import { REPLY_KEYBOARD } from "@/lib/telegram-commands";

// POST /api/admin/telegram-webhook — admin-only: (re)register this site as the
// bot's webhook so /stats, /users … work in the operator chat.
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "auth_required" }, { status: 401 });
  if (!isAdminUser(user)) return NextResponse.json({ error: "not_found" }, { status: 404 });
  if (!telegramConfigured()) return NextResponse.json({ error: "telegram_off" }, { status: 503 });

  const origin =
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") || req.nextUrl.origin;
  const res = await tgApi("setWebhook", {
    url: `${origin}/api/telegram/webhook`,
    secret_token: telegramWebhookSecret(),
    allowed_updates: ["message"],
    drop_pending_updates: true,
  });
  if (!res?.ok) {
    return NextResponse.json(
      { error: "setwebhook_failed", detail: res?.description ?? "no response" },
      { status: 502 }
    );
  }
  await tgApi("setMyCommands", {
    commands: [
      { command: "stats", description: "Totals + today's usage" },
      { command: "today", description: "What happened today" },
      { command: "users", description: "Last users" },
      { command: "maps", description: "Last maps" },
      { command: "topups", description: "Last top-ups" },
      { command: "user", description: "One user: /user <login>" },
      { command: "help", description: "All commands" },
    ],
  });
  // Show the button keyboard right away.
  await tgApi("sendMessage", {
    chat_id: process.env.TELEGRAM_CHAT_ID,
    text: "Bot commands enabled — use the buttons below.",
    reply_markup: REPLY_KEYBOARD,
  });
  return NextResponse.json({ ok: true, url: `${origin}/api/telegram/webhook` });
}
