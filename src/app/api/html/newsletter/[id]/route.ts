import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireTenant } from "@/lib/tenancy";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Newsletter HTML email — inline-styled, email-safe layout using tables.
 *
 * Returned as text/html so the browser renders it (Stage 3 iframes this for
 * preview). A ?download=1 query param turns it into a downloadable .html file
 * for hand-off to Mailchimp / manual send.
 */
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const { firmId } = await requireTenant();
  const url = new URL(req.url);
  const asDownload = url.searchParams.get("download") === "1";

  const item = await prisma.contentItem.findFirst({ where: { id, firmId } });
  if (!item) return new NextResponse("Not found", { status: 404 });

  const firm = await prisma.firm.findUnique({ where: { id: firmId } });

  const html = renderNewsletterHtml({
    title: item.title,
    summary: item.summary,
    body: item.body ?? "",
    author: item.author,
    publishDate: item.publishAt ?? item.publishedAt ?? new Date(),
    firmName: firm?.name ?? "Juris Avukatlık Ortaklığı",
    ctaUrl: item.url ?? "https://juris.com.tr",
  });

  const headers: Record<string, string> = { "Content-Type": "text/html; charset=utf-8" };
  if (asDownload) {
    headers["Content-Disposition"] = `attachment; filename="${slugify(item.title)}.html"`;
  }
  return new NextResponse(html, { headers });
}

function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/[çğıöşü]/g, (c) => ({ ç: "c", ğ: "g", ı: "i", ö: "o", ş: "s", ü: "u" })[c] ?? c)
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 60);
}

