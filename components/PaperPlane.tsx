// Pixel paper-airplane mascot. Built from a coarse pixel grid (rects) so it
// reads as deliberate pixel art next to the Departure Mono type, not a smooth
// vector. Two tones: the lit top wing (cream) and the shaded underside (ink),
// with an orange nose accent. `shape-rendering: crispEdges` keeps pixels sharp.
//
// Pure presentational; pass a size. Idle bob is opt-in via `bob`.
export function PaperPlane({
  size = 56,
  bob = false,
}: {
  size?: number;
  bob?: boolean;
}) {
  // Grid is 16×14 "pixels". A right-pointing dart: pointed nose at the right,
  // a concave V-notch tail on the left (the paper-plane giveaway), split into a
  // lit top wing and a shaded bottom wing along the centre fold. [x, y, width].
  const top: Array<[number, number, number]> = [
    [2, 1, 2], // tail top tip
    [2, 2, 4],
    [3, 3, 5],
    [4, 4, 6],
    [6, 5, 7],
    [7, 6, 7], // nose row (orange tip added separately)
  ];
  const under: Array<[number, number, number]> = [
    [6, 7, 7],
    [4, 8, 6],
    [3, 9, 5],
    [2, 10, 4],
    [2, 11, 2], // tail bottom tip
  ];

  return (
    <svg
      width={size}
      height={(size * 14) / 16}
      viewBox="0 0 16 14"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      className={bob ? "mascot-bob" : undefined}
      style={{ shapeRendering: "crispEdges" }}
    >
      {/* lit top wing — ink, so it reads on the cream panel */}
      {top.map(([x, y, w], i) => (
        <rect key={`t${i}`} x={x} y={y} width={w} height={1} fill="#1b1a16" />
      ))}
      {/* shaded underside — mid tone for fold depth */}
      {under.map(([x, y, w], i) => (
        <rect key={`u${i}`} x={x} y={y} width={w} height={1} fill="#56524a" />
      ))}
      {/* pointed nose accent (orange) at the right tip of the centre row */}
      <rect x={14} y={6} width={2} height={1} fill="#ff6a14" />
    </svg>
  );
}
