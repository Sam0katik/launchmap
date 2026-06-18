// RadarMascot — a pixel radar dish with a rotating green sweep + blips.
// On-theme for LaunchMap (scanning for where to launch). The sweep rotates via
// the .radar-sweep CSS animation; blips pulse. Pure SVG.

const GREEN = "#4ade80";
const GREEN_DIM = "rgba(74,222,128,0.35)";
const GREEN_FAINT = "rgba(74,222,128,0.16)";
const SCREEN = "#0c140d";

export function RadarMascot({ size = 150 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 120 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="A radar scanning for launch spots"
      role="img"
    >
      {/* screen */}
      <circle cx="60" cy="60" r="54" fill={SCREEN} stroke={GREEN_DIM} strokeWidth="2" />
      {/* range rings */}
      <circle cx="60" cy="60" r="40" stroke={GREEN_FAINT} strokeWidth="1.5" />
      <circle cx="60" cy="60" r="26" stroke={GREEN_FAINT} strokeWidth="1.5" />
      <circle cx="60" cy="60" r="12" stroke={GREEN_FAINT} strokeWidth="1.5" />
      {/* crosshair */}
      <line x1="60" y1="8" x2="60" y2="112" stroke={GREEN_FAINT} strokeWidth="1.5" />
      <line x1="8" y1="60" x2="112" y2="60" stroke={GREEN_FAINT} strokeWidth="1.5" />

      {/* rotating sweep wedge with a fading trail */}
      <g className="radar-sweep">
        <defs>
          <linearGradient id="sweep" x1="60" y1="60" x2="108" y2="32" gradientUnits="userSpaceOnUse">
            <stop offset="0" stopColor={GREEN} stopOpacity="0.55" />
            <stop offset="1" stopColor={GREEN} stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d="M60 60 L112 60 A52 52 0 0 0 96 24 Z" fill="url(#sweep)" />
        <line x1="60" y1="60" x2="112" y2="60" stroke={GREEN} strokeWidth="2" />
      </g>

      {/* blips (pixel squares) */}
      <rect x="78" y="40" width="4" height="4" fill={GREEN}>
        <animate attributeName="opacity" values="1;0.2;1" dur="2.2s" repeatCount="indefinite" />
      </rect>
      <rect x="44" y="74" width="4" height="4" fill={GREEN}>
        <animate attributeName="opacity" values="0.3;1;0.3" dur="2.8s" repeatCount="indefinite" />
      </rect>
      <rect x="70" y="78" width="3" height="3" fill={GREEN}>
        <animate attributeName="opacity" values="1;0.3;1" dur="3.4s" repeatCount="indefinite" />
      </rect>
    </svg>
  );
}
