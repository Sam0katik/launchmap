// Pixel paper-airplane mascot — a right-pointing origami dart: sharp orange
// nose, straight leading edges, a concave V-notch tail, and a cream fold ridge
// down the centre that splits the lit top wing from the shaded underside. Built
// from a coarse pixel grid (rects) so it reads as deliberate pixel art next to
// Departure Mono. `shape-rendering: crispEdges` keeps pixels sharp.
export function PaperPlane({
  size = 56,
  bob = false,
  fly = false,
  tone = "ink",
}: {
  size?: number;
  bob?: boolean;
  /** Continuous "flying" drift — gentle forward glide with a slight pitch,
   *  for headers where the plane should feel airborne, not just bobbing. */
  fly?: boolean;
  /** Colour scheme: "ink" (dark, default) or "white" (white origami). */
  tone?: "ink" | "white";
}) {
  const colors =
    tone === "white"
      ? { top: "#ffffff", under: "#c9c6bf", fold: "#8a877f" }
      : { top: "#1b1a16", under: "#56524a", fold: "#efece2" };
  // 18×13 grid. [x, y, width], height 1.
  const top: Array<[number, number, number]> = [
    [3, 1, 2],
    [3, 2, 4],
    [4, 3, 6],
    [5, 4, 8],
    [6, 5, 10],
  ];
  const under: Array<[number, number, number]> = [
    [6, 7, 10],
    [5, 8, 8],
    [4, 9, 6],
    [3, 10, 4],
    [3, 11, 2],
  ];

  return (
    <svg
      width={size}
      height={(size * 13) / 18}
      viewBox="0 0 18 13"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      className={fly ? "mascot-fly" : bob ? "mascot-bob" : undefined}
      style={{ shapeRendering: "crispEdges" }}
    >
      {/* lit top wing */}
      {top.map(([x, y, w], i) => (
        <rect key={`t${i}`} x={x} y={y} width={w} height={1} fill={colors.top} />
      ))}
      {/* shaded underside — mid tone */}
      {under.map(([x, y, w], i) => (
        <rect key={`u${i}`} x={x} y={y} width={w} height={1} fill={colors.under} />
      ))}
      {/* centre fold ridge reads as the paper fold between the wings */}
      <rect x={8} y={6} width={8} height={1} fill={colors.fold} />
      {/* sharp orange nose at the right tip of the centre row */}
      <rect x={15} y={6} width={3} height={1} fill="#ff6a14" />
    </svg>
  );
}
