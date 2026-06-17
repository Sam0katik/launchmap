"use client";

import { useEffect, useRef } from "react";

// Flowing pixel field — a dense grid of cells whose brightness rides a moving
// noise wave, so bands of teal pixels drift across the canvas (organic, not
// random twinkle). Sits behind all content, low alpha so text stays readable,
// honors prefers-reduced-motion.
export function PixelField() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const CELL = 13; // dense grid
    const MAX_A = 0.4;
    // Teal / cyan family — the new accent.
    const TINTS = ["45,212,191", "94,234,212", "20,184,166", "56,189,180"];

    let cols = 0;
    let rows = 0;
    let raf = 0;
    let t = 0;
    // Per-cell static jitter for a hand-scattered (not perfectly smooth) look.
    let jitter: Float32Array = new Float32Array(0);
    let tintIdx: Uint8Array = new Uint8Array(0);

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.floor(window.innerWidth * dpr);
      canvas.height = Math.floor(window.innerHeight * dpr);
      canvas.style.width = window.innerWidth + "px";
      canvas.style.height = window.innerHeight + "px";
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      cols = Math.ceil(window.innerWidth / CELL);
      rows = Math.ceil(window.innerHeight / CELL);
      jitter = new Float32Array(cols * rows);
      tintIdx = new Uint8Array(cols * rows);
      for (let i = 0; i < jitter.length; i++) {
        jitter[i] = Math.random();
        tintIdx[i] = (Math.random() * TINTS.length) | 0;
      }
    };

    // Cheap pseudo-noise: sum of sines over x, y, and a moving t → drifting bands.
    const wave = (x: number, y: number) =>
      Math.sin(x * 0.18 + t) +
      Math.sin(y * 0.22 + t * 0.7) +
      Math.sin((x + y) * 0.09 - t * 0.5) +
      Math.sin((x - y) * 0.13 + t * 0.4);

    const draw = () => {
      ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
      for (let gy = 0; gy < rows; gy++) {
        for (let gx = 0; gx < cols; gx++) {
          const i = gy * cols + gx;
          // wave in [-4,4] → normalize to [0,1]
          let v = (wave(gx, gy) + 4) / 8;
          v *= 0.6 + jitter[i] * 0.8; // scatter
          if (v < 0.62) continue; // threshold → only bright cells render
          const a = Math.min(MAX_A, (v - 0.62) * MAX_A * 3);
          ctx.fillStyle = `rgba(${TINTS[tintIdx[i]]},${a})`;
          ctx.fillRect(gx * CELL, gy * CELL, CELL - 2, CELL - 2);
        }
      }
    };

    const frame = () => {
      t += 0.018;
      draw();
      raf = requestAnimationFrame(frame);
    };

    resize();
    window.addEventListener("resize", resize);

    if (reduce) {
      draw(); // one static frame
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
