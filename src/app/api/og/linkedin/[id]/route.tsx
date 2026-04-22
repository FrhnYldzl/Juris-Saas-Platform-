import { ImageResponse } from "next/og";
import { prisma } from "@/lib/prisma";
import { requireTenant } from "@/lib/tenancy";
import { loadOgFonts, BRAND } from "@/lib/og-fonts";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// LinkedIn recommended share image: 1200 × 627 (landscape 1.91:1)
const W = 1200;
const H = 627;

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const { firmId } = await requireTenant();

  const item = await prisma.contentItem.findFirst({ where: { id, firmId } });
  if (!item) {
    return new Response("Not found", { status: 404 });
  }

  const fonts = await loadOgFonts();

  return new ImageResponse(
    (
      <div
        style={{
          width: W,
          height: H,
          display: "flex",
          flexDirection: "column",
          background: `linear-gradient(135deg, ${BRAND.navy} 0%, ${BRAND.navyLight} 100%)`,
          color: "white",
          position: "relative",
          overflow: "hidden",
          padding: "56px 64px",
          fontFamily: fonts ? "Inter, sans-serif" : "sans-serif",
        }}
      >
        {/* Red radial accent */}
        <div
          style={{
            position: "absolute",
            top: 0,
            right: 0,
            width: 620,
            height: 400,
            background:
              "radial-gradient(circle at 100% 0%, rgba(188,47,44,0.55), rgba(188,47,44,0) 60%)",
            display: "flex",
          }}
        />

        {/* Top row: brand */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            position: "relative",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: 8,
                background: BRAND.red,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontFamily: fonts ? "Playfair, serif" : "serif",
                fontSize: 30,
                fontWeight: 700,
                letterSpacing: "-0.02em",
              }}
            >
              J
            </div>
            <div style={{ display: "flex", flexDirection: "column" }}>
              <span
                style={{
                  fontFamily: fonts ? "Playfair, serif" : "serif",
                  fontSize: 22,
                  fontWeight: 500,
                  letterSpacing: "-0.01em",
                  lineHeight: 1,
                }}
              >
                Juris
              </span>
              <span
                style={{
                  fontSize: 11,
                  opacity: 0.6,
                  marginTop: 4,
                  letterSpacing: "0.18em",
                  textTransform: "uppercase",
                  fontWeight: 600,
                }}
              >
                Avukatlık Ortaklığı
              </span>
            </div>
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              padding: "8px 16px",
              borderRadius: 999,
              background: "rgba(255,255,255,0.1)",
              fontSize: 12,
              fontWeight: 600,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
            }}
          >
            {item.contentType ?? "İçerik"}
          </div>
        </div>

        {/* Title */}
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            marginTop: 40,
            position: "relative",
          }}
        >
          <div
            style={{
              fontFamily: fonts ? "Playfair, serif" : "serif",
              fontSize: title(item.title).size,
              lineHeight: 1.1,
              letterSpacing: "-0.015em",
              color: "white",
              display: "flex",
              flexWrap: "wrap",
              maxWidth: 1000,
            }}
          >
            {item.title}
          </div>
          {item.summary && (
            <div
              style={{
                marginTop: 24,
                fontSize: 20,
                color: "rgba(255,255,255,0.72)",
                lineHeight: 1.4,
                maxWidth: 880,
                display: "flex",
              }}
            >
              {truncate(item.summary, 180)}
            </div>
          )}
        </div>

        {/* Footer row: keywords + author + read time */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            paddingTop: 24,
            borderTop: "1px solid rgba(255,255,255,0.18)",
            position: "relative",
            fontSize: 14,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            {item.author && (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  fontWeight: 600,
                }}
              >
                <div
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: 4,
                    background: BRAND.red,
                    display: "flex",
                  }}
                />
                <span>{item.author}</span>
              </div>
            )}
            {item.author && item.keywords.length > 0 && (
              <span style={{ opacity: 0.4 }}>·</span>
            )}
            {item.keywords.length > 0 && (
              <div
                style={{
                  display: "flex",
                  gap: 8,
                  color: "rgba(255,255,255,0.55)",
                  fontFamily: "monospace",
                  fontSize: 13,
                }}
              >
                {item.keywords.slice(0, 3).map((k) => (
                  <span key={k}>#{k.replace(/\s+/g, "")}</span>
                ))}
              </div>
            )}
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              color: "rgba(255,255,255,0.55)",
              fontSize: 13,
            }}
          >
            {item.readMinutes && <span>{item.readMinutes} dk okuma</span>}
            <span style={{ opacity: 0.6 }}>·</span>
            <span style={{ color: "white", fontWeight: 600 }}>juris.com.tr</span>
          </div>
        </div>
      </div>
    ),
    {
      width: W,
      height: H,
      ...(fonts
        ? {
            fonts: [
              { name: "Inter",    data: fonts.inter,      style: "normal", weight: 400 },
              { name: "Inter",    data: fonts.interBold,  style: "normal", weight: 700 },
              { name: "Playfair", data: fonts.playfair,   style: "normal", weight: 500 },
            ],
          }
        : {}),
    },
  );
}

// Title size decays with length
function title(s: string): { size: number } {
  const len = s.length;
  if (len <= 40)  return { size: 68 };
  if (len <= 70)  return { size: 54 };
  if (len <= 100) return { size: 44 };
  return { size: 36 };
}

function truncate(s: string, max: number): string {
  if (s.length <= max) return s;
  return s.slice(0, max - 1) + "…";
}
