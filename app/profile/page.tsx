import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { VectorSketch } from "@/components/VectorSketch";
import { SiteNav } from "@/components/SiteNav";
import { DeleteAccountButton } from "@/components/DeleteAccountButton";
import { isBillingEnabled, UNLOCK_PRICE_LABEL } from "@/lib/billing";
import type { ProductAnalysis } from "@/lib/types";

const FREE_RUNS_PER_DAY = Number(process.env.FREE_RUNS_PER_DAY ?? 5);

// Account hub: every launch map the user has run, billing/usage, and account
// management (sign-out lives in the nav; deletion lives here). Server component,
// RLS-scoped — a user only ever sees their own rows.
export default async function ProfilePage() {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/");

  // Profile (plan) + this user's runs, in parallel.
  const [{ data: profile }, { data: runs }] = await Promise.all([
    supabase.from("profiles").select("plan, created_at").eq("id", user.id).maybeSingle(),
    supabase
      .from("runs")
      .select("id, product_url, product_data, unlocked, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false }),
  ]);

  const runList = runs ?? [];
  const since = Date.now() - 24 * 3600_000;
  const usedToday = runList.filter(
    (r) => new Date(r.created_at).getTime() >= since
  ).length;

  const username =
    (user.user_metadata?.user_name as string) ?? user.email ?? "you";
  const plan = profile?.plan ?? "free";

  return (
    <>
      <VectorSketch variant="alt" />

      <div className="relative z-10 flex min-h-screen flex-col">
        <SiteNav />

        <main className="mx-auto w-full max-w-content px-6 pb-20 pt-4">
          {/* identity header */}
          <header className="panel mb-10 px-8 pb-7 pt-6">
            <div className="mb-3 flex items-center justify-between text-xs uppercase tracking-widest text-ink-subtle">
              <span>Account</span>
              <span>Beacon Labs</span>
            </div>
            <div className="receipt-rule mb-5" />
            <h1 className="pixel text-ink" style={{ fontSize: "clamp(24px,3vw,34px)" }}>
              {username}
            </h1>
            <p className="mt-2 text-sm text-ink-subtle">
              Signed in with GitHub · plan: <span className="text-ink">{plan}</span>
            </p>
          </header>

          {/* billing / usage */}
          <section className="mb-10">
            <h2 className="eyebrow mb-3">Billing &amp; usage</h2>
            <div className="grid gap-4 sm:grid-cols-3">
              <Stat label="Plan" value={plan === "paid" ? "Paid" : "Free"} />
              <Stat
                label="Maps today"
                value={`${usedToday} / ${FREE_RUNS_PER_DAY}`}
              />
              <Stat label="Total maps" value={String(runList.length)} />
            </div>
            <p className="mt-4 text-sm text-ink-subtle">
              {isBillingEnabled()
                ? `Unlock any map's full community list for ${UNLOCK_PRICE_LABEL}.`
                : `Paid unlocks (${UNLOCK_PRICE_LABEL}) go live in Stage 6 — checkout isn't wired yet.`}
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
                  return (
                    <li key={run.id}>
                      <Link
                        href={`/map/${run.id}`}
                        className="focus-ring btn-press flex items-center justify-between gap-4 rounded-md border-2 border-hairline-strong bg-surface-1 px-5 py-4 shadow-[3px_4px_0_0_var(--color-hairline-strong)] hover:bg-surface-2"
                      >
                        <div className="min-w-0">
                          <p className="truncate text-ink">
                            {a?.product_summary || run.product_url}
                          </p>
                          <p className="mt-0.5 truncate text-xs text-ink-subtle">
                            {run.product_url}
                          </p>
                        </div>
                        <div className="shrink-0 text-right">
                          <span
                            className={`rounded-sm border px-2 py-0.5 text-xs ${
                              run.unlocked
                                ? "border-success/50 text-success"
                                : "border-hairline text-ink-tertiary"
                            }`}
                          >
                            {run.unlocked ? "Unlocked" : "Free tier"}
                          </span>
                          <p className="mt-1 text-xs text-ink-tertiary">
                            {new Date(run.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
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

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border-2 border-hairline-strong bg-surface-1 px-5 py-4">
      <p className="eyebrow mb-1">{label}</p>
      <p className="tnum text-2xl text-ink">{value}</p>
    </div>
  );
}
