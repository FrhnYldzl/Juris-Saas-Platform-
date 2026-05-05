import { NextResponse } from "next/server";
import { timingSafeEqual } from "node:crypto";
import { prisma } from "./prisma";
import { audit } from "./audit";

/**
 * Paperclip — Sales & Marketing only public API surface.
 *
 *   PROJECT_ID:        b277b84c-ccd0-4699-b202-c39272d76aee
 *   RELATIONSHIP:      sm-only
 *   SCOPE:             read + sm-write
 *
 * Allowed domains: lead, content (DRAFT only), analytics, campaign
 * Forbidden:       product, deploy, support, contracts, auth
 *
 * Auth: X-API-Key header — constant-time compared against env JURIS_SM_KEY
 * Tenancy: env JURIS_SM_FIRM_ID, falls back to oldest firm in DB.
 */

export type PaperclipDomain = "lead" | "content" | "analytics" | "campaign";

export type PaperclipScope =
  | "lead:read"      | "lead:write"
  | "content:read"   | "content:draft"        // No PUBLISH — board approval needed
  | "analytics:read"
  | "campaign:read"  | "campaign:write";

export const FORBIDDEN_DOMAINS = [
  "product",   // specs, features, pricing
  "deploy",    // CI/CD, infra
  "support",   // customer tickets
  "contracts", // legal documents
  "auth",      // user management, billing
] as const;

const ALLOWED_SCOPES: readonly PaperclipScope[] = [
  "lead:read", "lead:write",
  "content:read", "content:draft",
  "analytics:read",
  "campaign:read", "campaign:write",
] as const;

export type PaperclipContext = {
  firmId: string;
  apiKeyName: string;
  scopes: readonly PaperclipScope[];
};

type AuthResult =
  | { ok: true; ctx: PaperclipContext }
  | { ok: false; response: NextResponse };

/**
 * Authenticate a request to /api/paperclip/*.
 * Returns { ok:true, ctx } on success or { ok:false, response } with the 401/500.
 */
export async function authenticatePaperclip(req: Request): Promise<AuthResult> {
  const provided = req.headers.get("x-api-key") ?? "";
  const expected = process.env.JURIS_SM_KEY ?? "";

  if (!expected) {
    console.error("paperclip: JURIS_SM_KEY not set on the server");
    return {
      ok: false,
      response: paperclipError(500, "server_misconfigured", "API not enabled — JURIS_SM_KEY missing"),
    };
  }

  if (!provided) {
    return {
      ok: false,
      response: paperclipError(401, "missing_api_key", "X-API-Key header required"),
    };
  }

  if (!constantTimeEqual(provided, expected)) {
    return {
      ok: false,
      response: paperclipError(401, "invalid_api_key", "X-API-Key did not match"),
    };
  }

  // Tenancy
  let firmId = process.env.JURIS_SM_FIRM_ID ?? null;
  if (!firmId) {
    const firm = await prisma.firm.findFirst({
      orderBy: { createdAt: "asc" },
      select: { id: true },
    });
    firmId = firm?.id ?? null;
  }
  if (!firmId) {
    return {
      ok: false,
      response: paperclipError(500, "no_tenant", "No firm configured for the API key"),
    };
  }

  return {
    ok: true,
    ctx: {
      firmId,
      apiKeyName: process.env.JURIS_SM_KEY_NAME ?? "paperclip-sm",
      scopes: ALLOWED_SCOPES,
    },
  };
}

/**
 * Single helper that wraps an endpoint handler:
 *  - Authenticates the X-API-Key
 *  - Checks the required scope
 *  - Catches errors → 500 JSON
 *  - Audit-logs the call (firmId-scoped)
 */
export async function withPaperclip<TBody = unknown>(
  req: Request,
  scope: PaperclipScope,
  handler: (args: { ctx: PaperclipContext; body: TBody | null }) => Promise<NextResponse>,
): Promise<NextResponse> {
  const auth = await authenticatePaperclip(req);
  if (!auth.ok) return auth.response;

  if (!auth.ctx.scopes.includes(scope)) {
    return paperclipError(403, "scope_denied", `Required scope: ${scope}`);
  }

  let body: TBody | null = null;
  if (req.method !== "GET" && req.method !== "HEAD" && req.method !== "DELETE") {
    try {
      body = await req.json();
    } catch {
      return paperclipError(400, "invalid_json", "Body must be valid JSON");
    }
  }

  try {
    const res = await handler({ ctx: auth.ctx, body });
    // Best-effort audit; don't fail the request if it errors
    audit({
      firmId: auth.ctx.firmId,
      action: `paperclip.${scope}`,
      entityType: "paperclip",
      diff: { method: req.method, status: res.status, key: auth.ctx.apiKeyName },
    }).catch((err) => console.error("audit failed:", err));
    return res;
  } catch (err) {
    console.error(`paperclip handler failed (${scope}):`, err);
    return paperclipError(500, "internal_error", err instanceof Error ? err.message : "unknown");
  }
}

export function paperclipError(status: number, code: string, message?: string) {
  return NextResponse.json(
    { error: { code, message: message ?? code } },
    { status, headers: { "x-paperclip-error": code } },
  );
}

export function paperclipOk<T>(data: T, status = 200) {
  return NextResponse.json(data, {
    status,
    headers: { "x-paperclip-version": "1.0" },
  });
}

// ─── Internals ───

function constantTimeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) {
    // Still do a fixed-time op to avoid early-return signaling
    const aBuf = Buffer.from(a.padEnd(32, "\0"));
    const bBuf = Buffer.from(b.slice(0, 32).padEnd(32, "\0"));
    timingSafeEqual(aBuf, bBuf);
    return false;
  }
  try {
    return timingSafeEqual(Buffer.from(a), Buffer.from(b));
  } catch {
    return false;
  }
}
