// Pixi — LaunchMap's pixel mascot. A cute little rocket with a face, drawn as
// pixel blocks on a 16x16 grid. Lavender body (brand accent), amber flame.
// Pure SVG, no deps. Idle-bobs via the .mascot-bob class.

const INK = "#f7f8f8";
const LAV = "#5e6ad2";
const LAV_DK = "#4a55b8";
const AMBER = "#e8a55a";
const RED = "#c64545";
const WIN = "#0f1011";

// Each entry: [x, y, color]. Grid cell = 6px, so a 16-wide sprite ≈ 96px.
const P: [number, number, string][] = [
  // nose cone
  [7, 0, INK], [8, 0, INK],
  [6, 1, INK], [7, 1, LAV], [8, 1, LAV], [9, 1, INK],
  // body
  [6, 2, LAV], [7, 2, LAV], [8, 2, LAV], [9, 2, LAV],
  [5, 3, LAV], [6, 3, LAV], [7, 3, LAV], [8, 3, LAV], [9, 3, LAV], [10, 3, LAV],
  // window (face)
  [5, 4, LAV], [6, 4, WIN], [7, 4, WIN], [8, 4, WIN], [9, 4, WIN], [10, 4, LAV],
  [5, 5, LAV], [6, 5, WIN], [7, 5, INK], [8, 5, INK], [9, 5, WIN], [10, 5, LAV],
  // smile
  [5, 6, LAV], [6, 6, WIN], [7, 6, WIN], [8, 6, WIN], [9, 6, WIN], [10, 6, LAV],
  [5, 7, LAV], [6, 7, LAV], [7, 7, LAV], [8, 7, LAV], [9, 7, LAV], [10, 7, LAV],
  // lower body + fins
  [4, 8, LAV_DK], [5, 8, LAV], [6, 8, LAV], [7, 8, LAV], [8, 8, LAV], [9, 8, LAV], [10, 8, LAV], [11, 8, LAV_DK],
  [4, 9, LAV_DK], [5, 9, LAV], [6, 9, LAV], [7, 9, LAV], [8, 9, LAV], [9, 9, LAV], [10, 9, LAV], [11, 9, LAV_DK],
  [5, 10, LAV_DK], [6, 10, LAV], [7, 10, LAV], [8, 10, LAV], [9, 10, LAV], [10, 10, LAV_DK],
  // exhaust + flame
  [6, 11, WIN], [7, 11, LAV_DK], [8, 11, LAV_DK], [9, 11, WIN],
  [7, 12, AMBER], [8, 12, AMBER],
  [7, 13, RED], [8, 13, AMBER],
  [8, 14, RED],
];

const CELL = 6;

export function Mascot({ size = 96 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 96 96"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Pixi, the LaunchMap rocket mascot"
      role="img"
      shapeRendering="crispEdges"
    >
      {P.map(([x, y, color], i) => (
        <rect key={i} x={x * CELL} y={y * CELL} width={CELL} height={CELL} fill={color} />
      ))}
    </svg>
  );
}
