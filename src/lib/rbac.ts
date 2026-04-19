import type { UserRole } from "@prisma/client";

// Module IDs match the sidebar nav
export type ModuleId =
  | "command"
  | "bd"
  | "ops"
  | "marketing"
  | "sales"
  | "finance"
  | "people"
  | "integrations"
  | "settings"
  | "ai"
  | "portal";

// Permission keys — granular actions
export type Permission =
  | "matter.view" | "matter.create" | "matter.edit" | "matter.delete"
  | "lead.view" | "lead.create" | "lead.edit" | "lead.delete"
  | "invoice.view" | "invoice.create" | "invoice.send" | "invoice.delete"
  | "document.view" | "document.upload" | "document.delete"
  | "user.view" | "user.invite" | "user.edit" | "user.delete"
  | "integration.view" | "integration.manage"
  | "settings.view" | "settings.edit"
  | "audit.view"
  | "ai.use";

const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  OWNER: [
    "matter.view", "matter.create", "matter.edit", "matter.delete",
    "lead.view", "lead.create", "lead.edit", "lead.delete",
    "invoice.view", "invoice.create", "invoice.send", "invoice.delete",
    "document.view", "document.upload", "document.delete",
    "user.view", "user.invite", "user.edit", "user.delete",
    "integration.view", "integration.manage",
    "settings.view", "settings.edit",
    "audit.view", "ai.use",
  ],
  PARTNER: [
    "matter.view", "matter.create", "matter.edit", "matter.delete",
    "lead.view", "lead.create", "lead.edit", "lead.delete",
    "invoice.view", "invoice.create", "invoice.send",
    "document.view", "document.upload", "document.delete",
    "user.view", "user.invite", "user.edit",
    "integration.view", "integration.manage",
    "settings.view", "settings.edit",
    "audit.view", "ai.use",
  ],
  ASSOCIATE: [
    "matter.view", "matter.create", "matter.edit",
    "lead.view", "lead.create", "lead.edit",
    "invoice.view", "invoice.create",
    "document.view", "document.upload",
    "user.view",
    "integration.view",
    "settings.view",
    "ai.use",
  ],
  PARALEGAL: [
    "matter.view",
    "lead.view",
    "document.view", "document.upload",
    "user.view",
    "ai.use",
  ],
  ADMIN_STAFF: [
    "matter.view",
    "invoice.view", "invoice.create",
    "document.view", "document.upload",
    "user.view",
    "settings.view",
  ],
  CLIENT: [
    "matter.view",       // only their own — enforced at query layer
    "document.view",
    "invoice.view",
  ],
};

const MODULE_ACCESS: Record<UserRole, ModuleId[]> = {
  OWNER: ["command", "bd", "ops", "marketing", "sales", "finance", "people", "ai", "integrations", "settings"],
  PARTNER: ["command", "bd", "ops", "marketing", "sales", "finance", "people", "ai", "integrations", "settings"],
  ASSOCIATE: ["command", "bd", "ops", "marketing", "sales", "finance", "people", "ai", "settings"],
  PARALEGAL: ["command", "ops", "ai"],
  ADMIN_STAFF: ["command", "ops", "finance", "people", "settings"],
  CLIENT: ["portal"],
};

export function can(role: UserRole, perm: Permission): boolean {
  return ROLE_PERMISSIONS[role].includes(perm);
}

export function canAccessModule(role: UserRole, moduleId: ModuleId): boolean {
  return MODULE_ACCESS[role].includes(moduleId);
}

export function requirePermission(role: UserRole, perm: Permission): void {
  if (!can(role, perm)) {
    throw new ForbiddenError(`Missing permission: ${perm}`);
  }
}

export class ForbiddenError extends Error {
  status = 403;
  constructor(message = "Forbidden") {
    super(message);
    this.name = "ForbiddenError";
  }
}

export class UnauthorizedError extends Error {
  status = 401;
  constructor(message = "Unauthorized") {
    super(message);
    this.name = "UnauthorizedError";
  }
}
