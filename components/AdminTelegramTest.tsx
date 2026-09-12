"use client";

import { useState } from "react";

// Admin-only: one-click test message to the operator's Telegram bot.
export function AdminTelegramTest({ configured }: { configured: boolean }) {
  const [state, setState] = useState<"idle" | "busy" | "sent" | "error" | "off">(
    configured ? "idle" : "off"
  );

  async function send() {
    setState("busy");
    const res = await fetch("/api/admin/telegram-test", { method: "POST" });
    setState(res.ok ? "sent" : res.status === 503 ? "off" : "error");
  }

  return (
    <button
      onClick={send}
      disabled={state === "busy" || state === "off"}
      title={state === "off" ? "Set TELEGRAM_BOT_TOKEN + TELEGRAM_CHAT_ID in Vercel" : undefined}
      className="focus-ring btn-press rounded-md border-2 border-hairline-strong bg-surface-2 px-3 py-2 text-sm text-ink hover:bg-surface-3 disabled:opacity-50"
    >
      {state === "busy"
        ? "Sending…"
        : state === "sent"
          ? "Telegram: sent ✓"
          : state === "error"
            ? "Telegram: failed — check logs"
            : state === "off"
              ? "Telegram: not configured"
              : "Test Telegram alert"}
    </button>
  );
}
