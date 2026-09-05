import "server-only";
import { eq } from "drizzle-orm";
import { auth } from "../../../../auth";
import { db } from "@/lib/db";
import { adminUsers } from "@/lib/db/schema";
import { assertPermission, type AdminPermission } from "./rbac";
import { resolveAdminRecord, type CurrentAdmin } from "./identity";

export class AdminAccessError extends Error {
  constructor(public readonly status: 401 | 403, message: string) {
    super(message);
    this.name = "AdminAccessError";
  }
}

/**
 * Re-resolve the signed session against the database so deactivated users and
 * role changes take effect immediately, even while an old JWT still exists.
 */
export async function getCurrentAdmin(): Promise<CurrentAdmin | null> {
  const session = await auth();
  const userId = session?.user?.id;
  if (typeof userId !== "string" || userId.length === 0) return null;

  const [user] = await db
    .select({ id: adminUsers.id, email: adminUsers.email, role: adminUsers.role, isActive: adminUsers.isActive })
    .from(adminUsers)
    .where(eq(adminUsers.id, userId))
    .limit(1);
  return resolveAdminRecord(user);
}

export async function requireAdminPermission(permission: AdminPermission): Promise<CurrentAdmin> {
  const admin = await getCurrentAdmin();
  if (!admin) throw new AdminAccessError(401, "Prijava je obavezna.");
  try {
    assertPermission(admin.role, permission);
  } catch {
    throw new AdminAccessError(403, "Uloga nema dozvolu za ovu akciju.");
  }
  return admin;
}
