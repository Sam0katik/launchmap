// A small beige note "clipped" onto the main card with a paper clip — the
// description lives here, with key phrases marker-highlighted (reference style).
export function ClippedNote() {
  return (
    <div className="pointer-events-none relative w-[260px] rotate-[3deg] select-none">
      {/* paper clip over the top edge */}
      <svg
        className="absolute -top-7 left-8 z-10"
        width="26"
        height="58"
        viewBox="0 0 26 58"
        fill="none"
        aria-hidden="true"
      >
        <path
          d="M13 54 V14 a8 8 0 0 1 16 0 V44 a13 13 0 0 1 -26 0 V12 a11 11 0 0 1 22 0 V46"
          transform="translate(-2 0)"
          stroke="#5b5751"
          strokeWidth="2.5"
          fill="none"
          strokeLinecap="round"
        />
      </svg>

      {/* the note */}
      <div className="border-2 border-hairline-strong bg-[#cdbfa6] px-5 py-5 text-[13px] leading-relaxed text-ink shadow-[5px_5px_0_0_var(--color-hairline-strong)]">
        <p className="mb-3 text-base">Mission brief</p>
        <p>
          Paste your URL and Beacon maps where to post. Each spot comes with its{" "}
          <span className="hl">rules</span>,{" "}
          <span className="hl">karma bar</span>, and{" "}
          <span className="hl">best time</span> — so you reach first users{" "}
          <span className="hl">without getting banned</span>.
        </p>
      </div>
    </div>
  );
}
