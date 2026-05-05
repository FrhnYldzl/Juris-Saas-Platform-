import { withPaperclip, paperclipOk } from "@/lib/paperclip-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/paperclip/health
 *
 * Authenticated ping. Useful for the integration to verify its key is valid
 * + the firm scope it has, before doing real reads/writes.
 *
 * Returns:
 *  { ok: true, service: "paperclip", scopes: [...], firmId: "..." }
 */
export async function GET(req: Request) {
  return withPaperclip(req, "lead:read", async ({ ctx }) => {
    return paperclipOk({
      ok:        true,
      service:   "paperclip",
      version:   "1.0",
      project:   "b277b84c-ccd0-4699-b202-c39272d76aee",
      firmId:    ctx.firmId,
      keyName:   ctx.apiKeyName,
      scopes:    ctx.scopes,
      forbidden: ["product", "deploy", "support", "contracts", "auth"],
      endpoints: {
        leads:           ["GET",   "POST"],
        contentPosts:    ["GET",   "POST", "PATCH (id)"],
        analyticsLeads:  ["GET"],
        campaigns:       ["GET",   "POST"],
        health:          ["GET"],
      },
      timestamp: new Date().toISOString(),
    });
  });
}
