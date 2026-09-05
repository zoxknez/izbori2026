import { config } from "dotenv";
import { hash } from "bcryptjs";
import { eq } from "drizzle-orm";
import { randomUUID } from "node:crypto";
config({ path: ".env.local" });

async function main() {
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD;
  const role = process.env.ADMIN_ROLE ?? "SUPER_ADMIN";
  if (!email || !password) throw new Error("ADMIN_EMAIL i ADMIN_PASSWORD su obavezni samo za eksplicitni bootstrap admina.");
  const { db } = await import("../src/lib/db");
  const { adminUsers } = await import("../src/lib/db/schema");
  const passwordHash = await hash(password, 12);
  const existing = await db.select({ id: adminUsers.id }).from(adminUsers).where(eq(adminUsers.email, email)).limit(1);
  if (existing[0]) {
    await db.update(adminUsers).set({ passwordHash, role, isActive: true, updatedAt: new Date() }).where(eq(adminUsers.id, existing[0].id));
  } else {
    await db.insert(adminUsers).values({ id: randomUUID(), email, passwordHash, role, isActive: true });
  }
  console.log(`Admin nalog je spreman za ${email} (${role}).`);
}

main().catch((error) => { console.error(error); process.exit(1); });
