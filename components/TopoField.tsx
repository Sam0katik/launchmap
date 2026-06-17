"use client";

import { useEffect, useRef } from "react";

// Topographic contour background — thin relief lines that slowly drift, like a
// living topo map (on-theme for LaunchMap). Neutral zinc lines with a few icy
// accent lines. Behind all content, low alpha, honors prefers-reduced-motion.
export function TopoField() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const GAP = 34; // vertical spacing between contour lines
    const STEP = 8; // horizontal sampling resolution
    const ZINC = "39,39,42";
    const ICY = "125,211,252";

    let w = 0;
    let h = 0;
    let lines = 0;
    let raf = 0;
    let t = 0;

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = window.innerWidth;
      h = window.innerHeight;
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      canvas.style.width = w + "px";
      canvas.style.height = h + "px";
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      lines = Math.ceil(h / GAP) + 2;
    };

    const draw = () => {
      ctx.clearRect(0, 0, w, h);
      ctx.lineWidth = 1;
      for (let i = 0; i < lines; i++) {
        const baseY = i * GAP - GAP;
        // a few lines pick up the icy accent; the rest are neutral zinc
        const accent = i % 6 === 0;
        ctx.strokeStyle = accent ? `rgba(${ICY},0.10)` : `rgba(${ZINC},0.9)`;
        ctx.beginPath();
        for (let x = -STEP; x <= w + STEP; x += STEP) {
          const y =
            baseY +
            Math.sin(x * 0.006 + i * 0.45 + t) * 14 +
            Math.sin(x * 0.013 - t * 0.7 + i * 0.2) * 8 +
            Math.sin(x * 0.022 + t * 0.4) * 4;
          if (x === -STEP) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
      }
    };

    const frame = () => {
      t += 0.01;
      draw();
      raf = requestAnimationFrame(frame);
    };

    resize();
    window.addEventListener("resize", resize);
    if (reduce) draw();
    else raf = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <canvas
      ref={ref}
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-0"
    />
  );
}
