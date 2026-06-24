// Side-profile paper airplane — a folded origami dart seen from the side, so it
// reads unmistakably as a paper plane (not a top-down arrow). Two facets (lit
// top wing + shaded lower wing) meeting at a centre fold, with a small orange
// nose. Brand palette, matches the pixel mascot's colours. `fly` gives it the
// same continuous airborne glide used elsewhere.
export function SidePaperPlane({
  size = 84,
  fly = true,
}: {
  size?: number;
  fly?: boolean;
}) {
  return (
    <svg
      width={size}
      height={(size * 40) / 56}
      viewBox="0 0 56 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      className={fly ? "mascot-fly" : undefined}
    >
      {/* lit top wing */}
      <polygon points="54,18 4,4 24,22" fill="#1b1a16" />
      {/* shaded lower wing (the fold underside) */}
      <polygon points="54,18 24,22 10,36" fill="#56524a" />
      {/* centre keel fold line */}
      <line x1="54" y1="18" x2="24" y2="22" stroke="#efece2" strokeWidth="1" />
      {/* sharp orange nose */}
      <polygon points="54,18 45,15 47,20" fill="#ff6a14" />
    </svg>
  );
}
