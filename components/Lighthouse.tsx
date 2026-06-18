// Pixel lighthouse — peeks out from behind the card. The bright lamp room sits
// at the top; the rotating page-wide light beam is a separate CSS element
// (.beam) in the page. Mono palette. Pure SVG pixel rects.

const LAMP = "#fafafa";
const GLASS = "#e5e5e5";
const BODY = "#52525b";
const BODY_LT = "#71717a";
const DARK = "#3f3f46";
const RAIL = "#27272a";

// [xStart, xEnd, y, color] band rows on a 12-wide grid.
const ROWS: [number, number, number, string][] = [
  [4, 7, 0, DARK], // lamp cap
  [4, 7, 1, LAMP], // light
  [3, 8, 2, LAMP],
  [3, 8, 3, GLASS],
  [3, 8, 4, RAIL], // gallery rail
  [4, 7, 5, BODY_LT], // tower top
  [4, 7, 6, BODY],
  [3, 8, 7, DARK], // stripe
  [3, 8, 8, BODY_LT],
  [3, 8, 9, BODY],
  [2, 9, 10, DARK], // stripe
  [2, 9, 11, BODY_LT],
  [2, 9, 12, BODY],
  [1, 10, 13, DARK], // base
];

const CELL = 6;
const W = 12 * CELL;
const H = 14 * CELL;

export function Lighthouse({ size = 84 }: { size?: number }) {
  const cells: [number, number, string][] = [];
  for (const [s, e, y, c] of ROWS) {
    for (let x = s; x <= e; x++) cells.push([x, y, c]);
  }
  return (
    <svg
      width={size}
      height={(size * H) / W}
      viewBox={`0 0 ${W} ${H}`}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="A pixel lighthouse"
      role="img"
      shapeRendering="crispEdges"
    >
      {/* soft lamp halo */}
      <circle cx={W / 2} cy={CELL * 1.5} r={14} fill="rgba(255,255,255,0.18)" />
      {cells.map(([x, y, c], i) => (
        <rect key={i} x={x * CELL} y={y * CELL} width={CELL} height={CELL} fill={c} />
      ))}
    </svg>
  );
}
