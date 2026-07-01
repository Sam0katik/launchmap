import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { VectorSketch } from "@/components/VectorSketch";
import { SiteNav } from "@/components/SiteNav";
import { DeleteAccountButton } from "@/components/DeleteAccountButton";
import { MapListRow } from "@/components/MapListRow";
import { RedditGuide } from "@/components/RedditGuide";
import { RedditKarmaCheck } from "@/components/RedditKarmaCheck";
import { TopUpButton } from "@/components/TopUpButton";
import { MAX_MAPS_PER_ACCOUNT, UNLOCK_PRICE_LABEL, formatUsd } from "@/lib/billing";
import { isAdminUser } from "@/lib/admins";
import { cryptomusConfigured } from "@/lib/cryptomus";
import { productNameFromUrl } from "@/lib/product-name";

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
      .select("id, product_url, title, unlocked, created_at")
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
            {/* items-start so each card hugs its own content — otherwise the
                grid stretches Maps/Unlocked to match the taller Balance card and
                leaves a big empty frame under the number. */}
            <div className="grid items-start gap-4 sm:grid-cols-3">
              <div className="flex items-center justify-between gap-3 rounded-md border-2 border-hairline-strong bg-surface-1 px-4 py-3">
                <div>
                  <p className="eyebrow mb-1">Balance</p>
                  <p className="tnum text-2xl text-ink">{formatUsd(balanceCents)}</p>
                </div>
                <TopUpButton enabled={cryptomusConfigured()} />
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
                {runList.map((run) => (
                  <MapListRow
                    key={run.id}
                    id={run.id}
                    url={run.product_url}
                    initialTitle={(run.title as string | null) ?? null}
                    derivedName={productNameFromUrl(run.product_url)}
                    unlocked={run.unlocked}
                    createdAt={run.created_at}
                  />
                ))}
              </ul>
            )}
          </section>

          {/* Reddit readiness check */}
          <section className="mb-12">
            <h2 className="eyebrow mb-3">Reddit account check</h2>
            <RedditKarmaCheck />
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

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border-2 border-hairline-strong bg-surface-1 px-4 py-3">
      <p className="eyebrow mb-1">{label}</p>
      <p className="tnum text-2xl text-ink">{value}</p>
    </div>
  );
}
