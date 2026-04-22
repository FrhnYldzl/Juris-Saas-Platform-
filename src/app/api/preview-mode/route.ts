import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { requireTenant } from "@/lib/tenancy";

/**
 * Preview-mode lets OWNER / PARTNER temporarily view the platform as
 * another role (most usefully: CLIENT → full Müvekkil portal).
 *
 * The real session role is unchanged. We set a short-lived cookie that
 * layouts + middleware consult; pressing "Exit preview" clears it.
 *
 * Allowed preview targets:
 *   CLIENT       → renders /portal using the firm's first demo client Contact
 *   ASSOCIATE    → hides owner-only modules in the staff sidebar
 *   PARALEGAL    → hides finance / marketing / settings
 *   ADMIN_STAFF  → hides strategy & BD, focuses finance
 *   OWNER/PARTNER → no-op (use "exit" instead)
 */

const VALID_PREVIEW_ROLES = ["CLIENT", "ASSOCIATE", "PARALEGAL", "ADMIN_STAFF"] as const;
type PreviewRole = typeof VALID_PREVIEW_ROLES[number];

// Keep the cookie name in sync with src/lib/preview-mode.ts (PREVIEW_COOKIE_NAME).
const COOKIE_NAME = "juris_preview_role";
const COOKIE_MAX_AGE = 60 * 60 * 2; // 2 hours

export async function POST(req: Request) {
  try {
    const { role } = await requireTenant();
    if (role !== "OWNER" && role !== "PARTNER") {
      return NextResponse.json({ error: "forbidden" }, { status: 403 });
    }

    const body = await req.json().catch(() => ({} as { role?: string }));
    const target = body.role as string | undefined;

    if (!target || !VALID_PREVIEW_ROLES.includes(target as PreviewRole)) {
      return NextResponse.json({ error: "invalid_role" }, { status: 400 });
    }

    const store = await cookies();
    store.set(COOKIE_NAME, target, {
      httpOnly: false,        // read-access from client for the banner
      sameSite: "lax",
      path: "/",
      maxAge: COOKIE_MAX_AGE,
    });

    return NextResponse.json({ ok: true, previewRole: target });
  } catch (err) {
    console.error("preview-mode POST error:", err);
    return NextResponse.json({ error: "failed" }, { status: 500 });
  }
}

export async function DELETE() {
  try {
    await requireTenant();
    const store = await cookies();
    store.delete(COOKIE_NAME);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("preview-mode DELETE error:", err);
    return NextResponse.json({ error: "failed" }, { status: 500 });
  }
}
