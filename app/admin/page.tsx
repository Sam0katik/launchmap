import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isAdminUser } from "@/lib/admins";
import { VectorSketch } from "@/components/VectorSketch";
import { SiteNav } from "@/components/SiteNav";
import { AdminUnlockToggle } from "@/components/AdminUnlockToggle";
import { AdminTopUpButton } from "@/components/AdminTopUpButton";
import { AdminRefreshReddit } from "@/components/AdminRefreshReddit";
import { formatUsd } from "@/lib/billing";

// Owner dashboard: every user, their plan, and run activity. Gated by the
// ADMIN_EMAILS allowlist; non-admins get a 404 (the page's existence is hidden).
// Reads via the service-role client, so it sees all rows regardless of RLS.
export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/");
  if (
    !isAdminUser({
      email: user.email,
      username: user.user_metadata?.user_name as string,
    })
  )
    notFound();

  const admin = createAdminClient();

  // Auth users + profiles (balance) + all runs, in parallel.
  const [usersRes, profilesRes, runsRes] = await Promise.all([
    admin.auth.admin.listUsers({ page: 1, perPage: 1000 }),
    admin.from("profiles").select("id, balance_cents"),
    admin.from("runs").select("user_id, unlocked, created_at"),
  ]);

  const authUsers = usersRes.data?.users ?? [];
  const balanceById = new Map(
    (profilesRes.data ?? []).map((p) => [
      p.id as string,
      (p.balance_cents as number) ?? 0,
    ])
  );

  // Aggregate run activity per user.
  type Agg = { total: number; unlocked: number; last: string | null };
  const aggById = new Map<string, Agg>();
  for (const r of runsRes.data ?? []) {
    const id = r.user_id as string;
    const a = aggById.get(id) ?? { total: 0, unlocked: 0, last: null };
    a.total += 1;
    if (r.unlocked) a.unlocked += 1;
    const ts = r.created_at as string;
    if (!a.last || ts > a.last) a.last = ts;
    aggById.set(id, a);
  }

  const rows = authUsers
    .map((u) => {
      const agg = aggById.get(u.id) ?? { total: 0, unlocked: 0, last: null };
      return {
        id: u.id,
        name: (u.user_metadata?.user_name as string) ?? "—",
        email: u.email ?? "—",
        joined: u.created_at,
        balanceCents: balanceById.get(u.id) ?? 0,
        ...agg,
      };
    })
    .sort((a, b) => (b.last ?? "").localeCompare(a.last ?? ""));

  const totalMaps = (runsRes.data ?? []).length;
  const unlockedUsers = rows.filter((r) => r.unlocked > 0).length;

  return (
    <>
      <VectorSketch variant="alt" />
      <div className="relative z-10 flex min-h-screen flex-col">
        <SiteNav />
        <main className="mx-auto w-full max-w-content px-6 pb-20 pt-4">
          <header className="panel mb-10 px-8 pb-7 pt-6">
            <div className="mb-3 flex items-center justify-between text-xs uppercase tracking-widest text-ink-subtle">
              <span>Admin</span>
              <span>ZeroFans Labs · internal</span>
            </div>
            <div className="receipt-rule mb-5" />
            <div className="flex flex-wrap items-center justify-between gap-4">
              <h1 className="pixel text-ink" style={{ fontSize: "clamp(24px,3vw,34px)" }}>
                Operator dashboard
              </h1>
              <AdminRefreshReddit />
            </div>
          </header>

          <section className="mb-10 grid gap-4 sm:grid-cols-3">
            <Stat label="Users" value={String(rows.length)} />
            <Stat label="Maps generated" value={String(totalMaps)} />
            <Stat label="Users with unlocks" value={String(unlockedUsers)} />
          </section>

          <h2 className="eyebrow mb-3">All users</h2>
          <div className="overflow-x-auto rounded-md border-2 border-hairline-strong bg-surface-1">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b-2 border-hairline-strong text-left text-xs uppercase tracking-widest text-ink-subtle">
                  <Th>User</Th>
                  <Th>Balance</Th>
                  <Th>Maps</Th>
                  <Th>Unlocked</Th>
                  <Th>Last map</Th>
                  <Th>Actions</Th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id} className="border-b border-hairline last:border-0">
                    <Td>
                      <span className="text-ink">{r.name}</span>
                      <span className="block text-xs text-ink-subtle">{r.email}</span>
                    </Td>
                    <Td className="tnum">{formatUsd(r.balanceCents)}</Td>
                    <Td className="tnum">{r.total}</Td>
                    <Td className="tnum">{r.unlocked}</Td>
                    <Td className="text-ink-subtle">{fmt(r.last)}</Td>
                    <Td>
                      <div className="flex items-center gap-2">
                        <AdminTopUpButton userId={r.id} />
                        <AdminUnlockToggle
                          userId={r.id}
                          unlocked={r.unlocked > 0}
                        />
                      </div>
                    </Td>
                  </tr>
                ))}
                {rows.length === 0 && (
                  <tr>
                    <Td className="text-ink-subtle">No users yet.</Td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </main>
      </div>
    </>
  );
}

function fmt(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString();
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border-2 border-hairline-strong bg-surface-1 px-5 py-4">
      <p className="eyebrow mb-1">{label}</p>
      <p className="tnum text-2xl text-ink">{value}</p>
    </div>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return <th className="px-4 py-3 font-normal">{children}</th>;
}

function Td({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <td className={`px-4 py-3 align-top ${className}`}>{children}</td>;
}
