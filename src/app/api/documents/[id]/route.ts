import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireTenant } from "@/lib/tenancy";
import { getStorage } from "@/lib/storage";
import { can } from "@/lib/rbac";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const { firmId, role, userId } = await requireTenant();
  if (!can(role, "document.view")) {
    return new NextResponse("Forbidden", { status: 403 });
  }

  const doc = await prisma.document.findFirst({
    where: { id, firmId },
    include: { matter: { include: { client: { select: { id: true, email: true } } } } },
  });
  if (!doc) return new NextResponse("Not found", { status: 404 });

  // Clients may only download their own matter's docs
  if (role === "CLIENT") {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { email: true },
    });
    const clientEmail = doc.matter?.client?.email;
    if (!clientEmail || !user?.email || clientEmail.toLowerCase() !== user.email.toLowerCase()) {
      return new NextResponse("Forbidden", { status: 403 });
    }
  }

  let bytes: Buffer;
  try {
    bytes = await getStorage().get(doc.storageKey);
  } catch {
    return new NextResponse("File missing in storage", { status: 410 });
  }

  // Node Buffer → new ArrayBuffer copy (independent, non-shared) for Blob compat
  const ab = new ArrayBuffer(bytes.byteLength);
  new Uint8Array(ab).set(bytes);
  return new NextResponse(new Blob([ab], { type: doc.mimeType }), {
    status: 200,
    headers: {
      "Content-Type": doc.mimeType,
      "Content-Length": String(bytes.length),
      "Content-Disposition": `inline; filename="${encodeURIComponent(doc.name)}"`,
      "Cache-Control": "private, max-age=300",
    },
  });
}
