// Profile top-up button. A real payment provider isn't connected yet, so this
// is intentionally inert — it's the single thing left to wire up in the future.
// (Admins grant test credit from the admin panel, not here.)
export function TopUpButton() {
  return (
    <button
      disabled
      title="Card / crypto top-up — connecting soon"
      className="rounded-md border-2 border-hairline-strong bg-surface-2 px-4 py-2 text-sm text-ink-muted opacity-60"
    >
      Top up — coming soon
    </button>
  );
}
