import type { Resource, ResourceType } from "@prisma/client";

/**
 * İlişki Haritası — Juris merkezde, kaynaklar halka uzaklıklarıyla dizilir.
 * Yakınlık = heat (HOT → iç halka, COLD → dış halka).
 * Pure SVG, server-side render.
 */

const TYPE_COLOR: Record<ResourceType, string> = {
  COMPANY: "#0A2240",
  DIRECT_PARTNER: "#BC2F2C",
  NETWORK: "#2B5185",
};

const TYPE_LABEL: Record<ResourceType, string> = {
  COMPANY: "İlişkili Şirket",
  DIRECT_PARTNER: "Direkt Partner",
  NETWORK: "Network / Dernek",
};

export function RelationMap({
  resources, firmName,
}: {
  resources: Pick<Resource, "id" | "name" | "type" | "heat" | "score" | "leadCount">[];
  firmName: string;
}) {
  const W = 1000;
  const H = 640;
  const cx = W / 2;
  const cy = H / 2;

  // 3 concentric rings: HOT = inner (120), WARM = middle (200), COLD = outer (280)
  const radiusFor = (heat: string) =>
    heat === "HOT" ? 140 : heat === "WARM" ? 220 : 290;

  // Place nodes around — distribute by index within each heat band
  const byHeat: Record<string, typeof resources> = {
    HOT: resources.filter((r) => r.heat === "HOT"),
    WARM: resources.filter((r) => r.heat === "WARM"),
    COLD: resources.filter((r) => r.heat === "COLD"),
  };

  const positioned = (Object.keys(byHeat) as ("HOT" | "WARM" | "COLD")[]).flatMap(
    (heat, heatIdx) => {
      const items = byHeat[heat];
      const r = radiusFor(heat);
      const startAngle = heatIdx * 30; // small offset per ring so they don't overlap
      return items.map((item, i) => {
        const angle = (i / Math.max(items.length, 1)) * Math.PI * 2 - Math.PI / 2 + (startAngle * Math.PI / 180);
        return {
          ...item,
          x: cx + Math.cos(angle) * r,
          y: cy + Math.sin(angle) * r,
          r,
        };
      });
    },
  );

  return (
    <div className="card p-6">
      <div className="mb-4">
        <h3
          className="text-juris-navy"
          style={{
            fontFamily: "'Playfair Display', Georgia, serif",
            fontSize: 20, fontWeight: 500, letterSpacing: "-0.005em",
          }}
        >
          İlişki Haritası
        </h3>
        <div className="text-xs text-juris-ink-3 mt-1">
          Juris merkezde · halka uzaklığı = ilişki yakınlığı · yeşil çizgi = lead akışı
        </div>
      </div>

      <div className="relative w-full overflow-x-auto">
        <svg
          viewBox={`0 0 ${W} ${H}`}
          style={{ width: "100%", maxWidth: W, height: "auto" }}
        >
          {/* Concentric rings */}
          {[140, 220, 290].map((r) => (
            <circle
              key={r}
              cx={cx} cy={cy} r={r}
              fill="none"
              stroke="#E5E9F0"
              strokeDasharray="2,4"
              strokeWidth="1"
            />
          ))}

          {/* Lines Juris → each node (lead flow, green if leadCount > 0) */}
          {positioned.map((p) => (
            <line
              key={`line-${p.id}`}
              x1={cx} y1={cy}
              x2={p.x} y2={p.y}
              stroke={p.leadCount > 0 ? "#147D5C" : "#E5E9F0"}
              strokeWidth="1"
              opacity={p.leadCount > 0 ? 0.4 : 0.25}
            />
          ))}

          {/* Juris center */}
          <circle cx={cx} cy={cy} r="38" fill="#0A2240" />
          <circle cx={cx} cy={cy} r="38" fill="none" stroke="#BC2F2C" strokeWidth="2" />
          <text
            x={cx} y={cy - 4} textAnchor="middle"
            fill="white"
            fontFamily="Playfair Display, serif"
            fontSize="15" fontWeight="500"
          >
            Juris
          </text>
          <text
            x={cx} y={cy + 11} textAnchor="middle"
            fill="rgba(255,255,255,0.65)"
            fontSize="10"
          >
            Hukuk
          </text>

          {/* Resource nodes */}
          {positioned.map((p) => {
            const color = TYPE_COLOR[p.type];
            const nodeR = 14 + Math.min(10, p.leadCount * 1.5);
            return (
              <g key={p.id}>
                <circle
                  cx={p.x} cy={p.y}
                  r={nodeR}
                  fill={color}
                />
                <circle
                  cx={p.x} cy={p.y}
                  r={nodeR}
                  fill="none"
                  stroke="white"
                  strokeWidth="2"
                />
                <text
                  x={p.x} y={p.y + nodeR + 14}
                  textAnchor="middle"
                  fill="#0A2240"
                  fontSize="11"
                  fontWeight="600"
                  fontFamily="Inter, sans-serif"
                >
                  {p.name}
                </text>
                <text
                  x={p.x} y={p.y + nodeR + 26}
                  textAnchor="middle"
                  fill="#8895AB"
                  fontSize="9"
                  fontFamily="JetBrains Mono, monospace"
                >
                  {p.leadCount} lead
                </text>
              </g>
            );
          })}

          {/* Legend (top-right) */}
          <g transform={`translate(${W - 180}, 20)`}>
            {(["COMPANY", "DIRECT_PARTNER", "NETWORK"] as ResourceType[]).map((t, i) => (
              <g key={t} transform={`translate(0, ${i * 22})`}>
                <circle cx="8" cy="8" r="6" fill={TYPE_COLOR[t]} />
                <text
                  x="22" y="12"
                  fill="#2A3B54"
                  fontSize="11"
                  fontFamily="Inter, sans-serif"
                >
                  {TYPE_LABEL[t]}
                </text>
              </g>
            ))}
          </g>
        </svg>
        <div className="sr-only">Firma: {firmName}</div>
      </div>
    </div>
  );
}
