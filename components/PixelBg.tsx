"use client";

import { useEffect, useRef } from "react";

// Drifting pixel blobs — a few soft warm-orange pixel clusters slowly moving
// across the cream canvas and wrapping at the edges. Subtle, behind content,
// honors prefers-reduced-motion.
export function PixelBg() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const CELL = 10;
    const MAX_A = 0.08;

    let w = 0;
    let h = 0;
    let raf = 0;

    type Blob = { x: number; y: number; vx: number; vy: number; r: number; tint: string };
    const TINTS = ["120,116,104", "150,145,130", "95,93,86"];
    let blobs: Blob[] = [];

    const make = (): Blob => ({
      x: Math.random() * w,
      y: Math.random() * h,
      vx: (Math.random() - 0.5) * 0.35,
      vy: (Math.random() - 0.5) * 0.35,
      r: 120 + Math.random() * 130,
      tint: TINTS[(Math.random() * TINTS.length) | 0],
    });

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = window.innerWidth;
      h = window.innerHeight;
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      canvas.style.width = w + "px";
      canvas.style.height = h + "px";
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      blobs = new Array(6).fill(0).map(make);
    };

    const drawBlob = (b: Blob) => {
      const x0 = Math.floor((b.x - b.r) / CELL) * CELL;
      const y0 = Math.floor((b.y - b.r) / CELL) * CELL;
      for (let y = y0; y <= b.y + b.r; y += CELL) {
        for (let x = x0; x <= b.x + b.r; x += CELL) {
          const d = Math.hypot(x - b.x, y - b.y);
          if (d > b.r) continue;
          const a = (1 - d / b.r) * MAX_A;
          if (a < 0.015) continue;
          ctx.fillStyle = `rgba(${b.tint},${a})`;
          ctx.fillRect(x, y, CELL - 2, CELL - 2);
        }
      }
    };

    const step = () => {
      ctx.clearRect(0, 0, w, h);
      for (const b of blobs) {
        b.x += b.vx;
        b.y += b.vy;
        const m = b.r;
        if (b.x < -m) b.x = w + m;
        if (b.x > w + m) b.x = -m;
        if (b.y < -m) b.y = h + m;
        if (b.y > h + m) b.y = -m;
        drawBlob(b);
      }
    };

    const frame = () => {
      step();
      raf = requestAnimationFrame(frame);
    };

    resize();
    window.addEventListener("resize", resize);
    if (reduce) step();
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
