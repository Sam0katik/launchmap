"use client";

import { useEffect, useRef } from "react";

// Horizontal travelling wave of pixels. Bright bands flow sideways across a
// small, dense grid of cyan cells over the charcoal canvas. Behind all content,
// low alpha for readability, honors prefers-reduced-motion.
export function PixelField() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const CELL = 8; // smaller + denser
    const MAX_A = 0.42;
    const TINTS = ["34,211,238", "103,232,249", "6,182,212", "45,212,191"];

    let cols = 0;
    let rows = 0;
    let raf = 0;
    let t = 0;
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

    // Horizontal travelling wave: dominant term moves bands along +x over time,
    // with a gentle vertical sway so the front isn't a flat line.
    const wave = (x: number, y: number) =>
      Math.sin(x * 0.11 - t * 1.3 + Math.sin(y * 0.08) * 2.2) +
      0.5 * Math.sin(y * 0.16 + t * 0.25);

    const draw = () => {
      ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
      for (let gy = 0; gy < rows; gy++) {
        for (let gx = 0; gx < cols; gx++) {
          const i = gy * cols + gx;
          let v = (wave(gx, gy) + 1.5) / 3; // normalize ~[0,1]
          v *= 0.55 + jitter[i] * 0.85;
          if (v < 0.66) continue;
          const a = Math.min(MAX_A, (v - 0.66) * MAX_A * 3.2);
          ctx.fillStyle = `rgba(${TINTS[tintIdx[i]]},${a})`;
          ctx.fillRect(gx * CELL, gy * CELL, CELL - 1, CELL - 1);
        }
      }
    };

    const frame = () => {
      t += 0.02;
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
