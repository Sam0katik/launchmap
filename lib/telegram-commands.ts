import { createAdminClient } from "@/lib/supabase/admin";
import { formatUsd } from "@/lib/billing";

// Read-mostly query commands the operator can send to the bot. Every command
// runs with the service role — the webhook route only forwards messages from
// the operator chat after verifying Telegram's secret header.

const HELP = [
  "ZeroFans bot — commands:",
  "/stats — totals + today's budget counters",
  "/users [n] — last n users (default 10)",
  "/maps [n] — last n maps",
  "/topups [n] — last n top-ups",
  "/user <github login | uuid> — one user in detail",
  "/block <login|uuid>, /unblock <login|uuid>",
  "/help",
].join("\n");

type Row = Record<string, unknown>;

function n(v: unknown): number {
  return typeof v === "number" ? v : 0;
}
function d(v: unknown): string {
  return typeof v === "string" ? v.slice(0, 16).replace("T", " ") : "—";
}
function clampN(arg: string | undefined, def = 10): number {
  const v = Number(arg);
  return Number.isInteger(v) && v > 0 ? Math.min(v, 30) : def;
}

async function userRows(limit: number, filter?: string): Promise<Row[]> {
  const admin = createAdminClient();
  const { data: users } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
  let list = (users?.users ?? []).sort((a, b) => (b.created_at > a.created_at ? 1 : -1));
  if (filter) {
    const f = filter.toLowerCase();
    list = list.filter((u) => {
      const gh = ((u.identities ?? []).find((i) => i.provider === "github")?.identity_data ?? {}) as Row;
      const login = String(gh.user_name ?? gh.preferred_username ?? "").toLowerCase();
      return u.id === filter || login === f || (u.email ?? "").toLowerCase() === f;
    });
  }
  list = list.slice(0, limit);
  const ids = list.map((u) => u.id);
  const [{ data: profiles }, { data: runs }] = await Promise.all([
    admin.from("profiles").select("id, balance_cents, blocked, reddit_accounts").in("id", ids),
    admin.from("runs").select("user_id, unlocked").in("user_id", ids),
  ]);
  const pById = new Map((profiles ?? []).map((p) => [p.id as string, p]));
  return list.map((u) => {
    const gh = ((u.identities ?? []).find((i) => i.provider === "github")?.identity_data ?? {}) as Row;
    const p = pById.get(u.id) ?? {};
    const mine = (runs ?? []).filter((r) => r.user_id === u.id);
    return {
      id: u.id,
      login: String(gh.user_name ?? gh.preferred_username ?? "—"),
      email: u.email ?? "—",
      created: u.created_at,
      last_sign_in: u.last_sign_in_at ?? null,
      balance: n((p as Row).balance_cents),
      blocked: (p as Row).blocked === true,
      maps: mine.length,
      unlocked: mine.filter((r) => r.unlocked).length,
      reddit: Array.isArray((p as Row).reddit_accounts) ? ((p as Row).reddit_accounts as Row[]).length : 0,
    };
  });
}

