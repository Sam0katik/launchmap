// Tiny pixel lighthouse — used as a small logo mark next to the wordmark.
const O = "#ff5310"; // orange band
const C = "#f1e9d6"; // cream band
const L = "#fff0c0"; // lamp
const D = "#c43e08"; // dark frame / rail
const R = "#5b5238"; // base/rock

const ROWS: [number, number, number, string][] = [
  [3, 4, 0, D], // roof
  [2, 5, 1, O],
  [2, 5, 2, L], // lamp
  [2, 5, 3, D], // frame
  [1, 6, 4, D], // gallery rail
  [2, 5, 5, C],
  [2, 5, 6, O], // band
  [2, 5, 7, C],
  [1, 6, 8, O], // band
  [1, 6, 9, C],
  [1, 6, 10, O],
  [0, 7, 11, C], // base
  [0, 7, 12, R], // rocks
];

const CELL = 3;
const W = 8 * CELL;
const H = 13 * CELL;

export function LighthouseIcon({ size = 26 }: { size?: number }) {
  const cells: [number, number, string][] = [];
  for (const [s, e, y, c] of ROWS) for (let x = s; x <= e; x++) cells.push([x, y, c]);
  return (
    <svg
      width={size}
      height={(size * H) / W}
      viewBox={`0 0 ${W} ${H}`}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      shapeRendering="crispEdges"
    >
      {cells.map(([x, y, c], i) => (
        <rect key={i} x={x * CELL} y={y * CELL} width={CELL} height={CELL} fill={c} />
      ))}
    </svg>
  );
}
