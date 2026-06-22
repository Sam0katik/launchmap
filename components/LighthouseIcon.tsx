// Pixel lighthouse mark, muted palette modelled on the reference photo:
// maroon roof, yellow-lit lantern, sage-green + dusty-rose bands, a cool purple
// shaded side, grey base. Frontal, simplified for a small logo.

const ROOF = "#8a3b32";
const ROOF_DK = "#5e2a25";
const LAMP = "#d9b24a";
const FRAME = "#a85a45";
const GALLERY = "#c7b79a";
const ROSE = "#b56a5a";
const SAGE = "#9aa583";
const REDB = "#9f4f43";
const SHADOW = "#5a4a63"; // cool shaded side
const WINDOW = "#33272f";
const BASE = "#8a8f7a";
const DOOR = "#4a4540";
const ROCK = "#6b6b66";

// [xStart, xEnd, y, color] on a 10-wide grid (center ~4.5).
const ROWS: [number, number, number, string][] = [
  [4, 5, 0, ROOF_DK],
  [3, 6, 1, ROOF],
  [2, 7, 2, ROOF_DK],
  [3, 6, 3, FRAME], // lantern frame
  [3, 6, 4, LAMP], // lit windows
  [3, 6, 5, LAMP],
  [2, 7, 6, FRAME], // balcony rail
  [2, 7, 7, GALLERY], // gallery deck
  [3, 6, 8, ROSE], // body bands
  [3, 6, 9, ROSE],
  [3, 6, 10, SAGE],
  [3, 6, 11, SAGE],
  [2, 7, 12, REDB],
  [2, 7, 13, REDB],
  [2, 7, 14, SAGE],
  [1, 8, 15, BASE], // base flare
  [1, 8, 16, BASE],
  [0, 9, 17, ROCK], // rocks
];

const OVERRIDES: [number, number, string][] = [
  [4, 4, "#7a5a2a"], [5, 4, "#7a5a2a"], // lamp mullion
  [4, 10, WINDOW], [5, 10, WINDOW], // window
  [4, 13, WINDOW], [5, 13, WINDOW], // window
  [4, 16, DOOR], [5, 16, DOOR], // door
];

const CELL = 4;
const W = 10 * CELL;
const H = 18 * CELL;

export function LighthouseIcon({ size = 40 }: { size?: number }) {
  const grid = new Map<string, string>();
  for (const [s, e, y, c] of ROWS) for (let x = s; x <= e; x++) grid.set(`${x},${y}`, c);
  // shade the leftmost lit cell of each row to suggest a light direction
  for (const [s, , y] of ROWS) grid.set(`${s},${y}`, SHADOW);
  for (const [x, y, c] of OVERRIDES) grid.set(`${x},${y}`, c);

  return (
    <svg
      width={(size * W) / H}
      height={size}
      viewBox={`0 0 ${W} ${H}`}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      shapeRendering="crispEdges"
    >
      {Array.from(grid.entries()).map(([k, c]) => {
        const [x, y] = k.split(",").map(Number);
        return <rect key={k} x={x * CELL} y={y * CELL} width={CELL} height={CELL} fill={c} />;
      })}
    </svg>
  );
}
