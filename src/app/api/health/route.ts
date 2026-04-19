import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const startedAt = Date.now();
  const health: {
    status: "ok" | "degraded" | "down";
    app: string;
    version: string;
    uptime: number;
    checks: Record<string, { ok: boolean; tookMs?: number; error?: string }>;
  } = {
    status: "ok",
    app: "juris-platform",
    version: process.env.npm_package_version ?? "0.1.0",
    uptime: Math.round(process.uptime()),
    checks: {},
  };

  // DB check
  const dbStart = Date.now();
  try {
    await prisma.$queryRaw`SELECT 1`;
    health.checks.db = { ok: true, tookMs: Date.now() - dbStart };
  } catch (err) {
    health.checks.db = {
      ok: false,
      tookMs: Date.now() - dbStart,
      error: err instanceof Error ? err.message : String(err),
    };
    health.status = "down";
  }

  const status = health.status === "ok" ? 200 : health.status === "degraded" ? 200 : 503;
  return NextResponse.json({ ...health, responseMs: Date.now() - startedAt }, { status });
}
