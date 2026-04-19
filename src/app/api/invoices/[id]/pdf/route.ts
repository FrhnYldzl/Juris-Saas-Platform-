import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireTenant } from "@/lib/tenancy";
import { formatDateTR, formatTRY } from "@/lib/utils";
import { invoiceStatusChip } from "@/lib/labels";
import { FIRM_INFO } from "@/lib/firm-info";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Fatura görüntüsü — printable HTML. Tarayıcı "Ctrl/Cmd+P → PDF'e kaydet" ile
 * resmi belgeye çevirir. Dedicated PDF engine (puppeteer/react-pdf) v0.3'te
 * gelecek; bu sürüm sıfır dep.
 */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const { firmId } = await requireTenant();

  const invoice = await prisma.invoice.findFirst({
    where: { id, firmId },
    include: {
      client: true,
      matter: { select: { matterNumber: true, title: true } },
      items: true,
      firm: true,
    },
  });
  if (!invoice) return new NextResponse("Not found", { status: 404 });

  const chip = invoiceStatusChip(invoice.status);
  const client = invoice.client;
  const clientDisplay =
    client?.type === "COMPANY" ? client.companyName ?? client.name : client?.name ?? "";

  const html = `<!DOCTYPE html>
<html lang="tr">
<head>
<meta charset="UTF-8">
<title>Fatura ${invoice.invoiceNumber}</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;500;600&family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap">
<style>
  @page { size: A4; margin: 20mm 18mm; }
  * { box-sizing: border-box; }
  body {
    font-family: 'Inter', system-ui, sans-serif;
    color: #0A2240;
    margin: 0; padding: 0;
    font-size: 11pt; line-height: 1.5;
    -webkit-print-color-adjust: exact; print-color-adjust: exact;
  }
  .page {
    max-width: 820px; margin: 0 auto; padding: 32px 28px 80px;
  }
  .toolbar {
    position: sticky; top: 0; z-index: 10;
    display: flex; justify-content: flex-end; gap: 8px;
    padding: 12px 18px; background: #FBFAF7;
    border-bottom: 1px solid #E5E9F0;
  }
  .toolbar button {
    height: 34px; padding: 0 14px; border-radius: 6px; border: 1px solid #0A2240;
    background: #0A2240; color: white; font-weight: 600; cursor: pointer; font-size: 13px;
    font-family: inherit;
  }
  @media print { .toolbar { display: none !important; } .page { padding: 0; } }
  .accent-bar { height: 4px; background: #BC2F2C; margin-bottom: 28px; }
  .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 40px; }
  .brand { display: flex; flex-direction: column; gap: 4px; }
  .brand .mark { display: flex; align-items: center; gap: 10px; }
  .brand .j {
    width: 38px; height: 38px; background: #BC2F2C; color: white;
    display: flex; align-items: center; justify-content: center;
    font-family: 'Playfair Display', serif; font-size: 24px; font-weight: 500;
    border-radius: 4px;
  }
  .brand .name {
    font-family: 'Playfair Display', serif; font-size: 28px; font-weight: 500; line-height: 1;
  }
  .brand .sub { font-size: 9px; letter-spacing: 0.18em; text-transform: uppercase; color: rgba(10,34,64,0.5); font-weight: 600; margin-top: 2px; }
  .brand .legal { font-size: 10px; color: rgba(10,34,64,0.55); margin-top: 10px; line-height: 1.5; }
  .doc-meta { text-align: right; }
  .doc-meta .label { font-size: 10px; letter-spacing: 0.14em; text-transform: uppercase; color: rgba(10,34,64,0.5); font-weight: 600; }
  .doc-meta .number { font-family: 'JetBrains Mono', monospace; font-size: 18px; font-weight: 600; margin-top: 4px; }
  .doc-meta .status { margin-top: 8px; display: inline-block; padding: 3px 10px; border-radius: 999px; font-size: 10px; font-weight: 600; }
  .parties { display: grid; grid-template-columns: 1fr 1fr; gap: 40px; margin-bottom: 36px; }
  .parties h4 { font-size: 10px; letter-spacing: 0.14em; text-transform: uppercase; color: rgba(10,34,64,0.5); font-weight: 600; margin: 0 0 8px; }
  .parties .value { font-weight: 600; font-size: 14px; margin-bottom: 4px; }
  .parties .line { color: rgba(10,34,64,0.7); font-size: 11px; line-height: 1.55; }
  .dates { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; padding: 14px 16px;
    background: #F4F7FB; border-radius: 8px; margin-bottom: 28px; }
  .dates .box .label { font-size: 9px; letter-spacing: 0.14em; text-transform: uppercase; color: rgba(10,34,64,0.5); font-weight: 600; }
  .dates .box .value { font-weight: 600; font-size: 13px; margin-top: 3px; }
  table.items { width: 100%; border-collapse: collapse; margin-bottom: 24px; }
  table.items thead th {
    text-align: left; padding: 10px 8px; font-size: 9px; letter-spacing: 0.14em;
    text-transform: uppercase; color: rgba(10,34,64,0.55); font-weight: 600;
    border-bottom: 2px solid #0A2240;
  }
  table.items thead th.num { text-align: right; }
  table.items tbody td { padding: 12px 8px; border-bottom: 1px solid #EEF1F6; vertical-align: top; font-size: 11px; }
  table.items tbody td.num { text-align: right; font-family: 'JetBrains Mono', monospace; font-variant-numeric: tabular-nums; }
  table.items tbody td.total { font-weight: 600; }
  .totals { display: flex; justify-content: flex-end; margin-bottom: 32px; }
  .totals .box { min-width: 320px; padding: 14px 18px; background: #F4F7FB; border-radius: 8px; }
  .totals .row { display: flex; justify-content: space-between; padding: 4px 0; font-size: 11px; }
  .totals .row .label { color: rgba(10,34,64,0.65); }
  .totals .row .value { font-family: 'JetBrains Mono', monospace; }
  .totals .sep { height: 1px; background: rgba(10,34,64,0.15); margin: 8px 0; }
  .totals .grand { font-size: 16px; font-weight: 600; }
  .totals .grand .value { color: #BC2F2C; font-size: 18px; }
  .notes { padding: 14px 16px; background: #FFF9F0; border-left: 3px solid #B4701C; border-radius: 4px; font-size: 11px; color: rgba(10,34,64,0.78); margin-bottom: 28px; }
  .footer { margin-top: 48px; padding-top: 18px; border-top: 1px solid #E5E9F0; font-size: 9.5px; color: rgba(10,34,64,0.5); text-align: center; }
  .footer strong { color: rgba(10,34,64,0.7); font-weight: 600; }
  .status-SENT { background: rgba(31,90,168,0.1); color: #1F5AA8; }
  .status-PAID { background: rgba(31,122,78,0.1); color: #1F7A4E; }
  .status-DRAFT { background: rgba(10,34,64,0.08); color: rgba(10,34,64,0.7); }
  .status-OVERDUE { background: rgba(188,47,44,0.1); color: #8A1F1D; }
  .status-CANCELLED { background: rgba(10,34,64,0.08); color: rgba(10,34,64,0.5); }
</style>
</head>
<body>
  <div class="toolbar">
    <button onclick="window.print()">PDF Olarak Kaydet</button>
  </div>
  <div class="page">
    <div class="accent-bar"></div>

    <div class="header">
      <div class="brand">
        <div class="mark">
          <div class="j">j</div>
          <div>
            <div class="name">juris</div>
            <div class="sub">Avukatlık Ortaklığı</div>
          </div>
        </div>
        <div class="legal">
          ${escapeHtml(invoice.firm.name)}<br>
          ${invoice.firm.taxNumber ? `Vergi No: ${escapeHtml(invoice.firm.taxNumber)}<br>` : ""}
          ${invoice.firm.address ? escapeHtml(invoice.firm.address) + "<br>" : ""}
          ${invoice.firm.phone ? escapeHtml(invoice.firm.phone) + " · " : ""}${invoice.firm.email ? escapeHtml(invoice.firm.email) : ""}
        </div>
      </div>
      <div class="doc-meta">
        <div class="label">Fatura</div>
        <div class="number">${escapeHtml(invoice.invoiceNumber)}</div>
        <span class="status status-${invoice.status}">${chip.label}</span>
      </div>
    </div>

    <div class="parties">
      <div>
        <h4>Hizmet Sağlayıcı</h4>
        <div class="value">${escapeHtml(invoice.firm.name)}</div>
        <div class="line">
          ${invoice.firm.address ? escapeHtml(invoice.firm.address) + "<br>" : FIRM_INFO.offices[0].address + "<br>"}
          ${invoice.firm.taxNumber ? "Vergi No: " + escapeHtml(invoice.firm.taxNumber) : ""}
        </div>
      </div>
      <div>
        <h4>Müvekkil</h4>
        <div class="value">${escapeHtml(clientDisplay)}</div>
        <div class="line">
          ${client?.type === "COMPANY" && client?.name !== clientDisplay ? "Yetkili: " + escapeHtml(client.name) + "<br>" : ""}
          ${client?.taxNumber ? "Vergi No: " + escapeHtml(client.taxNumber) + "<br>" : ""}
          ${client?.tcNumber ? "TC: " + escapeHtml(client.tcNumber) + "<br>" : ""}
          ${client?.address ? escapeHtml(client.address) + "<br>" : ""}
          ${client?.email ? escapeHtml(client.email) : ""}
        </div>
      </div>
    </div>

    <div class="dates">
      <div class="box">
        <div class="label">Düzenleme</div>
        <div class="value">${formatDateTR(invoice.issuedAt)}</div>
      </div>
      <div class="box">
        <div class="label">Vade</div>
        <div class="value">${formatDateTR(invoice.dueAt)}</div>
      </div>
      <div class="box">
        <div class="label">${invoice.matter ? "Dosya" : "Para Birimi"}</div>
        <div class="value">${
          invoice.matter
            ? escapeHtml(invoice.matter.matterNumber)
            : escapeHtml(invoice.currency)
        }</div>
      </div>
    </div>

    <table class="items">
      <thead>
        <tr>
          <th>Açıklama</th>
          <th class="num">Miktar</th>
          <th class="num">Birim Fiyat</th>
          <th class="num">Tutar</th>
        </tr>
      </thead>
      <tbody>
        ${invoice.items
          .map(
            (it) => `<tr>
          <td>${escapeHtml(it.description)}</td>
          <td class="num">${it.quantity.toString()}</td>
          <td class="num">${formatTRY(it.unitPrice.toString())}</td>
          <td class="num total">${formatTRY(it.total.toString())}</td>
        </tr>`,
          )
          .join("")}
      </tbody>
    </table>

    <div class="totals">
      <div class="box">
        <div class="row"><span class="label">Ara Toplam</span><span class="value">${formatTRY(invoice.subtotal.toString())}</span></div>
        <div class="row"><span class="label">KDV (%${invoice.taxRate.toString()})</span><span class="value">${formatTRY(invoice.tax.toString())}</span></div>
        <div class="sep"></div>
        <div class="row grand"><span class="label">Genel Toplam</span><span class="value">${formatTRY(invoice.total.toString())}</span></div>
      </div>
    </div>

    ${invoice.notes ? `<div class="notes"><strong>Not:</strong> ${escapeHtml(invoice.notes).replace(/\n/g, "<br>")}</div>` : ""}

    <div class="footer">
      <strong>${escapeHtml(invoice.firm.name)}</strong> · Juris Platform v0.2 ile oluşturulmuştur.<br>
      Bu belge hukuki fatura yerine geçmez; resmi e-Fatura GİB entegrasyonu ile oluşturulur.
    </div>
  </div>
</body>
</html>`;

  return new NextResponse(html, {
    status: 200,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}

function escapeHtml(s: string | null | undefined): string {
  if (!s) return "";
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
