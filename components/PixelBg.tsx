"use client";

import { useEffect, useRef } from "react";

// Calm, neat pixel shimmer. A sparse grid of dim monochrome pixels with a slow
// diagonal wave of brightness drifting across — subtle, not busy. Behind all
// content, honors prefers-reduced-motion.
export function PixelBg() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const CELL = 20; // sparse
    const DOT = 2;

    let cols = 0;
    let rows = 0;
    let raf = 0;
    let t = 0;
    let jitter: Float32Array = new Float32Array(0);

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.floor(window.innerWidth * dpr);
      canvas.height = Math.floor(window.innerHeight * dpr);
      canvas.style.width = window.innerWidth + "px";
      canvas.style.height = window.innerHeight + "px";
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      cols = Math.ceil(window.innerWidth / CELL) + 1;
      rows = Math.ceil(window.innerHeight / CELL) + 1;
      jitter = new Float32Array(cols * rows);
      for (let i = 0; i < jitter.length; i++) jitter[i] = Math.random();
    };

    const draw = () => {
      ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
      for (let gy = 0; gy < rows; gy++) {
        for (let gx = 0; gx < cols; gx++) {
          const i = gy * cols + gx;
          // slow diagonal shimmer wave + per-cell jitter
          const wave = Math.sin(gx * 0.12 + gy * 0.12 - t);
          let a = 0.03 + Math.max(0, wave) * 0.09 * (0.4 + jitter[i] * 0.6);
          if (a < 0.035) continue;
          ctx.fillStyle = `rgba(228,228,231,${a})`;
          ctx.fillRect(gx * CELL, gy * CELL, DOT, DOT);
        }
      }
    };

    const frame = () => {
      t += 0.012;
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
