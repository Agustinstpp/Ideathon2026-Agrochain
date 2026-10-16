// Íconos de trazo (estilo Lucide), inline para no sumar dependencias.
const PATHS: Record<string, string[]> = {
  home: ["M3 10.5L12 3l9 7.5", "M5 9.5V20h14V9.5", "M10 20v-6h4v6"],
  grain: ["M12 22V8", "M12 8c0-3 2-5 5-5 0 3-2 5-5 5z", "M12 13c0-3-2-5-5-5 0 3 2 5 5 5z", "M12 18c0-3 2-5 5-5 0 3-2 5-5 5z"],
  cattle: ["M4 8l2-3h3", "M20 8l-2-3h-3", "M6 8h12v5a6 6 0 0 1-12 0z", "M10 13h.01", "M14 13h.01", "M10 17h4"],
  feed: ["M4 11h16", "M5 11l1.5 9h11L19 11", "M8 11V7a4 4 0 0 1 8 0v4"],
  plus: ["M12 5v14", "M5 12h14"],
  check: ["M5 12.5l4.5 4.5L19 7.5"],
  x: ["M7 7l10 10", "M17 7L7 17"],
  alert: ["M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18z", "M12 8v5", "M12 16.5v.5"],
  clock: ["M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18z", "M12 7v5l3 2"],
  qr: ["M4 4h6v6H4z", "M14 4h6v6h-6z", "M4 14h6v6H4z", "M14 14h2v2h-2z", "M18 14h2", "M14 18h2", "M18 18h2v2"],
  external: ["M14 4h6v6", "M20 4l-9 9", "M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5"],
  arrow: ["M5 12h14", "M13 6l6 6-6 6"],
  wifiOff: ["M2 2l20 20", "M8.5 16.5a5 5 0 0 1 7 0", "M5 12.5a10 10 0 0 1 5-2.7", "M19 12.5a10 10 0 0 0-2.4-1.6", "M12 20h.01"],
  leaf: ["M12 22V13", "M12 13l-5-5h3L6 4h12l-4 4h3z"],
};

export type IconName = keyof typeof PATHS;

export function Icon({ name, size = 20, label }: { name: IconName; size?: number; label?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden={label ? undefined : true}
      role={label ? "img" : undefined}
      aria-label={label}
    >
      {PATHS[name].map((d) => (
        <path key={d} d={d} />
      ))}
    </svg>
  );
}
