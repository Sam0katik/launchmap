// Ambient origami paper plane gliding across the background, behind all
// content. Drawn in the site's print-zine language: cream paper facets, hard
// ink outlines, one orange nose (the pixel mascot's signature). It rides a
// swooping flight path with a loop-the-loop, nose always pointing along the
// curve (SMIL animateMotion + rotate="auto"), and leaves a faint dashed trail
// that draws itself behind the plane and fades before the next pass.
//
// Everything lives in one full-viewport SVG (viewBox 1440×900, slice-scaled),
// so the path stays proportional at any screen size. No JS, no layout cost.
const FLIGHT_PATH =
  "M-160 640 C 140 600, 300 330, 560 330 C 780 330, 880 470, 800 560 " +
  "C 720 650, 560 560, 620 440 C 700 280, 1080 240, 1600 120";

const DURATION = "26s";
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
            strokeWidth="8"
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

      {/* dashed trail: draws in behind the plane, fades out at the end of the pass */}
      <path
        d={FLIGHT_PATH}
        pathLength={100}
        stroke="#1b1a16"
        strokeWidth="2"
        strokeDasharray="0.9 1.3"
        strokeLinecap="round"
        opacity="0.22"
        mask="url(#plane-trail-reveal)"
      >
        <animate
          attributeName="opacity"
          values="0.22;0.22;0"
          keyTimes="0;0.86;1"
          dur={DURATION}
          repeatCount="indefinite"
        />
      </path>

      {/* the plane — nose points along +x, rotate="auto" aligns it to the curve */}
      <g>
        <animateMotion
          dur={DURATION}
          repeatCount="indefinite"
          rotate="auto"
          {...EASE}
        >
          <mpath href="#plane-flight-path" />
        </animateMotion>
        {/* inner group bobs on its own short cycle so it reads as riding air */}
        <g transform="scale(1.6) translate(-40 -20)">
        <g className="plane-bob">
          {/* soft ink shadow under the paper */}
          <path
            d="M82 24 L20 8 L34 24 L20 40 Z"
            fill="#1b1a16"
            opacity="0.12"
          />
          {/* lower wing (shaded underside) */}
          <path
            d="M80 20 L18 20 L4 38 Z"
            fill="#d8d3c4"
            stroke="#1b1a16"
            strokeWidth="2"
            strokeLinejoin="round"
          />
          {/* keel — the fold hanging below the centre crease */}
          <path
            d="M80 20 L18 20 L26 31 Z"
            fill="#ccc6b4"
            stroke="#1b1a16"
            strokeWidth="2"
            strokeLinejoin="round"
          />
          {/* upper wing (lit top) */}
          <path
            d="M80 20 L4 2 L18 20 Z"
            fill="#efece2"
            stroke="#1b1a16"
            strokeWidth="2"
            strokeLinejoin="round"
          />
          {/* fold crease highlight along the upper wing */}
          <path d="M72 19 L14 8" stroke="#ffffff" strokeWidth="1" opacity="0.7" />
          {/* orange nose — the mascot's signature */}
          <path d="M80 20 L66 16.5 L66 23.5 Z" fill="#ff6a14" stroke="#1b1a16" strokeWidth="2" strokeLinejoin="round" />
        </g>
        </g>
      </g>
    </svg>
  );
}
