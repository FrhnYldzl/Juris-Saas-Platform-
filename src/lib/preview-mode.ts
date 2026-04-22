import { cookies } from "next/headers";
import type { UserRole } from "@prisma/client";

export const PREVIEW_COOKIE_NAME = "juris_preview_role";

const VALID_PREVIEW_ROLES: UserRole[] = ["CLIENT", "ASSOCIATE", "PARALEGAL", "ADMIN_STAFF"];

/**
 * Read the current preview-mode cookie and resolve the effective role.
 *
 * Preview mode is only honoured when the real role is OWNER or PARTNER.
 * For anyone else, the returned previewRole is always null.
 *
 * @returns { realRole, previewRole, effectiveRole, isPreview }
 */
export async function getPreviewMode(realRole: UserRole) {
  const canPreview = realRole === "OWNER" || realRole === "PARTNER";
  if (!canPreview) {
    return {
      realRole,
      previewRole: null as UserRole | null,
      effectiveRole: realRole,
      isPreview: false,
    };
  }

  const store = await cookies();
  const raw = store.get(PREVIEW_COOKIE_NAME)?.value ?? null;
  const previewRole = raw && VALID_PREVIEW_ROLES.includes(raw as UserRole)
    ? (raw as UserRole)
    : null;

  return {
    realRole,
    previewRole,
    effectiveRole: previewRole ?? realRole,
    isPreview: previewRole !== null,
  };
}
