import { ADMIN_ROLES, type AdminRole } from "./rbac";

export type CurrentAdmin = { id: string; email: string; role: AdminRole };

export function resolveAdminRecord(user: { id: string; email: string; role: string; isActive: boolean } | null | undefined): CurrentAdmin | null {
  if (!user || !user.isActive || !ADMIN_ROLES.includes(user.role as AdminRole)) return null;
  return { id: user.id, email: user.email, role: user.role as AdminRole };
}