export async function handleTelegramCommand(text: string): Promise<string> {
  const [cmdRaw, ...args] = text.trim().split(/\s+/);
  const cmd = cmdRaw.toLowerCase().replace(/@.+$/, "");
  const admin = createAdminClient();

  try {
    switch (cmd) {
      case "/start":
      case "/help":
        return HELP;

      case "/stats": {
        const today = new Date().toISOString().slice(0, 10);
        const [users, profiles, runs, unlocked, topups, paid, counters, balance] = await Promise.all([
          admin.auth.admin.listUsers({ page: 1, perPage: 1 }),
          admin.from("profiles").select("id", { count: "exact", head: true }),
          admin.from("runs").select("id", { count: "exact", head: true }),
          admin.from("runs").select("id", { count: "exact", head: true }).eq("unlocked", true),
          admin.from("topups").select("id", { count: "exact", head: true }),
          admin.from("topups").select("amount_cents, amount_rub").eq("credited", true),
          admin.from("daily_counters").select("key, count").eq("day", today),
          admin.from("profiles").select("balance_cents"),
        ]);
        const paidUsd = (paid.data ?? []).reduce((s, r) => s + n(r.amount_cents), 0);
        const paidRub = (paid.data ?? []).reduce((s, r) => s + n(r.amount_rub), 0);
        const totalBal = (balance.data ?? []).reduce((s, r) => s + n(r.balance_cents), 0);
        const c = (counters.data ?? [])
          .filter((r) => !String(r.key).startsWith("apify:"))
          .map((r) => `${r.key}=${r.count}`)
          .join(", ");
        return [
          `👥 Users: ${(users.data as { total?: number } | null)?.total ?? profiles.count ?? "?"}`,
          `🗺 Maps: ${runs.count ?? 0} (unlocked ${unlocked.count ?? 0})`,
          `💳 Top-ups: ${topups.count ?? 0}, paid ${paid.data?.length ?? 0} = ${formatUsd(paidUsd)} / ${paidRub} ₽`,
          `💰 Balances outstanding: ${formatUsd(totalBal)}`,
          `📊 Today: ${c || "no usage yet"}`,
        ].join("\n");
      }

      case "/users": {
        const rows = await userRows(clampN(args[0]));
        if (rows.length === 0) return "No users.";
        return rows
          .map(
            (r) =>
              `${r.blocked ? "⛔ " : ""}${r.login} · ${r.email}\n   ${formatUsd(n(r.balance))} · maps ${r.maps}/${r.unlocked} unlocked · joined ${d(r.created)}`
          )
          .join("\n");
      }

      case "/maps": {
        const { data: runs } = await admin
          .from("runs")
          .select("id, user_id, product_url, unlocked, created_at")
          .order("created_at", { ascending: false })
          .limit(clampN(args[0]));
        if (!runs || runs.length === 0) return "No maps.";
        const ids = Array.from(new Set(runs.map((r) => r.user_id as string)));
        const { data: profiles } = await admin.from("profiles").select("id, username").in("id", ids);
        const name = new Map((profiles ?? []).map((p) => [p.id as string, String(p.username ?? "—")]));
        return runs
          .map((r) => `${r.unlocked ? "🔓" : "🔒"} ${r.product_url}\n   ${name.get(r.user_id as string) ?? r.user_id} · ${d(r.created_at)}`)
          .join("\n");
      }

      case "/topups": {
        const { data: rows } = await admin
          .from("topups")
          .select("user_id, amount_cents, amount_rub, status, provider_status, created_at")
          .order("created_at", { ascending: false })
          .limit(clampN(args[0]));
        if (!rows || rows.length === 0) return "No top-ups yet.";
        return rows
          .map((r) => `${r.status === "paid" ? "✅" : r.status === "canceled" ? "❌" : "⏳"} ${formatUsd(n(r.amount_cents))} (${r.amount_rub ?? "?"} ₽) · ${r.status}/${r.provider_status ?? "—"} · ${d(r.created_at)}`)
          .join("\n");
      }

      case "/user": {
        if (!args[0]) return "Usage: /user <github login | email | uuid>";
        const rows = await userRows(1, args[0]);
        if (rows.length === 0) return "Not found.";
        const r = rows[0];
        const { data: runs } = await admin
          .from("runs")
          .select("product_url, unlocked, created_at")
          .eq("user_id", r.id as string)
          .order("created_at", { ascending: false });
        return [
          `${r.blocked ? "⛔ BLOCKED\n" : ""}${r.login} · ${r.email}`,
          `id ${r.id}`,
          `joined ${d(r.created)} · last sign-in ${d(r.last_sign_in)}`,
          `balance ${formatUsd(n(r.balance))} · reddit accounts ${r.reddit}`,
          `maps (${(runs ?? []).length}):`,
          ...(runs ?? []).map((m) => `  ${m.unlocked ? "🔓" : "🔒"} ${m.product_url} · ${d(m.created_at)}`),
        ].join("\n");
      }

      case "/block":
      case "/unblock": {
        if (!args[0]) return `Usage: ${cmd} <github login | email | uuid>`;
        const rows = await userRows(1, args[0]);
        if (rows.length === 0) return "Not found.";
        const blocked = cmd === "/block";
        const { error } = await admin
          .from("profiles")
          .update({ blocked, blocked_at: blocked ? new Date().toISOString() : null })
          .eq("id", rows[0].id as string);
        return error ? `Failed: ${error.message}` : `${blocked ? "⛔ Blocked" : "✅ Unblocked"} ${rows[0].login}`;
      }

      default:
        return `Unknown command.\n\n${HELP}`;
    }
  } catch (e) {
    console.error("[telegram] command failed:", cmd, e);
    return "Error running that command — check the Vercel logs.";
  }
}
