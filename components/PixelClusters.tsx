"use client";

import { useEffect, useRef } from "react";

// Breathing pixel clusters — dense pixels gather toward the edges/corners and
// slowly pulse (breathe), leaving the center calmer so the panel reads clearly.
// Green-tinted, behind all content, honors prefers-reduced-motion.
export function PixelClusters() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const CELL = 9;
    const MAX_A = 0.3;
    // Gray gamma + a rare coral accent pixel (index 3).
    const TINTS = ["63,63,70", "82,82,91", "113,113,122", "251,113,133"];

    let cols = 0;
    let rows = 0;
    let raf = 0;
    let t = 0;
    let mask: Float32Array = new Float32Array(0); // edge bias + jitter per cell
    let tintIdx: Uint8Array = new Uint8Array(0);
    let phase: Float32Array = new Float32Array(0);

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.floor(window.innerWidth * dpr);
      canvas.height = Math.floor(window.innerHeight * dpr);
      canvas.style.width = window.innerWidth + "px";
      canvas.style.height = window.innerHeight + "px";
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      cols = Math.ceil(window.innerWidth / CELL);
      rows = Math.ceil(window.innerHeight / CELL);
      mask = new Float32Array(cols * rows);
      tintIdx = new Uint8Array(cols * rows);
      phase = new Float32Array(cols * rows);
      const cx = cols / 2;
      const cy = rows / 2;
      const maxD = Math.hypot(cx, cy);
      for (let gy = 0; gy < rows; gy++) {
        for (let gx = 0; gx < cols; gx++) {
          const i = gy * cols + gx;
          // edge bias: 0 at center → 1 at corners
          const edge = Math.hypot(gx - cx, gy - cy) / maxD;
          mask[i] = Math.pow(edge, 1.6) * Math.random();
          // mostly gray, ~8% coral accent
          tintIdx[i] = Math.random() < 0.08 ? 3 : (Math.random() * 3) | 0;
          phase[i] = Math.random() * Math.PI * 2;
        }
      }
    };

    const draw = () => {
      ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
      for (let i = 0; i < mask.length; i++) {
        const m = mask[i];
        if (m < 0.18) continue; // sparse: skip calm cells
        // breathing pulse per cell
        const pulse = 0.5 + 0.5 * Math.sin(t + phase[i]);
        const v = m * pulse;
        if (v < 0.22) continue;
        const a = Math.min(MAX_A, v * MAX_A * 1.6);
        const gx = i % cols;
        const gy = (i / cols) | 0;
        ctx.fillStyle = `rgba(${TINTS[tintIdx[i]]},${a})`;
        ctx.fillRect(gx * CELL, gy * CELL, CELL - 2, CELL - 2);
      }
    };

    const frame = () => {
      t += 0.022;
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
