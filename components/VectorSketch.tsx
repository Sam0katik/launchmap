// Faint technical line-art in the background — concentric circles, a
// golden-ratio-style spiral and construction lines, echoing the reference site
// (departuremono.com). Pure SVG, static, very low opacity, behind everything.
//
// `variant`:
//   - "primary" (default) — the landing composition.
//   - "alt"   — a different arrangement for inner pages (map / profile / legal)
//     so they feel related but not identical. Same ink + opacity language.
type Variant = "primary" | "alt";

export function VectorSketch({ variant = "primary" }: { variant?: Variant }) {
  return (
    <svg
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-0 h-full w-full"
      preserveAspectRatio="xMidYMid slice"
      viewBox="0 0 1440 900"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <g stroke="#1b1a16" strokeOpacity="0.1" strokeWidth="1.25" fill="none">
        {variant === "primary" ? <PrimarySketch /> : <AltSketch />}
      </g>
    </svg>
  );
}

function PrimarySketch() {
  return (
    <>
      {/* left-side concentric circles */}
      <circle cx="180" cy="470" r="300" />
      <circle cx="180" cy="470" r="190" />
      <circle cx="180" cy="470" r="118" />
      <circle cx="180" cy="470" r="73" />
      {/* golden-rectangle construction lines */}
      <rect x="-120" y="280" width="600" height="380" />
      <line x1="360" y1="280" x2="360" y2="660" />
      <line x1="-120" y1="470" x2="480" y2="470" />
      {/* quarter-arc spiral */}
      <path d="M480 280 A 200 200 0 0 0 280 480" />
      <path d="M280 480 A 120 120 0 0 0 360 600" />
      <path d="M360 600 A 75 75 0 0 0 435 540" />

      {/* upper-right construction grid */}
      <line x1="1180" y1="40" x2="1180" y2="240" />
      <line x1="1280" y1="40" x2="1280" y2="240" />
      <line x1="1100" y1="120" x2="1380" y2="120" />
      <circle cx="1260" cy="150" r="96" />
      <circle cx="1260" cy="150" r="56" />
      <path d="M1356 150 A 96 96 0 0 1 1260 246" />

      {/* lower-right concentric set */}
      <circle cx="1300" cy="760" r="220" />
      <circle cx="1300" cy="760" r="136" />
      <circle cx="1300" cy="760" r="84" />
      <line x1="1080" y1="760" x2="1520" y2="760" />
      <line x1="1300" y1="540" x2="1300" y2="980" />

      {/* mid cross-hairs + diagonals */}
      <line x1="720" y1="0" x2="720" y2="900" strokeDasharray="2 10" />
      <path d="M40 820 L300 560" />
      <path d="M1180 700 L1380 540" />
      <rect x="980" y="640" width="150" height="150" />
      <line x1="980" y1="640" x2="1130" y2="790" />
    </>
  );
}

// Inner-page variant: the same drafting language reflowed — a right-anchored
// circle cluster, a left construction grid, and a longer spiral. Recognizably
// the same hand, deliberately not the landing layout.
function AltSketch() {
  return (
    <>
      {/* right-side concentric circles (mirror of the landing's left set) */}
      <circle cx="1240" cy="430" r="320" />
      <circle cx="1240" cy="430" r="205" />
      <circle cx="1240" cy="430" r="128" />
      <circle cx="1240" cy="430" r="78" />
      <line x1="920" y1="430" x2="1560" y2="430" />
      <line x1="1240" y1="120" x2="1240" y2="760" />

      {/* longer quarter-arc spiral unwinding from the circle centre */}
      <path d="M960 430 A 280 280 0 0 1 1240 150" />
      <path d="M1240 150 A 170 170 0 0 1 1410 320" />
      <path d="M1410 320 A 100 100 0 0 1 1310 420" />

      {/* upper-left construction grid */}
      <rect x="80" y="90" width="360" height="240" />
      <line x1="260" y1="90" x2="260" y2="330" />
      <line x1="80" y1="210" x2="440" y2="210" />
      <circle cx="260" cy="210" r="78" />
      <circle cx="260" cy="210" r="44" />

      {/* lower-left diagonal drafting marks */}
      <path d="M120 860 L380 600" />
      <path d="M60 700 L240 520" />
      <rect x="150" y="640" width="140" height="140" />
      <line x1="150" y1="640" x2="290" y2="780" />

      {/* faint vertical dashed datum off-centre */}
      <line x1="640" y1="0" x2="640" y2="900" strokeDasharray="2 10" />
    </>
  );
}
