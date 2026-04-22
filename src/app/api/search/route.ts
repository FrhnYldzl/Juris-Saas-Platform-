import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireTenant } from "@/lib/tenancy";

/**
 * Universal cross-module search.
 * - Returns up to 6 matches per module (matters / leads / invoices / contacts / resources)
 * - Case-insensitive substring match on module-specific fields
 * - Scoped to the caller's firm
 */
export async function GET(req: Request) {
  try {
    const { firmId, role } = await requireTenant();
    const url = new URL(req.url);
    const q = (url.searchParams.get("q") ?? "").trim();

    if (q.length < 2) {
      return NextResponse.json({ q, results: [] });
    }

    // CLIENT users should not hit this — they have their own portal search
    if (role === "CLIENT") {
      return NextResponse.json({ q, results: [] }, { status: 403 });
    }

    const like = { contains: q, mode: "insensitive" as const };

    const [matters, leads, invoices, contacts, resources] = await Promise.all([
      prisma.matter.findMany({
        where: {
          firmId,
          OR: [
            { title: like },
            { matterNumber: like },
            { clientId: undefined, courtName: like },
          ],
        },
        take: 6,
        orderBy: { updatedAt: "desc" },
        select: {
          id: true, matterNumber: true, title: true, type: true, status: true,
          client: { select: { name: true, companyName: true, type: true } },
        },
      }),
      prisma.lead.findMany({
        where: {
          firmId,
          OR: [{ title: like }, { clientName: like }, { topic: like }],
        },
        take: 6,
        orderBy: { updatedAt: "desc" },
        select: {
          id: true, title: true, clientName: true, stage: true, value: true,
        },
      }),
      prisma.invoice.findMany({
        where: {
          firmId,
          OR: [{ invoiceNumber: like }],
        },
        take: 6,
        orderBy: { issuedAt: "desc" },
        select: {
          id: true, invoiceNumber: true, status: true, total: true,
          client: { select: { name: true, companyName: true, type: true } },
          matter: { select: { matterNumber: true, title: true } },
        },
      }),
      prisma.contact.findMany({
        where: {
          firmId,
          OR: [{ name: like }, { companyName: like }, { email: like }],
        },
        take: 6,
        orderBy: { updatedAt: "desc" },
        select: {
          id: true, name: true, companyName: true, type: true, isClient: true, email: true,
        },
      }),
      prisma.resource.findMany({
        where: {
          firmId,
          OR: [{ name: like }, { description: like }],
        },
        take: 6,
        orderBy: { updatedAt: "desc" },
        select: {
          id: true, name: true, type: true, heat: true, leadCount: true,
        },
      }),
    ]);

    type Result = {
      module: "matter" | "lead" | "invoice" | "contact" | "resource";
      id: string;
      href: string;
      title: string;
      subtitle?: string;
      badge?: string;
    };

    const results: Result[] = [
      ...matters.map<Result>((m) => ({
        module: "matter",
        id: m.id,
        href: `/ops/${m.id}`,
        title: m.title,
        subtitle: [
          m.matterNumber,
          m.client
            ? (m.client.type === "COMPANY" ? m.client.companyName : m.client.name)
            : null,
        ].filter(Boolean).join(" · "),
        badge: m.type,
      })),
      ...leads.map<Result>((l) => ({
        module: "lead",
        id: l.id,
        href: `/sales/${l.id}`,
        title: l.title,
        subtitle: [l.clientName, l.value ? `₺${l.value}` : null].filter(Boolean).join(" · "),
        badge: l.stage,
      })),
      ...invoices.map<Result>((i) => ({
        module: "invoice",
        id: i.id,
        href: `/finance/${i.id}`,
        title: i.invoiceNumber,
        subtitle: [
          i.client
            ? (i.client.type === "COMPANY" ? i.client.companyName : i.client.name)
            : null,
          i.matter?.matterNumber,
        ].filter(Boolean).join(" · "),
        badge: i.status,
      })),
      ...contacts.map<Result>((c) => ({
        module: "contact",
        id: c.id,
        href: `/sales?contact=${c.id}`,
        title: c.type === "COMPANY" ? (c.companyName ?? c.name) : c.name,
        subtitle: c.email ?? undefined,
        badge: c.isClient ? "MÜVEKKİL" : c.type,
      })),
      ...resources.map<Result>((r) => ({
        module: "resource",
        id: r.id,
        href: `/bd/${r.id}`,
        title: r.name,
        subtitle: `${r.leadCount} lead`,
        badge: r.type,
      })),
    ];

    return NextResponse.json({ q, results });
  } catch (err) {
    console.error("search error:", err);
    return NextResponse.json({ error: "search_failed" }, { status: 500 });
  }
}
