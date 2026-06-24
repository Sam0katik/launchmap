import type { RankedCommunity } from "@/lib/types";
import { CardActions, type InitialDraft } from "@/components/CardActions";

// One community card on the map, styled as a print-zine docket (departuremono
// vibe): hard dark frame + offset shadow, a stamped rank box, uppercase tracked
// meta, dashed receipt rules, tabular-num match score.
//
// Locked cards (free tier, no detail to show) collapse to a compact, dimmed
// strip so the eye skips them. Unlocked cards carry only the useful fields.
//
// UI note (from spec §3.7): member count is intentionally NOT a primary field.

const POLICY_LABEL: Record<string, string> = {
  welcome: "Welcome",
  megathread_only: "Megathread only",
  comment_only: "Comments only",
  banned: "No self-promo",
};

// green = safe, amber = constrained, red = risky.
const POLICY_TONE: Record<string, string> = {
  welcome: "text-success border-success/50",
  megathread_only: "text-[#b06a00] border-[#b06a00]/50",
  comment_only: "text-[#b06a00] border-[#b06a00]/50",
  banned: "text-red-700 border-red-700/50",
};

const KARMA_LABEL: Record<string, string> = {
  easy: "Easy",
  medium: "Medium",
  hard: "Hard",
};

// The platform is already shown as the eyebrow under the name, so strip any
// trailing "(Discord)" / "(Reddit)" suffix the catalog name might carry.
function displayName(name: string): string {
  return name.replace(/\s*\([^)]*\)\s*$/, "").trim();
}

export function CommunityCard({
  rank,
  entry,
  runId,
  initialDraft,
}: {
  rank: number;
  entry: RankedCommunity;
  runId?: string;
  initialDraft?: InitialDraft;
}) {
  const { community, relevance, locked } = entry;
  const name = displayName(community.name);

  // Locked: compact dimmed strip — rank, name, platform, match, lock. No body.
  if (locked) {
    return (
      <div className="flex items-center justify-between gap-3 self-start rounded-md border-2 border-hairline bg-surface-2/60 px-4 py-3 opacity-70">
        <div className="flex min-w-0 items-center gap-3">
          <span className="tnum inline-flex h-6 min-w-6 items-center justify-center rounded-sm border border-hairline px-1 text-xs text-ink-muted">
            {rank}
          </span>
          <div className="min-w-0">
            <h3 className="truncate text-sm text-ink-muted">{name}</h3>
            <span className="eyebrow block text-[11px]">
              {community.platform}
            </span>
          </div>
        </div>
        <span className="shrink-0 text-xs text-ink-tertiary" title="Unlock with the full map">
          🔒 {relevance}%
        </span>
      </div>
    );
  }

  return (
    <div className="flex flex-col rounded-md border-2 border-hairline-strong bg-surface-1 shadow-[4px_5px_0_0_var(--color-hairline-strong)]">
      {/* docket header: stamped rank + name, platform eyebrow, match score */}
      <div className="flex items-start justify-between gap-3 px-5 pb-4 pt-5">
        <div className="flex items-start gap-3">
          <span className="tnum mt-0.5 inline-flex h-7 min-w-7 items-center justify-center rounded-sm border-2 border-hairline-strong px-1 text-sm text-ink">
            {rank}
          </span>
          <div>
            <h3 className="text-lg leading-tight text-ink">{name}</h3>
            <span className="eyebrow mt-1 block">{community.platform}</span>
          </div>
        </div>
        <span className="tnum shrink-0 text-sm text-ink-muted">{relevance}%</span>
      </div>

      <div className="receipt-rule mx-5" />

      <UnlockedBody entry={entry} runId={runId} initialDraft={initialDraft} />
    </div>
  );
}

function UnlockedBody({
  entry,
  runId,
  initialDraft,
}: {
  entry: RankedCommunity;
  runId?: string;
  initialDraft?: InitialDraft;
}) {
  const { community } = entry;
  return (
    <div className="flex flex-1 flex-col gap-3 px-5 pb-5 pt-5 text-sm">
      <div className="flex flex-wrap gap-2">
        <span
          className={`rounded-sm border bg-surface-2 px-2 py-0.5 text-xs ${POLICY_TONE[community.self_promo_policy]}`}
        >
          {POLICY_LABEL[community.self_promo_policy]}
        </span>
        {community.karma_tier && (
          <Badge>Karma: {KARMA_LABEL[community.karma_tier]}</Badge>
        )}
        {community.activity_level && <Badge>{community.activity_level}</Badge>}
      </div>

      {/* The single most actionable line: how to post here without a ban. */}
      {(community.self_promo_note || community.rules_summary) && (
        <p className="text-ink-muted">
          {community.self_promo_note || community.rules_summary}
        </p>
      )}

      <div className="mt-auto pt-1">
        <CardActions
          community={community}
          runId={runId}
          initialDraft={initialDraft}
        />
      </div>

      {/* Best time pinned to the very bottom as a receipt-style footer. */}
      {community.best_time && (
        <div className="-mx-5 mt-3 border-t-2 border-dashed border-hairline px-5 pt-3">
          <p className="text-xs text-ink-subtle">
            <span className="text-ink-tertiary">Best time · </span>
            {community.best_time}
          </p>
        </div>
      )}
    </div>
  );
}

function Badge({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-sm border border-hairline bg-surface-2 px-2 py-0.5 text-xs text-ink-muted">
      {children}
    </span>
  );
}
