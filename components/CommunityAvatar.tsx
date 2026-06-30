"use client";

import { useState } from "react";

// Community avatar — real icon when we have one, monogram fallback otherwise.
// Plain <img> (not next/image) so any Reddit CDN host works without remote
// config; on a broken/blocked icon we drop it and the monogram shows through.
export function CommunityAvatar({
  icon,
  name,
}: {
  icon?: string | null;
  name: string;
}) {
  const [broken, setBroken] = useState(false);
  const initial = name.replace(/^r\//i, "").charAt(0).toUpperCase() || "•";
  const showImg = icon && !broken;

  return (
    <div className="relative grid h-9 w-9 shrink-0 place-items-center overflow-hidden rounded-md border-2 border-hairline-strong bg-surface-2 text-sm font-semibold text-ink-muted">
      <span aria-hidden>{initial}</span>
      {showImg ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={icon}
          alt=""
          loading="lazy"
          referrerPolicy="no-referrer"
          className="absolute inset-0 h-full w-full object-cover"
          onError={() => setBroken(true)}
        />
      ) : null}
    </div>
  );
}
