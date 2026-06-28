import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { VectorSketch } from "@/components/VectorSketch";
import { SiteNav } from "@/components/SiteNav";
import { DeleteAccountButton } from "@/components/DeleteAccountButton";
import { DeleteMapButton } from "@/components/DeleteMapButton";
import { RedditGuide } from "@/components/RedditGuide";
import { TopUpButton } from "@/components/TopUpButton";
import { MAX_MAPS_PER_ACCOUNT, UNLOCK_PRICE_LABEL, formatUsd } from "@/lib/billing";
import { isAdminUser } from "@/lib/admins";
import type { ProductAnalysis } from "@/lib/types";

// Account hub: every launch map the user has run, usage, and account management
// (sign-out lives in the nav; deletion lives here). Server component, RLS-scoped
// — a user only ever sees their own rows.
export default async function ProfilePage() {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/");

  // This user's runs + balance.
  const [{ data: runs }, { data: profile }] = await Promise.all([
    supabase
      .from("runs")
      .select("id, product_url, product_data, unlocked, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false }),
    supabase
      .from("profiles")
      .select("balance_cents")
      .eq("id", user.id)
      .maybeSingle(),
  ]);

  const runList = runs ?? [];
  const balanceCents = (profile?.balance_cents as number) ?? 0;
  const isAdmin = isAdminUser({
    email: user.email,
    username: user.user_metadata?.user_name as string,
  });

  const username =
    (user.user_metadata?.user_name as string) ?? user.email ?? "you";

  return (
    <>
      <VectorSketch variant="alt" />

      <div className="relative z-10 flex min-h-screen flex-col">
        <SiteNav />

        <main className="mx-auto w-full max-w-content px-6 pb-20 pt-4">
          {/* identity header */}
          <header className="panel mb-10 px-8 pb-7 pt-6">
            <div className="mb-3 flex items-center justify-between gap-3 text-xs uppercase tracking-widest text-ink-subtle">
              <span>Account · Signed in with GitHub</span>
              <span>ZeroFans Labs</span>
            </div>
            <div className="receipt-rule mb-5" />
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-3">
                  <h1
                    className="pixel text-ink"
                    style={{ fontSize: "clamp(24px,3vw,34px)" }}
                  >
                    {username}
                  </h1>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {isAdmin && (
                  <Link
                    href="/admin"
                    className="focus-ring btn-press rounded-md border-2 border-hairline-strong bg-ink px-4 py-2.5 text-base font-medium text-canvas hover:opacity-90"
                  >
                    ⚙ Admin panel
                  </Link>
                )}
              </div>
            </div>
          </header>

          {/* balance + usage */}
          <section className="mb-10">
            <h2 className="eyebrow mb-3">Balance &amp; usage</h2>
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="rounded-md border-2 border-hairline-strong bg-surface-1 px-5 py-4">
                <p className="eyebrow mb-1">Balance</p>
                <p className="tnum text-2xl text-ink">{formatUsd(balanceCents)}</p>
                <div className="mt-3">
                  <TopUpButton userId={user.id} isAdmin={isAdmin} />
                </div>
              </div>
              <Stat
                label="Maps"
                value={`${runList.length} / ${MAX_MAPS_PER_ACCOUNT}`}
              />
              <Stat
                label="Unlocked maps"
                value={String(runList.filter((r) => r.unlocked).length)}
              />
            </div>
            <p className="mt-4 text-sm text-ink-subtle">
              Top up your balance, then unlock any map for {UNLOCK_PRICE_LABEL} —
              all publics + their posting briefs. You can keep{" "}
              {MAX_MAPS_PER_ACCOUNT} maps at once; delete one below to analyze a
              new product.
            </p>
          </section>

          {/* run history */}
          <section className="mb-12">
            <h2 className="eyebrow mb-3">Your launch maps</h2>
            {runList.length === 0 ? (
              <div className="rounded-md border-2 border-dashed border-hairline-strong/40 px-6 py-10 text-center">
                <p className="text-sm text-ink-subtle">
                  No maps yet. Paste a product URL on the{" "}
                  <Link href="/" className="text-primary hover:underline">
                    home page
                  </Link>{" "}
                  to light your first one.
                </p>
              </div>
            ) : (
              <ul className="space-y-3">
                {runList.map((run) => {
                  const a = run.product_data as ProductAnalysis | null;
                  // Short label: the category (a couple of words), falling back
                  // to the bare hostname — not the full sentence summary.
                  const host = hostnameOf(run.product_url);
                  const title = a?.category?.trim() || host;
                  return (
                    <li
                      key={run.id}
                      className="relative flex items-center justify-between gap-4 rounded-md border-2 border-hairline-strong bg-surface-1 px-5 py-4 shadow-[3px_4px_0_0_var(--color-hairline-strong)] transition-colors hover:bg-surface-2"
                    >
                      {/* stretched link makes the whole card clickable while the
                          Delete button (above it) stays its own control */}
                      <Link
                        href={`/map/${run.id}`}
                        aria-label={`Open ${title}`}
                        className="focus-ring absolute inset-0 rounded-md"
                      />
                      <div className="pointer-events-none min-w-0">
                        <p className="truncate text-ink">{title}</p>
                        <p className="mt-0.5 truncate text-xs text-ink-subtle">
                          {host}
                        </p>
                      </div>
                      <div className="relative flex shrink-0 items-center gap-3">
                        <div className="pointer-events-none text-right">
                          <span
                            className={`rounded-sm border px-2 py-0.5 text-xs ${
                              run.unlocked
                                ? "border-success/50 text-success"
                                : "border-hairline text-ink-tertiary"
                            }`}
                          >
                            {run.unlocked ? "Unlocked" : "Basic"}
                          </span>
                          <p className="mt-1 text-xs text-ink-tertiary">
                            {new Date(run.created_at).toLocaleDateString()}
                          </p>
                        </div>
                        <DeleteMapButton runId={run.id} />
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>

          {/* Reddit account playbook */}
          <section className="mb-12">
            <h2 className="eyebrow mb-3">Posting playbook</h2>
            <RedditGuide />
          </section>

          {/* danger zone */}
          <section>
            <h2 className="eyebrow mb-3 text-red-700">Danger zone</h2>
            <div className="rounded-md border-2 border-red-700/40 px-6 py-5">
              <DeleteAccountButton />
            </div>
          </section>
        </main>
      </div>
    </>
  );
}

/** Bare hostname without protocol/www, for compact run labels. */
function hostnameOf(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border-2 border-hairline-strong bg-surface-1 px-5 py-4">
      <p className="eyebrow mb-1">{label}</p>
      <p className="tnum text-2xl text-ink">{value}</p>
    </div>
  );
}
