// Blip — LaunchMap's mascot. A friendly pixel blob with big eyes and a smile.
// Teal body (brand accent), white eyes, dark pupils. Pure SVG, idle-bobs via
// the .mascot-bob class.

const PUPIL = "#0f1011";
const TEAL = "#2dd4bf";
const TEAL_DK = "#14b8a6";
const WHITE = "#f7f8f8";
const SHADOW = "#18191a";

// [x, y, color] on a 16-wide grid. cell = 6px → ~96px sprite.
const P: [number, number, string][] = [
  // antenna
  [8, 0, TEAL_DK],
  [8, 1, TEAL],
  // rounded dome
  [6, 2, TEAL], [7, 2, TEAL], [8, 2, TEAL], [9, 2, TEAL], [10, 2, TEAL],
  [5, 3, TEAL], [6, 3, TEAL], [7, 3, TEAL], [8, 3, TEAL], [9, 3, TEAL], [10, 3, TEAL], [11, 3, TEAL],
  // body + eyes row 1
  [4, 4, TEAL], [5, 4, WHITE], [6, 4, WHITE], [7, 4, TEAL], [8, 4, TEAL], [9, 4, WHITE], [10, 4, WHITE], [11, 4, TEAL],
  // eyes row 2 (with pupils)
  [4, 5, TEAL], [5, 5, WHITE], [6, 5, PUPIL], [7, 5, TEAL], [8, 5, TEAL], [9, 5, PUPIL], [10, 5, WHITE], [11, 5, TEAL],
  // cheeks
  [4, 6, TEAL], [5, 6, TEAL], [6, 6, TEAL], [7, 6, TEAL], [8, 6, TEAL], [9, 6, TEAL], [10, 6, TEAL], [11, 6, TEAL],
  // smile
  [4, 7, TEAL], [5, 7, TEAL], [6, 7, PUPIL], [7, 7, TEAL], [8, 7, TEAL], [9, 7, PUPIL], [10, 7, TEAL], [11, 7, TEAL],
  [4, 8, TEAL], [5, 8, TEAL], [6, 8, TEAL], [7, 8, PUPIL], [8, 8, PUPIL], [9, 8, TEAL], [10, 8, TEAL], [11, 8, TEAL],
  // rounded base
  [5, 9, TEAL], [6, 9, TEAL], [7, 9, TEAL], [8, 9, TEAL], [9, 9, TEAL], [10, 9, TEAL],
  [6, 10, TEAL_DK], [7, 10, TEAL_DK], [8, 10, TEAL_DK], [9, 10, TEAL_DK],
  // little feet
  [5, 11, TEAL], [6, 11, TEAL], [9, 11, TEAL], [10, 11, TEAL],
  // ground shadow
  [5, 13, SHADOW], [6, 13, SHADOW], [7, 13, SHADOW], [8, 13, SHADOW], [9, 13, SHADOW], [10, 13, SHADOW],
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
      aria-label="Blip, the LaunchMap mascot"
      role="img"
      shapeRendering="crispEdges"
    >
      {P.map(([x, y, color], i) => (
        <rect key={i} x={x * CELL} y={y * CELL} width={CELL} height={CELL} fill={color} />
      ))}
    </svg>
  );
}
