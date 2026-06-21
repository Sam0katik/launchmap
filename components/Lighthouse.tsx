// Red + white pixel lighthouse, simplified from a classic reference: red conical
// roof, a bright lantern room (the light source), red galleries, a banded
// red/white tower with windows, a door, and a rock base. The page-wide rotating
// beam (.beam) + lamp glow (.lampglow) emanate from the lantern.

const RED = "#e2402f";
const RED_DK = "#b8301f";
const WHITE = "#f4f4f5";
const WHITE_SH = "#d6d6da";
const GLASS = "#cfe8e6";
const LAMP = "#fff6cf";
const RAIL = "#c23a2c";
const WINDOW = "#5a241c";
const DOOR = "#6b2b1c";
const STEP = "#d9a45c";
const ROCK = "#6b6b72";
const ROCK_DK = "#4a4a50";

// Bands: [xStart, xEnd, y, color] on a 14-wide grid.
const ROWS: [number, number, number, string][] = [
  [6, 7, 0, RED_DK], // finial
  [5, 8, 1, RED],
  [5, 8, 2, RED], // roof
  [4, 9, 3, RED],
  [3, 10, 4, RED_DK], // eaves
  [4, 9, 5, RED_DK], // lantern top frame
  [4, 9, 6, GLASS], // lantern glass (light)
  [4, 9, 7, GLASS],
  [4, 9, 8, GLASS],
  [4, 9, 9, RED_DK], // lantern bottom frame
  [3, 10, 10, RAIL], // gallery 1 deck
  [3, 10, 11, RAIL],
  [4, 9, 12, WHITE], // neck
  [4, 9, 13, WHITE],
  [2, 11, 14, WHITE_SH], // main gallery deck
  [2, 11, 15, RAIL], // balcony rail
  [2, 11, 16, RAIL],
  [3, 10, 17, WHITE], // tower
  [3, 10, 18, WHITE],
  [3, 10, 19, RED], // band
  [3, 10, 20, RED],
  [3, 10, 21, WHITE],
  [3, 11, 22, WHITE],
  [2, 11, 23, RED], // band
  [2, 11, 24, RED],
  [2, 11, 25, WHITE],
  [2, 12, 26, WHITE],
  [1, 12, 27, WHITE], // base flare
  [1, 12, 28, WHITE],
  [0, 13, 29, ROCK], // rocks
  [0, 13, 30, ROCK_DK],
];

const OVERRIDES: [number, number, string][] = [
  // bright lamp core + mullions in the lantern
  [6, 7, LAMP], [7, 7, LAMP], [6, 6, LAMP], [7, 6, LAMP], [6, 8, LAMP], [7, 8, LAMP],
  [5, 6, RED_DK], [8, 6, RED_DK], [5, 7, RED_DK], [8, 7, RED_DK], [5, 8, RED_DK], [8, 8, RED_DK],
  // windows
  [6, 18, WINDOW], [7, 18, WINDOW],
  [6, 24, WINDOW], [7, 24, WINDOW],
  // door + steps
  [6, 27, DOOR], [7, 27, DOOR], [6, 28, DOOR], [7, 28, DOOR],
  [6, 29, STEP], [7, 29, STEP],
];

const CELL = 6;
const W = 14 * CELL;
const H = 31 * CELL;

export function Lighthouse({ size = 130 }: { size?: number }) {
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
      aria-label="A red and white pixel lighthouse"
      role="img"
      shapeRendering="crispEdges"
    >
      {/* lamp halo */}
      <circle cx={W / 2} cy={CELL * 7} r={15} fill="rgba(255,244,214,0.22)" />
      {Array.from(grid.entries()).map(([k, c]) => {
        const [x, y] = k.split(",").map(Number);
        return (
          <rect key={k} x={x * CELL} y={y * CELL} width={CELL} height={CELL} fill={c} />
        );
      })}
    </svg>
  );
}
