/**
 * Provision (or reset) a SUPERADMIN account.
 *
 * Runs against DATABASE_URL using only production dependencies (pg, bcryptjs)
 * so it works inside the deployed runtime, where devDependencies such as tsx
 * may not be present. Safe to re-run: it upserts on email, so invoking it again
 * with a new ADMIN_PASSWORD rotates that account's password.
 *
 *   ADMIN_EMAIL=you@example.com ADMIN_PASSWORD='...' node scripts/create-admin.mjs
 */
import { randomUUID } from "node:crypto";
import pg from "pg";
import bcrypt from "bcryptjs";

const email = (process.env.ADMIN_EMAIL ?? "").trim().toLowerCase();
const password = process.env.ADMIN_PASSWORD ?? "";
const name = (process.env.ADMIN_NAME ?? "").trim() || "Administrator";

if (!email || !password) {
  console.error("[create-admin] ADMIN_EMAIL and ADMIN_PASSWORD are both required.");
  process.exit(1);
}
if (!process.env.DATABASE_URL) {
  console.error("[create-admin] DATABASE_URL is not set.");
  process.exit(1);
}
if (password.length < 12) {
  console.error("[create-admin] ADMIN_PASSWORD must be at least 12 characters.");
  process.exit(1);
}

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });

try {
  // Credentials sign-in lowercases the submitted email before lookup, so the
  // stored value must be lowercase to be reachable.
  const passwordHash = await bcrypt.hash(password, 12);
  const now = new Date();

  const { rows } = await pool.query(
    `INSERT INTO "User" ("id", "email", "name", "passwordHash", "role", "isActive", "createdAt", "updatedAt")
     VALUES ($1, $2, $3, $4, 'SUPERADMIN', true, $5, $5)
     ON CONFLICT ("email") DO UPDATE SET
       "passwordHash" = EXCLUDED."passwordHash",
       "role"         = 'SUPERADMIN',
       "isActive"     = true,
       "updatedAt"    = EXCLUDED."updatedAt"
     RETURNING "email", "role", ("createdAt" = "updatedAt") AS created`,
    [randomUUID(), email, name, passwordHash, now]
  );

  const row = rows[0];
  console.log(
    `[create-admin] ${row.created ? "created" : "updated"} ${row.email} as ${row.role}`
  );
} catch (error) {
  console.error("[create-admin] failed:", error.message);
  process.exitCode = 1;
} finally {
  await pool.end();
}
