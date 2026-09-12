import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isAdminUser } from "@/lib/admins";
import { notifyTelegram, telegramConfigured } from "@/lib/telegram";

// POST /api/admin/telegram-test — admin-only: send a test alert to the
// operator's Telegram so the bot token / chat id can be verified from the
// admin panel without waiting for a real sign-up.
export const dynamic = "force-dynamic";

export async function POST() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "auth_required" }, { status: 401 });
  }
  if (!isAdminUser(user)) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }
  if (!telegramConfigured()) {
    return NextResponse.json({ error: "telegram_off" }, { status: 503 });
  }
  await notifyTelegram(
    `✅ ZeroFans alerts connected.\nSent from the admin panel at ${new Date().toISOString()}.`
  );
  return NextResponse.json({ ok: true });
}
