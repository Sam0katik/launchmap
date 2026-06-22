"use client";

import { useCallback, useEffect, useRef, useState } from "react";

// Text that assembles from random glyphs into the target word — the
// departuremono.com title trick. Runs on mount and re-runs on hover.
const POOL = "ABCDEFGHIJKLMNOPQRSTUVWXYZ#%&@*+=▚▞░▒";

export function ScrambleText({
  text,
  className,
}: {
  text: string;
  className?: string;
}) {
  const [out, setOut] = useState(text);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  const run = useCallback(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setOut(text);
      return;
    }
    if (timer.current) clearInterval(timer.current);
    let frame = 0;
    const total = 26;
    timer.current = setInterval(() => {
      frame++;
      const revealed = Math.floor((frame / total) * text.length);
      let s = "";
      for (let i = 0; i < text.length; i++) {
        if (i < revealed || text[i] === " ") s += text[i];
        else s += POOL[(Math.random() * POOL.length) | 0];
      }
      setOut(s);
      if (frame >= total) {
        setOut(text);
        if (timer.current) clearInterval(timer.current);
      }
    }, 45);
  }, [text]);

  useEffect(() => {
    run();
    return () => {
      if (timer.current) clearInterval(timer.current);
    };
  }, [run]);

  return (
    <span className={className} onMouseEnter={run}>
      {out}
    </span>
  );
}
