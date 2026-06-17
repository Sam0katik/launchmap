"use client";

import { useEffect, useRef } from "react";

// Shimmering pixel-field background. A grid of cells where a few randomly
// light up in the lavender accent and fade out — subtle, behind all content.
// Canvas + rAF (compositor-friendly), honors prefers-reduced-motion, and caps
// brightness low so text stays readable.
export function PixelField() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const CELL = 22; // px per pixel-cell
    const MAX_A = 0.28; // peak alpha — low enough not to fight the text
    // Lavender + a cooler blue for variety.
    const TINTS = ["94,105,209", "130,143,255", "90,120,180"];

    let cols = 0;
    let rows = 0;
    let cells: { a: number; tint: string }[] = [];
    let raf = 0;

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.floor(window.innerWidth * dpr);
      canvas.height = Math.floor(window.innerHeight * dpr);
      canvas.style.width = window.innerWidth + "px";
      canvas.style.height = window.innerHeight + "px";
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      cols = Math.ceil(window.innerWidth / CELL);
      rows = Math.ceil(window.innerHeight / CELL);
      cells = new Array(cols * rows).fill(0).map(() => ({ a: 0, tint: TINTS[0] }));
    };

    const spark = (count: number) => {
      for (let i = 0; i < count; i++) {
        const idx = (Math.random() * cells.length) | 0;
        const c = cells[idx];
        if (c && c.a <= 0.01) {
          c.a = MAX_A * (0.5 + Math.random() * 0.5);
          c.tint = TINTS[(Math.random() * TINTS.length) | 0];
        }
      }
    };

    const frame = () => {
      ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
      for (let i = 0; i < cells.length; i++) {
        const c = cells[i];
        if (c.a <= 0.01) continue;
        const x = (i % cols) * CELL;
        const y = ((i / cols) | 0) * CELL;
        ctx.fillStyle = `rgba(${c.tint},${c.a})`;
        ctx.fillRect(x, y, CELL - 2, CELL - 2);
        c.a -= 0.005; // fade
      }
      spark(5);
      raf = requestAnimationFrame(frame);
    };

    resize();
    window.addEventListener("resize", resize);

    if (reduce) {
      // Static sparse field, no animation.
      spark(Math.floor(cells.length * 0.05));
      ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
      for (let i = 0; i < cells.length; i++) {
        const c = cells[i];
        if (c.a <= 0.01) continue;
        const x = (i % cols) * CELL;
        const y = ((i / cols) | 0) * CELL;
        ctx.fillStyle = `rgba(${c.tint},${c.a})`;
        ctx.fillRect(x, y, CELL - 2, CELL - 2);
      }
    } else {
      raf = requestAnimationFrame(frame);
    }

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
