"use client";

import { useEffect, useRef } from "react";

// Full-screen monochrome pixel field. Every cell blinks slowly on its own
// phase. Near the cursor, pixels brighten and get pushed outward (they part
// around the pointer). No color. Behind all content, honors reduced-motion.
export function InteractivePixels() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const CELL = 16;
    const DOT = 3; // drawn pixel size (small dots on a wide grid)
    const RADIUS = 130; // cursor influence radius (px)
    const PUSH = 9; // max displacement (px)

    let cols = 0;
    let rows = 0;
    let raf = 0;
    let t = 0;
    let phase: Float32Array = new Float32Array(0);
    let speed: Float32Array = new Float32Array(0);
    const mouse = { x: -9999, y: -9999 };

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.floor(window.innerWidth * dpr);
      canvas.height = Math.floor(window.innerHeight * dpr);
      canvas.style.width = window.innerWidth + "px";
      canvas.style.height = window.innerHeight + "px";
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      cols = Math.ceil(window.innerWidth / CELL) + 1;
      rows = Math.ceil(window.innerHeight / CELL) + 1;
      phase = new Float32Array(cols * rows);
      speed = new Float32Array(cols * rows);
      for (let i = 0; i < phase.length; i++) {
        phase[i] = Math.random() * Math.PI * 2;
        speed[i] = 0.4 + Math.random() * 0.8; // varied blink speeds
      }
    };

    const onMove = (e: MouseEvent) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
    };
    const onLeave = () => {
      mouse.x = -9999;
      mouse.y = -9999;
    };

    const draw = () => {
      ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
      for (let gy = 0; gy < rows; gy++) {
        for (let gx = 0; gx < cols; gx++) {
          const i = gy * cols + gx;
          let px = gx * CELL;
          let py = gy * CELL;
          // slow blink baseline
          let a = 0.06 + 0.05 * (0.5 + 0.5 * Math.sin(t * speed[i] + phase[i]));

          // cursor interaction: brighten + push outward
          const dx = px - mouse.x;
          const dy = py - mouse.y;
          const d = Math.hypot(dx, dy);
          if (d < RADIUS) {
            const f = 1 - d / RADIUS; // 0..1
            a += f * 0.5;
            const inv = 1 / (d || 1);
            px += dx * inv * PUSH * f;
            py += dy * inv * PUSH * f;
          }

          if (a <= 0.06) {
            // draw dim baseline cheaply
          }
          ctx.fillStyle = `rgba(228,228,231,${Math.min(0.6, a)})`;
          ctx.fillRect(px, py, DOT, DOT);
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
    if (!reduce) {
      window.addEventListener("mousemove", onMove);
      window.addEventListener("mouseleave", onLeave);
      raf = requestAnimationFrame(frame);
    } else {
      draw();
    }

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseleave", onLeave);
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
