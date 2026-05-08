"use client";

import { useEffect, useRef } from "react";

export function AnimatedPercent({ target }: { target: number }) {
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (target === 0) { el.textContent = "0%"; return; }

    const duration  = 900;
    const startTime = performance.now();

    function tick(now: number) {
      const p     = Math.min((now - startTime) / duration, 1);
      const eased = 1 - (1 - p) ** 3;
      el!.textContent = `${Math.round(eased * target)}%`;
      if (p < 1) requestAnimationFrame(tick);
    }

    requestAnimationFrame(tick);
  }, [target]);

  return <span ref={ref}>0%</span>;
}
