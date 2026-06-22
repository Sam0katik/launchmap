// Beige note "clipped" to the card with a paper clip. Slides out smoothly on
// hover. Key phrases are marker-highlighted (reference style).
export function ClippedNote() {
  return (
    <div className="group relative w-[270px] origin-top-left rotate-[3deg] cursor-default select-none transition-transform duration-300 ease-out hover:translate-x-3 hover:-translate-y-1.5 hover:rotate-[1.5deg]">
      {/* vertical wire paper clip over the top edge (reference style) */}
      <svg
        className="absolute -top-8 left-9 z-10"
        width="22"
        height="70"
        viewBox="0 0 22 70"
        fill="none"
        aria-hidden="true"
      >
        <path
          d="M8 64 V12 a3 3 0 0 1 6 0 V58"
          stroke="#6b675f"
          strokeWidth="2.4"
          strokeLinecap="round"
          fill="none"
        />
        <path
          d="M14 58 V14 a6 6 0 0 0 -12 0 V62 a9 9 0 0 0 18 0 V10 a8 8 0 0 0 -16 0 V52"
          stroke="#88847b"
          strokeWidth="2.4"
          strokeLinecap="round"
          fill="none"
        />
      </svg>

      <div className="border-2 border-hairline-strong bg-[#cdbfa6] px-5 py-5 text-[13px] leading-relaxed text-ink shadow-[6px_8px_0_0_var(--color-hairline-strong)]">
        <p className="mb-3 text-base">Mission brief</p>
        <p>
          Paste your URL and Beacon maps where to post. Each spot lists its{" "}
          <span className="hl">rules</span>,{" "}
          <span className="hl">karma bar</span>, and{" "}
          <span className="hl">best time</span> — so you reach first users{" "}
          <span className="hl">without getting banned</span>.
        </p>
      </div>
    </div>
  );
}
