import type { ProductAnalysis, RankedCommunity } from "@/lib/types";
import { PostingBrief } from "@/components/PostingBrief";
import { CommunityAvatar } from "@/components/CommunityAvatar";

// One community card on the map, styled as a print-zine docket. All cards share
// the same frame; locked ones show a lock placeholder instead of the brief, so
// the grid reads uniformly.

const POLICY_LABEL: Record<string, string> = {
  welcome: "Welcome",
  megathread_only: "Megathread only",
  comment_only: "Comments only",
  banned: "No self-promo",
};

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

function displayName(name: string): string {
  return name.replace(/\s*\([^)]*\)\s*$/, "").trim();
}

function formatMembers(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1).replace(/\.0$/, "")}M`;
  if (n >= 1_000) return `${Math.round(n / 1_000)}K`;
  return String(n);
}

export function CommunityCard({
  entry,
  analysis,
}: {
  entry: RankedCommunity;
  analysis?: ProductAnalysis | null;
}) {
  const { community, locked } = entry;
  const name = displayName(community.name);

  return (
    <div className="flex flex-col rounded-md border-2 border-hairline-strong bg-surface-1 shadow-[4px_5px_0_0_var(--color-hairline-strong)]">
      <div className="flex items-start gap-3 px-5 pb-4 pt-5">
        <CommunityAvatar icon={community.icon} name={name} />
        <div className="min-w-0 flex-1">
          <h3 className="text-lg leading-tight text-ink">{name}</h3>
          <span className="eyebrow mt-1 block">{community.platform}</span>
        </div>
        {community.members ? (
          <span
            className="tnum shrink-0 rounded-sm border border-hairline px-1.5 py-0.5 text-[11px] text-ink-muted"
            title={`${community.members.toLocaleString()} members`}
          >
            {formatMembers(community.members)}
          </span>
        ) : null}
      </div>

      <div className="receipt-rule mx-5" />

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

        {(community.self_promo_note || community.rules_summary) && (
          <p className="text-ink-muted">
            {community.self_promo_note || community.rules_summary}
          </p>
        )}

        <div className="mt-auto pt-1">
          {locked ? (
            <div className="rounded-md border border-dashed border-hairline-strong/40 bg-canvas/40 px-3 py-3 text-center text-xs text-ink-subtle">
              🔒 Unlock to see the brief — rules, links, karma &amp; a tailored
              angle
            </div>
          ) : (
            <PostingBrief community={community} analysis={analysis} />
          )}
        </div>
      </div>
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
