"use client";

import { useState } from "react";

// Admin-only: register the site as the Telegram bot's webhook (enables the
// /stats /users … commands in the operator chat). Safe to click again.
export function AdminTelegramWebhook({ configured }: { configured: boolean }) {
  const [state, setState] = useState<string>(configured ? "idle" : "off");

  async function register() {
    setState("busy");
    const res = await fetch("/api/admin/telegram-webhook", { method: "POST" });
    const data = await res.json().catch(() => null);
    setState(res.ok ? "done" : `error: ${data?.detail ?? res.status}`);
  }

  return (
    <button
      onClick={register}
      disabled={state === "busy" || state === "off"}
      className="focus-ring btn-press rounded-md border-2 border-hairline-strong bg-surface-2 px-3 py-2 text-sm text-ink hover:bg-surface-3 disabled:opacity-50"
    >
      {state === "busy"
        ? "Registering…"
        : state === "done"
          ? "Bot commands: on ✓"
          : state === "off"
            ? "Bot: not configured"
            : state.startsWith("error")
              ? `Bot: ${state}`
              : "Enable bot commands"}
    </button>
  );
}
