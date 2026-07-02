// A white origami paper plane that glides slowly across the background —
// ambient, behind all content. Three folded facets (lit top wing, shaded
// underside, body keel) with a thin outline so it reads as folded paper. The
// outer layer travels across the screen; the inner layer bobs and pitches on
// its own cycle, so the dart reads as riding air currents, not sliding on a
// rail.
export function FlyingPlane() {
  return (
    <div
      aria-hidden="true"
      className="plane-across pointer-events-none fixed left-0 top-28 z-0"
    >
      <div className="plane-soar">
        <svg
          width="56"
          height="44"
          viewBox="0 0 56 44"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* lit top wing */}
          <path
            d="M4 20 L52 4 L27 25 Z"
            fill="#ffffff"
            stroke="#a9a49a"
            strokeWidth="1"
            strokeLinejoin="round"
          />
          {/* shaded underside wing */}
          <path
            d="M27 25 L52 4 L36 38 Z"
            fill="#e6e2d6"
            stroke="#a9a49a"
            strokeWidth="1"
            strokeLinejoin="round"
          />
          {/* body keel fold */}
          <path
            d="M4 20 L27 25 L36 38 L24 30 Z"
            fill="#f4f1e8"
            stroke="#a9a49a"
            strokeWidth="1"
            strokeLinejoin="round"
          />
        </svg>
      </div>
    </div>
  );
}
