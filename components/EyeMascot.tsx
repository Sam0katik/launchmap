"use client";

import { useEffect, useRef, useState } from "react";

// EyeMascot — a detailed pixel eye whose iris tracks the cursor.
// Static white sclera (almond) + a layered cyan iris group that translates
// toward the mouse. Pure SVG pixel rects, crisp-edged.

const CELL = 6;
const WHITE = "#fafafa";
const IRIS_OUT = "#075985";
const IRIS_MID = "#38bdf8";
const IRIS_IN = "#7dd3fc";
const PUPIL = "#09090b";
const RING = "#27272a";

// Almond sclera, [xStart, xEnd] inclusive per row y (0..12).
const SCLERA: [number, number][] = [
  [8, 13], [6, 15], [4, 17], [3, 18], [2, 19], [2, 19],
  [1, 20], [2, 19], [2, 19], [3, 18], [4, 17], [6, 15], [8, 13],
];

const CX = 10.5;
const CY = 6;
const W = 22 * CELL;
const H = 13 * CELL;

// Static cells: dark ring outline + white sclera.
const scleraCells: [number, number, string][] = [];
SCLERA.forEach(([s, e], y) => {
  // ring: one cell outside each end
  scleraCells.push([s - 1, y, RING], [e + 1, y, RING]);
  for (let x = s; x <= e; x++) scleraCells.push([x, y, WHITE]);
});
// top/bottom ring caps
for (let x = 7; x <= 14; x++) scleraCells.push([x, -1, RING], [x, 13, RING]);

// Iris/pupil/glint cells, centered on (CX, CY).
const irisCells: [number, number, string][] = [];
for (let dx = -6; dx <= 6; dx++) {
  for (let dy = -6; dy <= 6; dy++) {
    const r = Math.hypot(dx, dy);
    if (r > 4.6) continue;
    let color = r > 3.4 ? IRIS_OUT : r > 1.9 ? IRIS_MID : IRIS_IN;
    if (r <= 2.2) color = PUPIL;
    irisCells.push([CX + dx, CY + dy, color]);
  }
}
irisCells.push([CX - 1.5, CY - 1.5, WHITE], [CX - 0.5, CY - 1.5, WHITE]);

export function EyeMascot({ size = 150 }: { size?: number }) {
  const ref = useRef<SVGSVGElement>(null);
  const [off, setOff] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) return;
    const onMove = (e: MouseEvent) => {
      const el = ref.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const ex = rect.left + rect.width / 2;
      const ey = rect.top + rect.height / 2;
      const dx = e.clientX - ex;
      const dy = e.clientY - ey;
      const d = Math.hypot(dx, dy) || 1;
      const MAX = 2.2; // cells the iris can travel
      const mag = Math.min(1, d / 280) * MAX;
      setOff({ x: (dx / d) * mag, y: (dy / d) * mag });
    };
    window.addEventListener("mousemove", onMove);
    return () => window.removeEventListener("mousemove", onMove);
  }, []);

  return (
    <svg
      ref={ref}
      width={size}
      height={(size * H) / W}
      viewBox={`0 ${-CELL} ${W} ${H + CELL}`}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="A pixel eye that follows your cursor"
      role="img"
      shapeRendering="crispEdges"
    >
      {scleraCells.map(([x, y, c], i) => (
        <rect key={`s${i}`} x={x * CELL} y={y * CELL} width={CELL} height={CELL} fill={c} />
      ))}
      <g
        style={{
          transform: `translate(${off.x * CELL}px, ${off.y * CELL}px)`,
          transition: "transform 130ms ease-out",
        }}
      >
        {irisCells.map(([x, y, c], i) => (
          <rect key={`i${i}`} x={x * CELL} y={y * CELL} width={CELL} height={CELL} fill={c} />
        ))}
      </g>
    </svg>
  );
}