function renderNewsletterHtml(p: {
  title: string;
  summary: string | null;
  body: string;
  author: string | null;
  publishDate: Date;
  firmName: string;
  ctaUrl: string;
}): string {
  const dateFmt = new Intl.DateTimeFormat("tr-TR", {
    day: "2-digit", month: "long", year: "numeric",
  }).format(p.publishDate);

  // Convert simple Markdown-ish body to email HTML
  const bodyHtml = p.body
    .split(/\n\n+/)
    .map((para) => {
      const trimmed = para.trim();
      if (!trimmed) return "";
      if (trimmed.startsWith("# "))    return `<h1 style="font-family:Georgia,serif;font-size:28px;line-height:1.2;color:#0A2240;margin:32px 0 12px 0;font-weight:500;">${escape(trimmed.slice(2))}</h1>`;
      if (trimmed.startsWith("## "))   return `<h2 style="font-family:Georgia,serif;font-size:22px;line-height:1.25;color:#0A2240;margin:28px 0 10px 0;font-weight:500;">${escape(trimmed.slice(3))}</h2>`;
      if (trimmed.startsWith("### "))  return `<h3 style="font-size:16px;line-height:1.3;color:#0A2240;margin:24px 0 8px 0;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;">${escape(trimmed.slice(4))}</h3>`;
      if (/^[-*]\s/.test(trimmed)) {
        const items = trimmed.split(/\n/).map((l) => l.replace(/^[-*]\s+/, "")).filter(Boolean);
        return `<ul style="margin:12px 0 12px 20px;padding:0;color:#1F2933;font-size:15px;line-height:1.6;">${items.map((i) => `<li style="margin:4px 0;">${inlineMd(escape(i))}</li>`).join("")}</ul>`;
      }
      return `<p style="margin:12px 0;color:#1F2933;font-size:15px;line-height:1.65;">${inlineMd(escape(trimmed))}</p>`;
    })
    .join("\n");

  return `<!DOCTYPE html>
<html lang="tr">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>${escape(p.title)}</title>
<!--[if mso]>
<style type="text/css">body,table,td {font-family: Arial, Helvetica, sans-serif !important;}</style>
<![endif]-->
</head>
<body style="margin:0;padding:0;background:#F4F6FA;font-family:-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,Helvetica,Arial,sans-serif;">
  <!-- Preheader (hidden but pulls into inbox preview) -->
  <div style="display:none;max-height:0;overflow:hidden;">
    ${escape(p.summary ?? "").slice(0, 130)}
  </div>

  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#F4F6FA;">
    <tr>
      <td align="center" style="padding:28px 12px;">
        <table role="presentation" width="600" cellspacing="0" cellpadding="0" style="max-width:600px;width:100%;background:white;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(10,34,64,0.06);">

          <!-- Navy header band -->
          <tr>
            <td style="background:linear-gradient(135deg,#0A2240 0%,#1a3558 100%);color:white;padding:32px 36px;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                <tr>
                  <td style="vertical-align:middle;">
                    <table role="presentation" cellspacing="0" cellpadding="0">
                      <tr>
                        <td style="width:44px;height:44px;background:#BC2F2C;border-radius:8px;text-align:center;vertical-align:middle;font-family:Georgia,serif;font-size:26px;font-weight:700;color:white;line-height:44px;">J</td>
                        <td style="padding-left:12px;vertical-align:middle;">
                          <div style="font-family:Georgia,serif;font-size:20px;line-height:1;font-weight:500;color:white;">Juris</div>
                          <div style="font-size:10px;letter-spacing:0.18em;color:rgba(255,255,255,0.65);text-transform:uppercase;margin-top:4px;">Avukatlık Ortaklığı</div>
                        </td>
                      </tr>
                    </table>
                  </td>
                  <td style="text-align:right;vertical-align:middle;font-size:11px;color:rgba(255,255,255,0.65);letter-spacing:0.1em;text-transform:uppercase;">
                    ${dateFmt}
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Kicker -->
          <tr>
            <td style="padding:36px 36px 0 36px;">
              <div style="display:inline-block;padding:4px 12px;border-radius:999px;background:rgba(188,47,44,0.08);color:#BC2F2C;font-size:11px;font-weight:700;letter-spacing:0.16em;text-transform:uppercase;">
                Bülten
              </div>
            </td>
          </tr>

          <!-- Title -->
          <tr>
            <td style="padding:16px 36px 0 36px;">
              <h1 style="margin:0;font-family:Georgia,serif;font-size:30px;line-height:1.15;color:#0A2240;font-weight:500;letter-spacing:-0.015em;">
                ${escape(p.title)}
              </h1>
              ${p.summary ? `<p style="margin:14px 0 0 0;color:#415063;font-size:16px;line-height:1.5;">${escape(p.summary)}</p>` : ""}
              <div style="width:60px;height:4px;background:#BC2F2C;border-radius:2px;margin:20px 0 0 0;"></div>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:20px 36px 20px 36px;">
              ${bodyHtml || '<p style="color:#8895AB;font-style:italic;">Taslak içeriği boş — editörde metin girin.</p>'}
            </td>
          </tr>

          <!-- CTA -->
          <tr>
            <td style="padding:12px 36px 36px 36px;">
              <table role="presentation" cellspacing="0" cellpadding="0">
                <tr>
                  <td style="background:#0A2240;border-radius:8px;">
                    <a href="${p.ctaUrl}" style="display:inline-block;padding:14px 28px;color:white;text-decoration:none;font-size:14px;font-weight:600;letter-spacing:0.02em;">
                      Blog yazısının tamamını okuyun →
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#FAFBFD;border-top:1px solid #E5E9F0;padding:24px 36px;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                <tr>
                  <td style="font-size:12px;color:#5A6B82;line-height:1.5;">
                    ${p.author ? `<strong style="color:#0A2240;">${escape(p.author)}</strong><br/>` : ""}
                    ${escape(p.firmName)}<br/>
                    <a href="https://juris.com.tr" style="color:#BC2F2C;text-decoration:none;">juris.com.tr</a>
                  </td>
                  <td style="text-align:right;font-size:11px;color:#8895AB;">
                    <a href="#" style="color:#8895AB;text-decoration:underline;">Abonelikten çık</a>
                    &nbsp;·&nbsp;
                    <a href="#" style="color:#8895AB;text-decoration:underline;">Arşiv</a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

        </table>

        <!-- Micro-copy -->
        <div style="max-width:600px;margin:16px auto 0 auto;font-size:11px;color:#8895AB;text-align:center;line-height:1.5;">
          Bu e-postayı ${escape(p.firmName)} sizinle olan profesyonel iletişimi kapsamında aldınız.
        </div>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function escape(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function inlineMd(s: string): string {
  return s
    .replace(/\*\*([^*]+)\*\*/g, '<strong style="color:#0A2240;">$1</strong>')
    .replace(/\*([^*]+)\*/g,   '<em>$1</em>')
    .replace(/`([^`]+)`/g,     '<code style="background:#F1F4F8;padding:1px 5px;border-radius:3px;font-size:0.9em;">$1</code>');
}
