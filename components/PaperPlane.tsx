// Pixel paper-airplane mascot — a right-pointing origami dart: sharp orange
// nose, straight leading edges, a concave V-notch tail, and a cream fold ridge
// down the centre that splits the lit top wing from the shaded underside. Built
// from a coarse pixel grid (rects) so it reads as deliberate pixel art next to
// Departure Mono. `shape-rendering: crispEdges` keeps pixels sharp.
export function PaperPlane({
  size = 56,
  bob = false,
}: {
  size?: number;
  bob?: boolean;
}) {
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
      className={bob ? "mascot-bob" : undefined}
      style={{ shapeRendering: "crispEdges" }}
    >
      {/* lit top wing — ink */}
      {top.map(([x, y, w], i) => (
        <rect key={`t${i}`} x={x} y={y} width={w} height={1} fill="#1b1a16" />
      ))}
      {/* shaded underside — mid tone */}
      {under.map(([x, y, w], i) => (
        <rect key={`u${i}`} x={x} y={y} width={w} height={1} fill="#56524a" />
      ))}
      {/* centre fold ridge (cream) reads as the paper fold between the wings */}
      <rect x={8} y={6} width={8} height={1} fill="#efece2" />
      {/* sharp orange nose at the right tip of the centre row */}
      <rect x={15} y={6} width={3} height={1} fill="#ff6a14" />
    </svg>
  );
}
