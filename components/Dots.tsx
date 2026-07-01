// Animated loading ellipsis. Use next to a verb, e.g. `Scanning<Dots />`.
export function Dots() {
  return (
    <span className="loading-dots" aria-hidden>
      <span>.</span>
      <span>.</span>
      <span>.</span>
    </span>
  );
}
