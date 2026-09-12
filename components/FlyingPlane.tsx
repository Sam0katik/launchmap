import { PixelPlaneGlyph } from "@/components/PixelPlane";

// Ambient pixel paper plane gliding across the background, behind all content.
// It rides a gentle wave (SMIL animateMotion) without rotating — pixel art
// stays crisp only when it isn't turned — and leaves a short trail of pixel
// dashes that draws in behind it and fades before the next pass.
//
// One full-viewport SVG (viewBox 1440×900, slice-scaled), so the path stays
// proportional at any screen size. No JS, no layout cost.
const FLIGHT_PATH =
  "M-140 620 C 260 560, 420 360, 720 380 C 980 400, 1160 250, 1580 210";

const DURATION = "24s";
// ease-in-out over the whole pass — the slow ends are off-screen, so the
// plane is already moving when it enters and still moving when it leaves.
const EASE = { calcMode: "spline", keyTimes: "0;1", keySplines: "0.45 0 0.55 1" };

export function FlyingPlane() {
  return (
    <svg
      aria-hidden="true"
      className="plane-flight pointer-events-none fixed inset-0 z-0 h-full w-full"
      preserveAspectRatio="xMidYMid slice"
      viewBox="0 0 1440 900"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <path id="plane-flight-path" d={FLIGHT_PATH} />
        {/* reveal mask: a white stroke that grows along the path in step with
            the plane, so only the part already flown shows */}
        <mask id="plane-trail-reveal" maskUnits="userSpaceOnUse" x="-200" y="0" width="1900" height="900">
          <path
            d={FLIGHT_PATH}
            pathLength={100}
            stroke="#fff"
            strokeWidth="10"
            strokeDasharray="100 100"
            strokeDashoffset="100"
          >
            <animate
              attributeName="stroke-dashoffset"
              from="100"
              to="0"
              dur={DURATION}
              repeatCount="indefinite"
              {...EASE}
            />
          </path>
        </mask>
      </defs>

      {/* pixel-dash trail (square caps, crisp) */}
      <path
        d={FLIGHT_PATH}
        pathLength={100}
        stroke="#1b1a16"
        strokeWidth="2.5"
        strokeDasharray="0.5 1.1"
        strokeLinecap="butt"
        shapeRendering="crispEdges"
        opacity="0.16"
        mask="url(#plane-trail-reveal)"
      >
        <animate
          attributeName="opacity"
          values="0.16;0.16;0"
          keyTimes="0;0.86;1"
          dur={DURATION}
          repeatCount="indefinite"
        />
      </path>

      {/* the plane — glides along the path, never rotates */}
      <g>
        <animateMotion dur={DURATION} repeatCount="indefinite" {...EASE}>
          <mpath href="#plane-flight-path" />
        </animateMotion>
        {/* 24×14 sprite at 2.4 units per pixel (~58px wide on a 1440 screen),
            centred on the path; the inner group bobs on its own short cycle */}
        <g transform="translate(-29 -17) scale(2.4)">
          <g className="plane-bob">
            <PixelPlaneGlyph />
          </g>
        </g>
      </g>
    </svg>
  );
}
