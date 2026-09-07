import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";

/**
 * Do not read DATABASE_URL while Next is collecting route metadata at build time.
 * Administrative handlers still fail clearly when they actually try to use the DB.
 */
let database: ReturnType<typeof drizzle<typeof schema>> | undefined;

export function getDb() {
  if (database) return database;
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL nije podešen u okruženju za ovu administrativnu radnju.");
  }
  database = drizzle(neon(connectionString), { schema });
  return database;
}

// Preserve the existing import API without creating a database client until a query is made.
export const db = new Proxy({} as ReturnType<typeof drizzle<typeof schema>>, {
  get(_target, property) {
    const instance = getDb();
    const value = Reflect.get(instance, property, instance);
    return typeof value === "function" ? value.bind(instance) : value;
  },
});
