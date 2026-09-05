export const ADMIN_ROLES = ["SUPER_ADMIN", "LEGAL_EDITOR", "CONTENT_EDITOR", "REVIEWER"] as const;
export type AdminRole = (typeof ADMIN_ROLES)[number];

export const ADMIN_PERMISSIONS = ["rules:write", "sources:write", "review:write", "publish", "audit:read"] as const;
export type AdminPermission = (typeof ADMIN_PERMISSIONS)[number];

const rolePermissions: Record<AdminRole, AdminPermission[]> = {
  SUPER_ADMIN: [...ADMIN_PERMISSIONS],
  LEGAL_EDITOR: ["rules:write", "sources:write", "review:write", "audit:read"],
  CONTENT_EDITOR: ["rules:write", "audit:read"],
  REVIEWER: ["review:write", "audit:read"],
};

export function hasPermission(role: AdminRole, permission: AdminPermission): boolean {
  return rolePermissions[role]?.includes(permission) ?? false;
}

export function assertPermission(role: string, permission: AdminPermission): asserts role is AdminRole {
  if (!ADMIN_ROLES.includes(role as AdminRole) || !hasPermission(role as AdminRole, permission)) throw new Error("Nedovoljna dozvola.");
}
