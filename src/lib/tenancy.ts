import { auth } from "@/lib/auth";
import { UnauthorizedError } from "@/lib/rbac";

/** Returns the current session or throws. Use in server components & route handlers. */
export async function requireSession() {
  const session = await auth();
  if (!session?.user) throw new UnauthorizedError();
  return session;
}

/** Returns { userId, firmId, role }. Throws if not authenticated. */
export async function requireTenant() {
  const session = await requireSession();
  return {
    userId: session.user.id,
    firmId: session.user.firmId,
    role: session.user.role,
    email: session.user.email ?? "",
    name: session.user.name ?? "",
  };
}
