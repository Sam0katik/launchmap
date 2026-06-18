// Tall pixel lighthouse — bright lamp room up top, a banded tapering tower,
// a window and door, and a rock base. Mono palette. The page-wide rotating
// beam is a separate CSS element (.beam) positioned at the lamp.

const LAMP = "#fafafa";
const GLASS = "#e5e5e5";
const BAND_L = "#d4d4d8"; // light stripe
const BAND_D = "#3f3f46"; // dark stripe
const RAIL = "#27272a";
const BASE = "#2e2e33";
const WINDOW = "#18181b";

// Bands: [xStart, xEnd, y, color] on a 12-wide grid (taper widens downward).
const ROWS: [number, number, number, string][] = [
  [5, 6, 0, BAND_D], // roof peak
  [4, 7, 1, BAND_D], // roof
  [4, 7, 2, LAMP], // light
  [3, 8, 3, LAMP],
  [3, 8, 4, GLASS], // lamp glass
  [2, 9, 5, RAIL], // gallery deck
  [4, 7, 6, BAND_L], // tower begins
  [4, 7, 7, BAND_L],
  [4, 7, 8, BAND_D],
  [4, 7, 9, BAND_D],
  [3, 8, 10, BAND_L],
  [3, 8, 11, BAND_L],
  [3, 8, 12, BAND_D],
  [3, 8, 13, BAND_D],
  [3, 8, 14, BAND_L],
  [2, 9, 15, BAND_L],
  [2, 9, 16, BAND_D],
  [2, 9, 17, BAND_D],
  [2, 9, 18, BAND_L],
  [1, 10, 19, BAND_L],
  [1, 10, 20, BAND_D],
  [0, 11, 21, BASE], // rock base
  [0, 11, 22, BAND_D],
];

// Single-cell overrides (window + door).
const OVERRIDES: [number, number, string][] = [
  [5, 11, WINDOW], [6, 11, WINDOW], // window
  [5, 19, WINDOW], [6, 19, WINDOW], // door
  [5, 20, WINDOW], [6, 20, WINDOW],
];

const CELL = 6;
const W = 12 * CELL;
const H = 23 * CELL;

export function Lighthouse({ size = 110 }: { size?: number }) {
  const grid = new Map<string, string>();
  for (const [s, e, y, c] of ROWS) {
    for (let x = s; x <= e; x++) grid.set(`${x},${y}`, c);
  }
  for (const [x, y, c] of OVERRIDES) grid.set(`${x},${y}`, c);

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
      {/* lamp halo */}
      <circle cx={W / 2} cy={CELL * 2.5} r={16} fill="rgba(255,255,255,0.16)" />
      {Array.from(grid.entries()).map(([k, c]) => {
        const [x, y] = k.split(",").map(Number);
        return (
          <rect key={k} x={x * CELL} y={y * CELL} width={CELL} height={CELL} fill={c} />
        );
      })}
    </svg>
  );
}
