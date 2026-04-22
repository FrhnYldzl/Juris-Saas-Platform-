import { ImageResponse } from "next/og";
import { prisma } from "@/lib/prisma";
import { requireTenant } from "@/lib/tenancy";
import { loadOgFonts, BRAND } from "@/lib/og-fonts";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Instagram portrait: 1080 × 1350 (4:5)
const W = 1080;
const H = 1350;

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const { firmId } = await requireTenant();

  const item = await prisma.contentItem.findFirst({ where: { id, firmId } });
  if (!item) return new Response("Not found", { status: 404 });

  const fonts = await loadOgFonts();

  // Choose the title line break pattern for visual rhythm
  const titleWords = item.title.split(" ");
  // Layout: paper-bg card with navy band at top, big serif title, red underline accent

  return new ImageResponse(
    (
      <div
        style={{
          width: W,
          height: H,
          display: "flex",
          flexDirection: "column",
          background: BRAND.paper,
          position: "relative",
          fontFamily: fonts ? "Inter, sans-serif" : "sans-serif",
          overflow: "hidden",
        }}
      >
        {/* Navy banner top */}
        <div
          style={{
            height: 220,
            background: `linear-gradient(135deg, ${BRAND.navy} 0%, ${BRAND.navyLight} 100%)`,
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            padding: "0 64px",
            position: "relative",
            color: "white",
          }}
        >
          {/* Red corner accent */}
          <div
            style={{
              position: "absolute",
              top: 0,
              right: 0,
              width: 520,
              height: 220,
              background:
                "radial-gradient(circle at 100% 0%, rgba(188,47,44,0.55), rgba(188,47,44,0) 60%)",
              display: "flex",
            }}
          />
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 18,
              position: "relative",
            }}
          >
            <div
              style={{
                width: 64,
                height: 64,
                borderRadius: 12,
                background: BRAND.red,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontFamily: fonts ? "Playfair, serif" : "serif",
                fontSize: 42,
                fontWeight: 700,
              }}
            >
              J
            </div>
            <div style={{ display: "flex", flexDirection: "column" }}>
              <span
                style={{
                  fontFamily: fonts ? "Playfair, serif" : "serif",
                  fontSize: 34,
                  fontWeight: 500,
                  letterSpacing: "-0.01em",
                  lineHeight: 1,
                }}
              >
                Juris
              </span>
              <span
                style={{
                  fontSize: 14,
                  opacity: 0.65,
                  marginTop: 6,
                  letterSpacing: "0.22em",
                  textTransform: "uppercase",
                  fontWeight: 600,
                }}
              >
                Avukatlık Ortaklığı
              </span>
            </div>
          </div>
        </div>

        {/* Category pill */}
        <div
          style={{
            padding: "48px 64px 0 64px",
            display: "flex",
          }}
        >
          <div
            style={{
              display: "flex",
              padding: "10px 20px",
              borderRadius: 999,
              background: "rgba(188,47,44,0.1)",
              color: BRAND.red,
              fontSize: 16,
              fontWeight: 700,
              letterSpacing: "0.16em",
              textTransform: "uppercase",
            }}
          >
            {item.contentType ?? "İçerik"}
          </div>
        </div>

        {/* Title block */}
        <div
          style={{
            padding: "32px 64px 0 64px",
            display: "flex",
            flexDirection: "column",
            flex: 1,
          }}
        >
          <div
            style={{
              fontFamily: fonts ? "Playfair, serif" : "serif",
              fontSize: titleSize(item.title),
              lineHeight: 1.08,
              letterSpacing: "-0.02em",
              color: BRAND.navy,
              display: "flex",
              flexWrap: "wrap",
            }}
          >
            {item.title}
          </div>
          {/* Red underline accent */}
          <div
            style={{
              marginTop: 24,
              height: 5,
              width: 120,
              background: BRAND.red,
              borderRadius: 4,
              display: "flex",
            }}
          />
          {item.summary && (
            <div
              style={{
                marginTop: 28,
                fontSize: 26,
                color: BRAND.ink2,
                lineHeight: 1.4,
                display: "flex",
              }}
            >
              {truncate(item.summary, 200)}
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          style={{
            padding: "24px 64px 52px 64px",
            display: "flex",
            flexDirection: "column",
            gap: 16,
          }}
        >
          {item.keywords.length > 0 && (
            <div
              style={{
                display: "flex",
                gap: 10,
                flexWrap: "wrap",
                fontFamily: "monospace",
                fontSize: 18,
                color: BRAND.ink3,
              }}
            >
              {item.keywords.slice(0, 5).map((k) => (
                <span key={k}>#{k.replace(/\s+/g, "")}</span>
              ))}
            </div>
          )}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              paddingTop: 18,
              borderTop: `1px solid ${BRAND.line}`,
              fontSize: 18,
            }}
          >
            {item.author ? (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  fontWeight: 600,
                  color: BRAND.navy,
                }}
              >
                <div
                  style={{
                    width: 10,
                    height: 10,
                    borderRadius: 5,
                    background: BRAND.red,
                    display: "flex",
                  }}
                />
                <span>{item.author}</span>
              </div>
            ) : (
              <div style={{ display: "flex", color: BRAND.ink3 }}>juris.com.tr</div>
            )}
            <div
              style={{
                display: "flex",
                color: BRAND.ink3,
                fontWeight: 600,
                letterSpacing: "0.16em",
                textTransform: "uppercase",
                fontSize: 15,
              }}
            >
              Kaydır →
            </div>
          </div>
        </div>

        {titleWords && null}
      </div>
    ),
    {
      width: W,
      height: H,
      ...(fonts
        ? {
            fonts: [
              { name: "Inter",    data: fonts.inter,     style: "normal", weight: 400 },
              { name: "Inter",    data: fonts.interBold, style: "normal", weight: 700 },
              { name: "Playfair", data: fonts.playfair,  style: "normal", weight: 500 },
            ],
          }
        : {}),
    },
  );
}

function titleSize(s: string): number {
  const len = s.length;
  if (len <= 30)  return 92;
  if (len <= 50)  return 76;
  if (len <= 80)  return 62;
  if (len <= 120) return 50;
  return 42;
}

function truncate(s: string, max: number): string {
  if (s.length <= max) return s;
  return s.slice(0, max - 1) + "…";
}
