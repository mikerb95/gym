import { STANDARD_PLATES_KG } from "@gym/core";

type PlateKg = (typeof STANDARD_PLATES_KG)[number];

// Alto y grosor proporcionales a los discos reales (los de 10 kg en adelante
// comparten diámetro olímpico de 450 mm).
const PLATE_STYLE: Record<PlateKg, { color: string; height: number; width: number }> = {
  25: { color: "var(--plate-25)", height: 100, width: 15 },
  20: { color: "var(--plate-20)", height: 100, width: 13 },
  15: { color: "var(--plate-15)", height: 100, width: 11 },
  10: { color: "var(--plate-10)", height: 100, width: 9 },
  5: { color: "var(--plate-5)", height: 52, width: 8 },
  2.5: { color: "var(--plate-small)", height: 42, width: 7 },
  1.25: { color: "var(--plate-small)", height: 34, width: 6 },
};

/** Media barra cargada, vista de frente. Cada disco usa el color IWF de su peso. */
export function Barbell({ perSide, className }: { perSide: number[]; className?: string }) {
  const sleeveStart = 92;
  const plates = perSide.reduce<{ color: string; height: number; width: number; x: number; key: string }[]>(
    (acc, kg, i) => {
      const style = PLATE_STYLE[kg as PlateKg] ?? PLATE_STYLE[1.25];
      const previous = acc.at(-1);
      const x = previous ? previous.x + previous.width + 1.5 : sleeveStart;
      return [...acc, { ...style, x, key: `${kg}-${i}` }];
    },
    [],
  );
  const last = plates.at(-1);
  const width = Math.max((last ? last.x + last.width : sleeveStart) + 34, 240);

  return (
    <svg
      viewBox={`0 0 ${width} 120`}
      className={className}
      role="img"
      aria-label={perSide.length ? `Por lado: ${perSide.join(" kg, ")} kg` : "Barra sin discos"}
    >
      <rect x="0" y="56" width={sleeveStart - 10} height="8" rx="2" fill="var(--ink-muted)" />
      <rect x={sleeveStart - 12} y="48" width="8" height="24" rx="2" fill="var(--ink-muted)" />
      <rect x={sleeveStart - 4} y="54" width={width - sleeveStart} height="12" rx="3" fill="var(--line)" />
      {plates.map((p) => (
        <rect
          key={p.key}
          x={p.x}
          y={60 - p.height / 2}
          width={p.width}
          height={p.height}
          rx="2.5"
          fill={p.color}
          stroke="var(--ink)"
          strokeOpacity="0.25"
        />
      ))}
    </svg>
  );
}
