"use client";

import React, { useEffect, useState } from "react";

interface CountUpProps {
  end: number;
  durationMs?: number;
  prefix?: string;
  isCurrency?: boolean;
  className?: string;
}

export function CountUp({
  end,
  durationMs = 1200,
  prefix = "₹",
  isCurrency = true,
  className = "",
}: CountUpProps) {
  const [displayValue, setDisplayValue] = useState(end);

  useEffect(() => {
    let startTimestamp: number | null = null;
    const startValue = 0;

    const step = (timestamp: number) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / durationMs, 1);
      // Ease out cubic
      const easedProgress = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(startValue + (end - startValue) * easedProgress);
      setDisplayValue(current);

      if (progress < 1) {
        window.requestAnimationFrame(step);
      }
    };

    window.requestAnimationFrame(step);
  }, [end, durationMs]);

  const formatted = isCurrency
    ? prefix + displayValue.toLocaleString("en-IN")
    : `${prefix}${displayValue}`;

  return <span className={`tabular-nums ${className}`}>{formatted}</span>;
}
