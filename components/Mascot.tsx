// Pin — LaunchMap's mascot. A cute pixel map-pin with a face (you're mapping
// where to launch). Lavender body, white face, ink eyes + smile. Pure SVG.
// Idle-bobs via the .mascot-bob class.

const INK = "#0f1011";
const LAV = "#5e6ad2";
const LAV_DK = "#4a55b8";
const FACE = "#f7f8f8";

// [x, y, color] on a 16-wide grid. cell = 6px → ~96px sprite.
const P: [number, number, string][] = [
  // pin top edge
  [6, 0, LAV], [7, 0, LAV], [8, 0, LAV], [9, 0, LAV],
  [5, 1, LAV], [6, 1, LAV], [7, 1, LAV], [8, 1, LAV], [9, 1, LAV], [10, 1, LAV],
  // body rows with a white face inset
  [4, 2, LAV], [5, 2, FACE], [6, 2, FACE], [7, 2, FACE], [8, 2, FACE], [9, 2, FACE], [10, 2, FACE], [11, 2, LAV],
  [4, 3, LAV], [5, 3, FACE], [6, 3, INK], [7, 3, FACE], [8, 3, FACE], [9, 3, INK], [10, 3, FACE], [11, 3, LAV],
  [4, 4, LAV], [5, 4, FACE], [6, 4, FACE], [7, 4, FACE], [8, 4, FACE], [9, 4, FACE], [10, 4, FACE], [11, 4, LAV],
  [4, 5, LAV], [5, 5, FACE], [6, 5, INK], [7, 5, FACE], [8, 5, FACE], [9, 5, INK], [10, 5, FACE], [11, 5, LAV],
  [4, 6, LAV], [5, 6, FACE], [6, 6, FACE], [7, 6, INK], [8, 6, INK], [9, 6, FACE], [10, 6, FACE], [11, 6, LAV],
  // taper to the point
  [5, 7, LAV], [6, 7, LAV], [7, 7, LAV], [8, 7, LAV], [9, 7, LAV], [10, 7, LAV],
  [6, 8, LAV], [7, 8, LAV], [8, 8, LAV], [9, 8, LAV],
  [7, 9, LAV_DK], [8, 9, LAV_DK],
  [7, 10, LAV_DK], [8, 10, LAV_DK],
  [7, 11, INK], [8, 11, INK],
  // little shadow under the pin
  [6, 13, "#18191a"], [7, 13, "#18191a"], [8, 13, "#18191a"], [9, 13, "#18191a"],
];

const CELL = 6;

export function Mascot({ size = 88 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 96 96"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Pin, the LaunchMap map-pin mascot"
      role="img"
      shapeRendering="crispEdges"
    >
      {P.map(([x, y, color], i) => (
        <rect key={i} x={x * CELL} y={y * CELL} width={CELL} height={CELL} fill={color} />
      ))}
    </svg>
  );
}
