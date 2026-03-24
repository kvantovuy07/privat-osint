"use client";

import type { CSSProperties } from "react";

const columns = Array.from({ length: 18 }, (_, index) => ({
  id: index,
  text: Array.from({ length: 64 }, (_unused, step) =>
    (index + step * 7) % 2 === 0 ? "1" : "0",
  ).join(" "),
  duration: 14 + (index % 6) * 2,
  delay: index * 0.8,
  left: `${index * 6}%`,
}));

export function MatrixRain() {
  return (
    <div aria-hidden className="matrix-rain">
      {columns.map((column) => (
        <span
          key={column.id}
          className="matrix-column"
          style={
            {
              left: column.left,
              animationDuration: `${column.duration}s`,
              animationDelay: `${column.delay}s`,
            } as CSSProperties
          }
        >
          {column.text}
        </span>
      ))}
    </div>
  );
}
