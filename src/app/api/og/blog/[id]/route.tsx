import { ImageResponse } from "next/og";
import { prisma } from "@/lib/prisma";
import { requireTenant } from "@/lib/tenancy";
import { loadOgFonts, BRAND } from "@/lib/og-fonts";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Open Graph standard: 1200 × 630
const W = 1200;
const H = 630;

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const { firmId } = await requireTenant();

  const item = await prisma.contentItem.findFirst({ where: { id, firmId } });
  if (!item) return new Response("Not found", { status: 404 });

  const fonts = await loadOgFonts();

  return new ImageResponse(
    (
      <div
        style={{
          width: W,
          height: H,
          display: "flex",
          flexDirection: "row",
          background: BRAND.paper,
          fontFamily: fonts ? "Inter, sans-serif" : "sans-serif",
          position: "relative",
        }}
      >
        {/* Left navy band with logo */}
        <div
          style={{
            width: 320,
            background: `linear-gradient(180deg, ${BRAND.navy} 0%, ${BRAND.navyLight} 100%)`,
            color: "white",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            padding: "48px 40px",
            position: "relative",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              position: "absolute",
              bottom: -60,
              left: -60,
              width: 260,
              height: 260,
              background:
                "radial-gradient(circle, rgba(188,47,44,0.45), rgba(188,47,44,0) 70%)",
              display: "flex",
            }}
          />
          <div style={{ display: "flex", flexDirection: "column", position: "relative" }}>
            <div
              style={{
                width: 52,
                height: 52,
                borderRadius: 10,
                background: BRAND.red,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontFamily: fonts ? "Playfair, serif" : "serif",
                fontSize: 34,
                fontWeight: 700,
                marginBottom: 24,
              }}
            >
              J
            </div>
            <span
              style={{
                fontFamily: fonts ? "Playfair, serif" : "serif",
                fontSize: 28,
                fontWeight: 500,
                letterSpacing: "-0.01em",
                lineHeight: 1,
                marginBottom: 8,
              }}
            >
              Juris
            </span>
            <span
              style={{
                fontSize: 12,
                opacity: 0.65,
                letterSpacing: "0.22em",
                textTransform: "uppercase",
                fontWeight: 600,
              }}
            >
              Avukatlık Ortaklığı
            </span>
          </div>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              position: "relative",
              fontSize: 13,
              opacity: 0.6,
              letterSpacing: "0.08em",
            }}
          >
            juris.com.tr
          </div>
        </div>

        {/* Right content */}
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            padding: "56px",
            position: "relative",
          }}
        >
          <div
            style={{
              display: "flex",
              padding: "8px 16px",
              borderRadius: 999,
              background: "rgba(188,47,44,0.1)",
              color: BRAND.red,
              fontSize: 13,
              fontWeight: 700,
              letterSpacing: "0.18em",
              textTransform: "uppercase",
              marginBottom: 24,
              alignSelf: "flex-start",
            }}
          >
            {item.contentType ?? "Makale"}
          </div>

          <div
            style={{
              fontFamily: fonts ? "Playfair, serif" : "serif",
              fontSize: titleSize(item.title),
              lineHeight: 1.1,
              letterSpacing: "-0.02em",
              color: BRAND.navy,
              display: "flex",
              flexWrap: "wrap",
            }}
          >
            {item.title}
          </div>

          {item.summary && (
            <div
              style={{
                marginTop: 20,
                fontSize: 18,
                color: BRAND.ink2,
                lineHeight: 1.4,
                display: "flex",
              }}
            >
              {truncate(item.summary, 170)}
            </div>
          )}

          <div
            style={{
              marginTop: "auto",
              paddingTop: 24,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              borderTop: `1px solid ${BRAND.line}`,
              fontSize: 13,
              color: BRAND.ink3,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              {item.author && (
                <>
                  <div
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: 4,
                      background: BRAND.red,
                      display: "flex",
                    }}
                  />
                  <span style={{ color: BRAND.navy, fontWeight: 600 }}>{item.author}</span>
                </>
              )}
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              {item.readMinutes && <span>{item.readMinutes} dk okuma</span>}
            </div>
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
  if (len <= 40)  return 58;
  if (len <= 70)  return 46;
  if (len <= 100) return 38;
  return 32;
}

function truncate(s: string, max: number): string {
  if (s.length <= max) return s;
  return s.slice(0, max - 1) + "…";
}
