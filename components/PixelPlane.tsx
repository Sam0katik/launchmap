// Pixel-art origami paper plane — the site's mascot glyph, shared by the
// favicon (app/icon.svg carries the same rows) and the background flyer.
// Drawn as a 24×14 pixel grid of horizontal runs; `shape-rendering: crispEdges`
// keeps every pixel hard. Tones map onto the print-zine palette: ink outline,
// cream lit wing, shaded underside, a slightly lighter keel facet, orange nose.
export type PlaneTone = "ink" | "top" | "under" | "keel" | "nose";

const TONE: Record<PlaneTone, string> = {
  ink: "#1b1a16",
  top: "#efece2",
  under: "#c9c4b3",
  keel: "#d8d3c4",
  nose: "#ff6a14",
};

// Generated pixel runs: [x, y, width, tone]. 24×14 grid, one unit = one pixel.
export const PIXEL_PLANE_RUNS: Array<[number, number, number, PlaneTone]> = [
  [0, 0, 2, "ink"],
  [1, 1, 4, "ink"],
  [2, 2, 1, "ink"],
  [3, 2, 2, "top"],
  [5, 2, 3, "ink"],
  [3, 3, 1, "ink"],
  [4, 3, 4, "top"],
  [8, 3, 3, "ink"],
  [4, 4, 1, "ink"],
  [5, 4, 6, "top"],
  [11, 4, 3, "ink"],
  [5, 5, 1, "ink"],
  [6, 5, 8, "top"],
  [14, 5, 3, "ink"],
  [6, 6, 1, "ink"],
  [7, 6, 10, "top"],
  [17, 6, 3, "ink"],
  [5, 7, 1, "ink"],
  [6, 7, 14, "top"],
  [20, 7, 2, "ink"],
  [22, 7, 2, "nose"],
  [4, 8, 1, "ink"],
  [5, 8, 4, "under"],
  [9, 8, 1, "ink"],
  [10, 8, 7, "keel"],
  [17, 8, 4, "ink"],
  [3, 9, 1, "ink"],
  [4, 9, 8, "under"],
  [12, 9, 1, "ink"],
  [13, 9, 1, "keel"],
  [14, 9, 3, "ink"],
  [2, 10, 1, "ink"],
  [3, 10, 7, "under"],
  [10, 10, 4, "ink"],
  [1, 11, 1, "ink"],
  [2, 11, 5, "under"],
  [7, 11, 3, "ink"],
  [0, 12, 1, "ink"],
  [1, 12, 2, "under"],
  [3, 12, 4, "ink"],
  [0, 13, 3, "ink"],
];

/** The glyph as a group of rects. Wrap in an <svg> (or a transformed <g>). */
export function PixelPlaneGlyph() {
  return (
    <g shapeRendering="crispEdges">
      {PIXEL_PLANE_RUNS.map(([x, y, w, tone], i) => (
        <rect key={i} x={x} y={y} width={w} height={1} fill={TONE[tone]} />
      ))}
    </g>
  );
}
