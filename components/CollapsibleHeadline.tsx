// The map header: the product name as the heading, with a short gray summary
// underneath. Kept compact and clean — the receipt meta line (No.) plus the
// identity (pixel mono, dashed rule, eyebrow) stay; the visual bulk goes.
export function CollapsibleHeadline({
  productName,
  summary,
  runNo,
}: {
  productName: string;
  summary: string;
  runNo: string;
}) {
  return (
    <header className="panel mb-10 px-8 pb-7 pt-6">
      <div className="mb-3 flex items-center justify-between text-xs uppercase tracking-widest text-ink-subtle">
        <span>Your launch map</span>
        <span className="tnum">No. {runNo}</span>
      </div>
      <div className="receipt-rule mb-5" />

      <h1
        className="pixel text-ink"
        style={{
          fontSize: "clamp(24px, 2.8vw, 34px)",
          lineHeight: 1.15,
          letterSpacing: "0.3px",
        }}
      >
        {productName}
      </h1>

      {summary && (
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-ink-subtle">
          {summary}
        </p>
      )}
    </header>
  );
}
