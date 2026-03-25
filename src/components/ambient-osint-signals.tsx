"use client";

import type { CSSProperties } from "react";

const floatingSources = [
  { label: "SEC", top: "9%", left: "31%", delay: "0s", duration: "22s" },
  { label: "GLEIF", top: "15%", right: "8%", delay: "1.4s", duration: "24s" },
  { label: "WIKIPEDIA", top: "27%", right: "5%", delay: "2.8s", duration: "26s" },
  { label: "WIKIDATA", top: "41%", left: "33%", delay: "0.8s", duration: "23s" },
  { label: "RDAP", bottom: "22%", right: "6%", delay: "1.8s", duration: "27s" },
  { label: "CRT.SH", bottom: "16%", left: "34%", delay: "3.2s", duration: "25s" },
  { label: "SECURITY.TXT", bottom: "29%", right: "11%", delay: "2.2s", duration: "28s" },
  { label: "GITHUB", bottom: "10%", right: "16%", delay: "4s", duration: "24s" },
  { label: "WAYBACK", top: "56%", right: "4%", delay: "2.5s", duration: "30s" },
  { label: "JSON-LD", top: "68%", left: "36%", delay: "1.1s", duration: "26s" },
];

const binaryColumns = Array.from({ length: 10 }, (_, index) => ({
  id: index,
  left: `${29 + index * 6.2}%`,
  duration: `${20 + (index % 5) * 3}s`,
  delay: `${index * 1.1}s`,
  text: Array.from({ length: 44 }, (_unused, step) =>
    (index + step * 5) % 2 === 0 ? "1" : "0",
  ).join(" "),
}));

export function AmbientOsintSignals() {
  return (
    <div aria-hidden className="ambient-signals hidden xl:block">
      {binaryColumns.map((column) => (
        <span
          key={`binary-${column.id}`}
          className="ambient-binary"
          style={
            {
              left: column.left,
              animationDuration: column.duration,
              animationDelay: column.delay,
            } as CSSProperties
          }
        >
          {column.text}
        </span>
      ))}

      {floatingSources.map((item) => (
        <span
          key={item.label}
          className="ambient-source"
          style={item as CSSProperties}
        >
          {item.label}
        </span>
      ))}
    </div>
  );
}
