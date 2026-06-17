import type { RankedCommunity } from "@/lib/types";

// One community card on the map. Locked cards show name + rank only; the rules,
// karma, best time, submit link, and draft live behind the paywall.
//
// UI note (from spec §3.7): member count is intentionally NOT a primary field.
// Activity matters more than size.

const POLICY_LABEL: Record<string, string> = {
  welcome: "Welcome",
  megathread_only: "Megathread only",
  comment_only: "Comments only",
  banned: "No self-promo",
};

const KARMA_LABEL: Record<string, string> = {
  easy: "Easy",
  medium: "Medium",
  hard: "Hard",
};

export function CommunityCard({
  rank,
  entry,
}: {
  rank: number;
  entry: RankedCommunity;
}) {
  const { community, relevance, locked } = entry;

  return (
    <div className="rounded-lg border border-hairline bg-surface-1 p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-ink-tertiary">#{rank}</span>
            <h3 className="text-lg font-medium text-ink">{community.name}</h3>
          </div>
          <span className="eyebrow mt-1 block">{community.platform}</span>
        </div>
        <span className="rounded-pill rounded-full bg-surface-2 px-2 py-0.5 text-xs text-ink-muted">
          {relevance}% match
        </span>
      </div>

      {locked ? (
        <LockedBody />
      ) : (
        <UnlockedBody entry={entry} policyLabel={POLICY_LABEL} karmaLabel={KARMA_LABEL} />
      )}
    </div>
  );
}

function LockedBody() {
  return (
    <div className="mt-4 border-t border-hairline pt-4">
      <p className="text-sm text-ink-subtle">
        🔒 Rules, karma requirements, best time, one-click submit link, and a
        tailored draft are unlocked with the full map.
      </p>
    </div>
  );
}

function UnlockedBody({
  entry,
  policyLabel,
  karmaLabel,
}: {
  entry: RankedCommunity;
  policyLabel: Record<string, string>;
  karmaLabel: Record<string, string>;
}) {
  const { community } = entry;
  return (
    <div className="mt-4 space-y-3 border-t border-hairline pt-4 text-sm">
      <div className="flex flex-wrap gap-2">
        <Badge>{policyLabel[community.self_promo_policy]}</Badge>
        {community.karma_tier && (
          <Badge>Karma: {karmaLabel[community.karma_tier]}</Badge>
        )}
        {community.activity_level && <Badge>{community.activity_level}</Badge>}
      </div>

      {community.self_promo_note && (
        <p className="text-ink-muted">{community.self_promo_note}</p>
      )}
      {community.rules_summary && (
        <p className="text-ink-subtle">{community.rules_summary}</p>
      )}
      {community.best_time && (
        <p className="text-ink-subtle">
          <span className="text-ink-tertiary">Best time: </span>
          {community.best_time}
        </p>
      )}

      <a
        href={community.url}
        target="_blank"
        rel="noopener noreferrer"
        className="focus-ring inline-block rounded-md bg-primary px-3 py-2 text-sm font-medium text-white hover:bg-primary-hover"
      >
        Open submit form
      </a>
    </div>
  );
}

function Badge({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-full bg-surface-2 px-2 py-0.5 text-xs text-ink-muted">
      {children}
    </span>
  );
}
