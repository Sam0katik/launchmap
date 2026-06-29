import { PaperPlane } from "@/components/PaperPlane";

// A white pixel paper-plane that drifts slowly across the background — ambient,
// behind all content. Used on the map screen instead of a static header plane.
export function FlyingPlane() {
  return (
    <div
      aria-hidden="true"
      className="plane-across pointer-events-none fixed left-0 top-28 z-0 opacity-70"
    >
      <PaperPlane size={44} tone="white" />
    </div>
  );
}
